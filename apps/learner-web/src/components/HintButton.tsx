import { useEffect, useState } from "react";

// Opt-in "hard-to-catch" hint button shown during the speaking timer. It
// wobbles and drifts to random spots; catching it reveals one answer beat,
// deliberately adding cognitive load while speaking. Reduced-motion users get a
// static, keyboard-accessible version that never moves. No focus trap: the
// button is a normal tabbable control and the revealed hint is plain text.
//
// The parent keys this component by topic id, so revealed hints reset naturally
// on a new topic without a state-setting effect.

const REPOSITION_INTERVAL_MS = 2600;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function randomPos(): { top: string; left: string } {
  const top = 8 + Math.floor(Math.random() * 74);
  const left = 8 + Math.floor(Math.random() * 74);
  return { top: `${top}%`, left: `${left}%` };
}

export interface HintButtonProps {
  /** One short hint revealed per catch (rubric concept label or answer beat). */
  hints: readonly string[];
  /** Master switch from settings; when false the button never renders. */
  enabled: boolean;
}

export function HintButton({ hints, enabled }: HintButtonProps) {
  const [reduceMotion] = useState(prefersReducedMotion);
  const [pos, setPos] = useState<{ top: string; left: string }>(() =>
    reduceMotion ? { top: "auto", left: "auto" } : randomPos(),
  );
  const [revealed, setRevealed] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled || reduceMotion || hints.length === 0) return;
    const id = window.setInterval(() => setPos(randomPos()), REPOSITION_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [enabled, reduceMotion, hints.length]);

  if (!enabled || hints.length === 0) return null;

  const exhausted = revealed.length >= hints.length;

  const onCatch = () => {
    if (exhausted) return;
    setRevealed((current) => [...current, hints[current.length]!]);
  };

  const style = reduceMotion ? undefined : { top: pos.top, left: pos.left };

  return (
    <div className={`hint-catch${reduceMotion ? " is-static" : ""}`}>
      <button
        type="button"
        className="hint-catch-button"
        onClick={onCatch}
        disabled={exhausted}
        style={style}
        aria-label="Catch for a hint"
        title={exhausted ? "No more hints" : "Catch for a hint"}
      >
        {exhausted ? "✓" : "?"}
      </button>
      {revealed.length > 0 ? (
        <ul className="hint-catch-revealed" aria-live="polite">
          {revealed.map((hint, index) => (
            <li key={index}>{hint}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
