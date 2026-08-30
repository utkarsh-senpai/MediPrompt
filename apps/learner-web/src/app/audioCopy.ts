// User-facing copy for every §5 error-matrix row. An absent transcript is a
// valid outcome — the copy always points at the typed/self-review path.
// See docs/V0.3_DEVELOPMENT_CONTEXT.md §5/§10.

import type { AudioErrorCode, TranscriptionUnavailableReason } from "@/practice/types";

export function audioIssueCopy(code: AudioErrorCode): string {
  switch (code) {
    case "AUDIO_MIC_PERMISSION_DENIED":
      return "Microphone access was denied. Nothing was recorded — the timer and self-review work exactly the same.";
    case "AUDIO_MIC_UNAVAILABLE":
      return "No usable microphone or recording format was found on this device. The timer and self-review work exactly the same.";
    case "AUDIO_RECORD_FAILED":
      return "The recording did not come through. Your timed attempt still counts — review it by typing or from memory.";
    case "AUDIO_DECODE_FAILED":
      return "The recording could not be read for analysis. Playback may still work; delivery metrics are unavailable this time.";
    case "AUDIO_ANALYSIS_FAILED":
      return "Delivery analysis failed on this device. Playback and self-review still work.";
  }
}

export function transcriptionIssueCopy(reason: TranscriptionUnavailableReason): string {
  switch (reason) {
    case "DECLINED":
      return "You skipped transcription. Type what you said, or review from memory.";
    case "LOAD_FAILED":
      return "The speech model could not be loaded — the connection may have dropped during the one-time download. You can retry, or type instead.";
    case "OFFLINE":
      return "You are offline and the speech model is not downloaded yet. Retry when you are back online (it is cached after the first download), or type instead.";
    case "TIMEOUT":
      return "Transcription took too long and was stopped. You can retry, or type instead.";
    case "LOW_MEMORY":
      return "This device ran low on memory, so transcription stopped and the model was unloaded. You can retry, or type instead.";
    case "CANCELLED":
      return "Transcription was cancelled. You can retry, or type instead.";
    case "ERROR":
      return "Transcription failed unexpectedly. You can retry, or type instead.";
  }
}
