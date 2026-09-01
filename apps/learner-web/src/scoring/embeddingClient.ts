// Client side of the embedding worker protocol (v0.5 semantic coverage).
// Mirrors the transcription client: lazy worker spawn on explicit activation,
// single in-flight job, stale-drop by attemptId, termination on
// cancel/timeout/low-memory. See docs/V0.5_DEVELOPMENT_CONTEXT.md §4.

import type { TranscriptionUnavailableReason } from "@/practice/types";

export const EMBED_PROTOCOL_VERSION = 1;

export type EmbeddingUnavailableReason = TranscriptionUnavailableReason;

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

const DEFAULT_TIMEOUT_MS = 60_000;

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

  const handleMessage = (event: MessageEvent<WorkerEmbedOutbound>) => {
    const msg = event.data;
    switch (msg.type) {
      case "load-progress":
        job?.onEvent({ type: "progress", progress: msg.progress });
        break;
      case "ready":
        job?.onEvent({ type: "progress", progress: null });
        break;
      case "result": {
        if (!job || msg.attemptId !== job.attemptId) return; // stale drop
        const current = job;
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

      if (!worker && !isOnline()) {
        const timeoutId = scheduler.setTimeout(() => {
          onEvent({ type: "unavailable", reason: "OFFLINE" });
        }, 0);
        void timeoutId;
        return { attemptId: input.attemptId, cancel: () => undefined };
      }

      const activeWorker = worker ?? spawnWorker();
      const timeoutId = scheduler.setTimeout(() => {
        cancelJob("TIMEOUT");
      }, timeoutMs);
      job = { attemptId: input.attemptId, onEvent, timeoutId };

      post({
        type: "embed",
        protocol: EMBED_PROTOCOL_VERSION,
        attemptId: input.attemptId,
        texts: input.texts,
      });
      void activeWorker;

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
  version: "b3c8a7a5f4b1e2d8c9a7b6e5f4d3c2b1a9e8f7d6",
  quantization: "q8",
} as const;

/** Production client: module worker bundled by Vite, same-origin. */
export function createDefaultEmbeddingClient(): EmbeddingClient {
  return createWorkerEmbeddingClient({
    workerFactory: () =>
      new Worker(new URL("./embed.worker.ts", import.meta.url), {
        type: "module",
      }),
  });
}
