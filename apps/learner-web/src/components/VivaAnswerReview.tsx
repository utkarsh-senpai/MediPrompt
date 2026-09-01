import type { AudioUiState } from "@/practice/usePracticeSession";
import type {
  ApprovedTranscript,
  CoverageReport,
  DeliveryMetrics,
  TextMetrics,
  TopicSnapshot,
  VivaQuestion,
} from "@/practice/types";
import { vivaLevelLabel } from "./vivaLevel";
import { CoveragePanel } from "./CoveragePanel";
import { DeliveryPanel } from "./DeliveryPanel";
import { PlaybackBar } from "./PlaybackBar";

interface VivaAnswerReviewProps {
  topic: TopicSnapshot;
  question: VivaQuestion;
  questionIndex: number;
  total: number;
  transcript: ApprovedTranscript;
  coverage: CoverageReport;
  metrics: DeliveryMetrics | null;
  textMetrics: TextMetrics | null;
  semanticRefining: boolean;
  audio: AudioUiState;
  onNext: () => void;
  onExit: () => void;
}

/** Review of one defense answer: coverage against the question’s targets only. */
export function VivaAnswerReview({
  topic,
  question,
  questionIndex,
  total,
  transcript,
  coverage,
  metrics,
  textMetrics,
  semanticRefining,
  audio,
  onNext,
  onExit,
}: VivaAnswerReviewProps) {
  const isLast = questionIndex + 1 >= total;
  return (
    <section aria-labelledby="viva-review-heading">
      <h2 id="viva-review-heading" tabIndex={-1}>
        {topic.title}
      </h2>
      <p className="status">
        Viva · question {questionIndex + 1} of {total} · {vivaLevelLabel(question.level)}
      </p>
      <p className="prompt-copy">{question.prompt}</p>

      {semanticRefining ? (
        <p className="status" role="status">
          Checking related wording on this device… Lexical coverage is already available.
        </p>
      ) : null}

      {audio.playback ? (
        <PlaybackBar url={audio.playback.url} durationMs={audio.playback.durationMs} />
      ) : null}

      <section className="topic-card" aria-labelledby="viva-transcript-heading">
        <h3 id="viva-transcript-heading">Your defense transcript</h3>
        <p className="transcript-text">{transcript.text || "No transcript saved."}</p>
      </section>

      <CoveragePanel coverage={coverage} />

      {metrics ? <DeliveryPanel metrics={metrics} textMetrics={textMetrics} /> : null}

      <div className="toolbar">
        <button type="button" className="primary" onClick={onNext}>
          {isLast ? "Finish viva" : "Next question"}
        </button>
        <button type="button" onClick={onExit}>
          Exit viva
        </button>
      </div>
    </section>
  );
}
