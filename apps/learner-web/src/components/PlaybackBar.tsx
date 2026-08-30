interface PlaybackBarProps {
  url: string;
  durationMs: number;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * In-app playback of the just-recorded attempt. The blob URL is session-local
 * and revoked on spin-again, discard, or navigation — nothing persists.
 */
export function PlaybackBar({ url, durationMs }: PlaybackBarProps) {
  return (
    <section className="playback" aria-label="Listen to your attempt">
      <audio controls preload="metadata" src={url}>
        Your browser cannot play this recording.
      </audio>
      <p className="status">
        {formatDuration(durationMs)} · only you can hear this — it never leaves your
        device
      </p>
    </section>
  );
}
