import type { TopicSnapshot, VivaLevel, VivaQuestion } from "@/practice/types";
import { vivaLevelLabel } from "./vivaLevel";

const LEVEL_ORDER: VivaLevel[] = [
  "RECALL",
  "EXPLAIN",
  "APPLY",
  "DIFFERENTIATE",
  "DEFEND",
];

interface VivaOverviewProps {
  topic: TopicSnapshot;
  questions: VivaQuestion[];
  onBegin: () => void;
  onExit: () => void;
}

/** Pre-start overview of the defense ladder. Viva is opt-in and always escapable. */
export function VivaOverview({ topic, questions, onBegin, onExit }: VivaOverviewProps) {
  const ordered = [...questions].sort(
    (a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level),
  );
  return (
    <section aria-labelledby="viva-asking-heading">
      <h2 id="viva-asking-heading" tabIndex={-1}>
        Viva: {topic.title}
      </h2>
      <p className="status">
        The examiner asks {questions.length} follow-up
        {questions.length === 1 ? "" : "s"}, climbing from Recall toward Defend.
        You answer each one aloud, transcribed on this device, and see coverage
        against that question’s target concepts. Viva coverage is not a grade.
      </p>
      <ol className="viva-ladder">
        {ordered.map((question) => (
          <li key={question.id} className="viva-ladder-step">
            <span className="eyebrow" aria-hidden="true">
              {vivaLevelLabel(question.level)}
            </span>
            <span>{question.prompt}</span>
          </li>
        ))}
      </ol>
      <div className="toolbar">
        <button type="button" className="primary" onClick={onBegin}>
          Begin viva
        </button>
        <button type="button" onClick={onExit}>
          Back to attempt review
        </button>
      </div>
    </section>
  );
}
