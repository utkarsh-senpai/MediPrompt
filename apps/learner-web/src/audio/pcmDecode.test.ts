import { describe, expect, it } from "vitest";
import { createWebAudioDecoder, mixToMono, resample } from "./pcmDecode";
import { AudioError } from "./audioErrors";

describe("resample", () => {
  it("returns a copy when rates match", () => {
    const pcm = Float32Array.from([0.1, 0.2]);
    const out = resample(pcm, 16000, 16000);
    expect(Array.from(out)).toEqual(Array.from(pcm));
    expect(out).not.toBe(pcm);
  });

  it("halves the sample count when decimating 2:1", () => {
    const pcm = new Float32Array(1000).fill(0.5);
    expect(resample(pcm, 32000, 16000).length).toBe(500);
  });

  it("preserves endpoints when upsampling", () => {
    const pcm = Float32Array.from([0, 1]);
    const out = resample(pcm, 16000, 48000);
    expect(out[0]).toBe(0);
    expect(out[out.length - 1]).toBeCloseTo(1, 5);
  });

  it("rejects invalid rates", () => {
    expect(resample(Float32Array.from([1]), 0, 16000).length).toBe(0);
  });
});

describe("mixToMono", () => {
  it("passes a single channel through", () => {
    const ch = Float32Array.from([0.1, -0.2, 0.3]);
    expect(Array.from(mixToMono([ch]))).toEqual([0.1, -0.2, 0.3].map((v) => Math.fround(v)));
  });

  it("averages multiple channels", () => {
    const a = Float32Array.from([1, 0]);
    const b = Float32Array.from([0, 1]);
    const mono = mixToMono([a, b]);
    expect(mono[0]).toBeCloseTo(0.5);
    expect(mono[1]).toBeCloseTo(0.5);
  });

  it("handles no channels", () => {
    expect(mixToMono([]).length).toBe(0);
  });
});

describe("createWebAudioDecoder", () => {
  it("decodes via the injected context and closes it", async () => {
    let closed = false;
    const decoder = createWebAudioDecoder(() => ({
      decodeAudioData: () =>
        Promise.resolve({
          numberOfChannels: 2,
          length: 4,
          sampleRate: 16000,
          getChannelData: (c: number) =>
            Float32Array.from(c === 0 ? [0.2, 0.2, 0.2, 0.2] : [0.4, 0.4, 0.4, 0.4]),
        } as AudioBuffer),
      close: () => {
        closed = true;
        return Promise.resolve();
      },
    }));
    const out = await decoder.decode(new ArrayBuffer(8));
    expect(out.sampleRate).toBe(16000);
    expect(out.pcm[0]).toBeCloseTo(0.3);
    expect(closed).toBe(true);
  });

  it("maps decode failures to AUDIO_DECODE_FAILED", async () => {
    const decoder = createWebAudioDecoder(() => ({
      decodeAudioData: () => Promise.reject(new Error("bad data")),
      close: () => Promise.resolve(),
    }));
    await expect(decoder.decode(new ArrayBuffer(8))).rejects.toMatchObject({
      code: "AUDIO_DECODE_FAILED",
    });
    await expect(decoder.decode(new ArrayBuffer(8))).rejects.toBeInstanceOf(AudioError);
  });
});
