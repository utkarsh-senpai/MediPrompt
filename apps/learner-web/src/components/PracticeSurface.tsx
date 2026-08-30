import type {
  ChallengePreset,
  PracticeSelection,
  V02PracticeMode,
} from "@/practice/types";
import type { SubjectOption } from "@/content/packQuery";
import { subjectEmoji } from "@/app/subjectEmoji";

export interface PracticeSurfaceProps {
  subjects: SubjectOption[];
  selection: PracticeSelection;
  presets: ChallengePreset[];
  challengeVisible: boolean;
  eligibleCount: number;
  drawing: boolean;
  onChange: (partial: Partial<PracticeSelection>) => void;
  onSpin: () => void;
}

const MODES: { id: V02PracticeMode; label: string; hint: string; emoji: string }[] = [
  { id: "RECALL_SPRINT", label: "Recall Sprint", hint: "Draw a topic and speak at once.", emoji: "⚡" },
  { id: "DEEP_RESEARCH", label: "Deep Research", hint: "Research first, then speak.", emoji: "🔬" },
];

const PRESET_LABEL: Record<ChallengePreset, string> = {
  GUIDED: "Easy · Guided",
  APPLIED: "Medium · Applied",
  VIVA: "Hard · Viva",
};

export function PracticeSurface({
  subjects,
  selection,
  presets,
  challengeVisible,
  eligibleCount,
  drawing,
  onChange,
  onSpin,
}: PracticeSurfaceProps) {
  const spinDisabled = drawing || eligibleCount === 0;

  return (
    <section className="setup-surface" aria-labelledby="controls-heading">
      <h2 id="controls-heading" className="sr-only">
        Practice setup
      </h2>

      <div className="control-row">
        <span id="mode-label">Practice mode</span>
        <div
          className={`mode-switch sel-${MODES.findIndex((m) => m.id === selection.mode)}`}
          role="group"
          aria-labelledby="mode-label"
        >
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className="mode-option"
              aria-pressed={selection.mode === m.id}
              title={m.hint}
              onClick={() => onChange({ mode: m.id })}
            >
              <span className="mode-emoji" aria-hidden="true">
                {m.emoji}
              </span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {challengeVisible ? (
        <div className="control-row">
          <span id="challenge-label">Challenge</span>
          <div className="chips" role="group" aria-labelledby="challenge-label">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={selection.challenge === p}
                onClick={() => onChange({ challenge: p })}
              >
                {PRESET_LABEL[p]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="control-row">
        <label htmlFor="subject-select">Subject</label>
        <select
          id="subject-select"
          value={selection.subjectId}
          onChange={(e) => onChange({ subjectId: e.target.value })}
        >
          {subjects.map((s) => (
            <option key={s.subjectId} value={s.subjectId}>
              {subjectEmoji(s.title)} {s.title}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="spin"
        onClick={onSpin}
        disabled={spinDisabled}
        aria-label="Spin for a topic"
      >
        {drawing ? "Drawing…" : "Spin"}
      </button>

      <p className="status" role="status">
        {eligibleCount === 0
          ? "No topics for this mode in this subject yet."
          : `${eligibleCount} topic${eligibleCount === 1 ? "" : "s"} available.`}
      </p>
    </section>
  );
}

export type { V02PracticeMode };
