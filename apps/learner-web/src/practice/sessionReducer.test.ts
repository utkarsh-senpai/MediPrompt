import { describe, expect, it } from "vitest";
import { initialState, reduceSession } from "./sessionReducer";
import { findVariant, toTopicSnapshot } from "@/content/packQuery";
import { validatePack } from "@/content/packValidator";
import type {
  ApprovedTranscript,
  CoverageReport,
  DeliveryMetrics,
  PracticeSelection,
  ReducerDeps,
  RuntimePack,
  SessionState,
  TextMetrics,
  TopicSnapshot,
  TranscriptDraft,
} from "./types";
import medicalPackJson from "@content/candidates/mpt-cardiorespiratory-review-candidate.json";

const pack = validatePack(medicalPackJson) as RuntimePack;

const deps: ReducerDeps = {
  pack,
  now: 0,
  nowIso: "2026-08-30T00:00:00.000Z",
  defaultSpeakingSeconds: 90,
  defaultResearchSeconds: 120,
  audioArmed: false,
};

function recallSelection(subjectId = "respiratory-physiotherapy"): PracticeSelection {
  return {
    mode: "RECALL_SPRINT",
    challenge: "GUIDED",
    subjectId,
    register: "EXAMINER",
  };
}

function deepResearchSelection(): PracticeSelection {
  return {
    mode: "DEEP_RESEARCH",
    challenge: "GUIDED",
    subjectId: "respiratory-physiotherapy",
    register: "EXAMINER",
  };
}

function snapshot(variantId: string): TopicSnapshot {
  const found = findVariant(pack, variantId);
  if (!found) throw new Error(`variant ${variantId} not found`);
  return toTopicSnapshot(pack, found.variant, found.topic, found.subject, {
    speakingSeconds: 90,
    researchSeconds: 120,
  });
}

const GUIDED = "respiratory-assessment-guided-recall-v1";
const GUIDED_DR = "respiratory-assessment-guided-deep-v1";

const METRICS: DeliveryMetrics = {
  durationMs: 90_000,
  spokenMs: 61_500,
  pauses: [{ startMs: 12_000, durationMs: 450, kind: "UNKNOWN" }],
  clippingRatio: 0,
  loudnessVariationDb: 9.4,
  limitations: ["Loudness is relative to this recording only."],
};

const DRAFT: TranscriptDraft = {
  text: "um the assessment starts with patient history",
  source: "LOCAL_WHISPER",
  model: { id: "whisper-base.en", version: "pinned-revision", quantization: "q4" },
  uncertainRanges: [],
};

const APPROVED: ApprovedTranscript = {
  rawText: DRAFT.text,
  text: "the assessment starts with patient history",
  approvedAt: "2026-08-30T00:02:00.000Z",
  wasEdited: true,
};

const TEXT_METRICS: TextMetrics = {
  wordsPerMinute: 58.5,
  fillerCount: 1,
  repeatedPhraseCount: 0,
};

const COVERAGE_REPORT: CoverageReport = {
  verifiable: true,
  conceptResults: [
    { conceptId: "c1", label: "Names the slider role", weight: 2, hit: true, matchedPhrase: "slider" },
    { conceptId: "c2", label: "Explains interlocking teeth", weight: 3, hit: false, matchedPhrase: null },
  ],
  hitCount: 1,
  totalCount: 2,
  weightedFraction: 0.4,
  fraction: 0.5,
};

describe("reduceSession — IDLE / DRAWING", () => {
  it("SPIN moves to DRAWING and emits REQUEST_DRAW with eligible ids", () => {
    const idle = initialState(recallSelection());
    const { state, commands } = reduceSession(
      idle,
      { type: "SPIN", requestId: "r1", now: 0 },
      deps,
    );
    expect(state.name).toBe("DRAWING");
    const cmd = commands[0];
    expect(cmd?.type).toBe("REQUEST_DRAW");
    if (cmd?.type === "REQUEST_DRAW") {
      expect(cmd.eligibleVariantIds.length).toBeGreaterThan(0);
      expect(cmd.requestId).toBe("r1");
    }
  });

  it("CHANGE_SELECTION returns to IDLE with the new selection", () => {
    const drawing = reduceSession(
      initialState(recallSelection()),
      { type: "SPIN", requestId: "r1", now: 0 },
      deps,
    ).state;
    const { state } = reduceSession(
      drawing,
      { type: "CHANGE_SELECTION", selection: recallSelection("cardiovascular-physiotherapy") },
      deps,
    );
    expect(state.name).toBe("IDLE");
    if (state.name === "IDLE") expect(state.selection.subjectId).toBe("cardiovascular-physiotherapy");
  });
});

