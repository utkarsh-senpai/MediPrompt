import { audioIssueCopy } from "@/app/audioCopy";
import type { AudioUiState } from "@/practice/usePracticeSession";
import { MicPrimer } from "./MicPrimer";

function MicGlyph({ off = false }: { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v4M9 21h6" />
      {off ? <path className="mic-slash" d="M4 4l16 16" /> : null}
    </svg>
  );
}

interface MicControlProps {
  audio: AudioUiState;
  onBegin: () => void;
  onConfirm: () => void;
  onDecline: () => void;
}

/** Compact mic status: the icon is visual shorthand; every state has text. */
export function MicControl({
  audio,
  onBegin,
  onConfirm,
  onDecline,
}: MicControlProps) {
  if (audio.status === "PRIMER") {
    return <MicPrimer onConfirm={onConfirm} onDecline={onDecline} />;
  }

  if (!audio.available || audio.status === "UNAVAILABLE") {
    const label = audio.issue ? audioIssueCopy(audio.issue) : "Microphone unavailable";
    return (
      <div className="mic-choice" role="status" title={label}>
        <button type="button" className="mic-button" disabled aria-label={label}>
          <MicGlyph off />
        </button>
        <span>Mic unavailable</span>
      </div>
    );
  }

  if (audio.status === "STARTING") {
    return (
      <div className="mic-choice" role="status">
        <button type="button" className="mic-button" disabled aria-label="Starting microphone">
          <MicGlyph />
        </button>
        <span>Starting mic…</span>
      </div>
    );
  }

  if (audio.status === "ACTIVE") {
    return (
      <div className="mic-choice is-active" role="status">
        <span className="mic-button" aria-hidden="true">
          <MicGlyph />
        </span>
        <span>Recording locally</span>
      </div>
    );
  }

  const ready = audio.status === "READY";
  return (
    <div className={`mic-choice${ready ? " is-ready" : ""}`}>
      <button
        type="button"
        className="mic-button"
        aria-label={ready ? "Disable microphone for the next timer" : "Enable microphone feedback"}
        aria-pressed={ready}
        onClick={ready ? onDecline : onBegin}
      >
        <MicGlyph off={!ready} />
      </button>
      <span>{ready ? "Mic starts with timer" : "Mic off"}</span>
    </div>
  );
}
