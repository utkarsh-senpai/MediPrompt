import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePracticeSession } from "./usePracticeSession";
import { validatePack } from "@/content/packValidator";
import { findRubric } from "@/content/packQuery";
import { seededRandom } from "@/platform/random";
import { InMemoryBagStore } from "@/platform/bagStore";
import { InMemoryHistoryStore } from "@/platform/historyStore";
import { AudioError } from "@/audio/audioErrors";
import type { AudioDecoder } from "@/audio/pcmDecode";
import { AttemptRecorder, type RecorderDeps } from "@/audio/recorder";
import type {
  TranscriptionClient,
  TranscriptionEvent,
} from "@/speech/transcriptionClient";
import type { EmbeddingClient, EmbeddingEvent } from "@/scoring/embeddingClient";
import { FIXTURE_RATE, concat, silence, sineBurst } from "@/test/pcmFixtures";
import {
  DEFAULT_SETTINGS,
  type RuntimePack,
  type SessionState,
  type TranscriptDraft,
} from "./types";
import medicalPackJson from "@content/candidates/mpt-cardiorespiratory-review-candidate.json";

const pack = validatePack(medicalPackJson) as RuntimePack;

function setup() {
  const nowRef = { value: 0 };
  const monotonic = { now: () => nowRef.value };
  const wall = { isoNow: () => "2026-08-30T00:00:00.000Z" };
  const random = seededRandom(123);
  const bagStore = new InMemoryBagStore();
  const hook = renderHook(() =>
    usePracticeSession({
      pack,
      settings: DEFAULT_SETTINGS,
      monotonic,
      wall,
      random,
      bagStore,
      drawDelayMs: 0,
    }),
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

  it("runs the full Recall Sprint loop: spin → speak → complete", async () => {
    const { hook, advance } = setup();
    const { result } = hook;
    expect(result.current.state.name).toBe("IDLE");

    act(() => result.current.actions.spin());
    expect(result.current.state.name).toBe("TOPIC_READY");

    await act(async () => {
      await result.current.actions.startTimer();
    });
    expect(result.current.state.name).toBe("SPEAKING");

    advance(DEFAULT_SETTINGS.speakingSeconds * 1000);
    expect(result.current.state.name).toBe("ATTEMPT_COMPLETE");
  });

  it("a visibility event mid-deadline is a no-op and completion fires once", async () => {
    const { hook, advance } = setup();
    const { result } = hook;
    act(() => result.current.actions.spin());
    await act(async () => {
      await result.current.actions.startTimer();
    });
    expect(result.current.state.name).toBe("SPEAKING");

    advance(40_000);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(result.current.state.name).toBe("SPEAKING");

    advance(50_000);
    expect(result.current.state.name).toBe("ATTEMPT_COMPLETE");
    advance(5_000);
    expect(result.current.state.name).toBe("ATTEMPT_COMPLETE");
  });

  it("runs the Deep Research loop: research → ready → speak → complete", async () => {
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

    advance(DEFAULT_SETTINGS.researchSeconds * 1000);
    expect(result.current.state.name).toBe("READY_TO_SPEAK");

    await act(async () => {
      await result.current.actions.confirmReady();
    });
    expect(result.current.state.name).toBe("SPEAKING");

    advance(DEFAULT_SETTINGS.speakingSeconds * 1000);
    expect(result.current.state.name).toBe("ATTEMPT_COMPLETE");
  });

  it("spin again repeats without error after completion", async () => {
    const { hook, advance } = setup();
    const { result } = hook;
    act(() => result.current.actions.spin());
    await act(async () => {
      await result.current.actions.startTimer();
    });
    advance(DEFAULT_SETTINGS.speakingSeconds * 1000);
    expect(result.current.state.name).toBe("ATTEMPT_COMPLETE");
    act(() => result.current.actions.spinAgain());
    expect(result.current.state.name).toBe("TOPIC_READY");
  });

  it("opens the exact current-pack topic selected by the resurfacing queue", () => {
    const { hook } = setup();
    const subject = pack.subjects[0]!;
    const topic = subject.topics[0]!;
    const variant = topic.variants.find(
      (candidate) =>
        candidate.mode === "RECALL_SPRINT" || candidate.mode === "DEEP_RESEARCH",
    )!;
    let opened = false;
    act(() => {
      opened = hook.result.current.actions.practiceTopic({
        packId: pack.packId,
        packVersion: pack.version,
        subjectId: subject.subjectId,
        topicId: topic.topicId,
        variantId: variant.variantId,
        difficultyProfileVersion: variant.difficultyProfileVersion,
        promptId: variant.promptId,
        rubricId: variant.rubricId,
      });
    });
    expect(opened).toBe(true);
    expect(hook.result.current.state.name).toBe("TOPIC_READY");
    if (hook.result.current.state.name === "TOPIC_READY") {
      expect(hook.result.current.state.topic.topicRef.variantId).toBe(variant.variantId);
    }
  });

  it("retries the identical topic and computes Refinement Delta from consecutive attempts", async () => {
    const { hook, advance } = setup();
    const { result } = hook;
    const currentState = (): SessionState => result.current.state;
    act(() => result.current.actions.spin());
    const firstReady = currentState();
    expect(firstReady.name).toBe("TOPIC_READY");
    if (firstReady.name !== "TOPIC_READY") throw new Error("topic missing");
    const originalRef = firstReady.topic.topicRef;
    const rubric = findRubric(pack, originalRef);
    if (!rubric) throw new Error("rubric missing");

    await act(async () => {
      await result.current.actions.startTimer();
    });
    advance(DEFAULT_SETTINGS.speakingSeconds * 1000);
    act(() => result.current.actions.startTypedReview());
    act(() => result.current.actions.submitSelfReview(rubric.concepts[0]!.acceptedPhrases[0]!));
    const firstReview = currentState();
    expect(firstReview.name).toBe("REVIEW");
    if (firstReview.name !== "REVIEW") throw new Error("first review missing");
    const firstFraction = firstReview.coverage.weightedFraction;

    act(() => result.current.actions.startSecondAttempt());
    const retryReady = currentState();
    expect(retryReady.name).toBe("TOPIC_READY");
    if (retryReady.name !== "TOPIC_READY") throw new Error("retry missing");
    expect(retryReady.topic.topicRef).toEqual(originalRef);
    expect(retryReady.attempt.history).toHaveLength(1);

    await act(async () => {
      await result.current.actions.startTimer();
    });
    advance(DEFAULT_SETTINGS.speakingSeconds * 1000);
    act(() => result.current.actions.startTypedReview());
    const completeAnswer = rubric.concepts
      .map((concept) => concept.acceptedPhrases[0])
      .join(". ");
    act(() => result.current.actions.submitSelfReview(completeAnswer));
    const secondReview = currentState();
    expect(secondReview.name).toBe("REVIEW");
    if (secondReview.name === "REVIEW") {
      expect(secondReview.attempt.attemptIndex).toBe(2);
      expect(secondReview.refinementDelta).toMatchObject({
        available: true,
        direction: "IMPROVED",
      });
      if (secondReview.refinementDelta?.available) {
        expect(secondReview.refinementDelta.score).toBeCloseTo(1 - firstFraction, 5);
        expect(secondReview.refinementDelta.newlyCoveredConceptIds.length).toBeGreaterThan(0);
      }
    }
  });

  it("persists only minimal metadata after explicit learning-plan opt-in", async () => {
    const nowRef = { value: 0 };
    const historyStore = new InMemoryHistoryStore();
    const hook = renderHook(() =>
      usePracticeSession({
        pack,
        settings: { ...DEFAULT_SETTINGS, practiceHistory: true },
        monotonic: { now: () => nowRef.value },
        wall: { isoNow: () => "2026-09-02T09:30:00.000Z" },
        random: seededRandom(123),
        bagStore: new InMemoryBagStore(),
        historyStore,
        drawDelayMs: 0,
      }),
    );

    act(() => hook.result.current.actions.spin());
    const ready = hook.result.current.state;
    if (ready.name !== "TOPIC_READY") throw new Error("topic missing");
    const rubric = findRubric(pack, ready.topic.topicRef);
    if (!rubric) throw new Error("rubric missing");
    await act(async () => {
      await hook.result.current.actions.startTimer();
    });
    act(() => {
      nowRef.value += DEFAULT_SETTINGS.speakingSeconds * 1000;
      vi.advanceTimersByTime(DEFAULT_SETTINGS.speakingSeconds * 1000);
    });
    act(() => hook.result.current.actions.startTypedReview());
    act(() =>
      hook.result.current.actions.submitSelfReview(
        rubric.concepts.map((concept) => concept.acceptedPhrases[0]).join(". "),
      ),
    );
    await act(async () => {
      for (let turn = 0; turn < 6; turn += 1) await Promise.resolve();
    });

    const records = await historyStore.loadAll();
    expect(records).toHaveLength(1);
    expect(records[0]!.schedule).not.toBeNull();
    expect(hook.result.current.historySaveState).toBe("SAVED_SESSION");
    const serialized = JSON.stringify(records[0]);
    expect(serialized).not.toContain("transcript");
    expect(serialized).not.toContain("conceptResults");
    expect(serialized).not.toContain("semanticEvidence");
  });
});

