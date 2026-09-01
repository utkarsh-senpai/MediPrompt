import type { AudioErrorCode } from "@/practice/types";

/** Typed failure for the audio pipeline; each code maps to one §5 error-matrix row. */
export class AudioError extends Error {
  readonly code: AudioErrorCode;

  constructor(code: AudioErrorCode, message: string) {
    super(message);
    this.name = "AudioError";
    this.code = code;
  }
}

export function isAudioError(err: unknown): err is AudioError {
  return err instanceof AudioError;
}

/** Map getUserMedia DOMException names to stable codes. */
export function micErrorFromException(err: unknown): AudioError {
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError" || err.name === "SecurityError") {
      return new AudioError(
        "AUDIO_MIC_PERMISSION_DENIED",
        "Microphone permission was denied.",
      );
    }
    if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
      return new AudioError(
        "AUDIO_MIC_UNAVAILABLE",
        "No usable microphone was found.",
      );
    }
  }
  return new AudioError(
    "AUDIO_MIC_UNAVAILABLE",
    "Microphone could not be opened.",
  );
}
