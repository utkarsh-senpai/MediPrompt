// v0.4 single-actionable-prescription generator.
// See docs/V0.4_DEVELOPMENT_CONTEXT.md §4.
//
// The review screen shows ONE prescription per attempt, not a dashboard. The
// rule: pick the highest-weight missed concept and name it. When nothing was
// missed, reinforce. When the rubric has no concepts, surface the
// "not verifiable from sources" fallback rather than a fabricated grade.

import type { CoverageReport } from "@/practice/types";

export type PrescriptionKind = "ACTION" | "FULL" | "NOT_VERIFIABLE";

export interface Prescription {
  kind: PrescriptionKind;
  text: string;
}

const FULL_COVERAGE_TEXT =
  "You touched every listed concept. On the next attempt, explain the same concepts more concisely.";

/**
 * Build the single prescription line for a coverage report. Missed concepts are
 * ordered by weight descending then by original rubric order, so the chosen
 * action is stable for a given report.
 */
export function prescribe(report: CoverageReport): Prescription {
  if (!report.verifiable) {
    if (report.unavailableReason === "NO_TRANSCRIPT") {
      return {
        kind: "NOT_VERIFIABLE",
        text:
          "No transcript was provided, so content coverage was not scored. Add or approve a transcript on the next attempt.",
      };
    }
    return {
      kind: "NOT_VERIFIABLE",
      text:
        "No source-grounded rubric is available for this topic, so content coverage was not scored. Focus on structure and delivery instead.",
    };
  }

  if (report.hitCount === report.totalCount) {
    return {
      kind: "FULL",
      text: FULL_COVERAGE_TEXT,
    };
  }

  const missed = report.conceptResults
    .map((result, index) => ({ result, index }))
    .filter((entry) => !entry.result.hit)
    .sort((a, b) => b.result.weight - a.result.weight || a.index - b.index);

  const target = missed[0]?.result;
  if (!target) {
    return {
      kind: "FULL",
      text: FULL_COVERAGE_TEXT,
    };
  }

  return {
    kind: "ACTION",
    text: `On your next attempt, explain: "${target.label}".`,
  };
}
