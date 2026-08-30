import type { DeliveryMetrics, TextMetrics } from "@/practice/types";

interface DeliveryPanelProps {
  metrics: DeliveryMetrics;
  /** Transcript-derived observations; present only after transcript approval. */
  textMetrics?: TextMetrics | null;
}

function formatMs(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

/**
 * Delivery observations, visually and verbally separate from anything about
 * content quality. Absent fields are "not measurable", never zero.
 */
export function DeliveryPanel({ metrics, textMetrics }: DeliveryPanelProps) {
  const pauseCount = metrics.pauses.length;
  const pauseTotalMs = metrics.pauses.reduce((sum, p) => sum + p.durationMs, 0);

  return (
    <section className="delivery-panel" aria-labelledby="delivery-heading">
      <h3 id="delivery-heading">Delivery observations</h3>
      <p className="status">
        What this measures: how the attempt sounded — timing, pauses, audible fillers.
        What it does not: whether the content was correct, complete, or good.
      </p>
      <dl className="metric-list">
        <div>
          <dt>Recording length</dt>
          <dd>{formatMs(metrics.durationMs)}</dd>
        </div>
        <div>
          <dt>Time speaking</dt>
          <dd>
            {metrics.spokenMs !== undefined
              ? formatMs(metrics.spokenMs)
              : "Not measurable on this recording"}
          </dd>
        </div>
        <div>
          <dt>Pauses</dt>
          <dd>
            {pauseCount > 0
              ? `${pauseCount} (about ${formatMs(pauseTotalMs)} total)`
              : "None detected"}
          </dd>
        </div>
        {textMetrics ? (
          <>
            <div>
              <dt>Speaking pace</dt>
              <dd>
                {textMetrics.wordsPerMinute !== undefined
                  ? `${textMetrics.wordsPerMinute} words per minute`
                  : "Needs time-speaking data"}
              </dd>
            </div>
            <div>
              <dt>Filler words heard</dt>
              <dd>{textMetrics.fillerCount ?? "Not measurable"}</dd>
            </div>
            <div>
              <dt>Repeated phrases</dt>
              <dd>{textMetrics.repeatedPhraseCount ?? "Not measurable"}</dd>
            </div>
          </>
        ) : null}
        {metrics.clippingRatio !== undefined ? (
          <div>
            <dt>Mic clipping</dt>
            <dd>
              {metrics.clippingRatio === 0
                ? "None detected"
                : `${(metrics.clippingRatio * 100).toFixed(1)}% of samples — try speaking a little farther from the mic`}
            </dd>
          </div>
        ) : null}
        {metrics.loudnessVariationDb !== undefined ? (
          <div>
            <dt>Loudness variation</dt>
            <dd>{metrics.loudnessVariationDb.toFixed(1)} dB within this recording</dd>
          </div>
        ) : null}
      </dl>
      <ul className="limitations">
        {metrics.limitations.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  );
}