// --- v0.5 semantic refinement (stub embedding client; lexical baseline still runs) ---

describe("usePracticeSession — v0.5 semantic refinement", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("refines lexical coverage via the embedding client when semanticCoverage is enabled", async () => {
    const nowRef = { value: 0 };
    const monotonic = { now: () => nowRef.value };
    const wall = { isoNow: () => "2026-09-01T00:00:00.000Z" };
    const random = seededRandom(123);
    const bagStore = new InMemoryBagStore();
    let lastEmbed: (event: EmbeddingEvent) => void = () => {};
    const embedTextCounts: number[] = [];
    const embedding: EmbeddingClient = {
      embed(input, onEvent) {
        embedTextCounts.push(input.texts.length);
        lastEmbed = onEvent;
        return { attemptId: input.attemptId, cancel: () => undefined };
      },
      dispose() {},
    };
    const hook = renderHook(() =>
      usePracticeSession({
        pack,
        settings: { ...DEFAULT_SETTINGS, semanticCoverage: true },
        monotonic,
        wall,
        random,
        bagStore,
        drawDelayMs: 0,
        embedding,
      }),
    );
    const advance = (ms: number) =>
      act(() => {
        nowRef.value += ms;
        vi.advanceTimersByTime(ms);
      });
    const { result } = hook;

    act(() => result.current.actions.spin());
    await act(async () => {
      await result.current.actions.startTimer();
    });
    advance(DEFAULT_SETTINGS.speakingSeconds * 1000);
    expect(result.current.state.name).toBe("ATTEMPT_COMPLETE");

    act(() => result.current.actions.startTypedReview());
    expect(result.current.state.name).toBe("SELF_REVIEW");

    // Gibberish transcript: lexical coverage is verifiable with 0 hits.
    act(() => result.current.actions.submitSelfReview("zzz qqq xxx nonword"));
    expect(result.current.state.name).toBe("REVIEW");
    if (result.current.state.name === "REVIEW") {
      expect(result.current.state.coverage.verifiable).toBe(true);
      expect(result.current.state.coverage.hitCount).toBe(0);
    }

    // Every segment/rubric vector is identical. Until educator calibration,
    // semantic evidence remains POSSIBLY_COVERED and cannot inflate the score.
    act(() => {
      lastEmbed({
        type: "done",
        embeddings: Array.from({ length: embedTextCounts[0] ?? 0 }, () => [1, 0]),
      });
    });
    if (result.current.state.name === "REVIEW") {
      expect(result.current.state.coverage.verifiable).toBe(true);
      expect(result.current.state.coverage.hitCount).toBe(0);
      expect(result.current.state.coverage.totalCount).toBeGreaterThan(0);
      expect(result.current.state.coverage.weightedFraction).toBe(0);
      expect(result.current.state.coverage.scoring.method).toBe("LEXICAL");
      expect(
        result.current.state.coverage.conceptResults.every(
          (concept) => concept.semanticEvidence?.status === "POSSIBLY_COVERED",
        ),
      ).toBe(true);
    }

    act(() => result.current.actions.startSecondAttempt());
    await act(async () => {
      await result.current.actions.startTimer();
    });
    advance(DEFAULT_SETTINGS.speakingSeconds * 1000);
    act(() => result.current.actions.startTypedReview());
    act(() => result.current.actions.submitSelfReview("another answer"));
    expect(embedTextCounts).toHaveLength(2);
    expect(embedTextCounts[1]).toBeLessThan(embedTextCounts[0]!);
  });

  it("keeps lexical coverage when semantic is disabled (no embedding dep)", async () => {
    const nowRef = { value: 0 };
    const monotonic = { now: () => nowRef.value };
    const wall = { isoNow: () => "2026-09-01T00:00:00.000Z" };
    const random = seededRandom(123);
    const bagStore = new InMemoryBagStore();
    const hook = renderHook(() =>
      usePracticeSession({
        pack,
        settings: { ...DEFAULT_SETTINGS, semanticCoverage: false },
        monotonic,
        wall,
        random,
        bagStore,
        drawDelayMs: 0,
      }),
    );
    const advance = (ms: number) =>
      act(() => {
        nowRef.value += ms;
        vi.advanceTimersByTime(ms);
      });
    const { result } = hook;
    act(() => result.current.actions.spin());
    await act(async () => {
      await result.current.actions.startTimer();
    });
    advance(DEFAULT_SETTINGS.speakingSeconds * 1000);
    act(() => result.current.actions.startTypedReview());
    act(() => result.current.actions.submitSelfReview("zzz qqq xxx nonword"));
    expect(result.current.state.name).toBe("REVIEW");
    if (result.current.state.name === "REVIEW") {
      expect(result.current.state.coverage.hitCount).toBe(0);
      expect(result.current.state.refinementDelta).toBeNull();
      expect(result.current.state.attempt.history).toEqual([]);
    }
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
  const stopTrack = vi.fn();
  let clock = 1000;
  const getUserMedia = vi.fn(() =>
    options.denyMic
      ? Promise.reject(new DOMException("denied", "NotAllowedError"))
      : Promise.resolve({
          getTracks: () => [{ stop: stopTrack }],
        } as unknown as MediaStream),
  );
  const deps: RecorderDeps = {
    getUserMedia,
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
  return { deps, urls, revoked, getUserMedia, stopTrack };
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

function setupAudio(
  options: { denyMic?: boolean; decodeFails?: boolean; decoder?: AudioDecoder } = {},
) {
  const nowRef = { value: 0 };
  const monotonic = { now: () => nowRef.value };
  const wall = { isoNow: () => "2026-08-30T00:00:00.000Z" };
  const random = seededRandom(123);
  const bagStore = new InMemoryBagStore();
  const rec = fakeRecorderDeps(options);
  const recorder = new AttemptRecorder(rec.deps);
  const decoder: AudioDecoder = options.decoder ?? (options.decodeFails
    ? { decode: () => Promise.reject(new AudioError("AUDIO_DECODE_FAILED", "bad blob")) }
    : {
        decode: () =>
          Promise.resolve({
            pcm: SPEECH_PCM,
            sampleRate: FIXTURE_RATE,
            durationMs: 1100,
          }),
      });
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
      drawDelayMs: 0,
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

/** Drive an opted-in session to PROCESSING with metrics landed. */
async function toProcessing(ctx: AudioHook) {
  const { hook, advance } = ctx;
  act(() => hook.result.current.actions.spin());
  act(() => hook.result.current.actions.beginAudioOptIn());
  act(() => {
    hook.result.current.actions.confirmAudioOptIn();
  });
  await act(async () => {
    await hook.result.current.actions.startTimer();
  });
  advance(DEFAULT_SETTINGS.speakingSeconds * 1000);
  await flushAsync();
}

describe("usePracticeSession — v0.3 audio orchestration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not start the speaking timer while the microphone primer is unresolved", async () => {
    const ctx = setupAudio();
    const { result } = ctx.hook;
    act(() => result.current.actions.spin());
    act(() => result.current.actions.beginAudioOptIn());
    expect(result.current.audio.status).toBe("PRIMER");

    let started = true;
    await act(async () => {
      started = await result.current.actions.startTimer();
    });
    expect(started).toBe(false);
    expect(result.current.state.name).toBe("TOPIC_READY");
    expect(ctx.rec.getUserMedia).not.toHaveBeenCalled();
  });

  it("runs the full audio path: primer → ready → record → process → transcribe → review", async () => {
    const ctx = setupAudio();
    const { hook, advance, transcription } = ctx;
    const { result } = hook;

    act(() => result.current.actions.spin());
    act(() => result.current.actions.beginAudioOptIn());
    expect(result.current.audio.status).toBe("PRIMER");

    act(() => {
      result.current.actions.confirmAudioOptIn();
    });
    expect(result.current.audio.status).toBe("READY");
    expect(result.current.audio.armed).toBe(false);
    expect(ctx.rec.getUserMedia).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.actions.startTimer();
    });
    expect(result.current.state.name).toBe("SPEAKING");
    expect(ctx.recorder.getState()).toBe("RECORDING");

    advance(DEFAULT_SETTINGS.speakingSeconds * 1000);
    await flushAsync();
    expect(result.current.state.name).toBe("PROCESSING");
    expect(result.current.audio.playback?.url).toBe("blob:fake-0");
    expect(result.current.audio.status).toBe("READY");
    expect(result.current.audio.armed).toBe(false);
    expect(ctx.rec.stopTrack).toHaveBeenCalledTimes(1);
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
      expect(result.current.state.coverage.verifiable).toBe(true);
      expect(result.current.state.coverage.totalCount).toBeGreaterThan(0);
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

    act(() => result.current.actions.spin());
    act(() => result.current.actions.beginAudioOptIn());
    act(() => {
      result.current.actions.confirmAudioOptIn();
    });
    expect(result.current.audio.status).toBe("READY");
    expect(result.current.audio.armed).toBe(false);
    expect(ctx.rec.getUserMedia).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.actions.startTimer();
    });
    expect(result.current.audio.status).toBe("UNAVAILABLE");
    expect(result.current.audio.issue).toBe("AUDIO_MIC_PERMISSION_DENIED");
    expect(ctx.recorder.getState()).toBe("FAILED");
    advance(DEFAULT_SETTINGS.speakingSeconds * 1000);
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
      expect(result.current.state.coverage.verifiable).toBe(true);
      expect(result.current.state.coverage.totalCount).toBeGreaterThan(0);
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

    act(() => result.current.actions.spin());
    act(() => result.current.actions.beginAudioOptIn());
    act(() => {
      result.current.actions.confirmAudioOptIn();
    });
    await act(async () => {
      await result.current.actions.startTimer();
    });
    advance(DEFAULT_SETTINGS.speakingSeconds * 1000);
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

  it("does not start transcription when PCM preparation finishes after the learner leaves", async () => {
    const pending: Array<(value: {
      pcm: Float32Array;
      sampleRate: number;
      durationMs: number;
    }) => void> = [];
    const decoder: AudioDecoder = {
      decode: () =>
        new Promise((resolve) => {
          pending.push(resolve);
        }),
    };
    const ctx = setupAudio({ decoder });
    const { hook, advance, transcription } = ctx;
    const { result } = hook;

    act(() => result.current.actions.spin());
    act(() => result.current.actions.beginAudioOptIn());
    act(() => result.current.actions.confirmAudioOptIn());
    await act(async () => {
      await result.current.actions.startTimer();
    });
    advance(DEFAULT_SETTINGS.speakingSeconds * 1000);
    await flushAsync();
    expect(result.current.state.name).toBe("PROCESSING");
    expect(pending).toHaveLength(1);

    act(() => result.current.actions.requestTranscription());
    await flushAsync();
    expect(pending).toHaveLength(2);
    act(() => result.current.actions.spinAgain());
    expect(result.current.state.name).toBe("TOPIC_READY");

    const decoded = {
      pcm: SPEECH_PCM,
      sampleRate: FIXTURE_RATE,
      durationMs: 1100,
    };
    await act(async () => {
      for (const resolve of pending) resolve(decoded);
      await Promise.resolve();
    });
    await flushAsync();
    expect(transcription.jobs).toHaveLength(0);
    expect(result.current.state.name).toBe("TOPIC_READY");
  });

  it("a stale clip finalizing after spin-again is revoked, never dispatched", async () => {
    const ctx = setupAudio();
    const { hook, advance, rec } = ctx;
    const { result } = hook;

    act(() => result.current.actions.spin());
    act(() => result.current.actions.beginAudioOptIn());
    act(() => {
      result.current.actions.confirmAudioOptIn();
    });
    await act(async () => {
      await result.current.actions.startTimer();
    });
    advance(DEFAULT_SETTINGS.speakingSeconds * 1000);
    // The stop finalization is async; spin before it resolves.
    act(() => result.current.actions.spinAgain());
    await flushAsync();
    expect(result.current.state.name).toBe("TOPIC_READY");
    expect(result.current.audio.playback).toBeNull();
    expect(rec.revoked).toContain("blob:fake-0");
  });
});

// --- v0.6 viva defense ladder (typed path; reuses the transcript pipeline) ---

describe("usePracticeSession — v0.6 viva", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function vivaSetup() {
    const nowRef = { value: 0 };
    const monotonic = { now: () => nowRef.value };
    const wall = { isoNow: () => "2026-09-01T00:00:00.000Z" };
    const random = seededRandom(123);
    const bagStore = new InMemoryBagStore();
    const hook = renderHook(() =>
      usePracticeSession({
        pack,
        settings: DEFAULT_SETTINGS,
        monotonic,
        wall,
        random,
        bagStore,
        drawDelayMs: 0,
      }),
    );
    const advance = (ms: number) =>
      act(() => {
        nowRef.value += ms;
        vi.advanceTimersByTime(ms);
      });
    return { hook, advance };
  }

  /** Drive a cardiovascular Defend spin to REVIEW via the typed self-review path. */
  async function toReview(ctx: ReturnType<typeof vivaSetup>) {
    const { hook, advance } = ctx;
    const { result } = hook;
    const currentState = (): SessionState => result.current.state;
    act(() =>
      result.current.actions.setSelection({
        challenge: "VIVA",
        subjectId: "cardiovascular-physiotherapy",
      }),
    );
    act(() => result.current.actions.spin());
    const drawn = currentState();
    if (drawn.name !== "TOPIC_READY") throw new Error("topic not drawn");
    expect(drawn.topic.vivaQuestions.length).toBe(3);
    await act(async () => {
      await result.current.actions.startTimer();
    });
    advance(DEFAULT_SETTINGS.speakingSeconds * 1000);
    act(() => result.current.actions.startTypedReview());
    act(() => result.current.actions.submitSelfReview("safety assessment and secondary prevention"));
    const reviewed = currentState();
    if (reviewed.name !== "REVIEW") throw new Error("review not reached");
  }

  async function toAudioReview(ctx: AudioHook, enableMainMic = true) {
    const { result } = ctx.hook;
    act(() =>
      result.current.actions.setSelection({
        challenge: "VIVA",
        subjectId: "cardiovascular-physiotherapy",
      }),
    );
    act(() => result.current.actions.spin());
    if (enableMainMic) {
      act(() => result.current.actions.beginAudioOptIn());
      act(() => result.current.actions.confirmAudioOptIn());
    }
    await act(async () => {
      await result.current.actions.startTimer();
    });
    ctx.advance(DEFAULT_SETTINGS.speakingSeconds * 1000);
    await flushAsync();
    act(() => result.current.actions.startTypedReview());
    act(() =>
      result.current.actions.submitSelfReview(
        "safety assessment and secondary prevention",
      ),
    );
    expect(result.current.state.name).toBe("REVIEW");
  }

  it("runs a full typed viva: review → viva → 3 answers → complete → exit to review", async () => {
    const ctx = vivaSetup();
    const { hook } = ctx;
    const { result } = hook;
    const currentState = (): SessionState => result.current.state;
    await toReview(ctx);

    act(() => result.current.actions.startViva());
    expect(currentState().name).toBe("VIVA_READY");

    act(() => result.current.actions.beginVivaQuestion());
    expect(currentState().name).toBe("VIVA_ASKING");

    for (let q = 0; q < 3; q += 1) {
      if (currentState().name !== "VIVA_ASKING") throw new Error(`q${q} not asking`);
      await act(async () => {
        await result.current.actions.startVivaSpeaking();
      });
      expect(currentState().name).toBe("VIVA_SPEAKING");
      ctx.advance(DEFAULT_SETTINGS.speakingSeconds * 1000);
      expect(currentState().name).toBe("VIVA_ATTEMPT_COMPLETE");
      act(() => result.current.actions.startVivaTypedReview());
      expect(currentState().name).toBe("VIVA_SELF_REVIEW");
      // Each question targets a different concept; answer with that concept's phrase.
      const answer =
        q === 0
          ? "safety assessment with secondary prevention and patient goals"
          : q === 1
            ? "individualized exercise with supervision and risk stratification"
            : "shared decision making with escalation for recurrent symptoms";
      act(() => result.current.actions.submitVivaSelfReview(answer));
      expect(currentState().name).toBe("VIVA_ANSWER_REVIEW");
      const answerState = currentState();
      if (answerState.name === "VIVA_ANSWER_REVIEW") {
        expect(answerState.coverage.verifiable).toBe(true);
        expect(answerState.coverage.hitCount).toBe(1);
      }
      act(() => result.current.actions.nextVivaQuestion());
    }
    expect(currentState().name).toBe("VIVA_COMPLETE");
    const completeState = currentState();
    if (completeState.name === "VIVA_COMPLETE") {
      expect(completeState.summary.answeredCount).toBe(3);
      expect(completeState.summary.weightedFraction).toBe(1);
    }

    act(() => result.current.actions.exitViva());
    expect(currentState().name).toBe("REVIEW");
    const reviewAgain = currentState();
    if (reviewAgain.name === "REVIEW") {
      expect(reviewAgain.coverage.verifiable).toBe(true);
    }
  });

  it("startViva is a no-op before REVIEW is reached", async () => {
    const ctx = vivaSetup();
    const { hook } = ctx;
    const { result } = hook;
    const currentState = (): SessionState => result.current.state;
    act(() =>
      result.current.actions.setSelection({
        challenge: "GUIDED",
        subjectId: "cardiovascular-physiotherapy",
      }),
    );
    act(() => result.current.actions.spin());
    if (currentState().name !== "TOPIC_READY") throw new Error("topic not drawn");
    // startViva guards on REVIEW; from TOPIC_READY it must be a no-op.
    act(() => result.current.actions.startViva());
    expect(currentState().name).toBe("TOPIC_READY");
  });

  it("exitViva from VIVA_READY returns to REVIEW", async () => {
    const ctx = vivaSetup();
    const { hook } = ctx;
    const { result } = hook;
    const currentState = (): SessionState => result.current.state;
    await toReview(ctx);
    act(() => result.current.actions.startViva());
    expect(currentState().name).toBe("VIVA_READY");
    act(() => result.current.actions.exitViva());
    expect(currentState().name).toBe("REVIEW");
  });

  it("stops the live deadline and microphone when the learner exits an active viva", async () => {
    const ctx = setupAudio();
    const { result } = ctx.hook;
    await toAudioReview(ctx);

    act(() => result.current.actions.startViva());
    act(() => result.current.actions.beginVivaQuestion());
    await act(async () => {
      await result.current.actions.startVivaSpeaking();
    });
    expect(result.current.state.name).toBe("VIVA_SPEAKING");
    expect(ctx.recorder.getState()).toBe("RECORDING");

    act(() => result.current.actions.exitViva());
    await flushAsync();
    expect(result.current.state.name).toBe("REVIEW");
    expect(ctx.recorder.getState()).toBe("IDLE");
    expect(ctx.rec.stopTrack).toHaveBeenCalledTimes(2);
    expect(ctx.rec.revoked).toContain("blob:fake-1");

    ctx.advance(DEFAULT_SETTINGS.speakingSeconds * 1000);
    expect(result.current.state.name).toBe("REVIEW");
  });

  it("allows microphone opt-in at the viva question after a typed main attempt", async () => {
    const ctx = setupAudio();
    const { result } = ctx.hook;
    await toAudioReview(ctx, false);

    act(() => result.current.actions.startViva());
    act(() => result.current.actions.beginVivaQuestion());
    expect(result.current.audio.status).toBe("OFF");
    act(() => result.current.actions.beginAudioOptIn());
    expect(result.current.audio.status).toBe("PRIMER");

    let started = true;
    await act(async () => {
      started = await result.current.actions.startVivaSpeaking();
    });
    expect(started).toBe(false);
    expect(result.current.state.name).toBe("VIVA_ASKING");

    act(() => result.current.actions.confirmAudioOptIn());
    await act(async () => {
      started = await result.current.actions.startVivaSpeaking();
    });
    expect(started).toBe(true);
    expect(result.current.state.name).toBe("VIVA_SPEAKING");
    expect(ctx.recorder.getState()).toBe("RECORDING");
  });

  it("focuses the shared processing and review headings during viva audio fallback", async () => {
    const processing = document.createElement("h2");
    processing.id = "processing-heading";
    processing.tabIndex = -1;
    const review = document.createElement("h2");
    review.id = "review-heading";
    review.tabIndex = -1;
    document.body.append(processing, review);

    const ctx = setupAudio();
    const { result } = ctx.hook;
    await toAudioReview(ctx);
    act(() => result.current.actions.startViva());
    act(() => result.current.actions.beginVivaQuestion());
    await act(async () => {
      await result.current.actions.startVivaSpeaking();
    });
    ctx.advance(DEFAULT_SETTINGS.speakingSeconds * 1000);
    await flushAsync();
    expect(result.current.state.name).toBe("VIVA_PROCESSING");
    expect(document.activeElement).toBe(processing);

    act(() => result.current.actions.startVivaTypedReview());
    expect(result.current.state.name).toBe("VIVA_SELF_REVIEW");
    expect(document.activeElement).toBe(review);
    processing.remove();
    review.remove();
  });
});
