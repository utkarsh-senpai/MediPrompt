/// <reference lib="webworker" />
// Shared browser-local model worker. Separate worker instances lazily load either
// Whisper transcription or MiniLM embeddings, while Vite emits the transformers.js
// runtime only once. Clients own cancellation by terminating their instance.

import { env, pipeline } from "@huggingface/transformers";
import { resample } from "@/audio/pcmDecode";
import {
  TRANSCRIPTION_MODEL,
  type WorkerInbound,
  type WorkerOutbound,
} from "./protocol";
import {
  EMBED_PROTOCOL_VERSION,
  EMBEDDING_MODEL,
  MAX_EMBED_TEXTS,
  MAX_EMBED_TOTAL_CHARACTERS,
  type WorkerEmbedInbound,
  type WorkerEmbedOutbound,
} from "@/scoring/embeddingClient";

// Same-origin WASM runtime (copied by scripts/copy-model-runtime.mjs); the
// library default is a CDN, which the CSP forbids. Single thread: multithread
// builds spawn blob: workers, which worker-src 'self' blocks.
// transformers.js always initializes the wasm flags object at import time.
const wasmFlags = env.backends.onnx.wasm!;
wasmFlags.wasmPaths = `${self.location.origin}${import.meta.env.BASE_URL}models/ort/`;
wasmFlags.numThreads = 1;

// Model weights come from the pinned Hugging Face revision (connect-src allow
// -listed) and are cached by the browser for offline reuse. No audio ever
// leaves the device: inference runs entirely in this worker.
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;

const WHISPER_SAMPLE_RATE = 16000;

interface ProgressEvent {
  status: string;
  progress?: number;
}

type AsrPipeline = (
  audio: Float32Array,
  options: Record<string, unknown>,
) => Promise<{ text: string }>;

type FeaturePipeline = (
  texts: string[],
  options: Record<string, unknown>,
) => Promise<{ data: Float32Array; dims: number[] }>;

let transcriberPromise: Promise<AsrPipeline> | null = null;
let embedderPromise: Promise<FeaturePipeline> | null = null;

function post(message: WorkerOutbound | WorkerEmbedOutbound, transfer: Transferable[] = []): void {
  self.postMessage(message, { transfer });
}

function loadEmbedder(): Promise<FeaturePipeline> {
  if (!embedderPromise) {
    embedderPromise = (
      pipeline("feature-extraction", EMBEDDING_MODEL.hfId, {
        revision: EMBEDDING_MODEL.version,
        dtype: EMBEDDING_MODEL.quantization,
        device: "wasm",
        progress_callback: (event: ProgressEvent) => {
          if (event.status === "progress" && typeof event.progress === "number") {
            post({
              type: "load-progress",
              progress: Math.min(1, Math.max(0, event.progress / 100)),
            });
          }
        },
      }) as Promise<unknown>
    ).then((value) => value as FeaturePipeline);
    embedderPromise.catch(() => {
      embedderPromise = null;
    });
  }
  return embedderPromise;
}

function loadTranscriber(): Promise<AsrPipeline> {
  if (!transcriberPromise) {
    transcriberPromise = (
      pipeline(
        "automatic-speech-recognition",
        TRANSCRIPTION_MODEL.hfId,
        {
          revision: TRANSCRIPTION_MODEL.version,
          // Must equal TRANSCRIPTION_MODEL.quantization (typed as string there).
          dtype: "q4",
          device: "wasm",
          progress_callback: (event: ProgressEvent) => {
            if (event.status === "progress" && typeof event.progress === "number") {
              post({
                type: "load-progress",
                progress: Math.min(1, Math.max(0, event.progress / 100)),
              });
            }
          },
        },
      ) as Promise<unknown>
    ).then((p) => p as AsrPipeline);
    // A failed load must not poison the worker: the next attempt retries fresh.
    transcriberPromise.catch(() => {
      transcriberPromise = null;
    });
  }
  return transcriberPromise;
}

function classifyError(err: unknown): "LOAD_FAILED" | "LOW_MEMORY" | "ERROR" {
  const msg = String(err).toLowerCase();
  if (msg.includes("memory") || msg.includes("oom") || msg.includes("allocation")) {
    return "LOW_MEMORY";
  }
  if (
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("404") ||
    msg.includes("load")
  ) {
    return "LOAD_FAILED";
  }
  return "ERROR";
}

self.onmessage = async (event: MessageEvent<WorkerInbound | WorkerEmbedInbound>) => {
  const msg = event.data;
  if (msg.protocol !== 1) return;
  if (msg.type === "cancel") {
    // Cooperative acknowledgement only; real cancellation is the client
    // terminating this worker so its memory is fully released.
    post({ type: "cancelled", attemptId: msg.attemptId });
    return;
  }

  if (msg.type === "embed") {
    if (msg.protocol !== EMBED_PROTOCOL_VERSION) return;
    if (
      !Array.isArray(msg.texts) ||
      msg.texts.length === 0 ||
      msg.texts.length > MAX_EMBED_TEXTS ||
      msg.texts.some((value) => typeof value !== "string" || value.trim().length === 0)
    ) {
      post({
        type: "error",
        attemptId: msg.attemptId,
        kind: "ERROR",
        message: "invalid embedding request",
      });
      return;
    }
    const totalCharacters = msg.texts.reduce((sum, value) => sum + value.length, 0);
    if (totalCharacters > MAX_EMBED_TOTAL_CHARACTERS) {
      post({
        type: "error",
        attemptId: msg.attemptId,
        kind: "ERROR",
        message: "embedding request is too large",
      });
      return;
    }
    try {
      const embedder = await loadEmbedder();
      post({ type: "ready" });
      const output = await embedder(msg.texts, { pooling: "mean", normalize: true });
      const dims = output.dims;
      const dimension =
        dims.length > 1 ? (dims[1] ?? 0) : output.data.length / msg.texts.length;
      if (
        !Number.isSafeInteger(dimension) ||
        dimension <= 0 ||
        output.data.length !== msg.texts.length * dimension
      ) {
        throw new Error("invalid embedding tensor shape");
      }
      const embeddings: number[][] = [];
      for (let i = 0; i < msg.texts.length; i++) {
        const start = i * dimension;
        embeddings.push(Array.from(output.data.subarray(start, start + dimension)));
      }
      post({ type: "result", attemptId: msg.attemptId, embeddings });
    } catch (err) {
      post({
        type: "error",
        attemptId: msg.attemptId,
        kind: classifyError(err),
        message: err instanceof Error ? err.message : String(err),
      });
    }
    return;
  }

  try {
    const transcriber = await loadTranscriber();
    post({
      type: "ready",
      model: {
        id: TRANSCRIPTION_MODEL.id,
        version: TRANSCRIPTION_MODEL.version,
        quantization: TRANSCRIPTION_MODEL.quantization,
      },
    });
    const pcm = resample(
      new Float32Array(msg.pcm),
      msg.sampleRate,
      WHISPER_SAMPLE_RATE,
    );
    const output = await transcriber(pcm, {
      chunk_length_s: 30,
      stride_length_s: 5,
    });
    // whisper-base.en exposes no calibrated per-span confidence; reporting
    // none is honest, inventing ranges would not be.
    post({
      type: "result",
      attemptId: msg.attemptId,
      text: output.text.trim(),
      uncertainRanges: [],
    });
  } catch (err) {
    post({
      type: "error",
      attemptId: msg.attemptId,
      kind: classifyError(err),
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
