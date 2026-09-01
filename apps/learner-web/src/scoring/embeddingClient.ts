// Client side of the embedding worker protocol (v0.5 semantic coverage).
// Mirrors the transcription client: lazy worker spawn on explicit activation,
// single in-flight job, stale-drop by attemptId, termination on
// cancel/timeout/low-memory. See docs/V0.5_DEVELOPMENT_CONTEXT.md §4.

export const EMBED_PROTOCOL_VERSION = 1;

export type EmbeddingUnavailableReason =
  | "LOAD_FAILED"
  | "OFFLINE"
  | "TIMEOUT"
  | "LOW_MEMORY"
  | "CANCELLED"
  | "ERROR";

export type WorkerEmbedInbound =
  | {
      type: "embed";
      protocol: typeof EMBED_PROTOCOL_VERSION;
      attemptId: string;
      texts: string[];
    }
  | {
      type: "cancel";
      protocol: typeof EMBED_PROTOCOL_VERSION;
      attemptId: string;
    };

export type WorkerEmbedOutbound =
  | { type: "load-progress"; progress: number }
  | { type: "ready" }
  | { type: "result"; attemptId: string; embeddings: number[][] }
  | {
      type: "error";
      attemptId: string | null;
      kind: "LOAD_FAILED" | "LOW_MEMORY" | "ERROR";
      message: string;
    }
  | { type: "cancelled"; attemptId: string };

export type EmbeddingEvent =
  | { type: "progress"; progress: number | null }
  | { type: "done"; embeddings: number[][] }
  | { type: "unavailable"; reason: EmbeddingUnavailableReason };

export interface EmbeddingSession {
  readonly attemptId: string;
  cancel(): void;
}

export interface EmbeddingClient {
  embed(
    input: { attemptId: string; texts: string[] },
    onEvent: (event: EmbeddingEvent) => void,
  ): EmbeddingSession;
  dispose(): void;
}

export interface Scheduler {
  setTimeout(cb: () => void, ms: number): number;
  clearTimeout(id: number): void;
}

export interface EmbeddingClientOptions {
  workerFactory: () => Worker;
  timeoutMs?: number;
  isOnline?: () => boolean;
  scheduler?: Scheduler;
}

const DEFAULT_TIMEOUT_MS = 120_000;
export const MAX_EMBED_TEXTS = 512;
export const MAX_EMBED_TOTAL_CHARACTERS = 50_000;
const MAX_EMBED_DIMENSION = 4_096;

function validInput(texts: readonly string[]): boolean {
  return (
    texts.length > 0 &&
    texts.length <= MAX_EMBED_TEXTS &&
    texts.every((value) => typeof value === "string" && value.trim().length > 0) &&
    texts.reduce((sum, value) => sum + value.length, 0) <= MAX_EMBED_TOTAL_CHARACTERS
  );
}

function validEmbeddings(value: number[][], expectedCount: number): boolean {
  if (!Array.isArray(value) || value.length !== expectedCount) return false;
  const dimension = value[0]?.length ?? 0;
  return (
    dimension > 0 &&
    dimension <= MAX_EMBED_DIMENSION &&
    value.every(
      (vector) =>
        Array.isArray(vector) &&
        vector.length === dimension &&
        vector.every((item) => typeof item === "number" && Number.isFinite(item)),
    )
  );
}

