// v0.5 Refinement Delta: coverage change between two reproducibly comparable
// attempts. This is not a knowledge, correctness, confidence, or competence score.

import type {
  AttemptDraft,
  AttemptHistoryEntry,
  CoverageReport,
  RefinementDeltaResult,
  RefinementDeltaUnavailableReason,
  RefinementDirection,
} from "@/practice/types";

const FLOAT_EPSILON = 1e-9;

export function toAttemptHistoryEntry(
  attempt: AttemptDraft,
  coverage: CoverageReport,
  transcriptText: string,
): AttemptHistoryEntry {
  return {
    attemptId: attempt.attemptId,
    attemptIndex: attempt.attemptIndex,
    topicRef: attempt.topicRef,
    mode: attempt.mode,
    challenge: attempt.challenge,
    supportLevel: attempt.supportLevel,
    register: attempt.register,
    timePolicy: attempt.timePolicy,
    coverage,
    transcriptText,
  };
}

function sameAttemptIdentity(a: AttemptHistoryEntry, b: AttemptHistoryEntry): boolean {
  const ta = a.topicRef;
  const tb = b.topicRef;
  return (
    ta.packId === tb.packId &&
    ta.packVersion === tb.packVersion &&
    ta.subjectId === tb.subjectId &&
    ta.topicId === tb.topicId &&
    ta.variantId === tb.variantId &&
    ta.difficultyProfileVersion === tb.difficultyProfileVersion &&
    ta.promptId === tb.promptId &&
    ta.rubricId === tb.rubricId &&
    a.mode === b.mode &&
    a.challenge === b.challenge &&
    a.supportLevel === b.supportLevel &&
    a.register === b.register &&
    a.timePolicy.preparationSeconds === b.timePolicy.preparationSeconds &&
    a.timePolicy.speakingSeconds === b.timePolicy.speakingSeconds &&
    a.timePolicy.researchSeconds === b.timePolicy.researchSeconds
  );
}

function sameScoringIdentity(a: CoverageReport, b: CoverageReport): boolean {
  return a.scoring.method === b.scoring.method && a.scoring.version === b.scoring.version;
}

/**
 * Return a number only for the same complete attempt identity, scoring method,
 * and verifiable coverage. Missing or mismatched inputs stay explicitly unavailable.
 */
export function refinementDelta(
  prior: AttemptHistoryEntry,
  current: AttemptHistoryEntry,
): RefinementDeltaResult {
  if (!sameAttemptIdentity(prior, current)) {
    return { available: false, reason: "ATTEMPT_IDENTITY_MISMATCH" };
  }
  if (!sameScoringIdentity(prior.coverage, current.coverage)) {
    return { available: false, reason: "SCORING_IDENTITY_MISMATCH" };
  }
  if (!prior.coverage.verifiable) {
    return { available: false, reason: "PRIOR_COVERAGE_UNAVAILABLE" };
  }
  if (!current.coverage.verifiable) {
    return { available: false, reason: "CURRENT_COVERAGE_UNAVAILABLE" };
  }

  const rawScore = current.coverage.weightedFraction - prior.coverage.weightedFraction;
  const score = Math.abs(rawScore) <= FLOAT_EPSILON ? 0 : rawScore;
  const direction: RefinementDirection =
    score > 0 ? "IMPROVED" : score < 0 ? "REGRESSED" : "FLAT";
  const priorHits = new Set(
    prior.coverage.conceptResults.filter((concept) => concept.hit).map((concept) => concept.conceptId),
  );
  const currentHits = new Set(
    current.coverage.conceptResults.filter((concept) => concept.hit).map((concept) => concept.conceptId),
  );

  return {
    available: true,
    score,
    direction,
    newlyCoveredConceptIds: [...currentHits].filter((id) => !priorHits.has(id)),
    lostConceptIds: [...priorHits].filter((id) => !currentHits.has(id)),
  };
}

/** Format a valid delta as a signed percentage. Tiny non-zero changes stay visible. */
export function formatRefinementDelta(score: number): string {
  if (score === 0) return "0%";
  const rounded = Math.round(Math.abs(score) * 100);
  const magnitude = rounded === 0 ? "<1" : String(rounded);
  return `${score > 0 ? "+" : "−"}${magnitude}%`;
}

export function refinementDirectionCopy(direction: RefinementDirection): string {
  switch (direction) {
    case "IMPROVED":
      return "Your coverage improved on this attempt.";
    case "REGRESSED":
      return "Your coverage dropped on this attempt — revisit the missed concepts before moving on.";
    case "FLAT":
      return "Your coverage was unchanged across attempts.";
  }
}

export function refinementUnavailableCopy(reason: RefinementDeltaUnavailableReason): string {
  switch (reason) {
    case "PRIOR_COVERAGE_UNAVAILABLE":
      return "Refinement Delta is unavailable because the previous attempt had no verifiable coverage.";
    case "CURRENT_COVERAGE_UNAVAILABLE":
      return "Refinement Delta is unavailable because this attempt has no verifiable coverage.";
    case "ATTEMPT_IDENTITY_MISMATCH":
      return "Refinement Delta is unavailable because the two attempts used different practice conditions.";
    case "SCORING_IDENTITY_MISMATCH":
      return "Refinement Delta is unavailable because the two attempts used different coverage methods.";
  }
}
