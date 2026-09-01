import { useCallback, useEffect, useRef, useState } from "react";
import { reduceSession, initialState, findVariant, toTopicSnapshot } from "./sessionReducer";
import { draw } from "./shuffledBag";
import { isElapsed } from "./deadlineTimer";
import { listSubjects, presetsFor, eligibleVariantIds, findRubric } from "@/content/packQuery";
import { isAudioError } from "@/audio/audioErrors";
import { scoreCoverage } from "@/scoring/coverage";
import { gapScore } from "@/scoring/gapScore";
import type { AudioDecoder } from "@/audio/pcmDecode";
import type { AttemptRecorder } from "@/audio/recorder";
import { computeAudioMetrics, computeTextMetrics } from "@/audio/deliveryMetrics";
import type {
  TranscriptionClient,
  TranscriptionSession,
} from "@/speech/transcriptionClient";
import type { EmbeddingClient, EmbeddingSession } from "@/scoring/embeddingClient";
import { semanticCoverage, type ConceptEmbeddings } from "@/scoring/semanticCoverage";
import type {
  ApprovedTranscript,
  AudioErrorCode,
  BagStore,
  ChallengePreset,
  Command,
  Concept,
  CoverageReport,
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
  const { pack, settings, monotonic, wall, random, bagStore, audio, embedding, drawDelayMs } = deps;

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
  const pcmCacheRef = useRef<{
    attemptId: string;
    pcm: Float32Array;
    sampleRate: number;
  } | null>(null);
  const transcriptionSessionRef = useRef<TranscriptionSession | null>(null);
  const embeddingSessionRef = useRef<EmbeddingSession | null>(null);
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

  const focusView = useCallback(
    (target: "topic" | "speaking" | "complete" | "processing" | "review") => {
      const ids: Record<typeof target, string> = {
        topic: "topic-heading",
        speaking: "speaking-heading",
        complete: "complete-heading",
        processing: "processing-heading",
        review: "review-heading",
      };
      const id = ids[target];
      // Commands are drained from an effect after React commits the target view,
      // so the heading already exists. Focusing here avoids an extra-frame race
      // on slower devices and CI while preserving the visible transition.
      const heading = document.getElementById(id);
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

  // Cancel any in-flight semantic refinement when the learner leaves the review screen.
  useEffect(() => {
    if (state.name !== "REVIEW") {
      embeddingSessionRef.current?.cancel();
      embeddingSessionRef.current = null;
    }
  }, [state.name]);

  // --- Actions ---

  const now = useCallback(() => monotonic.now(), [monotonic]);

  const spin = useCallback(() => {
    dispatch({ type: "SPIN", requestId: newRequestId(), now: now() });
  }, [dispatch, now]);

  const spinAgain = useCallback(() => {
    dispatch({ type: "SPIN_AGAIN", requestId: newRequestId(), now: now() });
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
    if (current.name !== "TOPIC_READY" && current.name !== "READY_TO_SPEAK") return;
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

  // v0.5: refine the lexical coverage with a semantic pass. The lexical score is
  // already shown; this silently replaces it when the embedding model succeeds.
  // Any unavailable/timeout/cancel path is a no-op — the learner keeps the lexical score.
  const requestSemanticRefinement = useCallback(
    (
      attemptId: string,
      text: string,
      concepts: readonly Concept[],
      priorCoverage: CoverageReport | null,
    ) => {
      if (!embedding || !settings.semanticCoverage) return;
      if (text.trim().length === 0 || concepts.length === 0) return;
      const texts = [text, ...concepts.flatMap((c) => c.acceptedPhrases)];
      const session = embedding.embed({ attemptId, texts }, (event) => {
        if (event.type !== "done") {
          if (event.type === "unavailable" && embeddingSessionRef.current === session) {
            embeddingSessionRef.current = null;
          }
          return;
        }
        if (embeddingSessionRef.current === session) embeddingSessionRef.current = null;
        let offset = 1;
        const conceptEmbeddings: ConceptEmbeddings[] = concepts.map((c) => {
          const phraseEmbeddings = c.acceptedPhrases.map(
            (_, i) => event.embeddings[offset + i] ?? [],
          );
          offset += c.acceptedPhrases.length;
          return { conceptId: c.conceptId, phraseEmbeddings };
        });
        const refined = semanticCoverage({
          transcriptEmbedding: event.embeddings[0] ?? [],
          concepts,
          embeddings: conceptEmbeddings,
        });
        const current = stateRef.current;
        if (current.name !== "REVIEW" || current.attempt.attemptId !== attemptId) return;
        const gap = gapScore(priorCoverage, refined);
        dispatch({
          type: "COVERAGE_REFINED",
          attemptId,
          coverage: refined,
          gapScore: priorCoverage !== null ? gap : null,
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
      const gap = gapScore(s.attempt.priorCoverage, coverage);
      const concepts = findRubric(pack, s.topic.topicRef)?.concepts ?? [];
      const prior = s.attempt.priorCoverage;
      const attemptId = s.attempt.attemptId;
      dispatch({
        type: "TRANSCRIPT_APPROVED",
        attemptId,
        transcript,
        textMetrics,
        coverage,
        priorCoverage: prior,
        gapScore: prior !== null ? gap : null,
        now: now(),
      });
      requestSemanticRefinement(attemptId, text, concepts, prior);
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
      const gap = gapScore(s.attempt.priorCoverage, coverage);
      const concepts = findRubric(pack, s.topic.topicRef)?.concepts ?? [];
      const prior = s.attempt.priorCoverage;
      const attemptId = s.attempt.attemptId;
      dispatch({
        type: "SELF_REVIEW_DONE",
        attemptId,
        transcript,
        textMetrics,
        coverage,
        priorCoverage: prior,
        gapScore: prior !== null ? gap : null,
        now: now(),
      });
      requestSemanticRefinement(attemptId, text, concepts, prior);
    },
    [wall, pack, dispatch, now, requestSemanticRefinement],
  );

  const startSecondAttempt = useCallback(() => {
    const s = stateRef.current;
    if (s.name !== "REVIEW") return;
    dispatch({ type: "START_SECOND_ATTEMPT", requestId: newRequestId(), now: now() });
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
    actions: {
      spin,
      spinAgain,
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
    },
  };
}

export type { V02PracticeMode };
