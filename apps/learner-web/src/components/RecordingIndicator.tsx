/**
 * Visible + announced recording status during the speaking window. The dot is
 * decorative; the words carry the meaning (no color-only signaling).
 */
export function RecordingIndicator() {
  return (
    <p className="recording-indicator" role="status">
      <span className="recording-dot" aria-hidden="true" />
      Recording · on this device only
    </p>
  );
}
