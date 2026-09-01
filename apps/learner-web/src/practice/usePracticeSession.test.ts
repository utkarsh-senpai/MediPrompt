import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePracticeSession } from "./usePracticeSession";
import { validatePack } from "@/content/packValidator";
import { seededRandom } from "@/platform/random";
import { InMemoryBagStore } from "@/platform/bagStore";
import { AudioError } from "@/audio/audioErrors";
import type { AudioDecoder } from "@/audio/pcmDecode";
import { AttemptRecorder, type RecorderDeps } from "@/audio/recorder";
import type {
  TranscriptionClient,
  TranscriptionEvent,
} from "@/speech/transcriptionClient";
import { FIXTURE_RATE, concat, silence, sineBurst } from "@/test/pcmFixtures";
import {
  DEFAULT_SETTINGS,
  type RuntimePack,
  type TranscriptDraft,
} from "./types";
import medicalPackJson from "@content/packs/mpt-cardiorespiratory-v1.json";

const pack = validatePack(medicalPackJson) as RuntimePack;

function setup() {
  const nowRef = { value: 0 };
  const monotonic = { now: () => nowRef.value };
  const wall = { isoNow: () => "2026-08-30T00:00:00.000Z" };
  const random = seededRandom(123);
  const bagStore = new InMemoryBagStore();
  const hook = renderHook(() =>
    usePracticeSession({ pack, settings: DEFAULT_SETTINGS, monotonic, wall, random, bagStore }),
  );
  // Advance both the fake clock (to flush interval ticks) and the injected monotonic value.
  const advance = (ms: number) =>
    act(() => {
      nowRef.value += ms;
      vi.advanceTimersByTime(ms);
    });
  return { hook, advance };
}

describe("usePracticeSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs the full Recall Sprint loop: spin → speak → complete", () => {
    const { hook, advance } = setup();
    const { result } = hook;
    expect(result.current.state.name).toBe("IDLE");

    act(() => result.current.actions.spin());
    expect(result.current.state.name).toBe("TOPIC_READY");

    act(() => result.current.actions.startTimer());
    expect(result.current.state.name).toBe("SPEAKING");

    advance(90_000);
    expect(result.current.state.name).toBe("ATTEMPT_COMPLETE");
  });

  it("a visibility event mid-deadline is a no-op and completion fires once", () => {
    const { hook, advance } = setup();
    const { result } = hook;
    act(() => result.current.actions.spin());
    act(() => result.current.actions.startTimer());
    expect(result.current.state.name).toBe("SPEAKING");

    advance(40_000);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(result.current.state.name).toBe("SPEAKING");

    advance(50_000);
    expect(result.current.state.name).toBe("ATTEMPT_COMPLETE");
    advance(5_000);
    expect(result.current.state.name).toBe("ATTEMPT_COMPLETE");
  });

  it("runs the Deep Research loop: research → ready → speak → complete", () => {
    const { hook, advance } = setup();
    const { result } = hook;
    act(() =>
      result.current.actions.setSelection({
        mode: "DEEP_RESEARCH",
        subjectId: "respiratory-physiotherapy",
      }),
    );
    expect(result.current.state.name).toBe("IDLE");

    act(() => result.current.actions.spin());
    expect(result.current.state.name).toBe("TOPIC_READY");

    act(() => result.current.actions.startResearch());
    expect(result.current.state.name).toBe("RESEARCHING");

    advance(120_000);
    expect(result.current.state.name).toBe("READY_TO_SPEAK");

    act(() => result.current.actions.confirmReady());
    expect(result.current.state.name).toBe("SPEAKING");

    advance(90_000);
    expect(result.current.state.name).toBe("ATTEMPT_COMPLETE");
  });

  it("spin again repeats without error after completion", () => {
    const { hook, advance } = setup();
    const { result } = hook;
    act(() => result.current.actions.spin());
    act(() => result.current.actions.startTimer());
    advance(90_000);
    expect(result.current.state.name).toBe("ATTEMPT_COMPLETE");
    act(() => result.current.actions.spinAgain());
    expect(result.current.state.name).toBe("TOPIC_READY");
  });
});

// --- v0.3 audio orchestration (fake platform deps; real AttemptRecorder) ---

const SPEECH_PCM = concat(sineBurst(0.4), silence(0.3), sineBurst(0.4));

