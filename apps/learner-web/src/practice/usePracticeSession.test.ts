import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePracticeSession } from "./usePracticeSession";
import { validatePack } from "@/content/packValidator";
import { seededRandom } from "@/platform/random";
import { InMemoryBagStore } from "@/platform/bagStore";
import { DEFAULT_SETTINGS, type RuntimePack } from "./types";
import demoPackJson from "@content/packs/demo-interaction-fixture.json";

const pack = validatePack(demoPackJson) as RuntimePack;

function setup() {
  const nowRef = { value: 0 };
  const monotonic = { now: () => nowRef.value };
  const wall = { isoNow: () => "2026-08-30T00:00:00.000Z" };
  const random = seededRandom(123);
  const bagStore = new InMemoryBagStore();
  const hook = renderHook(() =>
    usePracticeSession({ pack, settings: DEFAULT_SETTINGS, monotonic, wall, random, bagStore }),
  );
  // Advance both the fake clock (to flush interval ticks) and the injected monotonic value.
  const advance = (ms: number) =>
    act(() => {
      nowRef.value += ms;
      vi.advanceTimersByTime(ms);
    });
  return { hook, advance };
}

describe("usePracticeSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs the full Recall Sprint loop: spin → speak → complete", () => {
    const { hook, advance } = setup();
    const { result } = hook;
    expect(result.current.state.name).toBe("IDLE");

    act(() => result.current.actions.spin());
    expect(result.current.state.name).toBe("TOPIC_READY");

    act(() => result.current.actions.startTimer());
    expect(result.current.state.name).toBe("SPEAKING");

    advance(90_000);
    expect(result.current.state.name).toBe("ATTEMPT_COMPLETE");
  });

  it("a visibility event mid-deadline is a no-op and completion fires once", () => {
    const { hook, advance } = setup();
    const { result } = hook;
    act(() => result.current.actions.spin());
    act(() => result.current.actions.startTimer());
    expect(result.current.state.name).toBe("SPEAKING");

    advance(40_000);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(result.current.state.name).toBe("SPEAKING");

    advance(50_000);
    expect(result.current.state.name).toBe("ATTEMPT_COMPLETE");
    advance(5_000);
    expect(result.current.state.name).toBe("ATTEMPT_COMPLETE");
  });

  it("runs the Deep Research loop: research → ready → speak → complete", () => {
    const { hook, advance } = setup();
    const { result } = hook;
    act(() =>
      result.current.actions.setSelection({
        mode: "DEEP_RESEARCH",
        subjectId: "reasoning-and-tradeoffs",
      }),
    );
    expect(result.current.state.name).toBe("IDLE");

    act(() => result.current.actions.spin());
    expect(result.current.state.name).toBe("TOPIC_READY");

    act(() => result.current.actions.startResearch());
    expect(result.current.state.name).toBe("RESEARCHING");

    advance(120_000);
    expect(result.current.state.name).toBe("READY_TO_SPEAK");

    act(() => result.current.actions.confirmReady());
    expect(result.current.state.name).toBe("SPEAKING");

    advance(90_000);
    expect(result.current.state.name).toBe("ATTEMPT_COMPLETE");
  });

  it("spin again repeats without error after completion", () => {
    const { hook, advance } = setup();
    const { result } = hook;
    act(() => result.current.actions.spin());
    act(() => result.current.actions.startTimer());
    advance(90_000);
    expect(result.current.state.name).toBe("ATTEMPT_COMPLETE");
    act(() => result.current.actions.spinAgain());
    expect(result.current.state.name).toBe("TOPIC_READY");
  });
});
