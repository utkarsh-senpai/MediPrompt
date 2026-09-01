import type { AudioUiState } from "@/practice/usePracticeSession";
import type {
  ApprovedTranscript,
  CoverageReport,
  DeliveryMetrics,
  GapDirection,
  TextMetrics,
  TopicSnapshot,
} from "@/practice/types";
import { formatGapScore, gapDirectionCopy } from "@/scoring/gapScore";
import { CoveragePanel } from "./CoveragePanel";
import { DeliveryPanel } from "./DeliveryPanel";
import { PlaybackBar } from "./PlaybackBar";

interface AttemptReviewProps {
  topic: TopicSnapshot;
  metrics: DeliveryMetrics | null;
  textMetrics: TextMetrics | null;
  transcript: ApprovedTranscript;
  coverage: CoverageReport;
  /** Prior attempt coverage; null on attempt 1 → no Gap Score block. */
  priorCoverage: CoverageReport | null;
  gapScore: number | null;
  gapDirection: GapDirection | null;
  attemptIndex: number;
  audio: AudioUiState;
  onSpinAgain: () => void;
  onTryAgain: () => void;
}

/** Final review screen: approved transcript, content coverage, Gap Score, and delivery. */
export function AttemptReview({
  topic,
  metrics,
  textMetrics,
  transcript,
  coverage,
  priorCoverage,
  gapScore,
  gapDirection,
  attemptIndex,
  audio,
  onSpinAgain,
  onTryAgain,
}: AttemptReviewProps) {
  const showGap = priorCoverage !== null && gapScore !== null && gapDirection !== null;

  return (
    <section aria-labelledby="review-heading">
      <h2 id="review-heading" tabIndex={-1}>
        Attempt review{attemptIndex > 1 ? ` (attempt ${attemptIndex})` : ""}
      </h2>
      <p className="status">{topic.title}</p>

      {audio.playback ? (
        <PlaybackBar url={audio.playback.url} durationMs={audio.playback.durationMs} />
      ) : null}

      {showGap ? (
        <section className="gap-score-panel" aria-labelledby="gap-score-heading">
          <h3 id="gap-score-heading">Gap Score</h3>
          <p className="gap-score-value" aria-live="polite">
            {formatGapScore(gapScore as number)}
          </p>
          <p className="status">{gapDirectionCopy(gapDirection as GapDirection)}</p>
          <p className="status">
            Gap Score is the change in coverage versus your previous attempt on this topic — not a
            measure of correctness.
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
