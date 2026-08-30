import { useCallback, useEffect, useRef, useState } from "react";
import { reduceSession, initialState, findVariant, toTopicSnapshot } from "./sessionReducer";
import { draw } from "./shuffledBag";
import { isElapsed } from "./deadlineTimer";
import { listSubjects, presetsFor, eligibleVariantIds } from "@/content/packQuery";
import type {
  BagStore,
  ChallengePreset,
  Command,
  PracticeSelection,
  ReducerDeps,
  RuntimePack,
  SessionEvent,
  SessionState,
  TopicSnapshot,
  UserSettings,
  V02PracticeMode,
} from "./types";
import type { MonotonicClock, WallClock } from "@/platform/clock";
import type { RandomSource } from "@/platform/random";

export interface OrchestratorDeps {
  pack: RuntimePack;
  settings: UserSettings;
  monotonic: MonotonicClock;
  wall: WallClock;
  random: RandomSource;
  bagStore: BagStore;
}

function newRequestId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `req-${Date.now().toString(36)}-${Math.floor(performance.now() * 1000).toString(36)}`;
}

export function initialSelection(pack: RuntimePack): PracticeSelection {
  const subjects = listSubjects(pack);
  const subjectId = subjects[0]?.subjectId ?? "";
  const presets = presetsFor(pack, subjectId, "RECALL_SPRINT");
  return {
    mode: "RECALL_SPRINT",
    challenge: (presets[0] ?? "GUIDED") as ChallengePreset,
    subjectId,
    register: "EXAMINER",
  };
}