const WHISPER_DRAFT: TranscriptDraft = {
  text: "um inspection then palpation",
  source: "LOCAL_WHISPER",
  model: { id: "whisper-base.en", version: "pinned-revision", quantization: "q4" },
  uncertainRanges: [],
};

interface FakeTranscriptionJob {
  input: { attemptId: string; pcm: Float32Array; sampleRate: number };
  emit: (event: TranscriptionEvent) => void;
  cancelled: boolean;
}

function fakeTranscriptionClient() {
  const jobs: FakeTranscriptionJob[] = [];
  const client: TranscriptionClient = {
    transcribe(input, onEvent) {
      const job: FakeTranscriptionJob = { input, emit: onEvent, cancelled: false };
      jobs.push(job);
      return { attemptId: input.attemptId, cancel: () => { job.cancelled = true; } };
    },
    dispose: () => {},
  };
  return { client, jobs };
}

function fakeRecorderDeps(options: { denyMic?: boolean } = {}) {
  const urls: string[] = [];
  const revoked: string[] = [];
  let clock = 1000;
  const deps: RecorderDeps = {
    getUserMedia: () =>
      options.denyMic
        ? Promise.reject(new DOMException("denied", "NotAllowedError"))
        : Promise.resolve({
            getTracks: () => [{ stop: () => {} }],
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
          handlers.ondataavailable?.({ data: new Blob(["audio-bytes"]) });
        },
        stop: () => {
          clock += 5000;
          handlers.onstop?.();
        },
      } as unknown as MediaRecorder;
    },
    isTypeSupported: () => true,
    createObjectUrl: () => {
      const url = `blob:fake-${urls.length}`;
      urls.push(url);
      return url;
    },
    revokeObjectUrl: (url) => {
      revoked.push(url);
    },
    now: () => clock,
  };
  return { deps, urls, revoked };
}

/** Pump microtasks + effects until the async audio chain settles. */
async function flushAsync() {
  for (let i = 0; i < 6; i += 1) {
    await act(async () => {
      for (let j = 0; j < 10; j += 1) await Promise.resolve();
      await vi.advanceTimersByTimeAsync(1);
    });
  }
}

function setupAudio(options: { denyMic?: boolean; decodeFails?: boolean } = {}) {
  const nowRef = { value: 0 };
  const monotonic = { now: () => nowRef.value };
  const wall = { isoNow: () => "2026-08-30T00:00:00.000Z" };
  const random = seededRandom(123);
  const bagStore = new InMemoryBagStore();
  const rec = fakeRecorderDeps(options);
  const recorder = new AttemptRecorder(rec.deps);
  const decoder: AudioDecoder = options.decodeFails
    ? { decode: () => Promise.reject(new AudioError("AUDIO_DECODE_FAILED", "bad blob")) }
    : {
        decode: () =>
          Promise.resolve({
            pcm: SPEECH_PCM,
            sampleRate: FIXTURE_RATE,
            durationMs: 1100,
          }),
      };
  const transcription = fakeTranscriptionClient();
  const hook = renderHook(() =>
    usePracticeSession({
      pack,
      settings: DEFAULT_SETTINGS,
      monotonic,
      wall,
      random,
      bagStore,
      audio: { recorder, decoder, transcription: transcription.client },
    }),
  );
  const advance = (ms: number) =>
    act(() => {
      nowRef.value += ms;
      vi.advanceTimersByTime(ms);
    });
  return { hook, advance, rec, recorder, transcription };
}

type AudioHook = ReturnType<typeof setupAudio>;

/** Drive an armed session to PROCESSING with metrics landed. */
async function toProcessing(ctx: AudioHook) {
  const { hook, advance } = ctx;
  act(() => hook.result.current.actions.beginAudioOptIn());
  await act(async () => {
    hook.result.current.actions.confirmAudioOptIn();
    await Promise.resolve();
  });
  act(() => hook.result.current.actions.spin());
  act(() => hook.result.current.actions.startTimer());
  advance(90_000);
  await flushAsync();
}

