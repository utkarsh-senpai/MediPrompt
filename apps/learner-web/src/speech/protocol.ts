import type { TranscriptModel } from "@/practice/types";

/**
 * Versioned message protocol between the app and the transcription worker.
 * Results for a non-current attemptId are dropped by the client (stale drop,
 * same rule as v0.2 draw events).
 */
export const TRANSCRIBE_PROTOCOL_VERSION = 1;

export type WorkerInbound =
  | {
      type: "transcribe";
      protocol: typeof TRANSCRIBE_PROTOCOL_VERSION;
      attemptId: string;
      pcm: ArrayBuffer;
      sampleRate: number;
    }
  | {
      type: "cancel";
      protocol: typeof TRANSCRIBE_PROTOCOL_VERSION;
      attemptId: string;
    };

export type WorkerErrorKind = "LOAD_FAILED" | "LOW_MEMORY" | "ERROR";

export type WorkerOutbound =
  | { type: "load-progress"; progress: number }
  | { type: "ready"; model: TranscriptModel }
  | {
      type: "result";
      attemptId: string;
      text: string;
      uncertainRanges: Array<{ start: number; end: number }>;
    }
  | {
      type: "error";
      attemptId: string | null;
      kind: WorkerErrorKind;
      message: string;
    }
  | { type: "cancelled"; attemptId: string };

/** Pinned whisper build. The revision hash is the integrity mechanism. */
export const TRANSCRIPTION_MODEL: TranscriptModel & { hfId: string } = {
  id: "whisper-base.en",
  hfId: "onnx-community/whisper-base.en",
  version: "51eefc0af78b103839eda9e7e4f4186acc6517fe",
  quantization: "q4",
};
