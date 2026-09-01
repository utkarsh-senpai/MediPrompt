// Synthetic PCM fixtures for audio metric tests. Deterministic by construction;
// see docs/V0.3_DEVELOPMENT_CONTEXT.md §14.

export const FIXTURE_RATE = 16000;

export function silence(seconds: number, sampleRate = FIXTURE_RATE): Float32Array {
  return new Float32Array(Math.round(seconds * sampleRate));
}

export function sineBurst(
  seconds: number,
  sampleRate = FIXTURE_RATE,
  amplitude = 0.5,
  frequency = 440,
): Float32Array {
  const n = Math.round(seconds * sampleRate);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    out[i] = amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  }
  return out;
}

export function constant(
  level: number,
  seconds: number,
  sampleRate = FIXTURE_RATE,
): Float32Array {
  return new Float32Array(Math.round(seconds * sampleRate)).fill(level);
}

export function concat(...parts: readonly Float32Array[]): Float32Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