describe("reduceSession — stale events ignored", () => {
  it("TOPIC_DRAWN with a non-current requestId is ignored", () => {
    const drawing = reduceSession(
      initialState(recallSelection()),
      { type: "SPIN", requestId: "r1", now: 0 },
      deps,
    ).state;
    const { state } = reduceSession(
      drawing,
      { type: "TOPIC_DRAWN", requestId: "other", topic: snapshot(GUIDED), now: 0 },
      deps,
    );
    expect(state.name).toBe("DRAWING");
  });

  it("TIMER_ELAPSED with a non-current requestId is ignored", () => {
    let s: SessionState = initialState(recallSelection());
    s = reduceSession(s, { type: "SPIN", requestId: "r1", now: 0 }, deps).state;
    s = reduceSession(s, { type: "TOPIC_DRAWN", requestId: "r1", topic: snapshot(GUIDED), now: 0 }, deps).state;
    s = reduceSession(s, { type: "START_TIMER", now: 0 }, deps).state;
    const { state } = reduceSession(s, { type: "TIMER_ELAPSED", requestId: "other", now: 9999 }, deps);
    expect(state.name).toBe("SPEAKING");
  });
});

describe("reduceSession — invalid transitions are inert", () => {
  it("cannot replace an active timer through selection or spin events", () => {
    let state: SessionState = initialState(recallSelection());
    state = reduceSession(state, { type: "SPIN", requestId: "r1", now: 0 }, deps).state;
    state = reduceSession(
      state,
      { type: "TOPIC_DRAWN", requestId: "r1", topic: snapshot(GUIDED), now: 0 },
      deps,
    ).state;
    state = reduceSession(state, { type: "START_TIMER", now: 0 }, deps).state;
    expect(state.name).toBe("SPEAKING");

    const changed = reduceSession(
      state,
      { type: "CHANGE_SELECTION", selection: recallSelection("cardiovascular-physiotherapy") },
      deps,
    );
    expect(changed.state).toBe(state);
    expect(changed.commands).toEqual([]);
    expect(
      reduceSession(state, { type: "SPIN", requestId: "r2", now: 1 }, deps).state,
    ).toBe(state);
    expect(
      reduceSession(state, { type: "SPIN_AGAIN", requestId: "r2", now: 1 }, deps).state,
    ).toBe(state);
  });

  it("does not accept SPIN_AGAIN before a topic exists", () => {
    const idle = initialState(recallSelection());
    expect(
      reduceSession(idle, { type: "SPIN_AGAIN", requestId: "r1", now: 0 }, deps).state,
    ).toBe(idle);
  });
});

describe("reduceSession — Recall Sprint path", () => {
  it("drawn → start timer → speaking → elapsed → complete", () => {
    let s: SessionState = initialState(recallSelection());
    s = reduceSession(s, { type: "SPIN", requestId: "r1", now: 0 }, deps).state;
    s = reduceSession(s, { type: "TOPIC_DRAWN", requestId: "r1", topic: snapshot(GUIDED), now: 0 }, deps).state;
    expect(s.name).toBe("TOPIC_READY");
    const started = reduceSession(s, { type: "START_TIMER", now: 0 }, deps);
    expect(started.commands).toContainEqual({ type: "FOCUS_VIEW", target: "speaking" });
    s = started.state;
    expect(s.name).toBe("SPEAKING");
    if (s.name === "SPEAKING") expect(s.deadlineAt).toBe(90_000);
    s = reduceSession(s, { type: "TIMER_ELAPSED", requestId: "r1", now: 90_000 }, deps).state;
    expect(s.name).toBe("ATTEMPT_COMPLETE");
  });

  it("keeps the effective duration captured when the topic was drawn", () => {
    let s: SessionState = initialState(recallSelection());
    s = reduceSession(s, { type: "SPIN", requestId: "r1", now: 0 }, deps).state;
    const topic = {
      ...snapshot(GUIDED),
      timePolicy: { speakingSeconds: 75 },
    };
    s = reduceSession(
      s,
      { type: "TOPIC_DRAWN", requestId: "r1", topic, now: 0 },
      deps,
    ).state;
    s = reduceSession(
      s,
      { type: "START_TIMER", now: 1_000 },
      { ...deps, defaultSpeakingSeconds: 120 },
    ).state;
    expect(s.name).toBe("SPEAKING");
    if (s.name === "SPEAKING") expect(s.deadlineAt).toBe(76_000);
  });

  it("START_TIMER is invalid before a topic is drawn", () => {
    const idle = initialState(recallSelection());
    const { state } = reduceSession(idle, { type: "START_TIMER", now: 0 }, deps);
    expect(state.name).toBe("IDLE");
  });

  it("CLOSE_TIMER during speaking completes the attempt", () => {
    let s: SessionState = initialState(recallSelection());
    s = reduceSession(s, { type: "SPIN", requestId: "r1", now: 0 }, deps).state;
    s = reduceSession(s, { type: "TOPIC_DRAWN", requestId: "r1", topic: snapshot(GUIDED), now: 0 }, deps).state;
    s = reduceSession(s, { type: "START_TIMER", now: 0 }, deps).state;
    s = reduceSession(s, { type: "CLOSE_TIMER", now: 5000 }, deps).state;
    expect(s.name).toBe("ATTEMPT_COMPLETE");
  });
});

