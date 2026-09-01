import type { SpeechArcStep } from "@/practice/types";

const PHASES = ["What?", "So what?", "Now what?"] as const;

interface AnswerCompassProps {
  steps: SpeechArcStep[];
  remainingMs?: number | null;
  totalMs?: number;
  active?: boolean;
}

/**
 * A three-beat speaking compass. Pack-specific arc labels remain available to
 * assistive technology and as native hover text, while the visual language is
 * deliberately consistent across every topic.
 */
export function AnswerCompass({
  steps,
  remainingMs = null,
  totalMs = 0,
  active = false,
}: AnswerCompassProps) {
  const elapsedFraction =
    active && remainingMs !== null && totalMs > 0
      ? Math.max(0, Math.min(1, 1 - remainingMs / totalMs))
      : 0;
  const activeIndex = active
    ? Math.min(PHASES.length - 1, Math.floor(elapsedFraction * PHASES.length))
    : -1;

  return (
    <ol className="answer-compass" aria-label="Speaking path">
      {PHASES.map((phase, index) => {
        const guidance = steps[index]?.label ?? phase.replace("?", "");
        const isCurrent = index === activeIndex;
        const isComplete = activeIndex > index;
        return (
          <li
            key={phase}
            className={isCurrent ? "is-current" : isComplete ? "is-complete" : ""}
            aria-current={isCurrent ? "step" : undefined}
            aria-label={`${phase} ${guidance}${isCurrent ? ", current phase" : ""}`}
            title={guidance}
          >
            <span className="compass-node" aria-hidden="true" />
            <span>{phase}</span>
          </li>
        );
      })}
    </ol>
  );
}
