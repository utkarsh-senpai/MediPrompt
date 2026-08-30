// Delivery measurements over mono PCM + approved transcripts. Pure functions,
// deterministic within the tolerances documented per metric.
// See docs/V0.3_DEVELOPMENT_CONTEXT.md §6.

import {
  DEFAULT_VAD_OPTIONS,
  detectSpeechIntervals,
  frameEnergies,
  type SpeechInterval,
  type VadOptions,
} from "./vad";
import type {
  DeliveryMetrics,
  PauseObservation,
  TextMetrics,
} from "@/practice/types";

/** Samples at or above this amplitude count as clipped (fixture-pinned). */
export const CLIPPING_THRESHOLD = 0.999;
/** Above this clipping share the recording quality warning is added. */
export const SEVERE_CLIPPING_RATIO = 0.05;
/** Gaps longer than this are terminal silences / topic breaks, not pauses. */
export const TERMINAL_SILENCE_MS = 5000;
/** Loudness variation needs at least this many voiced frames to be meaningful. */
const MIN_LOUDNESS_FRAMES = 8;

// Conservative default: only unambiguous fillers. Discourse markers that are
// also content words ("like", "basically", "actually") are excluded on purpose;
// a false positive would fabricate a delivery problem that did not happen.
export const DEFAULT_FILLER_PATTERNS: readonly string[] = Object.freeze([
  "um",
  "uh",
  "er",
  "erm",
  "ah",
  "hmm",
  "you know",
]);

export interface AudioMetricInput {
  pcm: Float32Array;
  sampleRate: number;
  durationMs: number;
  vad?: Partial<VadOptions>;
}

/**
 * Audio-derived observations. Text-derived fields are absent here by contract;
 * they appear only after transcript approval via computeTextMetrics.
 */
export function computeAudioMetrics(input: AudioMetricInput): DeliveryMetrics {
  const { pcm, sampleRate, durationMs } = input;
  const limitations: string[] = [
    "Loudness is relative to this device and cannot be compared across devices.",
    "Pause placement (mid-clause vs boundary) is not classified in this version.",
  ];

  if (pcm.length === 0 || sampleRate <= 0) {
    return {
      durationMs,
      pauses: [],
      limitations: [...limitations, "Recording was empty or could not be measured."],
    };
  }

  const vad: VadOptions = { ...DEFAULT_VAD_OPTIONS, ...input.vad };
  const intervals = detectSpeechIntervals(pcm, sampleRate, vad);
  const spokenMs = intervals.reduce(
    (sum, iv) => sum + (iv.endMs - iv.startMs),
    0,
  );
  if (spokenMs === 0) {
    limitations.push("No speech was detected in the recording.");
  }

  const pauses: PauseObservation[] = [];
  for (let i = 1; i < intervals.length; i += 1) {
    const prev: SpeechInterval = intervals[i - 1]!;
    const next = intervals[i]!;
    const gap = next.startMs - prev.endMs;
    if (gap >= vad.minSilenceMs && gap <= TERMINAL_SILENCE_MS) {
      pauses.push({ startMs: prev.endMs, durationMs: gap, kind: "UNKNOWN" });
    }
  }

  let clipped = 0;
  for (let i = 0; i < pcm.length; i += 1) {
    if (Math.abs(pcm[i]!) >= CLIPPING_THRESHOLD) clipped += 1;
  }
  const clippingRatio = clipped / pcm.length;
  if (clippingRatio > SEVERE_CLIPPING_RATIO) {
    limitations.push(
      "Significant clipping detected; the microphone was too loud or too close.",
    );
  }

  const { rms } = frameEnergies(pcm, sampleRate, vad.frameMs);
  const threshold = Math.max(
    vad.absoluteFloor,
    vad.thresholdScale * percentile20(rms),
  );
  const voicedDb: number[] = [];
  for (let f = 0; f < rms.length; f += 1) {
    const energy = rms[f]!;
    if (energy >= threshold && energy > 0) {
      voicedDb.push(20 * Math.log10(energy));
    }
  }
  let loudnessVariationDb: number | undefined;
  if (voicedDb.length >= MIN_LOUDNESS_FRAMES) {
    loudnessVariationDb =
      Math.round((Math.max(...voicedDb) - Math.min(...voicedDb)) * 10) / 10;
  } else {
    limitations.push("Too little speech to measure loudness variation.");
  }

  return {
    durationMs,
    spokenMs,
    pauses,
    clippingRatio: Math.round(clippingRatio * 10000) / 10000,
    ...(loudnessVariationDb === undefined ? {} : { loudnessVariationDb }),
    limitations,
  };
}

function percentile20(values: Float64Array): number {
  if (values.length === 0) return 0;
  const sorted = Float64Array.from(values).sort();
  return sorted[Math.floor(0.2 * (sorted.length - 1))]!;
}

export interface TextMetricInput {
  text: string;
  spokenMs?: number;
  fillerPatterns?: readonly string[];
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter((t) => t.length > 0);
}

/**
 * Transcript-derived observations over the APPROVED transcript only.
 * WPM uses spokenMs; without an audio measurement it is absent, not zero.
 */
export function computeTextMetrics(input: TextMetricInput): TextMetrics {
  const tokens = tokenize(input.text);
  const fillers = input.fillerPatterns ?? DEFAULT_FILLER_PATTERNS;
  const multiword = fillers.filter((f) => f.includes(" "));
  const single = new Set(fillers.filter((f) => !f.includes(" ")));

  let fillerCount = 0;
  const consumed = new Set<number>();
  for (const phrase of multiword) {
    const parts = tokenize(phrase);
    if (parts.length === 0) continue;
    for (let i = 0; i + parts.length <= tokens.length; i += 1) {
      if (parts.every((p, j) => tokens[i + j] === p)) {
        fillerCount += 1;
        for (let j = 0; j < parts.length; j += 1) consumed.add(i + j);
      }
    }
  }
  for (let i = 0; i < tokens.length; i += 1) {
    if (!consumed.has(i) && single.has(tokens[i]!)) fillerCount += 1;
  }

  // Repetition: immediate single-word repeats plus repeated bigrams
  // (occurrences beyond the first). Deterministic over the token stream.
  let repeatedPhraseCount = 0;
  const bigrams = new Map<string, number>();
  for (let i = 0; i + 1 < tokens.length; i += 1) {
    if (tokens[i] === tokens[i + 1]) repeatedPhraseCount += 1;
    const key = `${tokens[i]} ${tokens[i + 1]}`;
    bigrams.set(key, (bigrams.get(key) ?? 0) + 1);
  }
  for (const count of bigrams.values()) {
    if (count >= 2) repeatedPhraseCount += count - 1;
  }

  const wordsPerMinute =
    input.spokenMs !== undefined && input.spokenMs > 0
      ? Math.round((tokens.length / (input.spokenMs / 60000)) * 10) / 10
      : undefined;

  return {
    ...(wordsPerMinute === undefined ? {} : { wordsPerMinute }),
    fillerCount,
    repeatedPhraseCount,
  };
}
