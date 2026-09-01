import { eligibleVariantIds, toTopicSnapshot, findVariant } from "@/content/packQuery";
import { fingerprint } from "@/practice/shuffledBag";
import { startDeadline } from "@/practice/deadlineTimer";
import type {
  AttemptDraft,
  ChallengePreset,
  Command,
  PracticeSelection,
  ReducerDeps,
  ReducerResult,
  SessionEvent,
  SessionState,
  TopicSnapshot,
} from "@/practice/types";

/** Bounds session-local transcript/coverage history during repeated practice. */
const MAX_PRIOR_ATTEMPTS = 19;

export function initialState(selection: PracticeSelection): SessionState {
  return { name: "IDLE", selection };
}

function requestDraw(
  selection: PracticeSelection,
  requestId: string,
  deps: ReducerDeps,
): Command {
  const eligible = eligibleVariantIds(
    deps.pack,
    selection.subjectId,
    selection.mode,
    selection.challenge,
  );
  const fp = fingerprint([
    deps.pack.packId,
    deps.pack.version,
    selection.subjectId,
    selection.mode,
    selection.challenge,
  ]);
  return { type: "REQUEST_DRAW", requestId, fingerprint: fp, eligibleVariantIds: eligible };
}

function buildAttempt(
  topic: TopicSnapshot,
  requestId: string,
  deps: ReducerDeps,
): AttemptDraft {
  return {
    sessionId: requestId,
    attemptId: `${requestId}-attempt`,
    topicRef: topic.topicRef,
    mode: topic.mode,
    challenge: topic.challenge,
    supportLevel: topic.supportLevel,
    register: topic.register,
    timePolicy: topic.timePolicy,
    challengeIdentity: topic.challengeIdentity,
    createdAt: deps.nowIso,
    attemptIndex: 1,
    history: [],
  };
}

function deadlineFor(
  now: number,
  seconds: number,
): number {
  // The topic snapshot captures the effective accessibility duration used by
  // the attempt. A settings change after drawing applies to the next topic and
  // cannot change this attempt's identity or countdown denominator.
  return startDeadline(now, seconds * 1000);
}

function noChange(state: SessionState): ReducerResult {
  return { state, commands: [] };
}

