import { useCallback, useEffect, useRef, useState } from "react";
import { reduceSession, initialState, findVariant, toTopicSnapshot } from "./sessionReducer";
import { draw } from "./shuffledBag";
import { isElapsed } from "./deadlineTimer";
import {
  coverageToQuality,
  latestRecord,
  scheduleReview,
  topicFingerprint,
} from "./spacedRepetition";
import { listSubjects, presetsFor, eligibleVariantIds, findRubric } from "@/content/packQuery";
import { isAudioError } from "@/audio/audioErrors";
import { scoreCoverage } from "@/scoring/coverage";
import {
  refinementDelta,
  toAttemptHistoryEntry,
} from "@/scoring/refinementDelta";
import type { AudioDecoder } from "@/audio/pcmDecode";
import type { AttemptRecorder } from "@/audio/recorder";
import { computeAudioMetrics, computeTextMetrics } from "@/audio/deliveryMetrics";
import type {
  TranscriptionClient,
  TranscriptionSession,
} from "@/speech/transcriptionClient";
import {
  EMBEDDING_MODEL,
  type EmbeddingClient,
  type EmbeddingSession,
} from "@/scoring/embeddingClient";
import {
  segmentTranscript,
  semanticCoverage,
  type ConceptEmbeddings,
  type TextEmbedding,
} from "@/scoring/semanticCoverage";
import type {
  ApprovedTranscript,
  AudioErrorCode,
  BagStore,
  ChallengePreset,
  Command,
  Concept,
  CoverageReport,
  HistoryStore,
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
import { toPersistedCoverage } from "@/platform/historyStore";

/**
 * Audio/transcription platform surface. Every touchpoint is injected so the
 * orchestrator is fully testable in jsdom; when absent the session runs the
 * v0.2 timer-only path and the reducer never emits recording commands.
 */
export interface AudioDeps {
  recorder: AttemptRecorder;
  decoder: AudioDecoder;
  transcription: TranscriptionClient;
}

export interface OrchestratorDeps {
  pack: RuntimePack;
  settings: UserSettings;
  monotonic: MonotonicClock;
  wall: WallClock;
  random: RandomSource;
  bagStore: BagStore;
  audio?: AudioDeps;
  /** v0.5: optional semantic embedding client; used only when settings.semanticCoverage is true. */
  embedding?: EmbeddingClient;
  /** Test-only timing seam; production defaults to the motion-aware draw delay. */
  drawDelayMs?: number;
  /** v0.7: local metadata store; writes also require explicit learner opt-in. */
  historyStore?: HistoryStore;
  onHistoryChanged?: () => void;
}

/** Microphone opt-in lifecycle; the no-audio path is first-class, not an error. */
export type AudioOptInStatus =
  | "OFF"
  | "PRIMER"
  | "READY"
  | "STARTING"
  | "ACTIVE"
  | "UNAVAILABLE";

export interface AudioUiState {
  available: boolean;
  status: AudioOptInStatus;
  armed: boolean;
  /** Last audio failure for copy rows; cleared when a new recording starts. */
  issue: AudioErrorCode | null;
  playback: { attemptId: string; url: string; durationMs: number } | null;
  /** Model download 0..1; null while inference runs or transcription is idle. */
  transcriptionProgress: number | null;
}

export type HistorySaveState =
  | "OFF"
  | "IDLE"
  | "SAVING"
  | "SAVED"
  | "SAVED_SESSION"
  | "ERROR";

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
  const {
    pack,
    settings,
    monotonic,
    wall,
    random,
    bagStore,
    audio,
    embedding,
    drawDelayMs,
    historyStore,
    onHistoryChanged,
  } = deps;

  const [state, setState] = useState<SessionState>(() =>
    initialState(initialSelection(pack)),
  );
  const [renderNow, setRenderNow] = useState(() => monotonic.now());

  const pendingCommands = useRef<Command[]>([]);
  const stateRef = useRef(state);

  const timerRef = useRef<number | null>(null);
  const deadlineRef = useRef<{ deadlineAt: number; requestId: string } | null>(null);
  const lastDrawnRef = useRef<Map<string, string>>(new Map());
  const pendingDrawTimersRef = useRef<Set<number>>(new Set());
  const onVisibleRef = useRef<() => void>(() => {});

  // --- Audio orchestration state (orchestrator-owned; the reducer stays pure) ---
  const [audioArmed, setAudioArmed] = useState(false);
  const [audioStatus, setAudioStatus] = useState<AudioOptInStatus>("OFF");
  const [audioIssue, setAudioIssue] = useState<AudioErrorCode | null>(null);
  const [playback, setPlayback] = useState<AudioUiState["playback"]>(null);
  const [transcriptionProgress, setTranscriptionProgress] = useState<number | null>(
    null,
  );
  const [semanticRefining, setSemanticRefining] = useState(false);
  const [historySaveState, setHistorySaveState] = useState<HistorySaveState>(
    settings.practiceHistory ? "IDLE" : "OFF",
  );
  const lastHistoryPayloadRef = useRef<string | null>(null);
  const pcmCacheRef = useRef<{
    attemptId: string;
    pcm: Float32Array;
    sampleRate: number;
  } | null>(null);
  const transcriptionSessionRef = useRef<TranscriptionSession | null>(null);
  const embeddingSessionRef = useRef<EmbeddingSession | null>(null);
  const rubricEmbeddingCacheRef = useRef<Map<string, ConceptEmbeddings[]>>(new Map());
  const audioStartPendingRef = useRef(false);

  // Latest reducer deps for use inside the dispatch updater.
  const reducerDepsRef = useRef<ReducerDeps>({
    pack,
    now: 0,
    nowIso: wall.isoNow(),
    defaultSpeakingSeconds: settings.speakingSeconds,
    defaultResearchSeconds: settings.researchSeconds,
    audioArmed: false,
  });

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    reducerDepsRef.current = {
      pack,
      now: monotonic.now(),
      nowIso: wall.isoNow(),
      defaultSpeakingSeconds: settings.speakingSeconds,
      defaultResearchSeconds: settings.researchSeconds,
      audioArmed,
    };
  }, [pack, settings, monotonic, wall, audioArmed]);

  const dispatch = useCallback((event: SessionEvent) => {
    const latestDeps: ReducerDeps = {
      ...reducerDepsRef.current,
      now: monotonic.now(),
      nowIso: wall.isoNow(),
    };
    reducerDepsRef.current = latestDeps;
    setState((prev) => {
      const result = reduceSession(prev, event, latestDeps);
      if (result.commands.length > 0) pendingCommands.current.push(...result.commands);
      return result.state;
    });
  }, [monotonic, wall]);

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
        s.name === "SPEAKING" || s.name === "RESEARCHING"
          ? s.requestId
          : s.name === "VIVA_SPEAKING"
            ? s.attempt.attemptId
            : "";
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

  const focusView = useCallback(
    (
      target:
        | "topic"
        | "speaking"
        | "complete"
        | "processing"
        | "review"
        | "viva-asking"
        | "viva-processing"
        | "viva-review"
        | "viva-complete",
    ) => {
      const ids: Record<typeof target, readonly string[]> = {
        topic: ["topic-heading"],
        speaking: ["speaking-heading"],
        complete: ["complete-heading"],
        processing: ["processing-heading"],
        review: ["review-heading"],
        "viva-asking": ["viva-asking-heading"],
        "viva-processing": ["processing-heading"],
        "viva-review": ["viva-review-heading", "review-heading"],
        "viva-complete": ["viva-complete-heading"],
      };
      // Commands are drained from an effect after React commits the target view,
      // so the heading already exists. Focusing here avoids an extra-frame race
      // on slower devices and CI while preserving the visible transition.
      const heading = ids[target]
        .map((id) => document.getElementById(id))
        .find((candidate): candidate is HTMLElement => candidate !== null);
      heading?.focus();
      if (target === "topic") {
        const reduceMotion =
          globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
        heading?.scrollIntoView?.({
          block: "start",
          behavior: reduceMotion ? "auto" : "smooth",
        });
      }
    },
    [],
  );

  /** PCM for the attempt, from the analysis cache or a fresh decode. */
  const ensurePcm = useCallback(
    async (
      attemptId: string,
    ): Promise<{ attemptId: string; pcm: Float32Array; sampleRate: number } | null> => {
      if (!audio) return null;
      const cached = pcmCacheRef.current;
      if (cached && cached.attemptId === attemptId) return cached;
      const clip = audio.recorder.getClip(attemptId);
      if (!clip) return null;
      try {
        const buffer = await clip.blob.arrayBuffer();
        const decoded = await audio.decoder.decode(buffer);
        const entry = {
          attemptId,
          pcm: decoded.pcm,
          sampleRate: decoded.sampleRate,
        };
        pcmCacheRef.current = entry;
        return entry;
      } catch {
        return null;
      }
    },
    [audio],
  );

  const runCommand = useCallback(
    (cmd: Command) => {
      switch (cmd.type) {
        case "REQUEST_DRAW": {
          if (cmd.eligibleVariantIds.length === 0) return;
          const lastDrawn = lastDrawnRef.current.get(cmd.fingerprint);
          const bagState = bagStore.load(cmd.fingerprint);
          const { chosen, remaining } = draw({
            eligible: cmd.eligibleVariantIds,
            bag: bagState?.remainingVariantIds ?? [],
            previousEligible: bagState?.eligibleVariantIds,
            random,
            lastDrawnId: lastDrawn,
          });
          bagStore.save(cmd.fingerprint, {
            eligibleVariantIds: cmd.eligibleVariantIds,
            remainingVariantIds: remaining,
          });
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
          const reduceMotion =
            globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
          const delay = drawDelayMs ?? (reduceMotion ? 100 : 650);
          if (delay === 0) {
            dispatch({
              type: "TOPIC_DRAWN",
              requestId: cmd.requestId,
              topic: snapshot,
              now: monotonic.now(),
            });
            break;
          }
          const timerId = window.setTimeout(() => {
            pendingDrawTimersRef.current.delete(timerId);
            dispatch({
              type: "TOPIC_DRAWN",
              requestId: cmd.requestId,
              topic: snapshot,
              now: monotonic.now(),
            });
          }, delay);
          pendingDrawTimersRef.current.add(timerId);
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

        // --- v0.3 audio commands ---
        case "START_RECORDING": {
          if (!audio) break;
          try {
            audio.recorder.start();
            setAudioIssue(null);
            setAudioStatus("ACTIVE");
          } catch (err) {
            // Recording could not start: the speaking window continues
            // timer-only and no audio object exists (error-matrix row).
            setAudioArmed(false);
            setAudioStatus("UNAVAILABLE");
            setAudioIssue(
              isAudioError(err) ? err.code : "AUDIO_RECORD_FAILED",
            );
          }
          break;
        }
        case "STOP_RECORDING": {
          if (!audio) break;
          void (async () => {
            const clip = await audio.recorder.stop(cmd.attemptId);
            setAudioArmed(false);
            reducerDepsRef.current = {
              ...reducerDepsRef.current,
              audioArmed: false,
            };
            setAudioStatus((previous) =>
              previous === "UNAVAILABLE" ? previous : "READY",
            );
            if (!clip) {
              setAudioIssue((prev) => prev ?? "AUDIO_RECORD_FAILED");
              return;
            }
            const current = stateRef.current;
            const currentAttemptId =
              "attempt" in current ? current.attempt.attemptId : null;
            if (currentAttemptId !== cmd.attemptId) {
              // Learner moved on while the clip finalized: drop it immediately
              // rather than dispatching a stale event the reducer would ignore.
              audio.recorder.revoke(cmd.attemptId);
              return;
            }
            setPlayback({
              attemptId: clip.attemptId,
              url: clip.url,
              durationMs: clip.durationMs,
            });
            dispatch({
              type: "RECORDING_READY",
              attemptId: clip.attemptId,
              now: monotonic.now(),
            });
          })();
          break;
        }
        case "RUN_ANALYSIS": {
          if (!audio) break;
          void (async () => {
            const clip = audio.recorder.getClip(cmd.attemptId);
            if (!clip) return;
            try {
              const buffer = await clip.blob.arrayBuffer();
              const decoded = await audio.decoder.decode(buffer);
              pcmCacheRef.current = {
                attemptId: cmd.attemptId,
                pcm: decoded.pcm,
                sampleRate: decoded.sampleRate,
              };
              const metrics = computeAudioMetrics({
                pcm: decoded.pcm,
                sampleRate: decoded.sampleRate,
                durationMs: decoded.durationMs,
              });
              dispatch({
                type: "METRICS_READY",
                attemptId: cmd.attemptId,
                metrics,
                now: monotonic.now(),
              });
            } catch (err) {
              setAudioIssue(
                isAudioError(err) ? err.code : "AUDIO_ANALYSIS_FAILED",
              );
              // The typed/self-review path is the universal fallback for every
              // failure row; the reducer no-ops if the learner already moved on.
              dispatch({
                type: "START_TYPED_REVIEW",
                attemptId: cmd.attemptId,
                now: monotonic.now(),
              });
            }
          })();
          break;
        }
        case "START_TRANSCRIPTION": {
          if (!audio) break;
          void (async () => {
            const input = await ensurePcm(cmd.attemptId);
            if (!input) {
              dispatch({
                type: "TRANSCRIPTION_UNAVAILABLE",
                attemptId: cmd.attemptId,
                reason: "ERROR",
                now: monotonic.now(),
              });
              return;
            }
            const current = stateRef.current;
            const stillRequested =
              (current.name === "PROCESSING" || current.name === "VIVA_PROCESSING") &&
              current.attempt.attemptId === cmd.attemptId &&
              current.transcription === "RUNNING";
            if (!stillRequested) return;
            const session = audio.transcription.transcribe(input, (event) => {
              if (event.type === "progress") {
                setTranscriptionProgress(event.progress);
                return;
              }
              if (transcriptionSessionRef.current === session) {
                transcriptionSessionRef.current = null;
              }
              setTranscriptionProgress(null);
              if (event.type === "done") {
                dispatch({
                  type: "TRANSCRIPT_READY",
                  attemptId: cmd.attemptId,
                  draft: event.draft,
                  now: monotonic.now(),
                });
              } else {
                dispatch({
                  type: "TRANSCRIPTION_UNAVAILABLE",
                  attemptId: cmd.attemptId,
                  reason: event.reason,
                  now: monotonic.now(),
                });
              }
            });
            transcriptionSessionRef.current = session;
          })();
          break;
        }
        case "CANCEL_TRANSCRIPTION": {
          transcriptionSessionRef.current?.cancel();
          transcriptionSessionRef.current = null;
          setTranscriptionProgress(null);
          break;
        }
        case "REVOKE_RECORDING": {
          if (!audio) break;
          audio.recorder.revoke(cmd.attemptId);
          if (pcmCacheRef.current?.attemptId === cmd.attemptId) {
            pcmCacheRef.current = null;
          }
          setPlayback((prev) => (prev?.attemptId === cmd.attemptId ? null : prev));
          break;
        }
      }
    },
    [
      pack,
      settings,
      random,
      bagStore,
      monotonic,
      audio,
      ensurePcm,
      dispatch,
      startDeadline,
      stopDeadline,
      focusView,
      drawDelayMs,
    ],
  );

  // Drain queued commands after each render.
  useEffect(() => {
    const cmds = pendingCommands.current;
    pendingCommands.current = [];
    for (const cmd of cmds) runCommand(cmd);
  });

  useEffect(
    () => () => {
      stopDeadline();
      for (const timerId of pendingDrawTimersRef.current) {
        window.clearTimeout(timerId);
      }
      pendingDrawTimersRef.current.clear();
    },
    [stopDeadline],
  );

  // Session teardown: release the microphone and terminate the worker — on
  // unmount only. The deps object may be rebuilt each render by the caller, so
  // this must not key off `audio` identity or every render would release the mic.
  const audioRef = useRef(audio);
  const embeddingRef = useRef(embedding);
  useEffect(() => {
    audioRef.current = audio;
  }, [audio]);
  useEffect(() => {
    embeddingRef.current = embedding;
  }, [embedding]);
  useEffect(
    () => () => {
      audioRef.current?.recorder.release();
      audioRef.current?.transcription.dispose();
      embeddingRef.current?.dispose();
    },
    [],
  );

  // Cancel any in-flight semantic refinement when the learner leaves a coverage
  // view (main REVIEW or a viva answer review) or opts out of semantic coverage.
  const inCoverageView =
    state.name === "REVIEW" || state.name === "VIVA_ANSWER_REVIEW";
  useEffect(() => {
    if (!inCoverageView || !settings.semanticCoverage) {
      embeddingSessionRef.current?.cancel();
      embeddingSessionRef.current = null;
    }
  }, [inCoverageView, settings.semanticCoverage]);

  // Persist only learner-approved, privacy-minimized review metadata and only
  // after the learner explicitly enables the private learning plan.
  useEffect(() => {
    if (!settings.practiceHistory || !historyStore) {
      return;
    }
    if (state.name !== "REVIEW") {
      return;
    }

    const coverage = toPersistedCoverage(state.coverage);
    const payloadKey = JSON.stringify([
      state.attempt.attemptId,
      coverage.scoring.method,
      coverage.scoring.version,
      coverage.hitCount,
      coverage.totalCount,
      coverage.weightedFraction,
    ]);
    if (lastHistoryPayloadRef.current === payloadKey) return;
    lastHistoryPayloadRef.current = payloadKey;
    let cancelled = false;

    const persist = async () => {
      if (!cancelled) setHistorySaveState("SAVING");
      const fp = topicFingerprint(state.attempt.topicRef);
      const existing = await historyStore.loadTopic(fp);
      const previous = latestRecord(
        existing.filter(
          (record) => record.attemptId !== state.attempt.attemptId && record.schedule !== null,
        ),
      );
      const quality = coverageToQuality(coverage);
      const reviewedAt = state.transcript.approvedAt;
      const schedule =
        quality === null
          ? null
          : scheduleReview(previous?.schedule ?? null, quality, new Date(reviewedAt));
      await historyStore.append({
        schemaVersion: 1,
        attemptId: state.attempt.attemptId,
        topicFingerprint: fp,
        topicRef: state.attempt.topicRef,
        mode: state.attempt.mode,
        challenge: state.attempt.challenge,
        attemptIndex: state.attempt.attemptIndex,
        reviewedAt,
        coverage,
        schedule,
      });
      const storageMode = await historyStore.storageMode();
      if (!cancelled) {
        setHistorySaveState(storageMode === "DEVICE" ? "SAVED" : "SAVED_SESSION");
        onHistoryChanged?.();
      }
    };

    void persist().catch(() => {
      if (!cancelled) {
        lastHistoryPayloadRef.current = null;
        setHistorySaveState("ERROR");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [historyStore, onHistoryChanged, settings.practiceHistory, state]);

  // --- Actions ---

  const now = useCallback(() => monotonic.now(), [monotonic]);

  const spin = useCallback(() => {
    dispatch({ type: "SPIN", requestId: newRequestId(), now: now() });
  }, [dispatch, now]);

  const spinAgain = useCallback(() => {
    dispatch({ type: "SPIN_AGAIN", requestId: newRequestId(), now: now() });
  }, [dispatch, now]);

  const practiceTopic = useCallback(
    (ref: TopicSnapshot["topicRef"]): boolean => {
      const current = stateRef.current;
      if (
        current.name !== "IDLE" ||
        ref.packId !== pack.packId ||
        ref.packVersion !== pack.version
      ) {
        return false;
      }
      const found = findVariant(pack, ref.variantId);
      if (
        !found ||
        found.subject.subjectId !== ref.subjectId ||
        found.topic.topicId !== ref.topicId ||
        found.variant.promptId !== ref.promptId ||
        found.variant.rubricId !== ref.rubricId ||
        found.variant.difficultyProfileVersion !== ref.difficultyProfileVersion ||
        (found.variant.mode !== "RECALL_SPRINT" && found.variant.mode !== "DEEP_RESEARCH")
      ) {
        return false;
      }
      const topic = toTopicSnapshot(pack, found.variant, found.topic, found.subject, {
        speakingSeconds: settings.speakingSeconds,
        researchSeconds: settings.researchSeconds,
      });
      const selection: PracticeSelection = {
        mode: topic.mode,
        challenge: topic.challenge,
        subjectId: found.subject.subjectId,
        register: "EXAMINER",
      };
      dispatch({
        type: "RESURFACE_TOPIC",
        requestId: newRequestId(),
        selection,
        topic,
        now: now(),
      });
      return true;
    },
    [dispatch, now, pack, settings.researchSeconds, settings.speakingSeconds],
  );

  const startResearch = useCallback(() => {
    dispatch({ type: "START_RESEARCH", now: now() });
  }, [dispatch, now]);

  const doneResearching = useCallback(() => {
    const s = stateRef.current;
    if (s.name === "RESEARCHING") {
      dispatch({ type: "DONE_RESEARCHING", requestId: s.requestId, now: now() });
    }
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

  // --- v0.3 audio actions ---

  const beginAudioOptIn = useCallback(() => {
    if (!audio || audioStatus !== "OFF") return;
    const current = stateRef.current;
    if (
      current.name !== "TOPIC_READY" &&
      current.name !== "READY_TO_SPEAK" &&
      current.name !== "VIVA_ASKING"
    ) {
      return;
    }
    setAudioStatus("PRIMER");
  }, [audio, audioStatus]);

  const cancelAudioOptIn = useCallback(() => {
    setAudioStatus((previous) =>
      previous === "PRIMER" || previous === "READY" ? "OFF" : previous,
    );
  }, []);

  const confirmAudioOptIn = useCallback(() => {
    if (!audio || audioStatus !== "PRIMER") return;
    // Consent is remembered for this page session, but the browser stream is
    // acquired only when the learner starts the speaking clock.
    setAudioStatus("READY");
    setAudioIssue(null);
  }, [audio, audioStatus]);

  const startSpeaking = useCallback(
    async (eventType: "START_TIMER" | "CONFIRM_READY"): Promise<boolean> => {
      const before = stateRef.current;
      const canStart =
        (eventType === "START_TIMER" && before.name === "TOPIC_READY") ||
        (eventType === "CONFIRM_READY" && before.name === "READY_TO_SPEAK");
      if (!canStart || audioStartPendingRef.current) return false;
      if (audio && (audioStatus === "PRIMER" || audioStatus === "STARTING")) {
        return false;
      }

      const attemptId = before.attempt.attemptId;
      const sendStartEvent = () => {
        dispatch({ type: eventType, now: now() });
      };
      if (!audio || audioStatus !== "READY") {
        sendStartEvent();
        return true;
      }

      audioStartPendingRef.current = true;
      setAudioStatus("STARTING");
      try {
        await audio.recorder.arm();
        const current = stateRef.current;
        const stillCurrent =
          "attempt" in current &&
          current.attempt.attemptId === attemptId &&
          ((eventType === "START_TIMER" && current.name === "TOPIC_READY") ||
            (eventType === "CONFIRM_READY" && current.name === "READY_TO_SPEAK"));
        if (!stillCurrent) {
          audio.recorder.release();
          setAudioStatus("READY");
          return false;
        }
        setAudioArmed(true);
        reducerDepsRef.current = {
          ...reducerDepsRef.current,
          audioArmed: true,
        };
        sendStartEvent();
        return true;
      } catch (err) {
        setAudioArmed(false);
        reducerDepsRef.current = {
          ...reducerDepsRef.current,
          audioArmed: false,
        };
        setAudioStatus("UNAVAILABLE");
        setAudioIssue(
          isAudioError(err) ? err.code : "AUDIO_MIC_UNAVAILABLE",
        );
        // Permission or codec failure never blocks practice.
        sendStartEvent();
        return true;
      } finally {
        audioStartPendingRef.current = false;
      }
    },
    [audio, audioStatus, dispatch, now],
  );

  const startTimer = useCallback(
    () => startSpeaking("START_TIMER"),
    [startSpeaking],
  );

  const confirmReady = useCallback(
    () => startSpeaking("CONFIRM_READY"),
    [startSpeaking],
  );

  const currentAttemptId = useCallback((): string | null => {
    const s = stateRef.current;
    return "attempt" in s ? s.attempt.attemptId : null;
  }, []);

  const requestTranscription = useCallback(() => {
    const attemptId = currentAttemptId();
    const s = stateRef.current;
    if (!attemptId || (s.name !== "PROCESSING" && s.name !== "SELF_REVIEW")) return;
    dispatch({ type: "TRANSCRIBE_REQUESTED", attemptId, now: now() });
  }, [currentAttemptId, dispatch, now]);

  const declineTranscription = useCallback(() => {
    const s = stateRef.current;
    if (s.name !== "PROCESSING") return;
    dispatch({
      type: "TRANSCRIPTION_UNAVAILABLE",
      attemptId: s.attempt.attemptId,
      reason: "DECLINED",
      now: now(),
    });
  }, [dispatch, now]);

  const startTypedReview = useCallback(() => {
    const attemptId = currentAttemptId();
    if (!attemptId) return;
    dispatch({ type: "START_TYPED_REVIEW", attemptId, now: now() });
  }, [currentAttemptId, dispatch, now]);

  // v0.5: supplement lexical coverage with possible meaning-match evidence. The
  // lexical score remains authoritative; an unavailable semantic pass is a no-op.
  // v0.6: also refines a viva defense answer (VIVA_ANSWER_REVIEW), dispatching
  // VIVA_COVERAGE_REFINED with no Refinement Delta (viva has no retry delta).
  const requestSemanticRefinement = useCallback(
    (
      attemptId: string,
      text: string,
      concepts: readonly Concept[],
      baseline: CoverageReport,
      rubricCacheKey: string,
      mode: "REVIEW" | "VIVA" = "REVIEW",
    ) => {
      if (!embedding || !settings.semanticCoverage) return;
      const segmentTexts = segmentTranscript(text);
      if (segmentTexts.length === 0 || concepts.length === 0) return;
      const rubricTexts = concepts.map((concept) => ({
        conceptId: concept.conceptId,
        texts: [...new Set([concept.label, ...concept.acceptedPhrases])],
      }));
      const cachedRubricEmbeddings = rubricEmbeddingCacheRef.current.get(rubricCacheKey);
      const texts = [
        ...segmentTexts,
        ...(cachedRubricEmbeddings ? [] : rubricTexts.flatMap((entry) => entry.texts)),
      ];
      setSemanticRefining(true);
      const session = embedding.embed({ attemptId, texts }, (event) => {
        if (event.type !== "done") {
          if (event.type === "unavailable" && embeddingSessionRef.current === session) {
            embeddingSessionRef.current = null;
            setSemanticRefining(false);
          }
          return;
        }
        if (embeddingSessionRef.current === session) embeddingSessionRef.current = null;
        setSemanticRefining(false);
        const segments: TextEmbedding[] = segmentTexts.map((segmentText, index) => ({
          text: segmentText,
          embedding: event.embeddings[index] ?? [],
        }));
        let offset = segmentTexts.length;
        const conceptEmbeddings: ConceptEmbeddings[] =
          cachedRubricEmbeddings ??
          rubricTexts.map((entry) => {
            const rubricEmbeddings = entry.texts.map((rubricText, index) => ({
              text: rubricText,
              embedding: event.embeddings[offset + index] ?? [],
            }));
            offset += entry.texts.length;
            return { conceptId: entry.conceptId, rubricEmbeddings };
          });
        if (!cachedRubricEmbeddings) {
          const cache = rubricEmbeddingCacheRef.current;
          cache.set(rubricCacheKey, conceptEmbeddings);
          if (cache.size > 8) cache.delete(cache.keys().next().value as string);
        }
        const refined = semanticCoverage({
          baseline,
          segments,
          concepts,
          embeddings: conceptEmbeddings,
        });
        const current = stateRef.current;
        if (mode === "VIVA") {
          if (current.name !== "VIVA_ANSWER_REVIEW" || current.attempt.attemptId !== attemptId) {
            return;
          }
          dispatch({
            type: "VIVA_COVERAGE_REFINED",
            attemptId,
            coverage: refined,
            now: now(),
          });
          return;
        }
        if (current.name !== "REVIEW" || current.attempt.attemptId !== attemptId) return;
        const prior = current.attempt.history.at(-1);
        const currentEntry = toAttemptHistoryEntry(
          current.attempt,
          refined,
          current.transcript.text,
        );
        dispatch({
          type: "COVERAGE_REFINED",
          attemptId,
          coverage: refined,
          refinementDelta: prior ? refinementDelta(prior, currentEntry) : null,
          now: now(),
        });
      });
      embeddingSessionRef.current = session;
    },
    [embedding, settings.semanticCoverage, dispatch, now],
  );

  const approveTranscript = useCallback(
    (text: string) => {
      const s = stateRef.current;
      if (s.name !== "TRANSCRIPT_REVIEW") return;
      const transcript: ApprovedTranscript = {
        rawText: s.draft.text,
        text,
        approvedAt: wall.isoNow(),
        wasEdited: text !== s.draft.text,
      };
      // Text metrics are computed here (not in the reducer) so the reducer
      // stays pure; audio-derived metrics were final at METRICS_READY.
      const textMetrics = computeTextMetrics({
        text,
        spokenMs: s.metrics.spokenMs,
      });
      const coverage = scoreCoverage(text, findRubric(pack, s.topic.topicRef)?.concepts ?? []);
      const concepts = findRubric(pack, s.topic.topicRef)?.concepts ?? [];
      const attemptId = s.attempt.attemptId;
      const rubricCacheKey = [
        pack.packId,
        pack.version,
        s.topic.topicRef.variantId,
        s.topic.topicRef.rubricId,
        EMBEDDING_MODEL.version,
      ].join(":");
      const prior = s.attempt.history.at(-1);
      const currentEntry = toAttemptHistoryEntry(s.attempt, coverage, text);
      dispatch({
        type: "TRANSCRIPT_APPROVED",
        attemptId,
        transcript,
        textMetrics,
        coverage,
        refinementDelta: prior ? refinementDelta(prior, currentEntry) : null,
        now: now(),
      });
      requestSemanticRefinement(attemptId, text, concepts, coverage, rubricCacheKey);
    },
    [wall, pack, dispatch, now, requestSemanticRefinement],
  );

  const submitSelfReview = useCallback(
    (text: string) => {
      const s = stateRef.current;
      if (s.name !== "SELF_REVIEW") return;
      const transcript: ApprovedTranscript = {
        text,
        approvedAt: wall.isoNow(),
        wasEdited: false,
      };
      const textMetrics = computeTextMetrics({
        text,
        spokenMs: s.metrics?.spokenMs,
      });
      const coverage = scoreCoverage(text, findRubric(pack, s.topic.topicRef)?.concepts ?? []);
      const concepts = findRubric(pack, s.topic.topicRef)?.concepts ?? [];
      const attemptId = s.attempt.attemptId;
      const rubricCacheKey = [
        pack.packId,
        pack.version,
        s.topic.topicRef.variantId,
        s.topic.topicRef.rubricId,
        EMBEDDING_MODEL.version,
      ].join(":");
      const prior = s.attempt.history.at(-1);
      const currentEntry = toAttemptHistoryEntry(s.attempt, coverage, text);
      dispatch({
        type: "SELF_REVIEW_DONE",
        attemptId,
        transcript,
        textMetrics,
        coverage,
        refinementDelta: prior ? refinementDelta(prior, currentEntry) : null,
        now: now(),
      });
      requestSemanticRefinement(attemptId, text, concepts, coverage, rubricCacheKey);
    },
    [wall, pack, dispatch, now, requestSemanticRefinement],
  );

  const startSecondAttempt = useCallback(() => {
    const s = stateRef.current;
    if (s.name !== "REVIEW") return;
    dispatch({ type: "START_SECOND_ATTEMPT", requestId: newRequestId(), now: now() });
  }, [dispatch, now]);

  // --- v0.6 viva defense-ladder actions ---

  /** Resolve the current viva question's target concepts from the variant rubric. */
  const vivaTargetConcepts = useCallback(
    (question: { targetConceptIds: readonly string[] }): readonly Concept[] => {
      const s = stateRef.current;
      if (!("topic" in s)) return [];
      const concepts = findRubric(pack, s.topic.topicRef)?.concepts ?? [];
      const wanted = new Set(question.targetConceptIds);
      return concepts.filter((c) => wanted.has(c.conceptId));
    },
    [pack],
  );

  const startViva = useCallback(() => {
    const s = stateRef.current;
    if (s.name !== "REVIEW") return;
    if (s.topic.vivaQuestions.length === 0) return;
    dispatch({ type: "START_VIVA", requestId: newRequestId(), now: now() });
  }, [dispatch, now]);

  const beginVivaQuestion = useCallback(() => {
    const s = stateRef.current;
    if (s.name !== "VIVA_READY") return;
    dispatch({ type: "BEGIN_VIVA_QUESTION", attemptId: s.attempt.attemptId, now: now() });
  }, [dispatch, now]);

  const startVivaSpeaking = useCallback(async (): Promise<boolean> => {
    const before = stateRef.current;
    if (before.name !== "VIVA_ASKING" || audioStartPendingRef.current) return false;
    if (audio && (audioStatus === "PRIMER" || audioStatus === "STARTING")) {
      return false;
    }
    const attemptId = before.attempt.attemptId;
    if (!audio || audioStatus !== "READY") {
      dispatch({ type: "START_VIVA_SPEAKING", now: now() });
      return true;
    }
    audioStartPendingRef.current = true;
    setAudioStatus("STARTING");
    try {
      await audio.recorder.arm();
      const current = stateRef.current;
      const stillCurrent =
        current.name === "VIVA_ASKING" &&
        "attempt" in current &&
        current.attempt.attemptId === attemptId;
      if (!stillCurrent) {
        audio.recorder.release();
        setAudioStatus("READY");
        return false;
      }
      setAudioArmed(true);
      reducerDepsRef.current = { ...reducerDepsRef.current, audioArmed: true };
      dispatch({ type: "START_VIVA_SPEAKING", now: now() });
      return true;
    } catch (err) {
      setAudioArmed(false);
      reducerDepsRef.current = { ...reducerDepsRef.current, audioArmed: false };
      setAudioStatus("UNAVAILABLE");
      setAudioIssue(isAudioError(err) ? err.code : "AUDIO_MIC_UNAVAILABLE");
      dispatch({ type: "START_VIVA_SPEAKING", now: now() });
      return true;
    } finally {
      audioStartPendingRef.current = false;
    }
  }, [audio, audioStatus, dispatch, now]);

  const vivaRubricCacheKey = useCallback(
    (questionId: string): string => {
      const s = stateRef.current;
      if (!("topic" in s)) return questionId;
      return [
        pack.packId,
        pack.version,
        s.topic.topicRef.variantId,
        s.topic.topicRef.rubricId,
        questionId,
        EMBEDDING_MODEL.version,
      ].join(":");
    },
    [pack],
  );

  const approveVivaTranscript = useCallback(
    (text: string) => {
      const s = stateRef.current;
      if (s.name !== "VIVA_TRANSCRIPT_REVIEW") return;
      const question = s.viva.questions[s.viva.index];
      if (!question) return;
      const targets = vivaTargetConcepts(question);
      const transcript: ApprovedTranscript = {
        rawText: s.draft.text,
        text,
        approvedAt: wall.isoNow(),
        wasEdited: text !== s.draft.text,
      };
      const textMetrics = computeTextMetrics({ text, spokenMs: s.metrics.spokenMs });
      const coverage = scoreCoverage(text, targets);
      const attemptId = s.attempt.attemptId;
      dispatch({
        type: "APPROVE_VIVA_TRANSCRIPT",
        attemptId,
        transcript,
        textMetrics,
        coverage,
        now: now(),
      });
      requestSemanticRefinement(
        attemptId,
        text,
        targets,
        coverage,
        vivaRubricCacheKey(question.id),
        "VIVA",
      );
    },
    [wall, dispatch, now, requestSemanticRefinement, vivaTargetConcepts, vivaRubricCacheKey],
  );

  const submitVivaSelfReview = useCallback(
    (text: string) => {
      const s = stateRef.current;
      if (s.name !== "VIVA_SELF_REVIEW") return;
      const question = s.viva.questions[s.viva.index];
      if (!question) return;
      const targets = vivaTargetConcepts(question);
      const transcript: ApprovedTranscript = {
        text,
        approvedAt: wall.isoNow(),
        wasEdited: false,
      };
      const textMetrics = computeTextMetrics({ text, spokenMs: s.metrics?.spokenMs });
      const coverage = scoreCoverage(text, targets);
      const attemptId = s.attempt.attemptId;
      dispatch({
        type: "VIVA_SELF_REVIEW_DONE",
        attemptId,
        transcript,
        textMetrics,
        coverage,
        now: now(),
      });
      requestSemanticRefinement(
        attemptId,
        text,
        targets,
        coverage,
        vivaRubricCacheKey(question.id),
        "VIVA",
      );
    },
    [wall, dispatch, now, requestSemanticRefinement, vivaTargetConcepts, vivaRubricCacheKey],
  );

  const requestVivaTranscription = useCallback(() => {
    const s = stateRef.current;
    if (s.name !== "VIVA_PROCESSING" && s.name !== "VIVA_SELF_REVIEW") return;
    dispatch({ type: "TRANSCRIBE_REQUESTED", attemptId: s.attempt.attemptId, now: now() });
  }, [dispatch, now]);

  const declineVivaTranscription = useCallback(() => {
    const s = stateRef.current;
    if (s.name !== "VIVA_PROCESSING") return;
    dispatch({
      type: "TRANSCRIPTION_UNAVAILABLE",
      attemptId: s.attempt.attemptId,
      reason: "DECLINED",
      now: now(),
    });
  }, [dispatch, now]);

  const startVivaTypedReview = useCallback(() => {
    const s = stateRef.current;
    if (
      s.name !== "VIVA_ATTEMPT_COMPLETE" &&
      s.name !== "VIVA_PROCESSING" &&
      s.name !== "VIVA_TRANSCRIPT_REVIEW"
    ) {
      return;
    }
    dispatch({ type: "START_TYPED_REVIEW", attemptId: s.attempt.attemptId, now: now() });
  }, [dispatch, now]);

  const nextVivaQuestion = useCallback(() => {
    const s = stateRef.current;
    if (s.name !== "VIVA_ANSWER_REVIEW") return;
    dispatch({ type: "NEXT_VIVA_QUESTION", attemptId: s.attempt.attemptId, now: now() });
  }, [dispatch, now]);

  const exitViva = useCallback(() => {
    const s = stateRef.current;
    const vivaNames = [
      "VIVA_READY",
      "VIVA_ASKING",
      "VIVA_SPEAKING",
      "VIVA_ATTEMPT_COMPLETE",
      "VIVA_PROCESSING",
      "VIVA_TRANSCRIPT_REVIEW",
      "VIVA_SELF_REVIEW",
      "VIVA_ANSWER_REVIEW",
      "VIVA_COMPLETE",
    ] as const;
    if (!vivaNames.includes(s.name as (typeof vivaNames)[number])) return;
    dispatch({ type: "EXIT_VIVA", now: now() });
  }, [dispatch, now]);

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

  const audioUi: AudioUiState = {
    available: audio != null,
    status: audioStatus,
    armed: audioArmed,
    issue: audioIssue,
    playback,
    transcriptionProgress,
  };
  return {
    state,
    now: renderNow,
    subjects,
    presets,
    challengeVisible,
    eligibleCount,
    audio: audioUi,
    semanticRefining: semanticRefining && inCoverageView,
    historySaveState: !settings.practiceHistory
      ? "OFF"
      : historyStore
        ? historySaveState
        : "ERROR",
    actions: {
      spin,
      spinAgain,
      practiceTopic,
      startTimer,
      startResearch,
      doneResearching,
      confirmReady,
      closeTimer,
      setSelection,
      beginAudioOptIn,
      cancelAudioOptIn,
      confirmAudioOptIn,
      requestTranscription,
      declineTranscription,
      startTypedReview,
      approveTranscript,
      submitSelfReview,
      startSecondAttempt,
      startViva,
      beginVivaQuestion,
      startVivaSpeaking,
      approveVivaTranscript,
      submitVivaSelfReview,
      requestVivaTranscription,
      declineVivaTranscription,
      startVivaTypedReview,
      nextVivaQuestion,
      exitViva,
    },
  };
}

export type { V02PracticeMode };