describe("resolved topic snapshot", () => {
  it("uses effective accessibility durations and resolves the reviewed case", () => {
    const found = findVariant(pack, "copd-assessment-planning-applied-recall-v1");
    if (!found) throw new Error("fixture variant missing");
    const resolved = toTopicSnapshot(
      pack,
      found.variant,
      found.topic,
      found.subject,
      { speakingSeconds: 75, researchSeconds: 180 },
    );
    expect(resolved.timePolicy.speakingSeconds).toBe(75);
    expect(resolved.caseText).toContain("stable COPD");
    expect(resolved.supportLevel).toBe("FULL");
  });
});

describe("reduceSession — Deep Research path", () => {
  function drSelection(): PracticeSelection {
    return { mode: "DEEP_RESEARCH", challenge: "GUIDED", subjectId: "respiratory-physiotherapy", register: "EXAMINER" };
  }

  it("START_TIMER from TOPIC_READY is invalid for Deep Research (must research first)", () => {
    let s: SessionState = initialState(drSelection());
    s = reduceSession(s, { type: "SPIN", requestId: "r1", now: 0 }, deps).state;
    s = reduceSession(s, { type: "TOPIC_DRAWN", requestId: "r1", topic: snapshot(GUIDED_DR), now: 0 }, deps).state;
    expect(s.name).toBe("TOPIC_READY");
    s = reduceSession(s, { type: "START_TIMER", now: 0 }, deps).state;
    expect(s.name).toBe("TOPIC_READY"); // unchanged
  });

  it("research → done → ready → speaking → elapsed", () => {
    let s: SessionState = initialState(drSelection());
    s = reduceSession(s, { type: "SPIN", requestId: "r1", now: 0 }, deps).state;
    s = reduceSession(s, { type: "TOPIC_DRAWN", requestId: "r1", topic: snapshot(GUIDED_DR), now: 0 }, deps).state;
    s = reduceSession(s, { type: "START_RESEARCH", now: 0 }, deps).state;
    expect(s.name).toBe("RESEARCHING");
    if (s.name === "RESEARCHING") expect(s.deadlineAt).toBe(120_000);
    // Stale done ignored
    s = reduceSession(s, { type: "DONE_RESEARCHING", requestId: "other", now: 1000 }, deps).state;
    expect(s.name).toBe("RESEARCHING");
    s = reduceSession(s, { type: "DONE_RESEARCHING", requestId: "r1", now: 1000 }, deps).state;
    expect(s.name).toBe("READY_TO_SPEAK");
    s = reduceSession(s, { type: "CONFIRM_READY", now: 1000 }, deps).state;
    expect(s.name).toBe("SPEAKING");
    s = reduceSession(s, { type: "TIMER_ELAPSED", requestId: "r1", now: 9999 }, deps).state;
    expect(s.name).toBe("ATTEMPT_COMPLETE");
  });

  it("TIMER_ELAPSED during research moves to READY_TO_SPEAK", () => {
    let s: SessionState = initialState(drSelection());
    s = reduceSession(s, { type: "SPIN", requestId: "r1", now: 0 }, deps).state;
    s = reduceSession(s, { type: "TOPIC_DRAWN", requestId: "r1", topic: snapshot(GUIDED_DR), now: 0 }, deps).state;
    s = reduceSession(s, { type: "START_RESEARCH", now: 0 }, deps).state;
    s = reduceSession(s, { type: "TIMER_ELAPSED", requestId: "r1", now: 120_000 }, deps).state;
    expect(s.name).toBe("READY_TO_SPEAK");
  });

  it("CLOSE_TIMER during research returns to TOPIC_READY", () => {
    let s: SessionState = initialState(drSelection());
    s = reduceSession(s, { type: "SPIN", requestId: "r1", now: 0 }, deps).state;
    s = reduceSession(s, { type: "TOPIC_DRAWN", requestId: "r1", topic: snapshot(GUIDED_DR), now: 0 }, deps).state;
    s = reduceSession(s, { type: "START_RESEARCH", now: 0 }, deps).state;
    s = reduceSession(s, { type: "CLOSE_TIMER", now: 1000 }, deps).state;
    expect(s.name).toBe("TOPIC_READY");
  });
});