export function reduceSession(
  state: SessionState,
  event: SessionEvent,
  deps: ReducerDeps,
): ReducerResult {
  switch (event.type) {
    case "CHANGE_SELECTION": {
      if (state.name === "SPEAKING" || state.name === "RESEARCHING") {
        return noChange(state);
      }
      // Post-attempt states hold a recording (and maybe a running transcription);
      // leaving them releases both. ATTEMPT_COMPLETE only holds one when armed.
      if (
        state.name === "PROCESSING" ||
        state.name === "TRANSCRIPT_REVIEW" ||
        state.name === "SELF_REVIEW" ||
        state.name === "REVIEW"
      ) {
        const commands: Command[] = [];
        if (state.name === "PROCESSING" && state.transcription === "RUNNING") {
          commands.push({ type: "CANCEL_TRANSCRIPTION", attemptId: state.attempt.attemptId });
        }
        commands.push({ type: "REVOKE_RECORDING", attemptId: state.attempt.attemptId });
        return { state: { name: "IDLE", selection: event.selection }, commands };
      }
      if (state.name === "ATTEMPT_COMPLETE") {
        return {
          state: { name: "IDLE", selection: event.selection },
          commands: deps.audioArmed
            ? [{ type: "REVOKE_RECORDING", attemptId: state.attempt.attemptId }]
            : [],
        };
      }
      return { state: { name: "IDLE", selection: event.selection }, commands: [] };
    }

    case "SPIN":
      if (state.name !== "IDLE") return noChange(state);
      return {
        state: { name: "DRAWING", selection: state.selection, requestId: event.requestId },
        commands: [requestDraw(state.selection, event.requestId, deps)],
      };

    case "SPIN_AGAIN": {
      // Spinning again discards the attempt: any recording is revoked and any
      // running transcription cancelled before the next draw.
      const cleanup: Command[] = [];
      switch (state.name) {
        case "TOPIC_READY":
        case "READY_TO_SPEAK":
          break;
        case "ATTEMPT_COMPLETE":
          if (deps.audioArmed) {
            cleanup.push({ type: "REVOKE_RECORDING", attemptId: state.attempt.attemptId });
          }
          break;
        case "PROCESSING":
          if (state.transcription === "RUNNING") {
            cleanup.push({ type: "CANCEL_TRANSCRIPTION", attemptId: state.attempt.attemptId });
          }
          cleanup.push({ type: "REVOKE_RECORDING", attemptId: state.attempt.attemptId });
          break;
        case "TRANSCRIPT_REVIEW":
        case "SELF_REVIEW":
        case "REVIEW":
          cleanup.push({ type: "REVOKE_RECORDING", attemptId: state.attempt.attemptId });
          break;
        default:
          return noChange(state);
      }
      return {
        state: { name: "DRAWING", selection: state.selection, requestId: event.requestId },
        commands: [...cleanup, requestDraw(state.selection, event.requestId, deps)],
      };
    }

    case "TOPIC_DRAWN": {
      if (state.name !== "DRAWING" || state.requestId !== event.requestId) {
        return noChange(state); // stale draw
      }
      const attempt = buildAttempt(event.topic, event.requestId, deps);
      return {
        state: {
          name: "TOPIC_READY",
          selection: state.selection,
          requestId: event.requestId,
          topic: event.topic,
          attempt,
        },
        commands: [{ type: "FOCUS_VIEW", target: "topic" }],
      };
    }

    case "START_TIMER": {
      if (state.name !== "TOPIC_READY" && state.name !== "READY_TO_SPEAK") {
        return noChange(state);
      }
      if (state.selection.mode !== "RECALL_SPRINT" && state.name === "TOPIC_READY") {
        // Deep Research must go through research first; Start timer is only from READY_TO_SPEAK.
        return noChange(state);
      }
      const deadlineAt = deadlineFor(
        event.now,
        state.topic.timePolicy.speakingSeconds,
      );
      const commands: Command[] = [
        { type: "START_DEADLINE", deadlineAt },
        { type: "FOCUS_VIEW", target: "speaking" },
      ];
      if (deps.audioArmed) {
        // Recording arms only with the speaking window; unarmed stays timer-only
        // and no audio object is ever created.
        commands.push({ type: "START_RECORDING", attemptId: state.attempt.attemptId });
      }
      return {
        state: {
          name: "SPEAKING",
          selection: state.selection,
          requestId: state.requestId,
          topic: state.topic,
          attempt: state.attempt,
          deadlineAt,
        },
        commands,
      };
    }

    case "START_RESEARCH": {
      if (state.name !== "TOPIC_READY" || state.selection.mode !== "DEEP_RESEARCH") {
        return noChange(state);
      }
      const researchSeconds = state.topic.timePolicy.researchSeconds;
      if (researchSeconds === undefined) return noChange(state);
      const deadlineAt = deadlineFor(event.now, researchSeconds);
      return {
        state: {
          name: "RESEARCHING",
          selection: state.selection,
          requestId: state.requestId,
          topic: state.topic,
          attempt: state.attempt,
          deadlineAt,
        },
        commands: [
          { type: "START_DEADLINE", deadlineAt },
          { type: "FOCUS_VIEW", target: "speaking" },
        ],
      };
    }

    case "DONE_RESEARCHING": {
      if (
        state.name !== "RESEARCHING" ||
        state.requestId !== event.requestId
      ) {
        return noChange(state);
      }
      return {
        state: {
          name: "READY_TO_SPEAK",
          selection: state.selection,
          requestId: state.requestId,
          topic: state.topic,
          attempt: state.attempt,
        },
        commands: [
          { type: "STOP_DEADLINE" },
          { type: "FOCUS_VIEW", target: "topic" },
        ],
      };
    }

    case "CONFIRM_READY": {
      if (state.name !== "READY_TO_SPEAK") return noChange(state);
      const deadlineAt = deadlineFor(
        event.now,
        state.topic.timePolicy.speakingSeconds,
      );
      const commands: Command[] = [
        { type: "START_DEADLINE", deadlineAt },
        { type: "FOCUS_VIEW", target: "speaking" },
      ];
      if (deps.audioArmed) {
        commands.push({ type: "START_RECORDING", attemptId: state.attempt.attemptId });
      }
      return {
        state: {
          name: "SPEAKING",
          selection: state.selection,
          requestId: state.requestId,
          topic: state.topic,
          attempt: state.attempt,
          deadlineAt,
        },
        commands,
      };
    }

    case "TIMER_ELAPSED": {
      if (
        (state.name !== "SPEAKING" && state.name !== "RESEARCHING") ||
        state.requestId !== event.requestId
      ) {
        return noChange(state);
      }
      if (state.name === "RESEARCHING") {
        return {
          state: {
            name: "READY_TO_SPEAK",
            selection: state.selection,
            requestId: state.requestId,
            topic: state.topic,
            attempt: state.attempt,
          },
          commands: [
            { type: "STOP_DEADLINE" },
            { type: "FOCUS_VIEW", target: "topic" },
          ],
        };
      }
      const commands: Command[] = [
        { type: "STOP_DEADLINE" },
        { type: "FOCUS_VIEW", target: "complete" },
      ];
      if (deps.audioArmed) {
        commands.push({ type: "STOP_RECORDING", attemptId: state.attempt.attemptId });
      }
      return {
        state: {
          name: "ATTEMPT_COMPLETE",
          selection: state.selection,
          topic: state.topic,
          attempt: state.attempt,
        },
        commands,
      };
    }

    case "CLOSE_TIMER": {
      if (state.name === "RESEARCHING") {
        // Abandon research, stay on the drawn topic.
        return {
          state: {
            name: "TOPIC_READY",
            selection: state.selection,
            requestId: state.requestId,
            topic: state.topic,
            attempt: state.attempt,
          },
          commands: [
            { type: "STOP_DEADLINE" },
            { type: "FOCUS_VIEW", target: "topic" },
          ],
        };
      }
      if (state.name === "SPEAKING") {
        const commands: Command[] = [
          { type: "STOP_DEADLINE" },
          { type: "FOCUS_VIEW", target: "complete" },
        ];
        if (deps.audioArmed) {
          commands.push({ type: "STOP_RECORDING", attemptId: state.attempt.attemptId });
        }
        return {
          state: {
            name: "ATTEMPT_COMPLETE",
            selection: state.selection,
            topic: state.topic,
            attempt: state.attempt,
          },
          commands,
        };
      }
      return noChange(state);
    }

    // --- v0.3 post-attempt extension events (brief §5) ---
    // All keyed by attemptId: stale async results are dropped, never applied.

    case "RECORDING_READY": {
      if (state.name !== "ATTEMPT_COMPLETE" || state.attempt.attemptId !== event.attemptId) {
        return noChange(state);
      }
      return {
        state: {
          name: "PROCESSING",
          selection: state.selection,
          topic: state.topic,
          attempt: state.attempt,
          metrics: null,
          draft: null,
          transcription: "IDLE",
        },
        commands: [
          { type: "RUN_ANALYSIS", attemptId: event.attemptId },
          { type: "FOCUS_VIEW", target: "processing" },
        ],
      };
    }

    case "START_TYPED_REVIEW": {
      // The typed/self-review path is always available, including when audio or
      // transcription succeeded — the learner may simply prefer typing.
      if (state.name === "ATTEMPT_COMPLETE" && state.attempt.attemptId === event.attemptId) {
        return {
          state: {
            name: "SELF_REVIEW",
            selection: state.selection,
            topic: state.topic,
            attempt: state.attempt,
            metrics: null,
            transcriptionIssue: null,
          },
          commands: [{ type: "FOCUS_VIEW", target: "review" }],
        };
      }
      if (state.name === "PROCESSING" && state.attempt.attemptId === event.attemptId) {
        const commands: Command[] = [];
        if (state.transcription === "RUNNING") {
          commands.push({ type: "CANCEL_TRANSCRIPTION", attemptId: event.attemptId });
        }
        commands.push({ type: "FOCUS_VIEW", target: "review" });
        return {
          state: {
            name: "SELF_REVIEW",
            selection: state.selection,
            topic: state.topic,
            attempt: state.attempt,
            metrics: state.metrics,
            transcriptionIssue: null,
          },
          commands,
        };
      }
      if (state.name === "TRANSCRIPT_REVIEW" && state.attempt.attemptId === event.attemptId) {
        return {
          state: {
            name: "SELF_REVIEW",
            selection: state.selection,
            topic: state.topic,
            attempt: state.attempt,
            metrics: state.metrics,
            transcriptionIssue: null,
          },
          commands: [{ type: "FOCUS_VIEW", target: "review" }],
        };
      }
      return noChange(state);
    }

    case "METRICS_READY": {
      if (state.name === "PROCESSING" && state.attempt.attemptId === event.attemptId) {
        // Audio-derived metrics are final at this point; editing a transcript
        // later never changes them.
        if (state.draft !== null) {
          return {
            state: {
              name: "TRANSCRIPT_REVIEW",
              selection: state.selection,
              topic: state.topic,
              attempt: state.attempt,
              metrics: event.metrics,
              draft: state.draft,
            },
            commands: [{ type: "FOCUS_VIEW", target: "review" }],
          };
        }
        return { state: { ...state, metrics: event.metrics }, commands: [] };
      }
      if (state.name === "SELF_REVIEW" && state.attempt.attemptId === event.attemptId) {
        // Analysis can land after a fast transcription failure moved the
        // learner to self-review; adopt the metrics in place.
        return { state: { ...state, metrics: event.metrics }, commands: [] };
      }
      return noChange(state);
    }

    case "TRANSCRIBE_REQUESTED": {
      if (state.name === "PROCESSING" && state.attempt.attemptId === event.attemptId) {
        if (state.transcription === "RUNNING") return noChange(state);
        return {
          state: { ...state, transcription: "RUNNING" },
          commands: [{ type: "START_TRANSCRIPTION", attemptId: event.attemptId }],
        };
      }
      if (state.name === "SELF_REVIEW" && state.attempt.attemptId === event.attemptId) {
        // Retry after a recoverable failure (e.g. model download was offline).
        // Only reachable when the recording still exists — the UI hides the
        // action otherwise.
        return {
          state: {
            name: "PROCESSING",
            selection: state.selection,
            topic: state.topic,
            attempt: state.attempt,
            metrics: state.metrics,
            draft: null,
            transcription: "RUNNING",
          },
          commands: [
            { type: "START_TRANSCRIPTION", attemptId: event.attemptId },
            { type: "FOCUS_VIEW", target: "processing" },
          ],
        };
      }
      return noChange(state);
    }

    case "TRANSCRIPT_READY": {
      if (
        state.name !== "PROCESSING" ||
        state.attempt.attemptId !== event.attemptId ||
        state.transcription !== "RUNNING"
      ) {
        return noChange(state);
      }
      if (state.metrics !== null) {
        return {
          state: {
            name: "TRANSCRIPT_REVIEW",
            selection: state.selection,
            topic: state.topic,
            attempt: state.attempt,
            metrics: state.metrics,
            draft: event.draft,
          },
          commands: [{ type: "FOCUS_VIEW", target: "review" }],
        };
      }
      // Transcript beat the analysis; hold it until METRICS_READY.
      return {
        state: { ...state, draft: event.draft, transcription: "IDLE" },
        commands: [],
      };
    }

    case "TRANSCRIPTION_UNAVAILABLE": {
      if (state.name !== "PROCESSING" || state.attempt.attemptId !== event.attemptId) {
        return noChange(state);
      }
      // A first-class outcome, not an error: continue with self/typed review.
      return {
        state: {
          name: "SELF_REVIEW",
          selection: state.selection,
          topic: state.topic,
          attempt: state.attempt,
          metrics: state.metrics,
          transcriptionIssue: event.reason,
        },
        commands: [{ type: "FOCUS_VIEW", target: "review" }],
      };
    }

    case "TRANSCRIPT_APPROVED": {
      if (state.name !== "TRANSCRIPT_REVIEW" || state.attempt.attemptId !== event.attemptId) {
        return noChange(state);
      }
      return {
        state: {
          name: "REVIEW",
          selection: state.selection,
          topic: state.topic,
          attempt: state.attempt,
          metrics: state.metrics,
          textMetrics: event.textMetrics,
          transcript: event.transcript,
          coverage: event.coverage,
          refinementDelta: event.refinementDelta,
        },
        commands: [{ type: "FOCUS_VIEW", target: "review" }],
      };
    }

    case "SELF_REVIEW_DONE": {
      if (state.name !== "SELF_REVIEW" || state.attempt.attemptId !== event.attemptId) {
        return noChange(state);
      }
      return {
        state: {
          name: "REVIEW",
          selection: state.selection,
          topic: state.topic,
          attempt: state.attempt,
          metrics: state.metrics,
          textMetrics: event.textMetrics,
          transcript: event.transcript,
          coverage: event.coverage,
          refinementDelta: event.refinementDelta,
        },
        commands: [{ type: "FOCUS_VIEW", target: "review" }],
      };
    }

    case "START_SECOND_ATTEMPT": {
      // Re-attempt the same topic from the review screen. Capture the completed
      // attempt and release its recording before re-arming the normal pipeline.
      if (state.name !== "REVIEW") return noChange(state);
      const completed = {
        attemptId: state.attempt.attemptId,
        attemptIndex: state.attempt.attemptIndex,
        topicRef: state.attempt.topicRef,
        mode: state.attempt.mode,
        challenge: state.attempt.challenge,
        supportLevel: state.attempt.supportLevel,
        register: state.attempt.register,
        timePolicy: state.attempt.timePolicy,
        coverage: state.coverage,
        transcriptText: state.transcript.text,
      };
      const nextAttempt: AttemptDraft = {
        ...state.attempt,
        attemptId: `${event.requestId}-attempt`,
        sessionId: event.requestId,
        createdAt: deps.nowIso,
        attemptIndex: state.attempt.attemptIndex + 1,
        history: [...state.attempt.history, completed].slice(-MAX_PRIOR_ATTEMPTS),
      };
      return {
        state: {
          name: "TOPIC_READY",
          selection: state.selection,
          requestId: event.requestId,
          topic: state.topic,
          attempt: nextAttempt,
        },
        commands: [
          { type: "REVOKE_RECORDING", attemptId: state.attempt.attemptId },
          { type: "FOCUS_VIEW", target: "topic" },
        ],
      };
    }

    case "COVERAGE_REFINED": {
      // v0.5: replace the lexical baseline with the semantic pass on REVIEW.
      // Stale drops by attemptId; the learner never sees a failed model state.
      if (state.name !== "REVIEW" || state.attempt.attemptId !== event.attemptId) {
        return noChange(state);
      }
      return {
        state: {
          ...state,
          coverage: event.coverage,
          refinementDelta: event.refinementDelta,
        },
        commands: [],
      };
    }

    default:
      return noChange(state);
  }
}

// Re-export for the orchestrator so it can resolve a drawn variant id into a snapshot.
export { findVariant, toTopicSnapshot };

export type { ChallengePreset };
