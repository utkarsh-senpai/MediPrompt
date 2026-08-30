import { useState } from "react";
import type { AudioUiState } from "@/practice/usePracticeSession";
import type { DeliveryMetrics, TranscriptionUnavailableReason } from "@/practice/types";
import { audioIssueCopy, transcriptionIssueCopy } from "@/app/audioCopy";
import { DeliveryPanel } from "./DeliveryPanel";
import { PlaybackBar } from "./PlaybackBar";

interface SelfReviewProps {
  metrics: DeliveryMetrics | null;
  transcriptionIssue: TranscriptionUnavailableReason | null;
  audio: AudioUiState;
  onSubmit: (text: string) => void;
  onRetryTranscription: () => void;
}

/**
 * The equal first-class no-transcript path: playback (if recorded), delivery
 * observations (if measured), and a typed recap from memory.
 */
export function SelfReview({
  metrics,
  transcriptionIssue,
  audio,
  onSubmit,
  onRetryTranscription,
}: SelfReviewProps) {
  const [text, setText] = useState("");
  const canRetry = transcriptionIssue !== null && transcriptionIssue !== "DECLINED" && audio.playback !== null;

  return (
    <section aria-labelledby="review-heading">
      <h2 id="review-heading" tabIndex={-1}>
        Review your attempt
      </h2>

      {audio.issue ? (
        <p className="status" role="status">
          {audioIssueCopy(audio.issue)}
        </p>
      ) : null}
      {transcriptionIssue ? (
        <p className="status" role="status">
          {transcriptionIssueCopy(transcriptionIssue)}
        </p>
      ) : null}

      {audio.playback ? (
        <PlaybackBar url={audio.playback.url} durationMs={audio.playback.durationMs} />
      ) : null}

      {metrics ? <DeliveryPanel metrics={metrics} /> : null}

      {canRetry ? (
        <div className="toolbar">
          <button type="button" onClick={onRetryTranscription}>
            Try transcription again
          </button>
        </div>
      ) : null}

      <div className="control-row">
        <label htmlFor="self-review-text">
          Type what you said, as best you remember (optional but recommended)
        </label>
        <textarea
          id="self-review-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
        />
      </div>
      <div className="toolbar">
        <button type="button" className="primary" onClick={() => onSubmit(text)}>
          Save review
        </button>
      </div>
    </section>
  );
}