describe("usePracticeSession — v0.3 audio orchestration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs the full audio path: primer → armed → record → process → transcribe → review", async () => {
    const ctx = setupAudio();
    const { hook, advance, transcription } = ctx;
    const { result } = hook;

    act(() => result.current.actions.beginAudioOptIn());
    expect(result.current.audio.status).toBe("PRIMER");

    await act(async () => {
      result.current.actions.confirmAudioOptIn();
      await Promise.resolve();
    });
    expect(result.current.audio.status).toBe("ARMED");
    expect(result.current.audio.armed).toBe(true);

    act(() => result.current.actions.spin());
    act(() => result.current.actions.startTimer());
    expect(result.current.state.name).toBe("SPEAKING");
    expect(ctx.recorder.getState()).toBe("RECORDING");

    advance(90_000);
    await flushAsync();
    expect(result.current.state.name).toBe("PROCESSING");
    expect(result.current.audio.playback?.url).toBe("blob:fake-0");
    if (result.current.state.name === "PROCESSING") {
      expect(result.current.state.metrics?.spokenMs).toBeGreaterThan(0);
      expect(result.current.state.metrics?.pauses).toHaveLength(1);
      expect(result.current.state.transcription).toBe("IDLE");
    }

    act(() => result.current.actions.requestTranscription());
    await flushAsync();
    expect(result.current.state.name).toBe("PROCESSING");
    if (result.current.state.name === "PROCESSING") {
      expect(result.current.state.transcription).toBe("RUNNING");
    }
    expect(transcription.jobs).toHaveLength(1);

    act(() => transcription.jobs[0]!.emit({ type: "progress", progress: 0.4 }));
    expect(result.current.audio.transcriptionProgress).toBe(0.4);

    act(() => transcription.jobs[0]!.emit({ type: "done", draft: WHISPER_DRAFT }));
    expect(result.current.state.name).toBe("TRANSCRIPT_REVIEW");
    expect(result.current.audio.transcriptionProgress).toBeNull();

    act(() => result.current.actions.approveTranscript("inspection then palpation"));
    expect(result.current.state.name).toBe("REVIEW");
    if (result.current.state.name === "REVIEW") {
      expect(result.current.state.transcript.wasEdited).toBe(true);
      expect(result.current.state.transcript.rawText).toBe(WHISPER_DRAFT.text);
      expect(result.current.state.textMetrics?.wordsPerMinute).toBeGreaterThan(0);
      expect(result.current.state.textMetrics?.fillerCount).toBe(0);
      // Audio-derived metrics are untouched by the transcript edit.
      expect(result.current.state.metrics?.pauses).toHaveLength(1);
    }

    act(() => result.current.actions.spinAgain());
    expect(result.current.state.name).toBe("TOPIC_READY");
    expect(result.current.audio.playback).toBeNull();
    expect(ctx.rec.revoked).toContain("blob:fake-0");
  });

  it("mic denied: timer-only path with an equal typed review, no audio object", async () => {
    const ctx = setupAudio({ denyMic: true });
    const { hook, advance } = ctx;
    const { result } = hook;

    act(() => result.current.actions.beginAudioOptIn());
    await act(async () => {
      result.current.actions.confirmAudioOptIn();
      await Promise.resolve();
    });
    expect(result.current.audio.status).toBe("UNAVAILABLE");
    expect(result.current.audio.issue).toBe("AUDIO_MIC_PERMISSION_DENIED");
    expect(result.current.audio.armed).toBe(false);

    act(() => result.current.actions.spin());
    act(() => result.current.actions.startTimer());
    expect(ctx.recorder.getState()).toBe("FAILED");
    advance(90_000);
    await flushAsync();
    expect(result.current.state.name).toBe("ATTEMPT_COMPLETE");
    expect(result.current.audio.playback).toBeNull();

    act(() => result.current.actions.startTypedReview());
    expect(result.current.state.name).toBe("SELF_REVIEW");
    if (result.current.state.name === "SELF_REVIEW") {
      expect(result.current.state.transcriptionIssue).toBeNull();
    }

    act(() => result.current.actions.submitSelfReview("what I said, from memory"));
    expect(result.current.state.name).toBe("REVIEW");
    if (result.current.state.name === "REVIEW") {
      expect(result.current.state.metrics).toBeNull();
      expect(result.current.state.textMetrics?.wordsPerMinute).toBeUndefined();
      expect(result.current.state.transcript.text).toBe("what I said, from memory");
    }
  });

  it("transcription failure is first-class and retryable from self-review", async () => {
    const ctx = setupAudio();
    const { hook, transcription } = ctx;
    const { result } = hook;

    await toProcessing(ctx);
    act(() => result.current.actions.requestTranscription());
    await flushAsync();
    act(() =>
      transcription.jobs[0]!.emit({ type: "unavailable", reason: "LOAD_FAILED" }),
    );
    expect(result.current.state.name).toBe("SELF_REVIEW");
    if (result.current.state.name === "SELF_REVIEW") {
      expect(result.current.state.transcriptionIssue).toBe("LOAD_FAILED");
      expect(result.current.state.metrics).not.toBeNull();
    }

    act(() => result.current.actions.requestTranscription());
    await flushAsync();
    expect(result.current.state.name).toBe("PROCESSING");
    expect(transcription.jobs).toHaveLength(2);
    act(() => transcription.jobs[1]!.emit({ type: "done", draft: WHISPER_DRAFT }));
    expect(result.current.state.name).toBe("TRANSCRIPT_REVIEW");
  });

  it("declining transcription is a first-class DECLINED outcome", async () => {
    const ctx = setupAudio();
    const { hook } = ctx;
    const { result } = hook;

    await toProcessing(ctx);
    act(() => result.current.actions.declineTranscription());
    expect(result.current.state.name).toBe("SELF_REVIEW");
    if (result.current.state.name === "SELF_REVIEW") {
      expect(result.current.state.transcriptionIssue).toBe("DECLINED");
      expect(result.current.state.metrics).not.toBeNull();
    }
  });

  it("analysis failure falls back to typed review with an honest issue code", async () => {
    const ctx = setupAudio({ decodeFails: true });
    const { hook, advance } = ctx;
    const { result } = hook;

    act(() => result.current.actions.beginAudioOptIn());
    await act(async () => {
      result.current.actions.confirmAudioOptIn();
      await Promise.resolve();
    });
    act(() => result.current.actions.spin());
    act(() => result.current.actions.startTimer());
    advance(90_000);
    await flushAsync();

    expect(result.current.state.name).toBe("SELF_REVIEW");
    expect(result.current.audio.issue).toBe("AUDIO_DECODE_FAILED");
    if (result.current.state.name === "SELF_REVIEW") {
      expect(result.current.state.metrics).toBeNull();
    }
  });

  it("switching to typed review cancels a running transcription", async () => {
    const ctx = setupAudio();
    const { hook, transcription } = ctx;
    const { result } = hook;

    await toProcessing(ctx);
    act(() => result.current.actions.requestTranscription());
    await flushAsync();
    expect(transcription.jobs).toHaveLength(1);

    act(() => result.current.actions.startTypedReview());
    expect(result.current.state.name).toBe("SELF_REVIEW");
    expect(transcription.jobs[0]!.cancelled).toBe(true);
    if (result.current.state.name === "SELF_REVIEW") {
      expect(result.current.state.transcriptionIssue).toBeNull();
      expect(result.current.state.metrics).not.toBeNull();
    }
  });

  it("learner leaving mid-transcription cancels the job and revokes the clip", async () => {
    const ctx = setupAudio();
    const { hook, transcription } = ctx;
    const { result } = hook;

    await toProcessing(ctx);
    act(() => result.current.actions.requestTranscription());
    await flushAsync();

    act(() => result.current.actions.spinAgain());
    await flushAsync();
    expect(result.current.state.name).toBe("TOPIC_READY");
    expect(transcription.jobs[0]!.cancelled).toBe(true);
    expect(result.current.audio.playback).toBeNull();
    expect(ctx.rec.revoked).toContain("blob:fake-0");
  });

  it("a stale clip finalizing after spin-again is revoked, never dispatched", async () => {
    const ctx = setupAudio();
    const { hook, advance, rec } = ctx;
    const { result } = hook;

    act(() => result.current.actions.beginAudioOptIn());
    await act(async () => {
      result.current.actions.confirmAudioOptIn();
      await Promise.resolve();
    });
    act(() => result.current.actions.spin());
    act(() => result.current.actions.startTimer());
    advance(90_000);
    // The stop finalization is async; spin before it resolves.
    act(() => result.current.actions.spinAgain());
    await flushAsync();
    expect(result.current.state.name).toBe("TOPIC_READY");
    expect(result.current.audio.playback).toBeNull();
    expect(rec.revoked).toContain("blob:fake-0");
  });
});
