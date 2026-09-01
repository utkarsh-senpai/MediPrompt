import { describe, expect, it } from "vitest";
import { AttemptRecorder, type RecorderDeps } from "./recorder";

function fakeTrack() {
  return { stop: () => trackStopped.push(true) };
}
let trackStopped: boolean[] = [];

function makeDeps(overrides: Partial<RecorderDeps> = {}) {
  trackStopped = [];
  const urls: string[] = [];
  const revoked: string[] = [];
  let clock = 1000;
  const deps: RecorderDeps = {
    getUserMedia: () =>
      Promise.resolve({
        getTracks: () => [fakeTrack()],
      } as unknown as MediaStream),
    createMediaRecorder: () => {
      const handlers: Record<string, ((e?: unknown) => void) | null> = {};
      return {
        set ondataavailable(fn: ((e?: unknown) => void) | null) {
          handlers.ondataavailable = fn;
        },
        set onstop(fn: (() => void) | null) {
          handlers.onstop = fn;
        },
        set onerror(fn: ((e?: unknown) => void) | null) {
          handlers.onerror = fn;
        },
        start: () => {
          handlers.ondataavailable?.({
            data: new Blob(["audio-bytes"]),
          } as BlobEvent);
        },
        stop: () => {
          clock += 5000;
          handlers.onstop?.();
        },
      } as unknown as MediaRecorder;
    },
    isTypeSupported: (t) => t.startsWith("audio/webm"),
    createObjectUrl: () => {
      const url = `blob:fake-${urls.length}`;
      urls.push(url);
      return url;
    },
    revokeObjectUrl: (url) => {
      revoked.push(url);
    },
    now: () => clock,
    ...overrides,
  };
  return { deps, urls, revoked };
}

describe("AttemptRecorder", () => {
  it("arms with a supported codec", async () => {
    const { deps } = makeDeps();
    const rec = new AttemptRecorder(deps);
    await rec.arm();
    expect(rec.getState()).toBe("ARMED");
  });

  it("maps permission denial to AUDIO_MIC_PERMISSION_DENIED", async () => {
    const { deps } = makeDeps({
      getUserMedia: () =>
        Promise.reject(new DOMException("no", "NotAllowedError")),
    });
    const rec = new AttemptRecorder(deps);
    await expect(rec.arm()).rejects.toMatchObject({
      code: "AUDIO_MIC_PERMISSION_DENIED",
    });
    expect(rec.getState()).toBe("FAILED");
  });

  it("fails cleanly when no codec is supported and releases the stream", async () => {
    const { deps } = makeDeps({ isTypeSupported: () => false });
    const rec = new AttemptRecorder(deps);
    await expect(rec.arm()).rejects.toMatchObject({
      code: "AUDIO_MIC_UNAVAILABLE",
    });
    expect(rec.getState()).toBe("FAILED");
    expect(trackStopped).toHaveLength(1);
  });

  it("records and finalizes a clip with duration and playback URL", async () => {
    const { deps, urls } = makeDeps();
    const rec = new AttemptRecorder(deps);
    await rec.arm();
    rec.start();
    const clip = await rec.stop("att-1");
    expect(clip).not.toBeNull();
    expect(clip!.attemptId).toBe("att-1");
    expect(clip!.mimeType).toBe("audio/webm;codecs=opus");
    expect(clip!.durationMs).toBe(5000);
    expect(clip!.url).toBe(urls[0]);
    expect(rec.getClip("att-1")).toBe(clip);
    expect(rec.getClip("other")).toBeNull();
    expect(trackStopped).toHaveLength(1);
    expect(rec.getState()).toBe("IDLE");
  });

  it("throws when starting unarmed", () => {
    const { deps } = makeDeps();
    const rec = new AttemptRecorder(deps);
    expect(() => rec.start()).toThrowError(
      expect.objectContaining({ code: "AUDIO_RECORD_FAILED" }) as Error,
    );
  });

  it("releases the microphone when MediaRecorder fails to start", async () => {
    const { deps } = makeDeps({
      createMediaRecorder: () =>
        ({ start: () => { throw new Error("boom"); } }) as unknown as MediaRecorder,
    });
    const rec = new AttemptRecorder(deps);
    await rec.arm();
    expect(() => rec.start()).toThrowError(
      expect.objectContaining({ code: "AUDIO_RECORD_FAILED" }) as Error,
    );
    expect(trackStopped).toHaveLength(1);
    expect(rec.getState()).toBe("FAILED");
  });

  it("keeps no partial blob when the recording is empty", async () => {
    const { deps, urls } = makeDeps({
      createMediaRecorder: () => {
        const handlers: Record<string, (() => void) | null> = {};
        return {
          set onstop(fn: (() => void) | null) {
            handlers.onstop = fn;
          },
          set ondataavailable(_fn: unknown) {},
          set onerror(_fn: unknown) {},
          start: () => {},
          stop: () => handlers.onstop?.(),
        } as unknown as MediaRecorder;
      },
    });
    const rec = new AttemptRecorder(deps);
    await rec.arm();
    rec.start();
    const clip = await rec.stop("att-1");
    expect(clip).toBeNull();
    expect(urls).toHaveLength(0);
    expect(trackStopped).toHaveLength(1);
    expect(rec.getState()).toBe("IDLE");
  });

  it("revokes the playback URL on revoke and release stops tracks", async () => {
    const { deps, urls, revoked } = makeDeps();
    const rec = new AttemptRecorder(deps);
    await rec.arm();
    rec.start();
    await rec.stop("att-1");
    rec.revoke("att-1");
    expect(revoked).toEqual([urls[0]]);
    expect(rec.getClip("att-1")).toBeNull();
    expect(trackStopped).toHaveLength(1);
    rec.release();
    expect(trackStopped).toHaveLength(1);
    expect(rec.getState()).toBe("IDLE");
  });
});
