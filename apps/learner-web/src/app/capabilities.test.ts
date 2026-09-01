import { describe, expect, it } from "vitest";
import {
  semanticCoverageAvailable,
  speechFeedbackAvailable,
  type Capabilities,
} from "./capabilities";

function capabilities(overrides: Partial<Capabilities> = {}): Capabilities {
  return {
    microphone: false,
    mediaRecorder: false,
    audioDecode: false,
    webAssembly: true,
    worker: true,
    storage: true,
    online: true,
    serviceWorker: true,
    ...overrides,
  };
}

describe("capability gates", () => {
  it("allows typed semantic review without microphone or audio APIs", () => {
    const caps = capabilities();
    expect(speechFeedbackAvailable(caps)).toBe(false);
    expect(semanticCoverageAvailable(caps)).toBe(true);
  });

  it("requires both a worker and WebAssembly for semantic review", () => {
    expect(semanticCoverageAvailable(capabilities({ worker: false }))).toBe(false);
    expect(semanticCoverageAvailable(capabilities({ webAssembly: false }))).toBe(false);
  });
});
