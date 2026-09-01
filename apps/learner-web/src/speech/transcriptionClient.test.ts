import { describe, expect, it } from "vitest";
import {
  createWorkerTranscriptionClient,
  type TranscriptionEvent,
} from "./transcriptionClient";
import type { WorkerInbound, WorkerOutbound } from "./protocol";

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  posted: WorkerInbound[] = [];
  terminated = false;

  constructor() {
    FakeWorker.instances.push(this);
  }

  postMessage(msg: WorkerInbound) {
    this.posted.push(msg);
  }

  terminate() {
    this.terminated = true;
  }

  emit(msg: WorkerOutbound) {
    this.onmessage?.({ data: msg } as MessageEvent);
  }
}

function makeScheduler() {
  const timers = new Map<number, () => void>();
  let nextId = 1;
  return {
    scheduler: {
      setTimeout: (cb: () => void, _ms: number) => {
        const id = nextId++;
        timers.set(id, cb);
        return id;
      },
      clearTimeout: (id: number) => {
        timers.delete(id);
      },
    },
    fireAll: () => {
      for (const cb of [...timers.values()]) cb();
      timers.clear();
    },
    pending: () => timers.size,
  };
}

function setup(overrides: { isOnline?: () => boolean } = {}) {
  FakeWorker.instances = [];
  const { scheduler, fireAll, pending } = makeScheduler();
  const events: TranscriptionEvent[] = [];
  const client = createWorkerTranscriptionClient({
    workerFactory: () => new FakeWorker() as unknown as Worker,
    scheduler,
    isOnline: overrides.isOnline ?? (() => true),
    timeoutMs: 1000,
  });
  const onEvent = (e: TranscriptionEvent) => events.push(e);
  return { client, events, onEvent, fireAll, pending };
}

const PCM = new Float32Array(16000).fill(0.1);

