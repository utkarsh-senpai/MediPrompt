import {
  type SettingsStore,
  type UserSettings,
  DEFAULT_SETTINGS,
  TIME_BOUNDS,
} from "@/practice/types";

// Browser storage is untrusted: malformed JSON, denied access, quota errors, or a
// newer schema must fall back to immutable defaults. Never recursively merge parsed
// data; build the domain object explicitly from validated own properties.

const STORAGE_KEY = "mediprompt:settings:v1";

function clampFiniteSeconds(
  raw: unknown,
  bounds: { min: number; max: number },
  fallback: number,
): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return fallback;
  const v = Math.round(raw);
  if (v < bounds.min) return bounds.min;
  if (v > bounds.max) return bounds.max;
  return v;
}

function parseSettings(raw: unknown): UserSettings | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  // Reject dangerous object keys.
  for (const dangerous of ["__proto__", "prototype", "constructor"]) {
    if (Object.prototype.hasOwnProperty.call(obj, dangerous)) return null;
  }
  if (obj["schemaVersion"] !== 1) return null; // reject unknown / newer schema
  const speakingSeconds = clampFiniteSeconds(
    obj["speakingSeconds"],
    TIME_BOUNDS.speakingSeconds,
    DEFAULT_SETTINGS.speakingSeconds,
  );
  const researchSeconds = clampFiniteSeconds(
    obj["researchSeconds"],
    TIME_BOUNDS.researchSeconds,
    DEFAULT_SETTINGS.researchSeconds,
  );
  return { schemaVersion: 1, speakingSeconds, researchSeconds };
}

function safeStorage(): Storage | null {
  try {
    const s = globalThis.localStorage;
    if (!s) return null;
    // probe access
    s.getItem(STORAGE_KEY);
    return s;
  } catch {
    return null;
  }
}

export class LocalStorageSettingsStore implements SettingsStore {
  private readonly mem = new InMemorySettingsStore();

  load(): UserSettings {
    const s = safeStorage();
    if (!s) return this.mem.load();
    try {
      const raw = s.getItem(STORAGE_KEY);
      const parsed = raw ? parseSettings(JSON.parse(raw)) : null;
      return parsed ?? this.mem.load();
    } catch {
      return this.mem.load();
    }
  }

  save(settings: UserSettings): void {
    const s = safeStorage();
    if (!s) {
      this.mem.save(settings);
      return;
    }
    try {
      s.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      this.mem.save(settings);
    }
  }

  clear(): void {
    const s = safeStorage();
    if (s) {
      try {
        s.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    this.mem.clear();
  }
}

export class InMemorySettingsStore implements SettingsStore {
  private current: UserSettings = { ...DEFAULT_SETTINGS };

  load(): UserSettings {
    return { ...this.current };
  }

  save(settings: UserSettings): void {
    this.current = parseSettings(settings) ?? { ...DEFAULT_SETTINGS };
  }

  clear(): void {
    this.current = { ...DEFAULT_SETTINGS };
  }
}
