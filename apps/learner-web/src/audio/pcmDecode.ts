import { AudioError } from "./audioErrors";

export interface DecodedAudio {
  /** Mono float samples in [-1, 1]. */
  pcm: Float32Array;
  sampleRate: number;
  durationMs: number;
}

/** Pure channel mixdown; testable without Web Audio. */
export function mixToMono(channels: readonly Float32Array[]): Float32Array {
  if (channels.length === 0) return new Float32Array(0);
  const first = channels[0]!;
  if (channels.length === 1) return Float32Array.from(first);
  const out = new Float32Array(first.length);
  for (const channel of channels) {
    const len = Math.min(channel.length, out.length);
    for (let i = 0; i < len; i += 1) {
      out[i] = out[i]! + channel[i]! / channels.length;
    }
  }
  return out;
}

export interface AudioDecoder {
  decode(arrayBuffer: ArrayBuffer): Promise<DecodedAudio>;
}

/** Linear-interpolation resample; deterministic. Whisper expects 16 kHz mono. */
export function resample(
  pcm: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate <= 0 || toRate <= 0 || pcm.length === 0) return new Float32Array(0);
  if (fromRate === toRate) return Float32Array.from(pcm);
  const outLength = Math.max(1, Math.round((pcm.length * toRate) / fromRate));
  const out = new Float32Array(outLength);
  const step = (pcm.length - 1) / Math.max(1, outLength - 1);
  for (let i = 0; i < outLength; i += 1) {
    const pos = i * step;
    const lo = Math.floor(pos);
    const hi = Math.min(lo + 1, pcm.length - 1);
    const frac = pos - lo;
    out[i] = pcm[lo]! * (1 - frac) + pcm[hi]! * frac;
  }
  return out;
}

/** Structural decoded-buffer shape; avoids DOM AudioBuffer so this module stays WebWorker-safe. */
export interface DecodedBufferLike {
  numberOfChannels: number;
  length: number;
  sampleRate: number;
  getChannelData(channel: number): Float32Array;
}

export interface AudioContextLike {
  decodeAudioData(arrayBuffer: ArrayBuffer): Promise<DecodedBufferLike>;
  close(): Promise<void>;
}

/**
 * Production decoder: Web Audio decodeAudioData, then mono mixdown. The
 * context is created per decode and closed immediately so no audio device or
 * context leaks past the attempt. The factory is injected: the app layer
 * passes `() => new AudioContext()`.
 */
export function createWebAudioDecoder(
  createContext: () => AudioContextLike,
): AudioDecoder {
  return {
    async decode(arrayBuffer) {
      let ctx: AudioContextLike | null = null;
      try {
        ctx = createContext();
        const buffer = await ctx.decodeAudioData(arrayBuffer);
        const channels: Float32Array[] = [];
        for (let c = 0; c < buffer.numberOfChannels; c += 1) {
          channels.push(buffer.getChannelData(c));
        }
        const pcm = mixToMono(channels);
        return {
          pcm,
          sampleRate: buffer.sampleRate,
          durationMs: Math.round((buffer.length / buffer.sampleRate) * 1000),
        };
      } catch {
        throw new AudioError(
          "AUDIO_DECODE_FAILED",
          "The recording could not be decoded.",
        );
      } finally {
        await ctx?.close().catch(() => undefined);
      }
    },
  };
}