describe("createWorkerTranscriptionClient", () => {
  it("spawns lazily, streams progress, and resolves with model metadata", () => {
    const { client, events, onEvent } = setup();
    client.transcribe({ attemptId: "a1", pcm: PCM, sampleRate: 16000 }, onEvent);
    const worker = FakeWorker.instances[0]!;
    expect(worker.posted[0]).toMatchObject({
      type: "transcribe",
      protocol: 1,
      attemptId: "a1",
      sampleRate: 16000,
    });

    worker.emit({ type: "load-progress", progress: 0.42 });
    worker.emit({
      type: "ready",
      model: { id: "whisper-base.en", version: "rev", quantization: "q4" },
    });
    worker.emit({
      type: "result",
      attemptId: "a1",
      text: " hello ",
      uncertainRanges: [],
    });

    expect(events[0]).toEqual({ type: "progress", progress: 0.42 });
    expect(events[1]).toEqual({ type: "progress", progress: null });
    expect(events[2]).toEqual({
      type: "done",
      draft: {
        text: " hello ",
        source: "LOCAL_WHISPER",
        model: { id: "whisper-base.en", version: "rev", quantization: "q4" },
        uncertainRanges: [],
      },
    });
  });

  it("copies the PCM buffer instead of detaching the caller's", () => {
    const { client, onEvent } = setup();
    const pcm = new Float32Array(8000).fill(0.2);
    client.transcribe({ attemptId: "a1", pcm, sampleRate: 8000 }, onEvent);
    const posted = FakeWorker.instances[0]!.posted[0]!;
    expect(posted.type).toBe("transcribe");
    if (posted.type === "transcribe") {
      expect(posted.pcm).not.toBe(pcm.buffer);
      expect(new Float32Array(posted.pcm)[0]).toBeCloseTo(0.2);
    }
    expect(pcm[0]).toBeCloseTo(0.2);
  });

  it("drops results for a stale attemptId", () => {
    const { client, events, onEvent } = setup();
    client.transcribe({ attemptId: "a1", pcm: PCM, sampleRate: 16000 }, onEvent);
    FakeWorker.instances[0]!.emit({
      type: "result",
      attemptId: "old-attempt",
      text: "stale",
      uncertainRanges: [],
    });
    expect(events).toHaveLength(0);
  });

  it("cancel terminates the worker and reports CANCELLED", () => {
    const { client, events, onEvent } = setup();
    const session = client.transcribe(
      { attemptId: "a1", pcm: PCM, sampleRate: 16000 },
      onEvent,
    );
    session.cancel();
    expect(FakeWorker.instances[0]!.terminated).toBe(true);
    expect(events).toEqual([{ type: "unavailable", reason: "CANCELLED" }]);
  });

  it("times out, terminates the worker, and reports TIMEOUT", () => {
    const { client, events, onEvent, fireAll } = setup();
    client.transcribe({ attemptId: "a1", pcm: PCM, sampleRate: 16000 }, onEvent);
    fireAll();
    expect(events).toEqual([{ type: "unavailable", reason: "TIMEOUT" }]);
    expect(FakeWorker.instances[0]!.terminated).toBe(true);
  });

  it("maps worker error kinds and releases memory on LOW_MEMORY", () => {
    const { client, events, onEvent } = setup();
    client.transcribe({ attemptId: "a1", pcm: PCM, sampleRate: 16000 }, onEvent);
    FakeWorker.instances[0]!.emit({
      type: "error",
      attemptId: "a1",
      kind: "LOW_MEMORY",
      message: "oom",
    });
    expect(events).toEqual([{ type: "unavailable", reason: "LOW_MEMORY" }]);
    expect(FakeWorker.instances[0]!.terminated).toBe(true);

    // Next activation spawns a fresh worker.
    client.transcribe({ attemptId: "a2", pcm: PCM, sampleRate: 16000 }, onEvent);
    expect(FakeWorker.instances).toHaveLength(2);
  });

  it("keeps the worker warm after LOAD_FAILED", () => {
    const { client, events, onEvent } = setup();
    client.transcribe({ attemptId: "a1", pcm: PCM, sampleRate: 16000 }, onEvent);
    FakeWorker.instances[0]!.emit({
      type: "error",
      attemptId: "a1",
      kind: "LOAD_FAILED",
      message: "offline",
    });
    expect(events).toEqual([{ type: "unavailable", reason: "LOAD_FAILED" }]);
    expect(FakeWorker.instances[0]!.terminated).toBe(false);
  });

  it("defers with OFFLINE on cold start without network, spawning no worker", () => {
    const { client, events, onEvent, fireAll } = setup({
      isOnline: () => false,
    });
    client.transcribe({ attemptId: "a1", pcm: PCM, sampleRate: 16000 }, onEvent);
    expect(FakeWorker.instances).toHaveLength(0);
    fireAll();
    expect(events).toEqual([{ type: "unavailable", reason: "OFFLINE" }]);
  });

  it("still transcribes offline when the worker is already warm", () => {
    const { client, events, onEvent } = setup();
    // First job warms the worker while online.
    client.transcribe({ attemptId: "a1", pcm: PCM, sampleRate: 16000 }, onEvent);
    const worker = FakeWorker.instances[0]!;
    worker.emit({
      type: "result",
      attemptId: "a1",
      text: "one",
      uncertainRanges: [],
    });
    expect(events).toHaveLength(1);

    // Worker stays alive; second job proceeds even if the network drops.
    worker.emit({ type: "result", attemptId: "nope", text: "x", uncertainRanges: [] });
    client.transcribe({ attemptId: "a2", pcm: PCM, sampleRate: 16000 }, onEvent);
    expect(FakeWorker.instances).toHaveLength(1);
    expect(worker.posted).toHaveLength(2);
  });

  it("supersedes an in-flight job when a new one starts", () => {
    const { client, events, onEvent } = setup();
    client.transcribe({ attemptId: "a1", pcm: PCM, sampleRate: 16000 }, onEvent);
    client.transcribe({ attemptId: "a2", pcm: PCM, sampleRate: 16000 }, onEvent);
    expect(events).toEqual([{ type: "unavailable", reason: "CANCELLED" }]);
    // Supersede terminates and respawns.
    expect(FakeWorker.instances[0]!.terminated).toBe(true);
    expect(FakeWorker.instances).toHaveLength(2);
  });

  it("dispose cancels the job and terminates the worker", () => {
    const { client, events, onEvent } = setup();
    client.transcribe({ attemptId: "a1", pcm: PCM, sampleRate: 16000 }, onEvent);
    client.dispose();
    expect(events).toEqual([{ type: "unavailable", reason: "CANCELLED" }]);
    expect(FakeWorker.instances[0]!.terminated).toBe(true);
  });
});
