// v0.6 viva defense-ladder summary.
// See docs/V0.6_DEVELOPMENT_CONTEXT.md §4.
//
// Aggregates per-follow-up coverage into one weighted fraction. Each follow-up
// is weighted by the total weight of its target concepts, so a harder DEFEND
// question targeting three weighted concepts counts more than a one-concept
// RECALL. Not-verifiable answers are excluded from the numeric aggregate and
// listed separately — they never become a fabricated 0%. This is not a
// correctness, confidence, or competence score.

import type {
  CoverageReport,
  VivaAnswer,
  VivaFollowUpSummary,
  VivaSummary,
} from "@/practice/types";

function followUpWeight(coverage: CoverageReport): number {
  return coverage.conceptResults.reduce((sum, result) => sum + result.weight, 0);
}

function followUpHitWeight(coverage: CoverageReport): number {
  return coverage.conceptResults
    .filter((result) => result.hit)
    .reduce((sum, result) => sum + result.weight, 0);
}

/**
 * Aggregate completed viva answers into a summary. Pure and deterministic; the
 * reducer calls it when the ladder is exhausted so VIVA_COMPLETE carries a
 * frozen summary rather than recomputing in the view.
 */
export function summarizeViva(answers: readonly VivaAnswer[]): VivaSummary {
  const perFollowUp: VivaFollowUpSummary[] = answers.map((answer) => ({
    questionId: answer.question.id,
    level: answer.question.level,
    coverage: answer.coverage,
  }));

  let weightedTotal = 0;
  let weightedHit = 0;
  let scoredCount = 0;
  let notVerifiableCount = 0;
  for (const answer of answers) {
    if (!answer.coverage.verifiable) {
      notVerifiableCount += 1;
      continue;
    }
    scoredCount += 1;
    weightedTotal += followUpWeight(answer.coverage);
    weightedHit += followUpHitWeight(answer.coverage);
  }

  return {
    answeredCount: answers.length,
    scoredCount,
    notVerifiableCount,
    weightedFraction: weightedTotal > 0 ? weightedHit / weightedTotal : 0,
    perFollowUp,
  };
}

/** Format the aggregate as a percentage; an empty ladder is "no answers yet". */
export function formatVivaSummary(summary: VivaSummary): string {
  if (summary.answeredCount === 0) return "No answers yet.";
  if (summary.scoredCount === 0) {
    return "Coverage not verifiable across the viva.";
  }
  return `${Math.round(summary.weightedFraction * 100)}% target-concept coverage across ${summary.scoredCount} scored answer${
    summary.scoredCount === 1 ? "" : "s"
  }.`;
}