describe("reduceSession — repeat", () => {
  it("SPIN_AGAIN from ATTEMPT_COMPLETE returns to DRAWING", () => {
    let s: SessionState = initialState(recallSelection());
    s = reduceSession(s, { type: "SPIN", requestId: "r1", now: 0 }, deps).state;
    s = reduceSession(s, { type: "TOPIC_DRAWN", requestId: "r1", topic: snapshot(GUIDED), now: 0 }, deps).state;
    s = reduceSession(s, { type: "START_TIMER", now: 0 }, deps).state;
    s = reduceSession(s, { type: "TIMER_ELAPSED", requestId: "r1", now: 90_000 }, deps).state;
    const { state, commands } = reduceSession(s, { type: "SPIN_AGAIN", requestId: "r2", now: 90_000 }, deps);
    expect(state.name).toBe("DRAWING");
    expect(commands.some((c) => c.type === "REQUEST_DRAW")).toBe(true);
  });
});

// --- v0.3 post-attempt extension (docs/V0.3_DEVELOPMENT_CONTEXT.md §5) ---

describe("reduceSession — v0.3 armed recording lifecycle", () => {
  const armed: ReducerDeps = { ...deps, audioArmed: true };

  function speakingArmed(): SessionState {
    let s: SessionState = initialState(recallSelection());
    s = reduceSession(s, { type: "SPIN", requestId: "r1", now: 0 }, armed).state;
    s = reduceSession(s, { type: "TOPIC_DRAWN", requestId: "r1", topic: snapshot(GUIDED), now: 0 }, armed).state;
    s = reduceSession(s, { type: "START_TIMER", now: 0 }, armed).state;
    return s;
  }

  function attemptCompleteArmed(): SessionState {
    return reduceSession(
      speakingArmed(),
      { type: "TIMER_ELAPSED", requestId: "r1", now: 90_000 },
      armed,
    ).state;
  }

  function processingState(): SessionState {
    return reduceSession(
      attemptCompleteArmed(),
      { type: "RECORDING_READY", attemptId: "r1-attempt", now: 90_100 },
      armed,
    ).state;
  }

  it("armed START_TIMER emits START_RECORDING; unarmed does not", () => {
    let s: SessionState = initialState(recallSelection());
    s = reduceSession(s, { type: "SPIN", requestId: "r1", now: 0 }, armed).state;
    s = reduceSession(s, { type: "TOPIC_DRAWN", requestId: "r1", topic: snapshot(GUIDED), now: 0 }, armed).state;
    const armedStart = reduceSession(s, { type: "START_TIMER", now: 0 }, armed);
    expect(armedStart.commands).toContainEqual({ type: "START_RECORDING", attemptId: "r1-attempt" });
    const unarmedStart = reduceSession(s, { type: "START_TIMER", now: 0 }, deps);
    expect(unarmedStart.commands.some((c) => c.type === "START_RECORDING")).toBe(false);
  });

  it("armed CONFIRM_READY emits START_RECORDING", () => {
    let s: SessionState = initialState(deepResearchSelection());
    s = reduceSession(s, { type: "SPIN", requestId: "r1", now: 0 }, armed).state;
    s = reduceSession(s, { type: "TOPIC_DRAWN", requestId: "r1", topic: snapshot(GUIDED_DR), now: 0 }, armed).state;
    s = reduceSession(s, { type: "START_RESEARCH", now: 0 }, armed).state;
    s = reduceSession(s, { type: "DONE_RESEARCHING", requestId: "r1", now: 1000 }, armed).state;
    const confirmed = reduceSession(s, { type: "CONFIRM_READY", now: 1000 }, armed);
    expect(confirmed.state.name).toBe("SPEAKING");
    expect(confirmed.commands).toContainEqual({ type: "START_RECORDING", attemptId: "r1-attempt" });
  });

  it("armed TIMER_ELAPSED and CLOSE_TIMER emit STOP_RECORDING", () => {
    const elapsed = reduceSession(
      speakingArmed(),
      { type: "TIMER_ELAPSED", requestId: "r1", now: 90_000 },
      armed,
    );
    expect(elapsed.state.name).toBe("ATTEMPT_COMPLETE");
    expect(elapsed.commands).toContainEqual({ type: "STOP_RECORDING", attemptId: "r1-attempt" });
    const closed = reduceSession(speakingArmed(), { type: "CLOSE_TIMER", now: 5000 }, armed);
    expect(closed.state.name).toBe("ATTEMPT_COMPLETE");
    expect(closed.commands).toContainEqual({ type: "STOP_RECORDING", attemptId: "r1-attempt" });
    // Armed-ness lives in deps, not in state: the same SPEAKING state closed
    // with unarmed deps emits no recording commands (v0.2-identical).
    const unarmed = reduceSession(speakingArmed(), { type: "CLOSE_TIMER", now: 5000 }, deps);
    expect(unarmed.commands.some((c) => c.type === "STOP_RECORDING")).toBe(false);
  });

  it("RECORDING_READY moves ATTEMPT_COMPLETE to PROCESSING and runs analysis", () => {
    const { state, commands } = reduceSession(
      attemptCompleteArmed(),
      { type: "RECORDING_READY", attemptId: "r1-attempt", now: 90_100 },
      armed,
    );
    expect(state.name).toBe("PROCESSING");
    if (state.name === "PROCESSING") {
      expect(state.metrics).toBeNull();
      expect(state.draft).toBeNull();
      expect(state.transcription).toBe("IDLE");
    }
    expect(commands).toContainEqual({ type: "RUN_ANALYSIS", attemptId: "r1-attempt" });
    expect(commands).toContainEqual({ type: "FOCUS_VIEW", target: "processing" });
  });

  it("drops stale post-attempt events whose attemptId does not match", () => {
    const complete = attemptCompleteArmed();
    expect(
      reduceSession(complete, { type: "RECORDING_READY", attemptId: "stale", now: 0 }, armed).state,
    ).toBe(complete);
    const processing = processingState();
    expect(
      reduceSession(
        processing,
        { type: "METRICS_READY", attemptId: "stale", metrics: METRICS, now: 0 },
        armed,
      ).state,
    ).toBe(processing);
    expect(
      reduceSession(
        processing,
        { type: "TRANSCRIPT_READY", attemptId: "stale", draft: DRAFT, now: 0 },
        armed,
      ).state,
    ).toBe(processing);
    expect(
      reduceSession(
        processing,
        { type: "TRANSCRIPTION_UNAVAILABLE", attemptId: "stale", reason: "ERROR", now: 0 },
        armed,
      ).state,
    ).toBe(processing);
  });
});

