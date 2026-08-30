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

const REQUIRED_KEYS = ["researchSeconds", "schemaVersion", "speakingSeconds"];
const OPTIONAL_KEYS = ["soundMuted"];

function parseSettings(raw: unknown): UserSettings | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const allowed = new Set([...REQUIRED_KEYS, ...OPTIONAL_KEYS]);
  const actualKeys = Object.keys(obj);
  // All required keys present, unknown keys rejected; optional keys may be absent
  // (legacy v1 payloads predate soundMuted) and default when missing.
  if (actualKeys.some((key) => !allowed.has(key))) return null;
  if (REQUIRED_KEYS.some((key) => !Object.prototype.hasOwnProperty.call(obj, key))) {
    return null;
  }
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
  const soundMuted =
    typeof obj["soundMuted"] === "boolean" ? obj["soundMuted"] : false;
  return { schemaVersion: 1, speakingSeconds, researchSeconds, soundMuted };
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
      if (!parsed) return this.mem.load();
      this.mem.save(parsed);
      return parsed;
    } catch {
      return this.mem.load();
    }
  }

  save(settings: UserSettings): void {
    const parsed = parseSettings(settings) ?? { ...DEFAULT_SETTINGS };
    this.mem.save(parsed);
    const s = safeStorage();
    if (!s) return;
    try {
      s.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch {
      // The already-updated memory store remains the current-session fallback.
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
