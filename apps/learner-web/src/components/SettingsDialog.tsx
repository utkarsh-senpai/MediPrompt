import { useEffect, useRef, useState, type FormEvent } from "react";
import { TIME_BOUNDS } from "@/practice/types";
import type { SettingsStore, UserSettings } from "@/practice/types";
import { InfoTip } from "./InfoTip";

interface SettingsDialogProps {
  store: SettingsStore;
  settings: UserSettings;
  semanticCoverageAvailable: boolean;
  onClose: () => void;
  onSaved: (next: UserSettings) => void;
}

export function SettingsDialog({
  store,
  settings,
  semanticCoverageAvailable,
  onClose,
  onSaved,
}: SettingsDialogProps) {
  const [speakingSeconds, setSpeakingSeconds] = useState(
    String(settings.speakingSeconds),
  );
  const [researchSeconds, setResearchSeconds] = useState(
    String(settings.researchSeconds),
  );
  const [soundMuted, setSoundMuted] = useState(settings.soundMuted ?? false);
  const [semanticCoverage, setSemanticCoverage] = useState(
    settings.semanticCoverage ?? false,
  );
  const [practiceHistory, setPracticeHistory] = useState(
    settings.practiceHistory ?? false,
  );
  const [hardToCatchHints, setHardToCatchHints] = useState(
    settings.hardToCatchHints ?? false,
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    firstInputRef.current?.focus();
    return () => {
      if (dialog.open && typeof dialog.close === "function") dialog.close();
      previouslyFocused?.focus();
    };
  }, []);

  const clamp = (v: number, bounds: { min: number; max: number }) =>
    Math.max(bounds.min, Math.min(bounds.max, v));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: UserSettings = {
      schemaVersion: 1,
      speakingSeconds: clamp(
        Math.round(Number(speakingSeconds) || settings.speakingSeconds),
        TIME_BOUNDS.speakingSeconds,
      ),
      researchSeconds: clamp(
        Math.round(Number(researchSeconds) || settings.researchSeconds),
        TIME_BOUNDS.researchSeconds,
      ),
      soundMuted,
      semanticCoverage,
      practiceHistory,
      hardToCatchHints,
    };
    store.save(next);
    onSaved(next);
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="settings-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <form onSubmit={submit}>
        <h2 id="settings-title">Settings</h2>
        <div className="control-row">
          <span className="label-row">
            <label htmlFor="speaking-seconds">
              Speaking time (seconds, {TIME_BOUNDS.speakingSeconds.min}–
              {TIME_BOUNDS.speakingSeconds.max})
            </label>
            <InfoTip label="About speaking time">
              The countdown for your spoken answer. A shorter clock forces sharper
              structure; a longer one allows more depth.
            </InfoTip>
          </span>
          <input
            ref={firstInputRef}
            id="speaking-seconds"
            type="number"
            inputMode="numeric"
            min={TIME_BOUNDS.speakingSeconds.min}
            max={TIME_BOUNDS.speakingSeconds.max}
            required
            value={speakingSeconds}
            onChange={(e) => setSpeakingSeconds(e.target.value)}
          />
        </div>
        <div className="control-row">
          <span className="label-row">
            <label htmlFor="research-seconds">
              Research time (seconds, {TIME_BOUNDS.researchSeconds.min}–
              {TIME_BOUNDS.researchSeconds.max})
            </label>
            <InfoTip label="About research time">
              In Deep Research mode this is your reading time before the speaking
              clock starts. It has no effect in Recall Sprint.
            </InfoTip>
          </span>
          <input
            id="research-seconds"
            type="number"
            inputMode="numeric"
            min={TIME_BOUNDS.researchSeconds.min}
            max={TIME_BOUNDS.researchSeconds.max}
            required
            value={researchSeconds}
            onChange={(e) => setResearchSeconds(e.target.value)}
          />
        </div>
        <div className="settings-sound">
          <input
            id="sound-enabled"
            type="checkbox"
            checked={!soundMuted}
            onChange={(e) => setSoundMuted(!e.target.checked)}
          />
          <label htmlFor="sound-enabled">
            Sound effects
            <span className="settings-hint">
              Soft cues for spins and the timer, synthesized on this device.
            </span>
          </label>
        </div>
        <div className="settings-sound">
          <input
            id="practice-history"
            type="checkbox"
            checked={practiceHistory}
            onChange={(e) => setPracticeHistory(e.target.checked)}
          />
          <label htmlFor="practice-history">
            Private learning plan
            <span className="settings-hint">
              Save bounded topic, date, and aggregate coverage metadata on this device for spaced
              practice. Audio, transcripts, and transcript excerpts are never saved.
            </span>
          </label>
        </div>
        <div className="settings-sound">
          <input
            id="semantic-coverage"
            type="checkbox"
            checked={semanticCoverage}
            disabled={!semanticCoverageAvailable}
            onChange={(e) => setSemanticCoverage(e.target.checked)}
          />
          <label htmlFor="semantic-coverage">
            Meaning-match evidence (beta)
            <span className="settings-hint">
              {semanticCoverageAvailable
                ? "Refine content coverage with on-device meaning matching (downloads a small model on first use). The lexical baseline runs first, so this never blocks practice."
                : "Meaning matching needs WebAssembly and Web Worker support on this browser; lexical coverage remains available."}
            </span>
          </label>
        </div>
        <div className="settings-sound">
          <input
            id="hard-to-catch-hints"
            type="checkbox"
            checked={hardToCatchHints}
            onChange={(e) => setHardToCatchHints(e.target.checked)}
          />
          <label htmlFor="hard-to-catch-hints">
            Hard-to-catch hint button
            <span className="settings-hint">
              Show a wobbly hint button that drifts around during the speaking
              timer. Catching it reveals one answer beat. It deliberately adds
              pressure while you speak, so it is off by default. Reduced-motion
              users get a static, keyboard-accessible version instead.
            </span>
          </label>
        </div>
        <div className="toolbar">
          <button type="submit" className="primary">
            Save
          </button>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </dialog>
  );
}
