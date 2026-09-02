import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { findVariant, toTopicSnapshot } from "@/content/packQuery";
import { validatePack } from "@/content/packValidator";
import { VivaOverview } from "./VivaOverview";
import { VivaQuestionCard } from "./VivaQuestionCard";
import { VivaAnswerReview } from "./VivaAnswerReview";
import { VivaSummary } from "./VivaSummary";
import { AttemptReview } from "./AttemptReview";
import type { AudioUiState } from "@/practice/usePracticeSession";
import type {
  ApprovedTranscript,
  CoverageReport,
  DeliveryMetrics,
  RuntimePack,
  TextMetrics,
  VivaQuestion,
  VivaSummary as VivaSummaryType,
} from "@/practice/types";
import medicalPackJson from "@content/candidates/mpt-cardiorespiratory-review-candidate.json";

const pack = validatePack(medicalPackJson) as RuntimePack;

function vivaSnapshot(): ReturnType<typeof toTopicSnapshot> {
  const found = findVariant(pack, "cardiac-rehabilitation-viva-recall-v1");
  if (!found) throw new Error("viva variant not found");
  return toTopicSnapshot(pack, found.variant, found.topic, found.subject, {
    speakingSeconds: 90,
    researchSeconds: 120,
  });
}

const AUDIO: AudioUiState = {
  available: true,
  status: "OFF",
  armed: false,
  issue: null,
  playback: null,
  transcriptionProgress: null,
};

const APPROVED: ApprovedTranscript = {
  text: "safety assessment and secondary prevention",
  approvedAt: "2026-09-01T00:00:00.000Z",
  wasEdited: false,
};

const COVERAGE: CoverageReport = {
  verifiable: true,
  unavailableReason: null,
  scoring: { method: "LEXICAL", version: "lexical-v1" },
  conceptResults: [
    {
      conceptId: "cardiac-rehabilitation-viva-recall-c1",
      label: "Prioritize safety, goals, secondary prevention",
      weight: 2,
      hit: true,
      matchedPhrase: "safety assessment",
    },
  ],
  hitCount: 1,
  totalCount: 1,
  weightedFraction: 1,
  fraction: 1,
};

const METRICS: DeliveryMetrics = { durationMs: 60_000, pauses: [], limitations: [] };
const TEXT_METRICS: TextMetrics = { wordsPerMinute: 90, fillerCount: 0, repeatedPhraseCount: 0 };

describe("AttemptReview while viva is paused", () => {
  it("does not expose viva controls or unavailable messaging", () => {
    render(
      <AttemptReview
        topic={vivaSnapshot()}
        metrics={null}
        textMetrics={null}
        transcript={APPROVED}
        coverage={COVERAGE}
        history={[]}
        refinementDelta={null}
        attemptIndex={1}
        audio={AUDIO}
        onSpinAgain={() => {}}
        onTryAgain={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: "Begin viva" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Viva is unavailable for this topic/i)).not.toBeInTheDocument();
  });
});

describe("VivaOverview", () => {
  it("lists the ladder and wires begin/exit", async () => {
    const onBegin = vi.fn();
    const onExit = vi.fn();
    const topic = vivaSnapshot();
    render(
      <VivaOverview topic={topic} questions={topic.vivaQuestions} onBegin={onBegin} onExit={onExit} />,
    );
    expect(screen.getByRole("heading", { name: /Viva:/ })).toBeInTheDocument();
    // Three levels labelled.
    expect(screen.getByText("Recall")).toBeInTheDocument();
    expect(screen.getByText("Apply")).toBeInTheDocument();
    expect(screen.getByText("Defend")).toBeInTheDocument();
    expect(screen.queryByText(topic.vivaQuestions[0]!.prompt)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Begin viva" }));
    expect(onBegin).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Back to attempt review" }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});

describe("VivaQuestionCard", () => {
  it("shows the question, level, and start control", () => {
    const topic = vivaSnapshot();
    const question = topic.vivaQuestions[0] as VivaQuestion;
    render(
      <VivaQuestionCard
        topic={topic}
        question={question}
        questionIndex={0}
        total={3}
        audio={AUDIO}
        onBeginAudioOptIn={() => {}}
        onConfirmAudioOptIn={() => {}}
        onCancelAudioOptIn={() => {}}
        onStartSpeaking={() => {}}
        onExit={() => {}}
      />,
    );
    expect(screen.getByText(/question 1 of 3 · Recall/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start speaking" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exit viva" })).toBeInTheDocument();
  });
});

describe("VivaAnswerReview", () => {
  it("shows coverage against targets and the next action", () => {
    const topic = vivaSnapshot();
    const question = topic.vivaQuestions[0] as VivaQuestion;
    const onNext = vi.fn();
    render(
      <VivaAnswerReview
        topic={topic}
        question={question}
        questionIndex={0}
        total={3}
        transcript={APPROVED}
        coverage={COVERAGE}
        metrics={METRICS}
        textMetrics={TEXT_METRICS}
        semanticRefining={false}
        audio={AUDIO}
        onNext={onNext}
        onExit={() => {}}
      />,
    );
    expect(screen.getByRole("heading", { name: "Content coverage" })).toBeInTheDocument();
    expect(screen.getByText(/100% by weight/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next question" }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("labels the last question's action Finish viva", () => {
    const topic = vivaSnapshot();
    const question = topic.vivaQuestions[2] as VivaQuestion;
    render(
      <VivaAnswerReview
        topic={topic}
        question={question}
        questionIndex={2}
        total={3}
        transcript={APPROVED}
        coverage={COVERAGE}
        metrics={null}
        textMetrics={null}
        semanticRefining={false}
        audio={AUDIO}
        onNext={() => {}}
        onExit={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Finish viva" })).toBeInTheDocument();
  });
});

describe("VivaSummary", () => {
  it("renders the aggregate and per-follow-up rows", () => {
    const topic = vivaSnapshot();
    const summary: VivaSummaryType = {
      answeredCount: 3,
      scoredCount: 3,
      notVerifiableCount: 0,
      weightedFraction: 1,
      perFollowUp: topic.vivaQuestions.map((q) => ({
        questionId: q.id,
        level: q.level,
        coverage: COVERAGE,
      })),
    };
    const onExit = vi.fn();
    render(<VivaSummary topic={topic} summary={summary} onExit={onExit} />);
    expect(screen.getByText(/100% target-concept coverage across 3 scored answers/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to attempt review" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back to attempt review" }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("names not-verifiable answers explicitly", () => {
    const topic = vivaSnapshot();
    const summary: VivaSummaryType = {
      answeredCount: 1,
      scoredCount: 0,
      notVerifiableCount: 1,
      weightedFraction: 0,
      perFollowUp: [
        {
          questionId: "q",
          level: "RECALL",
          coverage: {
            verifiable: false,
            unavailableReason: "NO_SCORABLE_RUBRIC",
            scoring: { method: "LEXICAL", version: "lexical-v1" },
            conceptResults: [],
            hitCount: 0,
            totalCount: 0,
            weightedFraction: 0,
            fraction: 0,
          },
        },
      ],
    };
    render(<VivaSummary topic={topic} summary={summary} onExit={() => {}} />);
    expect(screen.getByText(/1 answer could not be scored/i)).toBeInTheDocument();
  });
});
