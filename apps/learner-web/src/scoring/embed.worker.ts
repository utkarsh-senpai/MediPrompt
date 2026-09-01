/// <reference lib="webworker" />
// Browser-local embedding worker for v0.5 semantic coverage. Lazy: the
// all-MiniLM-L6-v2 model downloads only on explicit activation, then lives in
// the browser cache. The client cancels by terminating this worker.
// See docs/V0.5_DEVELOPMENT_CONTEXT.md §4.

import { env, pipeline } from "@huggingface/transformers";
import {
  EMBED_PROTOCOL_VERSION,
  EMBEDDING_MODEL,
  type WorkerEmbedInbound,
  type WorkerEmbedOutbound,
} from "./embeddingClient";

const wasmFlags = env.backends.onnx.wasm!;
wasmFlags.wasmPaths = `${self.location.origin}${import.meta.env.BASE_URL}models/ort/`;
wasmFlags.numThreads = 1;

env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;

interface ProgressEvent {
  status: string;
  progress?: number;
}

type FeaturePipeline = (
  texts: string[],
  options: Record<string, unknown>,
) => Promise<{ data: Float32Array; dims: number[] }>;

let embedderPromise: Promise<FeaturePipeline> | null = null;

function post(message: WorkerEmbedOutbound): void {
  self.postMessage(message);
}

function loadEmbedder(): Promise<FeaturePipeline> {
  if (!embedderPromise) {
    embedderPromise = (
      pipeline("feature-extraction", EMBEDDING_MODEL.hfId, {
        revision: EMBEDDING_MODEL.version,
        dtype: "q8",
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
    ).then((p) => p as FeaturePipeline);
    embedderPromise.catch(() => {
      embedderPromise = null;
    });
  }
  return embedderPromise;
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

self.onmessage = async (event: MessageEvent<WorkerEmbedInbound>) => {
  const msg = event.data;
  if (msg.protocol !== EMBED_PROTOCOL_VERSION) return;
  if (msg.type === "cancel") {
    post({ type: "cancelled", attemptId: msg.attemptId });
    return;
  }

  try {
    const embedder = await loadEmbedder();
    post({ type: "ready" });
    const output = await embedder(msg.texts, { pooling: "mean", normalize: true });
    // transformers.js returns a Tensor-like { data, dims }. dims = [batch, dim].
    const dims = output.dims;
    const dim = dims.length > 1 ? (dims[1] as number) : output.data.length / msg.texts.length;
    const embeddings: number[][] = [];
    for (let i = 0; i < msg.texts.length; i++) {
      const start = i * dim;
      embeddings.push(Array.from(output.data.subarray(start, start + dim)));
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
};