export function createWorkerEmbeddingClient(
  options: EmbeddingClientOptions,
): EmbeddingClient {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const isOnline = options.isOnline ?? (() => navigator.onLine);
  const scheduler: Scheduler = options.scheduler ?? {
    setTimeout: (cb, ms) => globalThis.setTimeout(cb, ms) as unknown as number,
    clearTimeout: (id) => globalThis.clearTimeout(id),
  };

  let worker: Worker | null = null;
  let job: {
    attemptId: string;
    onEvent: (event: EmbeddingEvent) => void;
    timeoutId: number;
    expectedCount: number;
  } | null = null;

  const terminateWorker = () => {
    worker?.terminate();
    worker = null;
  };

  const clearJob = () => {
    if (job) {
      scheduler.clearTimeout(job.timeoutId);
      job = null;
    }
  };

  const failJob = (reason: EmbeddingUnavailableReason) => {
    const current = job;
    clearJob();
    current?.onEvent({ type: "unavailable", reason });
  };

  const deferUnavailable = (
    attemptId: string,
    onEvent: (event: EmbeddingEvent) => void,
    reason: EmbeddingUnavailableReason,
  ): EmbeddingSession => {
    let cancelled = false;
    const timeoutId = scheduler.setTimeout(() => {
      if (!cancelled) onEvent({ type: "unavailable", reason });
    }, 0);
    return {
      attemptId,
      cancel: () => {
        if (cancelled) return;
        cancelled = true;
        scheduler.clearTimeout(timeoutId);
        onEvent({ type: "unavailable", reason: "CANCELLED" });
      },
    };
  };

  const handleMessage = (event: MessageEvent<WorkerEmbedOutbound>) => {
    const msg = event.data;
    if (!msg || typeof msg !== "object" || !("type" in msg)) {
      terminateWorker();
      failJob("ERROR");
      return;
    }
    switch (msg.type) {
      case "load-progress":
        if (Number.isFinite(msg.progress)) {
          job?.onEvent({
            type: "progress",
            progress: Math.min(1, Math.max(0, msg.progress)),
          });
        }
        break;
      case "ready":
        job?.onEvent({ type: "progress", progress: null });
        break;
      case "result": {
        if (!job || msg.attemptId !== job.attemptId) return; // stale drop
        const current = job;
        if (!validEmbeddings(msg.embeddings, current.expectedCount)) {
          terminateWorker();
          failJob("ERROR");
          return;
        }
        clearJob();
        current.onEvent({ type: "done", embeddings: msg.embeddings });
        break;
      }
      case "error": {
        if (job && msg.attemptId !== null && msg.attemptId !== job.attemptId) {
          return;
        }
        if (msg.kind === "LOW_MEMORY") {
          terminateWorker();
        }
        failJob(msg.kind);
        break;
      }
      case "cancelled":
        break;
    }
  };

  const spawnWorker = (): Worker => {
    const instance = options.workerFactory();
    instance.onmessage = handleMessage;
    instance.onerror = () => {
      terminateWorker();
      failJob("ERROR");
    };
    worker = instance;
    return instance;
  };

  const post = (message: WorkerEmbedInbound) => {
    worker?.postMessage(message);
  };

  const cancelJob = (reason: EmbeddingUnavailableReason) => {
    if (!job) return;
    const current = job;
    clearJob();
    post({ type: "cancel", protocol: EMBED_PROTOCOL_VERSION, attemptId: current.attemptId });
    terminateWorker();
    current.onEvent({ type: "unavailable", reason });
  };

  return {
    embed(input, onEvent) {
      if (job) {
        cancelJob("CANCELLED");
      }

      const immediateFailure = !validInput(input.texts)
        ? "ERROR"
        : !worker && !isOnline()
          ? "OFFLINE"
          : null;
      if (immediateFailure) {
        return deferUnavailable(input.attemptId, onEvent, immediateFailure);
      }

      try {
        const activeWorker = worker ?? spawnWorker();
        const timeoutId = scheduler.setTimeout(() => {
          cancelJob("TIMEOUT");
        }, timeoutMs);
        job = {
          attemptId: input.attemptId,
          onEvent,
          timeoutId,
          expectedCount: input.texts.length,
        };

        post({
          type: "embed",
          protocol: EMBED_PROTOCOL_VERSION,
          attemptId: input.attemptId,
          texts: input.texts,
        });
        void activeWorker;
      } catch {
        clearJob();
        terminateWorker();
        return deferUnavailable(input.attemptId, onEvent, "ERROR");
      }

      return {
        attemptId: input.attemptId,
        cancel: () => cancelJob("CANCELLED"),
      };
    },

    dispose() {
      cancelJob("CANCELLED");
      terminateWorker();
    },
  };
}

/** Pinned embedding model. Revision hash is the integrity mechanism. */
export const EMBEDDING_MODEL = {
  id: "all-MiniLM-L6-v2",
  hfId: "Xenova/all-MiniLM-L6-v2",
  // Pinned revision; update deliberately and bump EMBED_PROTOCOL_VERSION on change.
  version: "751bff37182d3f1213fa05d7196b954e230abad9",
  quantization: "q8",
} as const;

/** Production client: module worker bundled by Vite, same-origin. */
export function createDefaultEmbeddingClient(): EmbeddingClient {
  return createWorkerEmbeddingClient({
    workerFactory: () =>
      new Worker(new URL("../speech/transcribe.worker.ts", import.meta.url), {
        type: "module",
      }),
  });
}
