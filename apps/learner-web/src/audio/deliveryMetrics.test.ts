import { describe, expect, it } from "vitest";
import {
  computeAudioMetrics,
  computeTextMetrics,
} from "./deliveryMetrics";
import {
  FIXTURE_RATE,
  concat,
  constant,
  silence,
  sineBurst,
} from "@/test/pcmFixtures";

describe("computeAudioMetrics", () => {
  it("measures spoken time and a single inter-speech pause", () => {
    const pcm = concat(sineBurst(1), silence(0.8), sineBurst(1), silence(0.3));
    const m = computeAudioMetrics({ pcm, sampleRate: FIXTURE_RATE, durationMs: 3100 });
    expect(m.durationMs).toBe(3100);
    expect(m.spokenMs).toBeGreaterThanOrEqual(1900);
    expect(m.spokenMs).toBeLessThanOrEqual(2100);
    expect(m.pauses).toHaveLength(1);
    expect(Math.abs(m.pauses[0]!.durationMs - 800)).toBeLessThanOrEqual(60);
    expect(m.pauses[0]!.kind).toBe("UNKNOWN");
  });

  it("never emits text-derived fields", () => {
    const pcm = concat(sineBurst(1), silence(0.3));
    const m = computeAudioMetrics({ pcm, sampleRate: FIXTURE_RATE, durationMs: 1300 });
    expect(m.wordsPerMinute).toBeUndefined();
    expect(m.fillerCount).toBeUndefined();
    expect(m.repeatedPhraseCount).toBeUndefined();
  });

  it("flags a fully clipped recording with a quality limitation", () => {
    const pcm = constant(1, 1.5);
    const m = computeAudioMetrics({ pcm, sampleRate: FIXTURE_RATE, durationMs: 1500 });
    expect(m.clippingRatio).toBe(1);
    expect(m.limitations.some((l) => l.includes("clipping"))).toBe(true);
  });

  it("reports zero clipping on a clean recording", () => {
    const m = computeAudioMetrics({
      pcm: sineBurst(1, FIXTURE_RATE, 0.5),
      sampleRate: FIXTURE_RATE,
      durationMs: 1000,
    });
    expect(m.clippingRatio).toBe(0);
  });

  it("reports loudness variation when loud and quiet speech alternate", () => {
    const loud = sineBurst(0.4, FIXTURE_RATE, 0.5);
    const quiet = sineBurst(0.4, FIXTURE_RATE, 0.05);
    const pcm = concat(loud, silence(0.3), quiet, silence(0.3), loud, silence(0.3), quiet);
    const m = computeAudioMetrics({ pcm, sampleRate: FIXTURE_RATE, durationMs: 2500 });
    expect(m.loudnessVariationDb).toBeDefined();
    expect(m.loudnessVariationDb!).toBeGreaterThanOrEqual(15);
    expect(m.loudnessVariationDb!).toBeLessThanOrEqual(25);
  });

  it("adds a no-speech limitation for silence", () => {
    const m = computeAudioMetrics({
      pcm: silence(2),
      sampleRate: FIXTURE_RATE,
      durationMs: 2000,
    });
    expect(m.spokenMs).toBe(0);
    expect(m.pauses).toEqual([]);
    expect(m.limitations.some((l) => l.includes("No speech"))).toBe(true);
  });

  it("handles empty PCM honestly", () => {
    const m = computeAudioMetrics({
      pcm: new Float32Array(0),
      sampleRate: FIXTURE_RATE,
      durationMs: 0,
    });
    expect(m.spokenMs).toBeUndefined();
    expect(m.limitations.some((l) => l.includes("empty"))).toBe(true);
  });

  it("is deterministic for identical input", () => {
    const pcm = concat(sineBurst(0.5), silence(0.4), sineBurst(0.5));
    const a = computeAudioMetrics({ pcm, sampleRate: FIXTURE_RATE, durationMs: 1400 });
    const b = computeAudioMetrics({ pcm, sampleRate: FIXTURE_RATE, durationMs: 1400 });
    expect(a).toEqual(b);
  });
});

describe("computeTextMetrics", () => {
  it("computes WPM from approved words over spoken time", () => {
    const t = computeTextMetrics({
      text: "one two three four five six seven eight nine",
      spokenMs: 30000,
    });
    expect(t.wordsPerMinute).toBe(18);
  });

  it("omits WPM without a spoken-time measurement", () => {
    const t = computeTextMetrics({ text: "some typed words" });
    expect(t.wordsPerMinute).toBeUndefined();
    expect(t.fillerCount).toBe(0);
  });

  it("counts unambiguous fillers including multiword phrases once", () => {
    const t = computeTextMetrics({
      text: "Um, the answer is, you know, correct. You know it. Uh.",
    });
    expect(t.fillerCount).toBe(4);
  });

  it("does not count content words that can be discourse markers", () => {
    const t = computeTextMetrics({ text: "I actually like this basically correct answer" });
    expect(t.fillerCount).toBe(0);
  });

  it("counts immediate repeats and repeated bigrams beyond the first occurrence", () => {
    const t = computeTextMetrics({ text: "the the patient the patient improved" });
    // "the the" immediate repeat = 1; bigram "the patient" x2 = 1 extra.
    expect(t.repeatedPhraseCount).toBe(2);
  });

  it("is case-insensitive", () => {
    const t = computeTextMetrics({ text: "UM okay UM" });
    expect(t.fillerCount).toBe(2);
  });
});
