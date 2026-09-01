import type { AudioUiState } from "@/practice/usePracticeSession";
import type { TopicSnapshot, VivaQuestion } from "@/practice/types";
import { vivaLevelLabel } from "./vivaLevel";
import { MicControl } from "./MicControl";

interface VivaQuestionCardProps {
  topic: TopicSnapshot;
  question: VivaQuestion;
  questionIndex: number;
  total: number;
  audio: AudioUiState;
  onBeginAudioOptIn: () => void;
  onConfirmAudioOptIn: () => void;
  onCancelAudioOptIn: () => void;
  onStartSpeaking: () => void;
  onExit: () => void;
}

/** A single defense question, pre-speak. Mirrors the topic-ready affordances. */
export function VivaQuestionCard({
  topic,
  question,
  questionIndex,
  total,
  audio,
  onBeginAudioOptIn,
  onConfirmAudioOptIn,
  onCancelAudioOptIn,
  onStartSpeaking,
  onExit,
}: VivaQuestionCardProps) {
  return (
    <section aria-labelledby="viva-asking-heading">
      <h2 id="viva-asking-heading" tabIndex={-1}>
        {topic.title}
      </h2>
      <p className="status">
        Viva · question {questionIndex + 1} of {total} · {vivaLevelLabel(question.level)}
      </p>
      <p className="prompt-copy">{question.prompt}</p>
      <div className="toolbar">
        <button
          type="button"
          className="primary"
          onClick={onStartSpeaking}
          disabled={audio.status === "STARTING" || audio.status === "PRIMER"}
        >
          {audio.status === "STARTING" ? "Starting mic…" : "Start speaking"}
        </button>
        <button type="button" onClick={onExit}>
          Exit viva
        </button>
      </div>
      <MicControl
        audio={audio}
        onBegin={onBeginAudioOptIn}
        onConfirm={onConfirmAudioOptIn}
        onDecline={onCancelAudioOptIn}
      />
    </section>
  );
}
