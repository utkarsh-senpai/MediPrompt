import type { AudioUiState } from "@/practice/usePracticeSession";
import type {
  ApprovedTranscript,
  DeliveryMetrics,
  TextMetrics,
  TopicSnapshot,
} from "@/practice/types";
import { DeliveryPanel } from "./DeliveryPanel";
import { PlaybackBar } from "./PlaybackBar";

interface AttemptReviewProps {
  topic: TopicSnapshot;
  metrics: DeliveryMetrics | null;
  textMetrics: TextMetrics | null;
  transcript: ApprovedTranscript;
  audio: AudioUiState;
  onSpinAgain: () => void;
}

/** Final review screen: approved transcript (inert text) + delivery panel. */
export function AttemptReview({
  topic,
  metrics,
  textMetrics,
  transcript,
  audio,
  onSpinAgain,
}: AttemptReviewProps) {
  return (
    <section aria-labelledby="review-heading">
      <h2 id="review-heading" tabIndex={-1}>
        Attempt review
      </h2>
      <p className="status">{topic.title}</p>

      {audio.playback ? (
        <PlaybackBar url={audio.playback.url} durationMs={audio.playback.durationMs} />
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

      {metrics ? <DeliveryPanel metrics={metrics} textMetrics={textMetrics} /> : null}

      <div className="toolbar">
        <button type="button" className="spin" onClick={onSpinAgain}>
          Spin again
        </button>
      </div>
    </section>
  );
}