describe("reduceSession — v0.3 processing pipeline", () => {
  const armed: ReducerDeps = { ...deps, audioArmed: true };

  function processingState(): SessionState {
    let s: SessionState = initialState(recallSelection());
    s = reduceSession(s, { type: "SPIN", requestId: "r1", now: 0 }, armed).state;
    s = reduceSession(s, { type: "TOPIC_DRAWN", requestId: "r1", topic: snapshot(GUIDED), now: 0 }, armed).state;
    s = reduceSession(s, { type: "START_TIMER", now: 0 }, armed).state;
    s = reduceSession(s, { type: "TIMER_ELAPSED", requestId: "r1", now: 90_000 }, armed).state;
    s = reduceSession(s, { type: "RECORDING_READY", attemptId: "r1-attempt", now: 90_100 }, armed).state;
    return s;
  }

  it("METRICS_READY stores metrics and stays in PROCESSING without a draft", () => {
    const { state, commands } = reduceSession(
      processingState(),
      { type: "METRICS_READY", attemptId: "r1-attempt", metrics: METRICS, now: 90_200 },
      armed,
    );
    expect(state.name).toBe("PROCESSING");
    if (state.name === "PROCESSING") expect(state.metrics).toEqual(METRICS);
    expect(commands).toEqual([]);
  });

  it("TRANSCRIBE_REQUESTED starts transcription once", () => {
    const processing = processingState();
    const requested = reduceSession(
      processing,
      { type: "TRANSCRIBE_REQUESTED", attemptId: "r1-attempt", now: 90_300 },
      armed,
    );
    expect(requested.state.name).toBe("PROCESSING");
    if (requested.state.name === "PROCESSING") {
      expect(requested.state.transcription).toBe("RUNNING");
    }
    expect(requested.commands).toEqual([{ type: "START_TRANSCRIPTION", attemptId: "r1-attempt" }]);
    const duplicate = reduceSession(
      requested.state,
      { type: "TRANSCRIBE_REQUESTED", attemptId: "r1-attempt", now: 90_301 },
      armed,
    );
    expect(duplicate.state).toBe(requested.state);
    expect(duplicate.commands).toEqual([]);
  });

  it("TRANSCRIPT_READY with metrics present moves to TRANSCRIPT_REVIEW", () => {
    let s = processingState();
    s = reduceSession(s, { type: "METRICS_READY", attemptId: "r1-attempt", metrics: METRICS, now: 90_200 }, armed).state;
    s = reduceSession(s, { type: "TRANSCRIBE_REQUESTED", attemptId: "r1-attempt", now: 90_300 }, armed).state;
    const { state, commands } = reduceSession(
      s,
      { type: "TRANSCRIPT_READY", attemptId: "r1-attempt", draft: DRAFT, now: 95_000 },
      armed,
    );
    expect(state.name).toBe("TRANSCRIPT_REVIEW");
    if (state.name === "TRANSCRIPT_REVIEW") {
      expect(state.metrics).toEqual(METRICS);
      expect(state.draft).toEqual(DRAFT);
    }
    expect(commands).toContainEqual({ type: "FOCUS_VIEW", target: "review" });
  });

  it("TRANSCRIPT_READY before metrics holds the draft; METRICS_READY then completes the pair", () => {
    let s = processingState();
    s = reduceSession(s, { type: "TRANSCRIBE_REQUESTED", attemptId: "r1-attempt", now: 90_150 }, armed).state;
    const held = reduceSession(
      s,
      { type: "TRANSCRIPT_READY", attemptId: "r1-attempt", draft: DRAFT, now: 90_400 },
      armed,
    );
    expect(held.state.name).toBe("PROCESSING");
    if (held.state.name === "PROCESSING") {
      expect(held.state.draft).toEqual(DRAFT);
      expect(held.state.transcription).toBe("IDLE");
    }
    const completed = reduceSession(
      held.state,
      { type: "METRICS_READY", attemptId: "r1-attempt", metrics: METRICS, now: 90_500 },
      armed,
    );
    expect(completed.state.name).toBe("TRANSCRIPT_REVIEW");
  });

  it("TRANSCRIPT_READY when transcription is not running is dropped", () => {
    const processing = processingState();
    const { state } = reduceSession(
      processing,
      { type: "TRANSCRIPT_READY", attemptId: "r1-attempt", draft: DRAFT, now: 90_400 },
      armed,
    );
    expect(state).toBe(processing);
  });

  it("TRANSCRIPTION_UNAVAILABLE moves to SELF_REVIEW with the reason; analysis still lands", () => {
    let s = processingState();
    s = reduceSession(s, { type: "TRANSCRIBE_REQUESTED", attemptId: "r1-attempt", now: 90_150 }, armed).state;
    const failed = reduceSession(
      s,
      { type: "TRANSCRIPTION_UNAVAILABLE", attemptId: "r1-attempt", reason: "OFFLINE", now: 90_400 },
      armed,
    );
    expect(failed.state.name).toBe("SELF_REVIEW");
    if (failed.state.name === "SELF_REVIEW") {
      expect(failed.state.metrics).toBeNull();
      expect(failed.state.transcriptionIssue).toBe("OFFLINE");
    }
    expect(failed.commands).toContainEqual({ type: "FOCUS_VIEW", target: "review" });
    const landed = reduceSession(
      failed.state,
      { type: "METRICS_READY", attemptId: "r1-attempt", metrics: METRICS, now: 90_600 },
      armed,
    );
    expect(landed.state.name).toBe("SELF_REVIEW");
    if (landed.state.name === "SELF_REVIEW") expect(landed.state.metrics).toEqual(METRICS);
  });

  it("TRANSCRIBE_REQUESTED from SELF_REVIEW retries via PROCESSING", () => {
    let s = processingState();
    s = reduceSession(s, { type: "METRICS_READY", attemptId: "r1-attempt", metrics: METRICS, now: 90_200 }, armed).state;
    s = reduceSession(s, { type: "TRANSCRIBE_REQUESTED", attemptId: "r1-attempt", now: 90_300 }, armed).state;
    s = reduceSession(
      s,
      { type: "TRANSCRIPTION_UNAVAILABLE", attemptId: "r1-attempt", reason: "LOAD_FAILED", now: 90_400 },
      armed,
    ).state;
    const retry = reduceSession(
      s,
      { type: "TRANSCRIBE_REQUESTED", attemptId: "r1-attempt", now: 91_000 },
      armed,
    );
    expect(retry.state.name).toBe("PROCESSING");
    if (retry.state.name === "PROCESSING") {
      expect(retry.state.metrics).toEqual(METRICS);
      expect(retry.state.transcription).toBe("RUNNING");
    }
    expect(retry.commands).toContainEqual({ type: "START_TRANSCRIPTION", attemptId: "r1-attempt" });
  });
});

