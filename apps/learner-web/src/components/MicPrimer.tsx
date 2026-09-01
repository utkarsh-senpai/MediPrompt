interface MicPrimerProps {
  onConfirm: () => void;
  onDecline: () => void;
}

/**
 * Shown before the browser permission prompt (never on page load, at most once
 * per session). Plain-language explanation of what the mic is for and the
 * privacy guarantee, so the browser prompt is never a surprise.
 */
export function MicPrimer({ onConfirm, onDecline }: MicPrimerProps) {
  return (
    <section className="topic-card primer" aria-labelledby="mic-primer-heading">
      <h3 id="mic-primer-heading">Enable microphone feedback?</h3>
      <p>
        Choose the mic now and your browser will ask for access only when you start the
        speaking timer. Recording stops with the timer. MediPrompt can then measure
        pace and pauses and, on your request, transcribe on this device.
      </p>
      <p>
        <strong>Your audio never leaves this device.</strong> There is no account, no
        upload, and nothing is stored after you leave or spin again.
      </p>
      <p className="status">
        This is optional. Without the mic, the timer and self-review work exactly the
        same.
      </p>
      <div className="toolbar">
        <button type="button" className="primary" onClick={onConfirm}>
          Use mic with timer
        </button>
        <button type="button" onClick={onDecline}>
          Not now
        </button>
      </div>
    </section>
  );
}
