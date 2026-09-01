// v0.5 Gap Score: the change in weighted coverage between two same-topic attempts.
// See docs/V0.5_DEVELOPMENT_CONTEXT.md §3.2.
//
// Gap Score is a coverage delta, NOT a "you got smarter" claim. If either report
// is not verifiable (no scorable rubric or no transcript), there is no comparable
// number and the result is a flat zero — we never fabricate a delta from missing
// data.

import type { CoverageReport, GapDirection, GapScoreResult } from "@/practice/types";

/**
 * Compute the Gap Score between a prior and current coverage report. Both must be
 * verifiable for a real delta; otherwise the score is 0 with direction FLAT.
 */
export function gapScore(
  prior: CoverageReport | null,
  current: CoverageReport,
): GapScoreResult {
  if (prior === null || !prior.verifiable || !current.verifiable) {
    return { score: 0, direction: "FLAT" };
  }
  const score = current.weightedFraction - prior.weightedFraction;
  const direction: GapDirection =
    score > 0 ? "IMPROVED" : score < 0 ? "REGRESSED" : "FLAT";
  return { score, direction };
}

/** Format a Gap Score as a signed percentage string, e.g. "+18%" / "−4%" / "0%". */
export function formatGapScore(score: number): string {
  if (score === 0) return "0%";
  const percent = Math.round(score * 100);
  const sign = percent > 0 ? "+" : "−";
  return `${sign}${Math.abs(percent)}%`;
}

/** Plain-language reading of a Gap Score direction. */
export function gapDirectionCopy(direction: GapDirection): string {
  switch (direction) {
    case "IMPROVED":
      return "Your coverage improved on this attempt.";
    case "REGRESSED":
      return "Your coverage dropped on this attempt — revisit the missed concepts before moving on.";
    case "FLAT":
      return "Your coverage was unchanged across attempts.";
  }
}
