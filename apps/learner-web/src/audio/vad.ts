// Energy-based voice-activity detection over mono PCM. Pure and deterministic:
// same PCM + same options => identical intervals. See docs/V0.3_DEVELOPMENT_CONTEXT.md §6.

export interface VadOptions {
  /** Analysis frame length. */
  frameMs: number;
  /** Speech bursts shorter than this are discarded as noise. */
  minSpeechMs: number;
  /** Gaps shorter than this are bridged (still speech); longer gaps split intervals. */
  minSilenceMs: number;
  /** Speech threshold = max(absoluteFloor, thresholdScale x noise-floor RMS). */
  thresholdScale: number;
  /** RMS floor in linear amplitude; 0.01 ~= -40 dBFS. */
  absoluteFloor: number;
}

export const DEFAULT_VAD_OPTIONS: Readonly<VadOptions> = Object.freeze({
  frameMs: 30,
  minSpeechMs: 120,
  minSilenceMs: 200,
  thresholdScale: 2.5,
  absoluteFloor: 0.01,
});

export interface SpeechInterval {
  startMs: number;
  endMs: number;
}

/** Per-frame RMS energies. Exported for tests and loudness metrics. */
export function frameEnergies(
  pcm: Float32Array,
  sampleRate: number,
  frameMs: number,
): { rms: Float64Array; frameSamples: number } {
  const frameSamples = Math.max(1, Math.floor((sampleRate * frameMs) / 1000));
  const frameCount = Math.floor(pcm.length / frameSamples);
  const rms = new Float64Array(frameCount);
  for (let f = 0; f < frameCount; f += 1) {
    let sum = 0;
    const base = f * frameSamples;
    for (let i = 0; i < frameSamples; i += 1) {
      const s = pcm[base + i]!;
      sum += s * s;
    }
    rms[f] = Math.sqrt(sum / frameSamples);
  }
  return { rms, frameSamples };
}

function percentile(sorted: Float64Array, p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((p / 100) * (sorted.length - 1))),
  );
  return sorted[idx]!;
}

/**
 * Noise floor = 20th percentile of frame RMS (conservative: quiet rooms and
 * constant hum both floor low; speech bursts sit well above scale x floor).
 */
export function speechThreshold(rms: Float64Array, opts: VadOptions): number {
  const sorted = Float64Array.from(rms).sort();
  const noiseFloor = percentile(sorted, 20);
  return Math.max(opts.absoluteFloor, opts.thresholdScale * noiseFloor);
}

export function detectSpeechIntervals(
  pcm: Float32Array,
  sampleRate: number,
  options: Partial<VadOptions> = {},
): SpeechInterval[] {
  const opts: VadOptions = { ...DEFAULT_VAD_OPTIONS, ...options };
  if (pcm.length === 0 || sampleRate <= 0) return [];
  const { rms } = frameEnergies(pcm, sampleRate, opts.frameMs);
  if (rms.length === 0) return [];
  const threshold = speechThreshold(rms, opts);

  const raw: SpeechInterval[] = [];
  let start: number | null = null;
  for (let f = 0; f < rms.length; f += 1) {
    const voiced = rms[f]! >= threshold;
    const frameStartMs = f * opts.frameMs;
    if (voiced && start === null) start = f * opts.frameMs;
    if (!voiced && start !== null) {
      raw.push({ startMs: start, endMs: frameStartMs });
      start = null;
    }
  }
  if (start !== null) {
    raw.push({
      startMs: start,
      endMs: Math.round((pcm.length / sampleRate) * 1000),
    });
  }

  return raw
    .filter((iv) => iv.endMs - iv.startMs >= opts.minSpeechMs)
    .reduce<SpeechInterval[]>((merged, iv) => {
      const last = merged[merged.length - 1];
      if (last && iv.startMs - last.endMs < opts.minSilenceMs) {
        last.endMs = iv.endMs;
      } else {
        merged.push({ ...iv });
      }
      return merged;
    }, []);
}
