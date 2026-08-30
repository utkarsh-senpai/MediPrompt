import { useCallback, useEffect, useRef, useState } from "react";
import { reduceSession, initialState, findVariant, toTopicSnapshot } from "./sessionReducer";
import { draw } from "./shuffledBag";
import { isElapsed } from "./deadlineTimer";
import { listSubjects, presetsFor, eligibleVariantIds } from "@/content/packQuery";
import { isAudioError } from "@/audio/audioErrors";
import type { AudioDecoder } from "@/audio/pcmDecode";
import type { AttemptRecorder } from "@/audio/recorder";
import { computeAudioMetrics, computeTextMetrics } from "@/audio/deliveryMetrics";
import type {
  TranscriptionClient,
  TranscriptionSession,
} from "@/speech/transcriptionClient";
import type {
  ApprovedTranscript,
  AudioErrorCode,
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
}

/** Microphone opt-in lifecycle; the no-audio path is first-class, not an error. */
export type AudioOptInStatus = "OFF" | "PRIMER" | "ARMING" | "ARMED" | "UNAVAILABLE";

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
  const { pack, settings, monotonic, wall, random, bagStore, audio } = deps;

  const [state, setState] = useState<SessionState>(() =>
    initialState(initialSelection(pack)),
  );
  const [renderNow, setRenderNow] = useState(() => monotonic.now());

  const pendingCommands = useRef<Command[]>([]);
  const stateRef = useRef(state);

  const timerRef = useRef<number | null>(null);
  const deadlineRef = useRef<{ deadlineAt: number; requestId: string } | null>(null);
  const lastDrawnRef = useRef<Map<string, string>>(new Map());
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
      document.getElementById(id)?.focus();
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

        // --- v0.3 audio commands ---
        case "START_RECORDING": {
          if (!audio) break;
          try {
            audio.recorder.start();
            setAudioIssue(null);
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
    ],
  );

  // Drain queued commands after each render.
  useEffect(() => {
    const cmds = pendingCommands.current;
    pendingCommands.current = [];
    for (const cmd of cmds) runCommand(cmd);
  });

  useEffect(() => () => stopDeadline(), [stopDeadline]);

  // Session teardown: release the microphone and terminate the worker — on
  // unmount only. The deps object may be rebuilt each render by the caller, so
  // this must not key off `audio` identity or every render would release the mic.
  const audioRef = useRef(audio);
  useEffect(() => {
    audioRef.current = audio;
  }, [audio]);
  useEffect(
    () => () => {
      audioRef.current?.recorder.release();
      audioRef.current?.transcription.dispose();
    },
    [],
  );

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

  // --- v0.3 audio actions ---

  const beginAudioOptIn = useCallback(() => {
    if (!audio || audioStatus !== "OFF") return;
    setAudioStatus("PRIMER");
  }, [audio, audioStatus]);

  const cancelAudioOptIn = useCallback(() => {
    setAudioStatus((prev) => (prev === "PRIMER" ? "OFF" : prev));
  }, []);

  const confirmAudioOptIn = useCallback(() => {
    if (!audio) return;
    setAudioStatus("ARMING");
    void (async () => {
      try {
        await audio.recorder.arm();
        setAudioArmed(true);
        setAudioStatus("ARMED");
        setAudioIssue(null);
      } catch (err) {
        setAudioArmed(false);
        setAudioStatus("UNAVAILABLE");
        setAudioIssue(
          isAudioError(err) ? err.code : "AUDIO_MIC_UNAVAILABLE",
        );
      }
    })();
  }, [audio]);

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
      dispatch({
        type: "TRANSCRIPT_APPROVED",
        attemptId: s.attempt.attemptId,
        transcript,
        textMetrics,
        now: now(),
      });
    },
    [wall, dispatch, now],
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
      dispatch({
        type: "SELF_REVIEW_DONE",
        attemptId: s.attempt.attemptId,
        transcript,
        textMetrics,
        now: now(),
      });
    },
    [wall, dispatch, now],
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
    },
  };
}

export type { V02PracticeMode };
