// Injectable clocks. Timers use a monotonic clock; persisted metadata uses ISO wall-clock.
// Tests inject deterministic values; production reads performance.now / Date.

export interface MonotonicClock {
  now(): number;
}

export interface WallClock {
  isoNow(): string;
}

export function systemMonotonicClock(): MonotonicClock {
  return {
    now: () => performance.now(),
  };
}

export function systemWallClock(): WallClock {
  return {
    isoNow: () => new Date().toISOString(),
  };
}
