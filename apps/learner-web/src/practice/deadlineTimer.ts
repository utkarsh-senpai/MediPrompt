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

function validateMonotonicMs(value: unknown, label: string): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > Number.MAX_SAFE_INTEGER
  ) {
    throw new Error(`${label} must be a finite non-negative monotonic time`);
  }
  return value;
}

export function startDeadline(now: number, durationMs: number): number {
  const current = validateMonotonicMs(now, "now");
  const deadline = current + validateDurationMs(durationMs);
  if (!Number.isFinite(deadline) || deadline > Number.MAX_SAFE_INTEGER) {
    throw new Error("deadline overflows the monotonic time range");
  }
  return deadline;
}

export function remainingMs(deadlineAt: number, now: number): number {
  const deadline = validateMonotonicMs(deadlineAt, "deadline");
  const current = validateMonotonicMs(now, "now");
  return Math.max(0, Math.trunc(deadline) - Math.trunc(current));
}

export function isElapsed(deadlineAt: number, now: number): boolean {
  const deadline = validateMonotonicMs(deadlineAt, "deadline");
  const current = validateMonotonicMs(now, "now");
  return Math.trunc(current) >= Math.trunc(deadline);
}
