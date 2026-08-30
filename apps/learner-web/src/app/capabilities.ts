// Capability detection. The v0.2 loop must work with all of these unavailable;
// these flags are informational only and never gate the core flow.

export interface Capabilities {
  microphone: boolean;
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
    storage: hasStorage,
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
    serviceWorker: "serviceWorker" in navigator,
  };
}
