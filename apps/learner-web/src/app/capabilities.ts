// Capability detection. The core loop must work with all of these unavailable;
// these flags are informational only and never gate the core flow.

export interface Capabilities {
  microphone: boolean;
  /** MediaRecorder + codec probe support (v0.3 recording). */
  mediaRecorder: boolean;
  /** Web Audio decodeAudioData (v0.3 delivery analysis). */
  audioDecode: boolean;
  /** WebAssembly (v0.3 on-device transcription runtime). */
  webAssembly: boolean;
  /** Web Workers (v0.3 transcription runs off the main thread). */
  worker: boolean;
  storage: boolean;
  online: boolean;
  serviceWorker: boolean;
}

export function detectCapabilities(): Capabilities {
  const hasStorage = (() => {
    try {
      const k = "__mediprompt_probe__";
      globalThis.localStorage?.setItem(k, "1");
      globalThis.localStorage?.removeItem(k);
      return true;
    } catch {
      return false;
    }
  })();

  return {
    microphone: Boolean(
      navigator?.mediaDevices?.getUserMedia &&
        typeof navigator.mediaDevices.getUserMedia === "function",
    ),
    mediaRecorder:
      typeof MediaRecorder !== "undefined" &&
      typeof MediaRecorder.isTypeSupported === "function",
    audioDecode: typeof AudioContext !== "undefined",
    webAssembly: typeof WebAssembly !== "undefined",
    worker: typeof Worker !== "undefined",
    storage: hasStorage,
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
    serviceWorker: "serviceWorker" in navigator,
  };
}

/** Everything the v0.3 speech-feedback path needs; anything missing means timer-only. */
export function speechFeedbackAvailable(caps: Capabilities): boolean {
  return (
    caps.microphone &&
    caps.mediaRecorder &&
    caps.audioDecode &&
    caps.webAssembly &&
    caps.worker
  );
}

/** Semantic typed-review enhancement does not require microphone or audio APIs. */
export function semanticCoverageAvailable(caps: Capabilities): boolean {
  return caps.webAssembly && caps.worker;
}
