import type { CoverageReport } from "@/practice/types";
import { prescribe } from "@/scoring/prescription";

interface CoveragePanelProps {
  coverage: CoverageReport;
}

/**
 * Content coverage, kept visually and verbally separate from delivery. This is
 * "did the expected idea appear in your spoken answer", not a correctness grade.
 * The single prescription line is the only recommended action — no dashboard.
 */
export function CoveragePanel({ coverage }: CoveragePanelProps) {
  const prescription = prescribe(coverage);

  if (!coverage.verifiable) {
    return (
      <section className="coverage-panel" aria-labelledby="coverage-heading">
        <h3 id="coverage-heading">Content coverage</h3>
        <p className="status">{prescription.text}</p>
      </section>
    );
  }

  const possible = coverage.conceptResults.filter(
    (result) => !result.hit && result.semanticEvidence?.status === "POSSIBLY_COVERED",
  );
  const missed = coverage.conceptResults.filter(
    (result) => !result.hit && result.semanticEvidence?.status !== "POSSIBLY_COVERED",
  );
  const touched = coverage.conceptResults.filter((result) => result.hit);
  const percent = Math.round(coverage.weightedFraction * 100);

  return (
    <section className="coverage-panel" aria-labelledby="coverage-heading">
      <h3 id="coverage-heading">Content coverage</h3>
      <p className="status">
        What this measures: whether each expected idea appeared in your approved transcript. It does
        not grade medical correctness, confidence, or emotion.
      </p>
      <p className="coverage-score" aria-live="polite">
        You touched {coverage.hitCount} of {coverage.totalCount} listed concepts ({percent}% by weight).
      </p>

      <p className="prescription">
        <span className="prescription-label">One thing to try next:</span> {prescription.text}
      </p>

      {missed.length > 0 ? (
        <div className="coverage-missed">
          <h4>Concepts not yet touched</h4>
          <ul>
            {missed.map((result) => (
              <li key={result.conceptId}>{result.label}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {possible.length > 0 ? (
        <div className="coverage-possible">
          <h4>Possibly present — not counted</h4>
          <p className="status">
            Meaning matching found related wording. Check it yourself; this is not a correctness
            decision.
          </p>
          <ul>
            {possible.map((result) => (
              <li key={result.conceptId}>
                {result.label}
                {result.semanticEvidence?.transcriptSegment ? (
                  <span className="coverage-evidence">
                    Your wording: “{result.semanticEvidence.transcriptSegment}”
                  </span>
                ) : null}
                {result.semanticEvidence?.rubricText ? (
                  <span className="coverage-evidence">
                    Related rubric wording: “{result.semanticEvidence.rubricText}”
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {touched.length > 0 ? (
        <details className="coverage-touched">
          <summary>Concepts you touched ({touched.length})</summary>
          <ul>
            {touched.map((result) => (
              <li key={result.conceptId}>
                {result.label}
                {result.matchedPhrase ? (
                  <span className="coverage-evidence">
                    Matched rubric wording: “{result.matchedPhrase}”
                  </span>
                ) : null}
                {result.semanticEvidence?.status === "COVERED" &&
                result.semanticEvidence.transcriptSegment ? (
                  <span className="coverage-evidence">
                    Your related wording: “{result.semanticEvidence.transcriptSegment}”
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
