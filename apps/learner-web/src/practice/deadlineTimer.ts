// Pure deadline math. A monotonic clock drives an active timer; wall-clock ISO is
// used only for in-memory metadata. The deadline event is idempotent and fires once.

export function validateDurationMs(ms: unknown): number {
  if (typeof ms !== "number" || !Number.isFinite(ms)) {
    throw new Error("duration must be a finite number");
  }
  const v = Math.trunc(ms);
  if (v <= 0) throw new Error("duration must be positive");
  if (v > 24 * 60 * 60 * 1000) throw new Error("duration exceeds one day");
  return v;
}

export function startDeadline(now: number, durationMs: number): number {
  return now + validateDurationMs(durationMs);
}

export function remainingMs(deadlineAt: number, now: number): number {
  return Math.max(0, Math.trunc(deadlineAt) - Math.trunc(now));
}

export function isElapsed(deadlineAt: number, now: number): boolean {
  return Math.trunc(now) >= Math.trunc(deadlineAt);
}