describe("reduceSession — v0.3 review and exits", () => {
  const armed: ReducerDeps = { ...deps, audioArmed: true };

  function transcriptReviewState(): SessionState {
    let s: SessionState = initialState(recallSelection());
    s = reduceSession(s, { type: "SPIN", requestId: "r1", now: 0 }, armed).state;
    s = reduceSession(s, { type: "TOPIC_DRAWN", requestId: "r1", topic: snapshot(GUIDED), now: 0 }, armed).state;
    s = reduceSession(s, { type: "START_TIMER", now: 0 }, armed).state;
    s = reduceSession(s, { type: "TIMER_ELAPSED", requestId: "r1", now: 90_000 }, armed).state;
    s = reduceSession(s, { type: "RECORDING_READY", attemptId: "r1-attempt", now: 90_100 }, armed).state;
    s = reduceSession(s, { type: "METRICS_READY", attemptId: "r1-attempt", metrics: METRICS, now: 90_200 }, armed).state;
    s = reduceSession(s, { type: "TRANSCRIBE_REQUESTED", attemptId: "r1-attempt", now: 90_300 }, armed).state;
    s = reduceSession(s, { type: "TRANSCRIPT_READY", attemptId: "r1-attempt", draft: DRAFT, now: 95_000 }, armed).state;
    return s;
  }

  it("TRANSCRIPT_APPROVED moves to REVIEW; audio metrics are untouched by edits", () => {
    const review = transcriptReviewState();
    const { state, commands } = reduceSession(
      review,
      {
        type: "TRANSCRIPT_APPROVED",
        attemptId: "r1-attempt",
        transcript: APPROVED,
        textMetrics: TEXT_METRICS,
        coverage: COVERAGE_REPORT,
        now: 96_000,
      },
      armed,
    );
    expect(state.name).toBe("REVIEW");
    if (state.name === "REVIEW") {
      expect(state.metrics).toEqual(METRICS);
      expect(state.textMetrics).toEqual(TEXT_METRICS);
      expect(state.transcript).toEqual(APPROVED);
      expect(state.coverage).toEqual(COVERAGE_REPORT);
    }
    expect(commands).toContainEqual({ type: "FOCUS_VIEW", target: "review" });
  });

  it("START_TYPED_REVIEW from ATTEMPT_COMPLETE opens SELF_REVIEW with no metrics", () => {
    let s: SessionState = initialState(recallSelection());
    s = reduceSession(s, { type: "SPIN", requestId: "r1", now: 0 }, deps).state;
    s = reduceSession(s, { type: "TOPIC_DRAWN", requestId: "r1", topic: snapshot(GUIDED), now: 0 }, deps).state;
    s = reduceSession(s, { type: "START_TIMER", now: 0 }, deps).state;
    s = reduceSession(s, { type: "TIMER_ELAPSED", requestId: "r1", now: 90_000 }, deps).state;
    const { state } = reduceSession(
      s,
      { type: "START_TYPED_REVIEW", attemptId: "r1-attempt", now: 90_100 },
      deps,
    );
    expect(state.name).toBe("SELF_REVIEW");
    if (state.name === "SELF_REVIEW") {
      expect(state.metrics).toBeNull();
      expect(state.transcriptionIssue).toBeNull();
    }
  });

  it("START_TYPED_REVIEW from PROCESSING cancels a running transcription", () => {
    let s: SessionState = initialState(recallSelection());
    s = reduceSession(s, { type: "SPIN", requestId: "r1", now: 0 }, armed).state;
    s = reduceSession(s, { type: "TOPIC_DRAWN", requestId: "r1", topic: snapshot(GUIDED), now: 0 }, armed).state;
    s = reduceSession(s, { type: "START_TIMER", now: 0 }, armed).state;
    s = reduceSession(s, { type: "TIMER_ELAPSED", requestId: "r1", now: 90_000 }, armed).state;
    s = reduceSession(s, { type: "RECORDING_READY", attemptId: "r1-attempt", now: 90_100 }, armed).state;
    s = reduceSession(s, { type: "TRANSCRIBE_REQUESTED", attemptId: "r1-attempt", now: 90_200 }, armed).state;
    const { state, commands } = reduceSession(
      s,
      { type: "START_TYPED_REVIEW", attemptId: "r1-attempt", now: 90_300 },
      armed,
    );
    expect(state.name).toBe("SELF_REVIEW");
    expect(commands).toContainEqual({ type: "CANCEL_TRANSCRIPTION", attemptId: "r1-attempt" });
  });

  it("START_TYPED_REVIEW from TRANSCRIPT_REVIEW keeps metrics and drops the draft", () => {
    const review = transcriptReviewState();
    const { state } = reduceSession(
      review,
      { type: "START_TYPED_REVIEW", attemptId: "r1-attempt", now: 96_000 },
      armed,
    );
    expect(state.name).toBe("SELF_REVIEW");
    if (state.name === "SELF_REVIEW") {
      expect(state.metrics).toEqual(METRICS);
      expect(state.transcriptionIssue).toBeNull();
    }
  });

  it("SELF_REVIEW_DONE moves to REVIEW carrying the typed transcript", () => {
    let s: SessionState = initialState(recallSelection());
    s = reduceSession(s, { type: "SPIN", requestId: "r1", now: 0 }, deps).state;
    s = reduceSession(s, { type: "TOPIC_DRAWN", requestId: "r1", topic: snapshot(GUIDED), now: 0 }, deps).state;
    s = reduceSession(s, { type: "START_TIMER", now: 0 }, deps).state;
    s = reduceSession(s, { type: "TIMER_ELAPSED", requestId: "r1", now: 90_000 }, deps).state;
    s = reduceSession(s, { type: "START_TYPED_REVIEW", attemptId: "r1-attempt", now: 90_100 }, deps).state;
    const typed: ApprovedTranscript = {
      text: "what I said, from memory",
      approvedAt: "2026-08-30T00:05:00.000Z",
      wasEdited: false,
    };
    const { state } = reduceSession(
      s,
      {
        type: "SELF_REVIEW_DONE",
        attemptId: "r1-attempt",
        transcript: typed,
        textMetrics: { fillerCount: 0, repeatedPhraseCount: 0 },
        coverage: COVERAGE_REPORT,
        now: 97_000,
      },
      deps,
    );
    expect(state.name).toBe("REVIEW");
    if (state.name === "REVIEW") {
      expect(state.metrics).toBeNull();
      expect(state.textMetrics?.wordsPerMinute).toBeUndefined();
      expect(state.transcript.text).toBe("what I said, from memory");
      expect(state.coverage).toEqual(COVERAGE_REPORT);
    }
  });

  it("SPIN_AGAIN from REVIEW revokes the recording and draws again", () => {
    const review = transcriptReviewState();
    const approved = reduceSession(
      review,
      {
        type: "TRANSCRIPT_APPROVED",
        attemptId: "r1-attempt",
        transcript: APPROVED,
        textMetrics: TEXT_METRICS,
        coverage: COVERAGE_REPORT,
        now: 96_000,
      },
      armed,
    ).state;
    const { state, commands } = reduceSession(
      approved,
      { type: "SPIN_AGAIN", requestId: "r2", now: 100_000 },
      armed,
    );
    expect(state.name).toBe("DRAWING");
    expect(commands).toContainEqual({ type: "REVOKE_RECORDING", attemptId: "r1-attempt" });
    expect(commands.some((c) => c.type === "REQUEST_DRAW")).toBe(true);
  });

  it("SPIN_AGAIN from PROCESSING cancels transcription and revokes the recording", () => {
    let s: SessionState = initialState(recallSelection());
    s = reduceSession(s, { type: "SPIN", requestId: "r1", now: 0 }, armed).state;
    s = reduceSession(s, { type: "TOPIC_DRAWN", requestId: "r1", topic: snapshot(GUIDED), now: 0 }, armed).state;
    s = reduceSession(s, { type: "START_TIMER", now: 0 }, armed).state;
    s = reduceSession(s, { type: "TIMER_ELAPSED", requestId: "r1", now: 90_000 }, armed).state;
    s = reduceSession(s, { type: "RECORDING_READY", attemptId: "r1-attempt", now: 90_100 }, armed).state;
    s = reduceSession(s, { type: "TRANSCRIBE_REQUESTED", attemptId: "r1-attempt", now: 90_200 }, armed).state;
    const { state, commands } = reduceSession(
      s,
      { type: "SPIN_AGAIN", requestId: "r2", now: 95_000 },
      armed,
    );
    expect(state.name).toBe("DRAWING");
    expect(commands).toContainEqual({ type: "CANCEL_TRANSCRIPTION", attemptId: "r1-attempt" });
    expect(commands).toContainEqual({ type: "REVOKE_RECORDING", attemptId: "r1-attempt" });
  });

  it("SPIN_AGAIN from an unarmed ATTEMPT_COMPLETE stays byte-identical to v0.2", () => {
    let s: SessionState = initialState(recallSelection());
    s = reduceSession(s, { type: "SPIN", requestId: "r1", now: 0 }, deps).state;
    s = reduceSession(s, { type: "TOPIC_DRAWN", requestId: "r1", topic: snapshot(GUIDED), now: 0 }, deps).state;
    s = reduceSession(s, { type: "START_TIMER", now: 0 }, deps).state;
    s = reduceSession(s, { type: "TIMER_ELAPSED", requestId: "r1", now: 90_000 }, deps).state;
    const { commands } = reduceSession(s, { type: "SPIN_AGAIN", requestId: "r2", now: 90_000 }, deps);
    expect(commands).toHaveLength(1);
    expect(commands[0]?.type).toBe("REQUEST_DRAW");
  });

  it("CHANGE_SELECTION from a post-attempt state releases audio resources", () => {
    const review = transcriptReviewState();
    const { state, commands } = reduceSession(
      review,
      { type: "CHANGE_SELECTION", selection: recallSelection("cardiovascular-physiotherapy") },
      armed,
    );
    expect(state.name).toBe("IDLE");
    expect(commands).toEqual([{ type: "REVOKE_RECORDING", attemptId: "r1-attempt" }]);
  });

  it("CHANGE_SELECTION from an unarmed ATTEMPT_COMPLETE stays byte-identical to v0.2", () => {
    let s: SessionState = initialState(recallSelection());
    s = reduceSession(s, { type: "SPIN", requestId: "r1", now: 0 }, deps).state;
    s = reduceSession(s, { type: "TOPIC_DRAWN", requestId: "r1", topic: snapshot(GUIDED), now: 0 }, deps).state;
    s = reduceSession(s, { type: "START_TIMER", now: 0 }, deps).state;
    s = reduceSession(s, { type: "TIMER_ELAPSED", requestId: "r1", now: 90_000 }, deps).state;
    const { commands } = reduceSession(
      s,
      { type: "CHANGE_SELECTION", selection: recallSelection("cardiovascular-physiotherapy") },
      deps,
    );
    expect(commands).toEqual([]);
  });
});
