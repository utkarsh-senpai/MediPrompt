import { describe, expect, it } from "vitest";
import { detectSpeechIntervals } from "./vad";
import {
  FIXTURE_RATE,
  concat,
  constant,
  silence,
  sineBurst,
} from "@/test/pcmFixtures";

describe("detectSpeechIntervals", () => {
  it("finds nothing in pure silence", () => {
    expect(detectSpeechIntervals(silence(3), FIXTURE_RATE)).toEqual([]);
  });

  it("finds nothing in empty input", () => {
    expect(detectSpeechIntervals(new Float32Array(0), FIXTURE_RATE)).toEqual([]);
  });

  it("detects a single burst within one frame of tolerance", () => {
    const pcm = concat(silence(1), sineBurst(1), silence(1));
    const [iv] = detectSpeechIntervals(pcm, FIXTURE_RATE);
    expect(iv).toBeDefined();
    expect(Math.abs(iv!.startMs - 1000)).toBeLessThanOrEqual(30);
    expect(Math.abs(iv!.endMs - 2000)).toBeLessThanOrEqual(30);
  });

  it("splits bursts separated by a gap at or above minSilenceMs", () => {
    const pcm = concat(
      sineBurst(0.5),
      silence(1),
      sineBurst(0.5),
      silence(0.5),
    );
    expect(detectSpeechIntervals(pcm, FIXTURE_RATE)).toHaveLength(2);
  });

  it("bridges bursts separated by less than minSilenceMs", () => {
    const pcm = concat(
      sineBurst(0.5),
      silence(0.1),
      sineBurst(0.5),
      silence(0.5),
    );
    expect(detectSpeechIntervals(pcm, FIXTURE_RATE)).toHaveLength(1);
  });

  it("discards bursts shorter than minSpeechMs", () => {
    const pcm = concat(silence(0.5), sineBurst(0.06), silence(1));
    expect(detectSpeechIntervals(pcm, FIXTURE_RATE)).toEqual([]);
  });

  it("ignores constant noise below the absolute floor", () => {
    const pcm = constant(0.005, 2);
    expect(detectSpeechIntervals(pcm, FIXTURE_RATE)).toEqual([]);
  });

  it("adapts the threshold so speech stands out from steady room noise", () => {
    // 0.02-amplitude room tone with 0.4-amplitude speech bursts on top.
    const pcm = concat(
      constant(0.02, 1),
      sineBurst(1, FIXTURE_RATE, 0.4),
      constant(0.02, 1),
    );
    const intervals = detectSpeechIntervals(pcm, FIXTURE_RATE);
    expect(intervals).toHaveLength(1);
    expect(Math.abs(intervals[0]!.startMs - 1000)).toBeLessThanOrEqual(30);
  });

  it("is deterministic for identical input", () => {
    const pcm = concat(silence(1), sineBurst(0.5), silence(0.4), sineBurst(0.5));
    expect(detectSpeechIntervals(pcm, FIXTURE_RATE)).toEqual(
      detectSpeechIntervals(pcm, FIXTURE_RATE),
    );
  });
});
