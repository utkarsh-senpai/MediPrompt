import { useState, type FormEvent } from "react";
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
    };
    store.save(next);
    onSaved(next);
    onClose();
  };

  return (
    <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <form onSubmit={submit}>
        <h2 id="settings-title">Settings</h2>
        <div className="control-row">
          <label htmlFor="speaking-seconds">
            Speaking time (seconds, {TIME_BOUNDS.speakingSeconds.min}–
            {TIME_BOUNDS.speakingSeconds.max})
          </label>
          <input
            id="speaking-seconds"
            type="number"
            inputMode="numeric"
            min={TIME_BOUNDS.speakingSeconds.min}
            max={TIME_BOUNDS.speakingSeconds.max}
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
            value={researchSeconds}
            onChange={(e) => setResearchSeconds(e.target.value)}
          />
        </div>
        <div className="toolbar">
          <button type="submit">Save</button>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
