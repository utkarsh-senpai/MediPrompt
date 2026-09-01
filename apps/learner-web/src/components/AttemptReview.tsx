import type { AudioUiState } from "@/practice/usePracticeSession";
import type {
  ApprovedTranscript,
  AttemptHistoryEntry,
  CoverageReport,
  DeliveryMetrics,
  RefinementDeltaResult,
  TextMetrics,
  TopicSnapshot,
} from "@/practice/types";
import {
  formatRefinementDelta,
  refinementDirectionCopy,
  refinementUnavailableCopy,
} from "@/scoring/refinementDelta";
import { CoveragePanel } from "./CoveragePanel";
import { DeliveryPanel } from "./DeliveryPanel";
import { PlaybackBar } from "./PlaybackBar";

interface AttemptReviewProps {
  topic: TopicSnapshot;
  metrics: DeliveryMetrics | null;
  textMetrics: TextMetrics | null;
  transcript: ApprovedTranscript;
  coverage: CoverageReport;
  history: AttemptHistoryEntry[];
  refinementDelta: RefinementDeltaResult | null;
  attemptIndex: number;
  semanticRefining?: boolean;
  audio: AudioUiState;
  onSpinAgain: () => void;
  onTryAgain: () => void;
  onBeginViva: () => void;
}

function coverageCopy(coverage: CoverageReport): string {
  return coverage.verifiable
    ? `${Math.round(coverage.weightedFraction * 100)}% coverage`
    : "coverage unavailable";
}

/** Final review screen: approved transcript, content coverage, retry delta, and delivery. */
export function AttemptReview({
  topic,
  metrics,
  textMetrics,
  transcript,
  coverage,
  history,
  refinementDelta,
  attemptIndex,
  semanticRefining = false,
  audio,
  onSpinAgain,
  onTryAgain,
  onBeginViva,
}: AttemptReviewProps) {
  const labelFor = (conceptId: string) =>
    coverage.conceptResults.find((concept) => concept.conceptId === conceptId)?.label ??
    history
      .at(-1)
      ?.coverage.conceptResults.find((concept) => concept.conceptId === conceptId)?.label ??
    conceptId;

  return (
    <section aria-labelledby="review-heading">
      <h2 id="review-heading" tabIndex={-1}>
        Attempt review{attemptIndex > 1 ? ` (attempt ${attemptIndex})` : ""}
      </h2>
      <p className="status">{topic.title}</p>

      {semanticRefining ? (
        <p className="status" role="status">
          Checking related wording on this device… Lexical coverage is already available.
        </p>
      ) : null}

      {audio.playback ? (
        <PlaybackBar url={audio.playback.url} durationMs={audio.playback.durationMs} />
      ) : null}

      {attemptIndex > 1 && refinementDelta ? (
        <section className="refinement-delta-panel" aria-labelledby="refinement-delta-heading">
          <h3 id="refinement-delta-heading">Refinement Delta</h3>
          {refinementDelta.available ? (
            <>
              <p className="refinement-delta-value" aria-live="polite">
                {formatRefinementDelta(refinementDelta.score)}
              </p>
              <p className="status">
                {refinementDirectionCopy(refinementDelta.direction)}
              </p>
              {refinementDelta.newlyCoveredConceptIds.length > 0 ? (
                <p className="status">
                  Newly covered: {refinementDelta.newlyCoveredConceptIds.map(labelFor).join(", ")}.
                </p>
              ) : null}
              {refinementDelta.lostConceptIds.length > 0 ? (
                <p className="status">
                  No longer detected: {refinementDelta.lostConceptIds.map(labelFor).join(", ")}.
                </p>
              ) : null}
            </>
          ) : (
            <p className="status" role="status">
              {refinementUnavailableCopy(refinementDelta.reason)}
            </p>
          )}
          <p className="status">
            Refinement Delta compares coverage under the same practice and scoring conditions. It
            does not measure correctness or long-term learning.
          </p>
        </section>
      ) : null}

      <section className="topic-card" aria-labelledby="transcript-view-heading">
        <h3 id="transcript-view-heading">Your transcript</h3>
        <p className="transcript-text">{transcript.text || "No transcript saved."}</p>
        {transcript.wasEdited && transcript.rawText !== undefined ? (
          <details>
            <summary>Original machine transcript (before your edits)</summary>
            <p className="transcript-text">{transcript.rawText}</p>
          </details>
        ) : null}
      </section>

      <CoveragePanel coverage={coverage} />

      {metrics ? <DeliveryPanel metrics={metrics} textMetrics={textMetrics} /> : null}

      <details className="attempt-history">
        <summary>Attempts ({attemptIndex})</summary>
        {attemptIndex > history.length + 1 ? (
          <p className="status">Showing the most recent {history.length + 1} attempts.</p>
        ) : null}
        <ol>
          {history.map((attempt) => (
            <li key={attempt.attemptId}>
              Attempt {attempt.attemptIndex} — {coverageCopy(attempt.coverage)}
            </li>
          ))}
          <li>
            Attempt {attemptIndex} — {coverageCopy(coverage)}
          </li>
        </ol>
      </details>

      {topic.vivaQuestions.length > 0 ? (
        <section className="viva-entry" aria-labelledby="viva-entry-heading">
          <h3 id="viva-entry-heading">Defend this topic</h3>
          <p className="status">
            Take {topic.vivaQuestions.length} timed follow-up
            {topic.vivaQuestions.length === 1 ? "" : "s"}, climbing from Recall
            toward Defend. The microphone is optional; target-concept coverage is not a grade.
          </p>
          <button type="button" className="primary" onClick={onBeginViva}>
            Begin viva
          </button>
        </section>
      ) : (
        <p className="status">
          Viva is unavailable for this topic: no source-grounded defense questions are
          authored for it yet.
        </p>
      )}

      <div className="toolbar">
        <button type="button" className="primary" onClick={onTryAgain}>
          Try again on this topic
        </button>
        <button type="button" className="spin" onClick={onSpinAgain}>
          Spin again
        </button>
      </div>
    </section>
  );
}
