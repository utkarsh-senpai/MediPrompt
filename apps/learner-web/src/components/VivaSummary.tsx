import type { TopicSnapshot, VivaSummary } from "@/practice/types";
import { formatVivaSummary } from "@/scoring/vivaSummary";
import { vivaLevelLabel } from "./vivaLevel";

interface VivaSummaryProps {
  topic: TopicSnapshot;
  summary: VivaSummary;
  onExit: () => void;
}

/** Final viva aggregate. Per-follow-up coverage is shown, never as a grade. */
export function VivaSummary({ topic, summary, onExit }: VivaSummaryProps) {
  return (
    <section aria-labelledby="viva-complete-heading">
      <h2 id="viva-complete-heading" tabIndex={-1}>
        Viva complete: {topic.title}
      </h2>
      <p className="coverage-score" aria-live="polite">
        {formatVivaSummary(summary)}
      </p>
      <p className="status">
        Target-concept coverage measures whether each question’s target ideas appeared in
        your approved answer. It does not grade medical correctness, confidence, or
        competence.
      </p>
      {summary.notVerifiableCount > 0 ? (
        <p className="status">
          {summary.notVerifiableCount} answer
          {summary.notVerifiableCount === 1 ? "" : "s"} could not be scored against a
          source-grounded rubric.
        </p>
      ) : null}
      <ol className="viva-summary-list">
        {summary.perFollowUp.map((entry) => (
          <li key={entry.questionId}>
            <span className="eyebrow" aria-hidden="true">
              {vivaLevelLabel(entry.level)}
            </span>
            <span>
              {entry.coverage.verifiable
                ? `${Math.round(entry.coverage.weightedFraction * 100)}% of target concepts`
                : "coverage unavailable"}
            </span>
          </li>
        ))}
      </ol>
      <div className="toolbar">
        <button type="button" className="primary" onClick={onExit}>
          Back to attempt review
        </button>
      </div>
    </section>
  );
}
