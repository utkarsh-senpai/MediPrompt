interface CountdownRingProps {
  remainingMs: number;
  totalMs: number;
  /** Visible label under the number, e.g. "seconds left" or "research left". */
  caption?: string;
}

const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CountdownRing({ remainingMs, totalMs, caption }: CountdownRingProps) {
  const fraction =
    totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0;
  const offset = CIRCUMFERENCE * (1 - fraction);
  const seconds = Math.ceil(remainingMs / 1000);

  return (
    <div className="countdown">
      <svg
        viewBox="0 0 200 200"
        role="img"
        aria-label={`${caption ?? "Timer"}: ${seconds} seconds remaining`}
      >
        <circle
          className="ring-bg"
          cx="100"
          cy="100"
          r={RADIUS}
          fill="none"
          strokeWidth="12"
        />
        <circle
          className="ring-fg"
          cx="100"
          cy="100"
          r={RADIUS}
          fill="none"
          strokeWidth="12"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 100 100)"
        />
        <text
          className="time"
          x="100"
          y="110"
          textAnchor="middle"
          aria-hidden="true"
        >
          {seconds}
        </text>
      </svg>
      {caption ? (
        <p className="status" aria-hidden="true">
          {caption}
        </p>
      ) : null}
    </div>
  );
}