export function usePracticeSession(deps: OrchestratorDeps) {
  const { pack, settings, monotonic, wall, random, bagStore } = deps;

  const [state, setState] = useState<SessionState>(() =>
    initialState(initialSelection(pack)),
  );
  const [renderNow, setRenderNow] = useState(() => monotonic.now());

  const pendingCommands = useRef<Command[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;

  const timerRef = useRef<number | null>(null);
  const deadlineRef = useRef<{ deadlineAt: number; requestId: string } | null>(null);
  const lastDrawnRef = useRef<Map<string, string>>(new Map());
  const onVisibleRef = useRef<() => void>(() => {});

  // Latest reducer deps for use inside the dispatch updater.
  const reducerDepsRef = useRef<ReducerDeps>({
    pack,
    now: 0,
    nowIso: wall.isoNow(),
    defaultSpeakingSeconds: settings.speakingSeconds,
    defaultResearchSeconds: settings.researchSeconds,
  });
  reducerDepsRef.current = {
    pack,
    now: monotonic.now(),
    nowIso: wall.isoNow(),
    defaultSpeakingSeconds: settings.speakingSeconds,
    defaultResearchSeconds: settings.researchSeconds,
  };

  const dispatch = useCallback((event: SessionEvent) => {
    setState((prev) => {
      const result = reduceSession(prev, event, reducerDepsRef.current);
      if (result.commands.length > 0) pendingCommands.current.push(...result.commands);
      return result.state;
    });
  }, []);

  const stopDeadline = useCallback(() => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    deadlineRef.current = null;
    window.removeEventListener("visibilitychange", onVisibleRef.current);
  }, []);

  const onVisible = useCallback(() => {
    if (document.visibilityState !== "visible") return;
    const d = deadlineRef.current;
    if (!d) return;
    const now = monotonic.now();
    if (isElapsed(d.deadlineAt, now)) {
      stopDeadline();
      dispatch({ type: "TIMER_ELAPSED", requestId: d.requestId, now });
    }
  }, [monotonic, dispatch, stopDeadline]);

  useEffect(() => {
    onVisibleRef.current = onVisible;
  }, [onVisible]);

  const startDeadline = useCallback(
    (deadlineAt: number) => {
      stopDeadline();
      const s = stateRef.current;
      const requestId =
        s.name === "SPEAKING" || s.name === "RESEARCHING" ? s.requestId : "";
      deadlineRef.current = { deadlineAt, requestId };
      const tick = () => {
        const d = deadlineRef.current;
        if (!d) return;
        const now = monotonic.now();
        setRenderNow(now);
        if (isElapsed(d.deadlineAt, now)) {
          stopDeadline();
          dispatch({ type: "TIMER_ELAPSED", requestId: d.requestId, now });
        }
      };
      timerRef.current = window.setInterval(tick, 250);
      window.addEventListener("visibilitychange", onVisibleRef.current);
    },
    [monotonic, dispatch, stopDeadline],
  );

  const focusView = useCallback((target: "topic" | "speaking" | "complete") => {
    const id =
      target === "topic"
        ? "topic-heading"
        : target === "speaking"
          ? "speaking-heading"
          : "complete-heading";
    requestAnimationFrame(() => {
      document.getElementById(id)?.focus();
    });
  }, []);

  const runCommand = useCallback(
    (cmd: Command) => {
      switch (cmd.type) {
        case "REQUEST_DRAW": {
          if (cmd.eligibleVariantIds.length === 0) return;
          const lastDrawn = lastDrawnRef.current.get(cmd.fingerprint);
          const bag = bagStore.load(cmd.fingerprint);
          const { chosen, remaining } = draw({
            eligible: cmd.eligibleVariantIds,
            bag,
            random,
            lastDrawnId: lastDrawn,
          });
          bagStore.save(cmd.fingerprint, remaining);
          lastDrawnRef.current.set(cmd.fingerprint, chosen);
          const found = findVariant(pack, chosen);
          if (!found) return;
          const snapshot: TopicSnapshot = toTopicSnapshot(
            pack,
            found.variant,
            found.topic,
            found.subject,
            {
              speakingSeconds: settings.speakingSeconds,
              researchSeconds: settings.researchSeconds,
            },
          );
          dispatch({
            type: "TOPIC_DRAWN",
            requestId: cmd.requestId,
            topic: snapshot,
            now: monotonic.now(),
          });
          break;
        }
        case "START_DEADLINE":
          startDeadline(cmd.deadlineAt);
          break;
        case "STOP_DEADLINE":
          stopDeadline();
          break;
        case "FOCUS_VIEW":
          focusView(cmd.target);
          break;
      }
    },
    [pack, settings, random, bagStore, monotonic, dispatch, startDeadline, stopDeadline, focusView],
  );

  // Drain queued commands after each render.
  useEffect(() => {
    const cmds = pendingCommands.current;
    pendingCommands.current = [];
    for (const cmd of cmds) runCommand(cmd);
  });

  useEffect(() => () => stopDeadline(), [stopDeadline]);

  // --- Actions ---

  const now = useCallback(() => monotonic.now(), [monotonic]);

  const spin = useCallback(() => {
    dispatch({ type: "SPIN", requestId: newRequestId(), now: now() });
  }, [dispatch, now]);

  const spinAgain = useCallback(() => {
    dispatch({ type: "SPIN_AGAIN", requestId: newRequestId(), now: now() });
  }, [dispatch, now]);

  const startTimer = useCallback(() => {
    dispatch({ type: "START_TIMER", now: now() });
  }, [dispatch, now]);

  const startResearch = useCallback(() => {
    dispatch({ type: "START_RESEARCH", now: now() });
  }, [dispatch, now]);

  const doneResearching = useCallback(() => {
    const s = stateRef.current;
    if (s.name === "RESEARCHING") {
      dispatch({ type: "DONE_RESEARCHING", requestId: s.requestId, now: now() });
    }
  }, [dispatch, now]);

  const confirmReady = useCallback(() => {
    dispatch({ type: "CONFIRM_READY", now: now() });
  }, [dispatch, now]);

  const closeTimer = useCallback(() => {
    dispatch({ type: "CLOSE_TIMER", now: now() });
  }, [dispatch, now]);

  const setSelection = useCallback(
    (partial: Partial<PracticeSelection>) => {
      const current = stateRef.current.selection;
      let next: PracticeSelection = { ...current, ...partial };
      // If the subject/mode change makes the current challenge unavailable, fall back.
      const presets = presetsFor(pack, next.subjectId, next.mode);
      if (presets.length > 0 && !presets.includes(next.challenge)) {
        next = { ...next, challenge: presets[0]! };
      }
      if (presets.length === 0) {
        // No eligible variants for this mode+subject; keep selection, UI disables spin.
      }
      dispatch({ type: "CHANGE_SELECTION", selection: next });
    },
    [pack, dispatch],
  );

  // --- Derived UI data ---

  const subjects = listSubjects(pack);
  const presets = presetsFor(pack, state.selection.subjectId, state.selection.mode);
  const challengeVisible = presets.length > 1;
  const eligibleCount = eligibleVariantIds(
    pack,
    state.selection.subjectId,
    state.selection.mode,
    state.selection.challenge,
  ).length;

  return {
    state,
    now: renderNow,
    subjects,
    presets,
    challengeVisible,
    eligibleCount,
    actions: {
      spin,
      spinAgain,
      startTimer,
      startResearch,
      doneResearching,
      confirmReady,
      closeTimer,
      setSelection,
    },
  };
}

export type { V02PracticeMode };
