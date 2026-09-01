// Client side of the transcription worker protocol. Owns the worker lifetime:
// lazy spawn on first explicit activation, warm reuse, and termination on
// cancel/timeout/low-memory so model memory is fully released.
// See docs/V0.3_DEVELOPMENT_CONTEXT.md §7.

import type {
  TranscriptDraft,
  TranscriptionUnavailableReason,
} from "@/practice/types";
import {
  TRANSCRIBE_PROTOCOL_VERSION,
  type WorkerInbound,
  type WorkerOutbound,
} from "./protocol";

export type TranscriptionEvent =
  /** Model download/load 0..1; null once inference is running (indeterminate). */
  | { type: "progress"; progress: number | null }
  | { type: "done"; draft: TranscriptDraft }
  | { type: "unavailable"; reason: TranscriptionUnavailableReason };

export interface TranscriptionSession {
  readonly attemptId: string;
  cancel(): void;
}

export interface TranscriptionClient {
  transcribe(
    input: { attemptId: string; pcm: Float32Array; sampleRate: number },
    onEvent: (event: TranscriptionEvent) => void,
  ): TranscriptionSession;
  dispose(): void;
}

export interface Scheduler {
  setTimeout(cb: () => void, ms: number): number;
  clearTimeout(id: number): void;
}

export interface TranscriptionClientOptions {
  workerFactory: () => Worker;
  /** Absolute cap for load + inference. Default 180s for first-download phones. */
  timeoutMs?: number;
  isOnline?: () => boolean;
  scheduler?: Scheduler;
}

const DEFAULT_TIMEOUT_MS = 180_000;

export function createWorkerTranscriptionClient(
  options: TranscriptionClientOptions,
): TranscriptionClient {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const isOnline = options.isOnline ?? (() => navigator.onLine);
  const scheduler: Scheduler = options.scheduler ?? {
    // @types/node widens the return type; in the browser this is a number.
    setTimeout: (cb, ms) => globalThis.setTimeout(cb, ms) as unknown as number,
    clearTimeout: (id) => globalThis.clearTimeout(id),
  };

  let worker: Worker | null = null;
  let model: TranscriptDraft["model"];
  let job: {
    attemptId: string;
    onEvent: (event: TranscriptionEvent) => void;
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

  const failJob = (reason: TranscriptionUnavailableReason) => {
    const current = job;
    clearJob();
    current?.onEvent({ type: "unavailable", reason });
  };

  const handleMessage = (event: MessageEvent<WorkerOutbound>) => {
    const msg = event.data;
    switch (msg.type) {
      case "load-progress":
        job?.onEvent({ type: "progress", progress: msg.progress });
        break;
      case "ready":
        model = msg.model;
        job?.onEvent({ type: "progress", progress: null });
        break;
      case "result": {
        // Stale drop: results for a non-current attempt are discarded.
        if (!job || msg.attemptId !== job.attemptId) return;
        const current = job;
        clearJob();
        current.onEvent({
          type: "done",
          draft: {
            text: msg.text,
            source: "LOCAL_WHISPER",
            model,
            uncertainRanges: msg.uncertainRanges,
          },
        });
        break;
      }
      case "error": {
        if (job && msg.attemptId !== null && msg.attemptId !== job.attemptId) {
          return;
        }
        if (msg.kind === "LOW_MEMORY") {
          // Release the model so the next activation starts with a clean heap.
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

  const post = (message: WorkerInbound, transfer: Transferable[] = []) => {
    worker?.postMessage(message, { transfer });
  };

  const cancelJob = (reason: TranscriptionUnavailableReason) => {
    if (!job) return;
    const current = job;
    clearJob();
    post({
      type: "cancel",
      protocol: TRANSCRIBE_PROTOCOL_VERSION,
      attemptId: current.attemptId,
    });
    // Terminating the worker is the real cancellation: inference cannot be
    // interrupted cooperatively, so the whole worker (and model memory) goes.
    terminateWorker();
    current.onEvent({ type: "unavailable", reason });
  };

  return {
    transcribe(input, onEvent) {
      if (job) {
        // Single in-flight job: supersede the previous one cleanly.
        cancelJob("CANCELLED");
      }

      if (!worker && !isOnline()) {
        // Cold start needs a model download. Offline: defer without spawning
        // a worker; the learner can retry later (error-matrix row).
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

      // Copy before transfer: the caller's buffer must never be detached.
      const copy = input.pcm.slice();
      post(
        {
          type: "transcribe",
          protocol: TRANSCRIBE_PROTOCOL_VERSION,
          attemptId: input.attemptId,
          pcm: copy.buffer,
          sampleRate: input.sampleRate,
        },
        [copy.buffer],
      );
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

/** Production client: module worker bundled by Vite, same-origin (worker-src 'self'). */
export function createDefaultTranscriptionClient(): TranscriptionClient {
  return createWorkerTranscriptionClient({
    workerFactory: () =>
      new Worker(new URL("./transcribe.worker.ts", import.meta.url), {
        type: "module",
      }),
  });
}
