import { describe, expect, it } from "vitest";
import {
  isElapsed,
  remainingMs,
  startDeadline,
  validateDurationMs,
} from "./deadlineTimer";

describe("validateDurationMs", () => {
  it("accepts a positive finite integer", () => {
    expect(validateDurationMs(90_000)).toBe(90_000);
    expect(validateDurationMs(90_000.9)).toBe(90_000);
  });

  it("rejects negative, zero, NaN, infinite, and overflowing durations", () => {
    expect(() => validateDurationMs(0)).toThrow();
    expect(() => validateDurationMs(-1)).toThrow();
    expect(() => validateDurationMs(NaN)).toThrow();
    expect(() => validateDurationMs(Infinity)).toThrow();
    expect(() => validateDurationMs(25 * 60 * 60 * 1000)).toThrow();
    expect(() => validateDurationMs("90" as unknown as number)).toThrow();
  });
});

describe("deadline", () => {
  it("startDeadline adds duration to now", () => {
    expect(startDeadline(1000, 90_000)).toBe(91_000);
  });

  it("remainingMs floors to zero at and after the deadline", () => {
    expect(remainingMs(1000, 500)).toBe(500);
    expect(remainingMs(1000, 1000)).toBe(0);
    expect(remainingMs(1000, 1500)).toBe(0);
  });

  it("isElapsed is true at and after the deadline", () => {
    expect(isElapsed(1000, 999)).toBe(false);
    expect(isElapsed(1000, 1000)).toBe(true);
    expect(isElapsed(1000, 2000)).toBe(true);
  });
});
