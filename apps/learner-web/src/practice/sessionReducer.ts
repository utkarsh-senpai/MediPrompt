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
    case "CHANGE_SELECTION":
      if (state.name === "SPEAKING" || state.name === "RESEARCHING") {
        return noChange(state);
      }
      return { state: { name: "IDLE", selection: event.selection }, commands: [] };

    case "SPIN":
      if (state.name !== "IDLE") return noChange(state);
      return {
        state: { name: "DRAWING", selection: state.selection, requestId: event.requestId },
        commands: [requestDraw(state.selection, event.requestId, deps)],
      };

    case "SPIN_AGAIN":
      if (
        state.name !== "TOPIC_READY" &&
        state.name !== "READY_TO_SPEAK" &&
        state.name !== "ATTEMPT_COMPLETE"
      ) {
        return noChange(state);
      }
      return {
        state: { name: "DRAWING", selection: state.selection, requestId: event.requestId },
        commands: [requestDraw(state.selection, event.requestId, deps)],
      };

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
      return {
        state: {
          name: "SPEAKING",
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
      return {
        state: {
          name: "SPEAKING",
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
      return {
        state: {
          name: "ATTEMPT_COMPLETE",
          selection: state.selection,
          topic: state.topic,
          attempt: state.attempt,
        },
        commands: [{ type: "STOP_DEADLINE" }, { type: "FOCUS_VIEW", target: "complete" }],
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
        return {
          state: {
            name: "ATTEMPT_COMPLETE",
            selection: state.selection,
            topic: state.topic,
            attempt: state.attempt,
          },
          commands: [{ type: "STOP_DEADLINE" }, { type: "FOCUS_VIEW", target: "complete" }],
        };
      }
      return noChange(state);
    }

    default:
      return noChange(state);
  }
}

// Re-export for the orchestrator so it can resolve a drawn variant id into a snapshot.
export { findVariant, toTopicSnapshot };

export type { ChallengePreset };
