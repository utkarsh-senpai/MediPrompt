import { afterEach, describe, expect, it, vi } from "vitest";
import { playSpinTick, playTimerEnd, playTimerStart } from "./sounds";

describe("sound cues", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("no-ops without throwing when AudioContext is unavailable", () => {
    expect(() => playSpinTick(false)).not.toThrow();
    expect(() => playTimerStart(false)).not.toThrow();
    expect(() => playTimerEnd(false)).not.toThrow();
  });

  it("never touches AudioContext when muted", () => {
    const construct = vi.fn();
    vi.stubGlobal(
      "AudioContext",
      class {
        constructor() {
          construct();
        }
      },
    );
    playSpinTick(true);
    playTimerStart(true);
    playTimerEnd(true);
    expect(construct).not.toHaveBeenCalled();
  });

  it("swallows errors from a bare constructor stub", () => {
    vi.stubGlobal("AudioContext", class {});
    expect(() => playSpinTick(false)).not.toThrow();
    expect(() => playTimerEnd(false)).not.toThrow();
  });
});
