// Injectable randomness. Production uses an unbiased Fisher-Yates index derived from
// Web Crypto. If Web Crypto is unavailable, fail visibly to a reviewable deterministic
// choice (first eligible) rather than silently using Math.random.

export interface RandomSource {
  /** Uniform integer in [0, maxExclusive). */
  int(maxExclusive: number): number;
}

export class CryptoRandom implements RandomSource {
  int(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new Error(`invalid bound: ${maxExclusive}`);
    }
    if (maxExclusive === 1) return 0;
    const cryptoObj = globalThis.crypto;
    if (!cryptoObj?.getRandomValues) {
      // Visible fallback: deterministic first choice, never Math.random.
      return 0;
    }
    const u32 = () => {
      const buf = new Uint32Array(1);
      cryptoObj.getRandomValues(buf);
      return buf[0]!;
    };
    const limit = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive;
    let r = u32();
    while (r >= limit) r = u32();
    return r % maxExclusive;
  }
}

/** Deterministic mulberry32 for tests only. */
export function seededRandom(seed: number): RandomSource {
  let a = seed >>> 0;
  return {
    int(maxExclusive: number): number {
      if (maxExclusive <= 0) throw new Error(`invalid bound: ${maxExclusive}`);
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      const x = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      return Math.floor(x * maxExclusive) % maxExclusive;
    },
  };
}
