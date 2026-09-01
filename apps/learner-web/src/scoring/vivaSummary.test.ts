import { describe, expect, it } from "vitest";
import { formatVivaSummary, summarizeViva } from "./vivaSummary";
import type {
  ApprovedTranscript,
  CoverageReport,
  DeliveryMetrics,
  VivaAnswer,
  VivaQuestion,
} from "@/practice/types";

const APPROVED: ApprovedTranscript = {
  text: "answer",
  approvedAt: "2026-09-01T00:00:00.000Z",
  wasEdited: false,
};

const METRICS: DeliveryMetrics = { durationMs: 1000, pauses: [], limitations: [] };

function question(level: VivaQuestion["level"], id: string): VivaQuestion {
  return { id, level, prompt: `prompt-${id}`, targetConceptIds: ["c1"] };
}

function coverage(hit: boolean, weight: number, conceptId = "c1"): CoverageReport {
  return {
    verifiable: true,
    unavailableReason: null,
    scoring: { method: "LEXICAL", version: "lexical-v1" },
    conceptResults: [{ conceptId, label: "L", weight, hit, matchedPhrase: hit ? "x" : null }],
    hitCount: hit ? 1 : 0,
    totalCount: 1,
    weightedFraction: hit ? 1 : 0,
    fraction: hit ? 1 : 0,
  };
}

function answer(
  level: VivaQuestion["level"],
  id: string,
  cov: CoverageReport,
): VivaAnswer {
  return {
    questionIndex: 0,
    question: question(level, id),
    attemptId: `a-${id}`,
    transcript: APPROVED,
    coverage: cov,
    textMetrics: null,
    metrics: METRICS,
  };
}

const UNVERIFIABLE: CoverageReport = {
  verifiable: false,
  unavailableReason: "NO_SCORABLE_RUBRIC",
  scoring: { method: "LEXICAL", version: "lexical-v1" },
  conceptResults: [],
  hitCount: 0,
  totalCount: 0,
  weightedFraction: 0,
  fraction: 0,
};

describe("summarizeViva", () => {
  it("returns a zeroed summary for no answers", () => {
    const summary = summarizeViva([]);
    expect(summary.answeredCount).toBe(0);
    expect(summary.weightedFraction).toBe(0);
    expect(summary.notVerifiableCount).toBe(0);
    expect(summary.perFollowUp).toEqual([]);
  });

  it("weights follow-ups by their target concept weight", () => {
    // q1: weight 2, hit → 2/2 ; q2: weight 3, miss → 0/3. Overall 2/5.
    const summary = summarizeViva([
      answer("RECALL", "q1", coverage(true, 2)),
      answer("DEFEND", "q2", coverage(false, 3)),
    ]);
    expect(summary.answeredCount).toBe(2);
    expect(summary.notVerifiableCount).toBe(0);
    expect(summary.weightedFraction).toBeCloseTo(2 / 5, 5);
    expect(summary.perFollowUp).toHaveLength(2);
  });

  it("excludes not-verifiable answers from the numeric aggregate and counts them", () => {
    const summary = summarizeViva([
      answer("RECALL", "q1", coverage(true, 2)),
      answer("APPLY", "q2", UNVERIFIABLE),
    ]);
    expect(summary.answeredCount).toBe(2);
    expect(summary.notVerifiableCount).toBe(1);
    expect(summary.weightedFraction).toBe(1);
  });

  it("reports zero fraction when every answer is not-verifiable", () => {
    const summary = summarizeViva([
      answer("RECALL", "q1", UNVERIFIABLE),
      answer("APPLY", "q2", UNVERIFIABLE),
    ]);
    expect(summary.notVerifiableCount).toBe(2);
    expect(summary.weightedFraction).toBe(0);
  });
});

describe("formatVivaSummary", () => {
  it("formats a percentage across answers", () => {
    const summary = summarizeViva([answer("RECALL", "q1", coverage(true, 2))]);
    expect(formatVivaSummary(summary)).toBe("100% defense coverage across 1 answer.");
  });

  it("pluralizes answers", () => {
    const summary = summarizeViva([
      answer("RECALL", "q1", coverage(true, 2)),
      answer("DEFEND", "q2", coverage(false, 3)),
    ]);
    expect(formatVivaSummary(summary)).toMatch(/across 2 answers\.$/);
  });

  it("says not verifiable when no answer could be scored", () => {
    const summary = summarizeViva([answer("RECALL", "q1", UNVERIFIABLE)]);
    expect(formatVivaSummary(summary)).toBe("Coverage not verifiable across the viva.");
  });

  it("says no answers yet for an empty ladder", () => {
    expect(formatVivaSummary(summarizeViva([]))).toBe("No answers yet.");
  });
});
