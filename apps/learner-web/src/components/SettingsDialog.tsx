import { useEffect, useRef, useState, type FormEvent } from "react";
import { TIME_BOUNDS } from "@/practice/types";
import type { SettingsStore, UserSettings } from "@/practice/types";

interface SettingsDialogProps {
  store: SettingsStore;
  settings: UserSettings;
  onClose: () => void;
  onSaved: (next: UserSettings) => void;
}

export function SettingsDialog({
  store,
  settings,
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
          <label htmlFor="speaking-seconds">
            Speaking time (seconds, {TIME_BOUNDS.speakingSeconds.min}–
            {TIME_BOUNDS.speakingSeconds.max})
          </label>
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
          <label htmlFor="research-seconds">
            Research time (seconds, {TIME_BOUNDS.researchSeconds.min}–
            {TIME_BOUNDS.researchSeconds.max})
          </label>
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
