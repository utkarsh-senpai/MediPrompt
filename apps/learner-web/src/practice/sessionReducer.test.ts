import { describe, expect, it } from "vitest";
import { initialState, reduceSession } from "./sessionReducer";
import { findVariant, toTopicSnapshot } from "@/content/packQuery";
import { validatePack } from "@/content/packValidator";
import type {
  PracticeSelection,
  ReducerDeps,
  RuntimePack,
  SessionState,
  TopicSnapshot,
} from "./types";
import demoPackJson from "@content/packs/demo-interaction-fixture.json";

const pack = validatePack(demoPackJson) as RuntimePack;

const deps: ReducerDeps = {
  pack,
  now: 0,
  nowIso: "2026-08-30T00:00:00.000Z",
  defaultSpeakingSeconds: 90,
  defaultResearchSeconds: 120,
};

function recallSelection(subjectId = "everyday-explanations"): PracticeSelection {
  return {
    mode: "RECALL_SPRINT",
    challenge: "GUIDED",
    subjectId,
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

const GUIDED = "how-a-zipper-works-guided-rs-v1";
const GUIDED_DR = "paper-vs-digital-guided-dr-v1";

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
      { type: "CHANGE_SELECTION", selection: recallSelection("science-and-nature") },
      deps,
    );
    expect(state.name).toBe("IDLE");
    if (state.name === "IDLE") expect(state.selection.subjectId).toBe("science-and-nature");
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
      { type: "CHANGE_SELECTION", selection: recallSelection("science-and-nature") },
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
    const found = findVariant(pack, "paper-vs-digital-applied-rs-v1");
    if (!found) throw new Error("fixture variant missing");
    const resolved = toTopicSnapshot(
      pack,
      found.variant,
      found.topic,
      found.subject,
      { speakingSeconds: 75, researchSeconds: 180 },
    );
    expect(resolved.timePolicy.speakingSeconds).toBe(75);
    expect(resolved.caseText).toContain("oral exam");
    expect(resolved.supportLevel).toBe("FULL");
  });
});

describe("reduceSession — Deep Research path", () => {
  function drSelection(): PracticeSelection {
    return { mode: "DEEP_RESEARCH", challenge: "GUIDED", subjectId: "reasoning-and-tradeoffs", register: "EXAMINER" };
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
