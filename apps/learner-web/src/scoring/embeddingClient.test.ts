import { describe, expect, it } from "vitest";
import {
  createWorkerEmbeddingClient,
  EMBEDDING_MODEL,
  MAX_EMBED_TEXTS,
  type EmbeddingEvent,
  type WorkerEmbedInbound,
  type WorkerEmbedOutbound,
} from "./embeddingClient";

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  posted: WorkerEmbedInbound[] = [];
  terminated = false;

  constructor() {
    FakeWorker.instances.push(this);
  }

  postMessage(message: WorkerEmbedInbound): void {
    this.posted.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  emit(message: WorkerEmbedOutbound): void {
    this.onmessage?.({ data: message } as MessageEvent);
  }
}

function makeScheduler() {
  const timers = new Map<number, () => void>();
  let nextId = 1;
  return {
    scheduler: {
      setTimeout: (callback: () => void) => {
        const id = nextId++;
        timers.set(id, callback);
        return id;
      },
      clearTimeout: (id: number) => timers.delete(id),
    },
    fireAll: () => {
      for (const callback of [...timers.values()]) callback();
      timers.clear();
    },
  };
}

function setup(isOnline = true) {
  FakeWorker.instances = [];
  const { scheduler, fireAll } = makeScheduler();
  const events: EmbeddingEvent[] = [];
  const client = createWorkerEmbeddingClient({
    workerFactory: () => new FakeWorker() as unknown as Worker,
    scheduler,
    isOnline: () => isOnline,
    timeoutMs: 1_000,
  });
  return { client, events, fireAll, onEvent: (event: EmbeddingEvent) => events.push(event) };
}

describe("createWorkerEmbeddingClient", () => {
  it("uses the verified public model revision", () => {
    expect(EMBEDDING_MODEL.version).toBe("751bff37182d3f1213fa05d7196b954e230abad9");
  });

  it("spawns lazily, clamps progress, and accepts a valid result", () => {
    const { client, events, onEvent } = setup();
    client.embed({ attemptId: "a1", texts: ["answer", "rubric"] }, onEvent);
    const worker = FakeWorker.instances[0]!;
    expect(worker.posted[0]).toEqual({
      type: "embed",
      protocol: 1,
      attemptId: "a1",
      texts: ["answer", "rubric"],
    });
    worker.emit({ type: "load-progress", progress: 2 });
    worker.emit({ type: "ready" });
    worker.emit({ type: "result", attemptId: "a1", embeddings: [[1, 0], [0, 1]] });
    expect(events).toEqual([
      { type: "progress", progress: 1 },
      { type: "progress", progress: null },
      { type: "done", embeddings: [[1, 0], [0, 1]] },
    ]);
  });

  it("drops stale results and rejects malformed or non-finite vectors", () => {
    const { client, events, onEvent } = setup();
    client.embed({ attemptId: "a1", texts: ["one", "two"] }, onEvent);
    const worker = FakeWorker.instances[0]!;
    worker.emit({ type: "result", attemptId: "old", embeddings: [[1], [1]] });
    expect(events).toEqual([]);
    worker.emit({ type: "result", attemptId: "a1", embeddings: [[Number.NaN]] });
    expect(events).toEqual([{ type: "unavailable", reason: "ERROR" }]);
    expect(worker.terminated).toBe(true);
  });

  it("rejects oversized or empty requests without spawning a worker", () => {
    const { client, events, onEvent, fireAll } = setup();
    client.embed({ attemptId: "a1", texts: [] }, onEvent);
    client.embed({ attemptId: "a2", texts: Array(MAX_EMBED_TEXTS + 1).fill("x") }, onEvent);
    expect(FakeWorker.instances).toHaveLength(0);
    fireAll();
    expect(events).toEqual([
      { type: "unavailable", reason: "ERROR" },
      { type: "unavailable", reason: "ERROR" },
    ]);
  });

  it("reports cancellation instead of a deferred offline cold-start failure", () => {
    const { client, events, onEvent, fireAll } = setup(false);
    const session = client.embed({ attemptId: "a1", texts: ["answer"] }, onEvent);
    expect(FakeWorker.instances).toHaveLength(0);
    session.cancel();
    fireAll();
    expect(events).toEqual([{ type: "unavailable", reason: "CANCELLED" }]);
  });

  it("terminates and reports timeout or explicit cancellation", () => {
    const timed = setup();
    timed.client.embed({ attemptId: "a1", texts: ["answer"] }, timed.onEvent);
    timed.fireAll();
    expect(timed.events).toEqual([{ type: "unavailable", reason: "TIMEOUT" }]);
    expect(FakeWorker.instances[0]?.terminated).toBe(true);

    const cancelled = setup();
    const session = cancelled.client.embed(
      { attemptId: "a2", texts: ["answer"] },
      cancelled.onEvent,
    );
    session.cancel();
    expect(cancelled.events).toEqual([{ type: "unavailable", reason: "CANCELLED" }]);
    expect(FakeWorker.instances[0]?.terminated).toBe(true);
  });

  it("supersedes an in-flight request with a fresh worker", () => {
    const { client, events, onEvent } = setup();
    client.embed({ attemptId: "a1", texts: ["one"] }, onEvent);
    client.embed({ attemptId: "a2", texts: ["two"] }, onEvent);
    expect(events).toEqual([{ type: "unavailable", reason: "CANCELLED" }]);
    expect(FakeWorker.instances).toHaveLength(2);
    expect(FakeWorker.instances[0]?.terminated).toBe(true);
  });

  it("turns synchronous worker construction failure into an asynchronous fallback", () => {
    const { scheduler, fireAll } = makeScheduler();
    const events: EmbeddingEvent[] = [];
    const client = createWorkerEmbeddingClient({
      workerFactory: () => {
        throw new Error("worker blocked");
      },
      scheduler,
      isOnline: () => true,
    });
    expect(() =>
      client.embed({ attemptId: "a1", texts: ["answer"] }, (event) => events.push(event)),
    ).not.toThrow();
    expect(events).toEqual([]);
    fireAll();
    expect(events).toEqual([{ type: "unavailable", reason: "ERROR" }]);
  });
});
