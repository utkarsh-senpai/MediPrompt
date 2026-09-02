import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStorageSettingsStore, InMemorySettingsStore } from "./settingsStore";
import { DEFAULT_SETTINGS, TIME_BOUNDS } from "@/practice/types";

describe("InMemorySettingsStore", () => {
  it("defaults to 60 seconds speaking and 10 minutes research", () => {
    expect(DEFAULT_SETTINGS.speakingSeconds).toBe(60);
    expect(DEFAULT_SETTINGS.researchSeconds).toBe(600);
  });

  it("loads defaults and clamps on save", () => {
    const store = new InMemorySettingsStore();
    expect(store.load()).toEqual(DEFAULT_SETTINGS);
    store.save({
      schemaVersion: 1,
      speakingSeconds: 5,
      researchSeconds: 99_999,
    });
    expect(store.load().speakingSeconds).toBe(TIME_BOUNDS.speakingSeconds.min);
    expect(store.load().researchSeconds).toBe(TIME_BOUNDS.researchSeconds.max);
  });

  it("clear resets to defaults", () => {
    const store = new InMemorySettingsStore();
    store.save({ schemaVersion: 1, speakingSeconds: 120, researchSeconds: 240 });
    store.clear();
    expect(store.load()).toEqual(DEFAULT_SETTINGS);
  });
});

describe("LocalStorageSettingsStore", () => {
  const KEY = "mediprompt:settings:v1";
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("persists and reloads valid settings", () => {
    const store = new LocalStorageSettingsStore();
    store.save({ schemaVersion: 1, speakingSeconds: 120, researchSeconds: 240 });
    const raw = localStorage.getItem(KEY);
    expect(raw).toBeTruthy();
    const again = new LocalStorageSettingsStore();
    expect(again.load().speakingSeconds).toBe(120);
    expect(again.load().researchSeconds).toBe(240);
  });

  it("falls back to defaults on malformed JSON", () => {
    localStorage.setItem(KEY, "{not json");
    expect(new LocalStorageSettingsStore().load()).toEqual(DEFAULT_SETTINGS);
  });

  it("falls back to defaults on a newer schema version", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ schemaVersion: 2, speakingSeconds: 60, researchSeconds: 60 }),
    );
    expect(new LocalStorageSettingsStore().load()).toEqual(DEFAULT_SETTINGS);
  });

  it("falls back to defaults when a dangerous key is present", () => {
    localStorage.setItem(
      KEY,
      '{"schemaVersion":1,"speakingSeconds":60,"researchSeconds":60,"__proto__":{}}',
    );
    expect(new LocalStorageSettingsStore().load()).toEqual(DEFAULT_SETTINGS);
  });

  it("rejects undeclared properties instead of merging them", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        schemaVersion: 1,
        speakingSeconds: 60,
        researchSeconds: 60,
        transcript: "must never be stored here",
      }),
    );
    expect(new LocalStorageSettingsStore().load()).toEqual(DEFAULT_SETTINGS);
  });

  it("sanitizes values before writing them", () => {
    const store = new LocalStorageSettingsStore();
    store.save({
      schemaVersion: 1,
      speakingSeconds: -10,
      researchSeconds: Number.POSITIVE_INFINITY,
    });
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({
      schemaVersion: 1,
      speakingSeconds: TIME_BOUNDS.speakingSeconds.min,
      researchSeconds: DEFAULT_SETTINGS.researchSeconds,
      soundMuted: false,
      semanticCoverage: false,
      practiceHistory: false,
    });
  });

  it("loads legacy v1 payloads that predate soundMuted", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ schemaVersion: 1, speakingSeconds: 60, researchSeconds: 90 }),
    );
    const loaded = new LocalStorageSettingsStore().load();
    expect(loaded.speakingSeconds).toBe(60);
    expect(loaded.soundMuted).toBe(false);
  });

  it("persists and reloads the soundMuted preference", () => {
    const store = new LocalStorageSettingsStore();
    store.save({
      schemaVersion: 1,
      speakingSeconds: 90,
      researchSeconds: 120,
      soundMuted: true,
    });
    expect(new LocalStorageSettingsStore().load().soundMuted).toBe(true);
  });

  it("persists and reloads the semantic coverage opt-in", () => {
    const store = new LocalStorageSettingsStore();
    store.save({
      schemaVersion: 1,
      speakingSeconds: 90,
      researchSeconds: 120,
      semanticCoverage: true,
    });
    expect(new LocalStorageSettingsStore().load().semanticCoverage).toBe(true);
  });

  it("keeps practice history off by default and persists explicit opt-in", () => {
    const store = new LocalStorageSettingsStore();
    expect(store.load().practiceHistory).toBe(false);
    store.save({
      schemaVersion: 1,
      speakingSeconds: 60,
      researchSeconds: 600,
      practiceHistory: true,
    });
    expect(new LocalStorageSettingsStore().load().practiceHistory).toBe(true);
  });

  it("falls back to in-memory when localStorage is unavailable", () => {
    const original = globalThis.localStorage;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).localStorage;
    const store = new LocalStorageSettingsStore();
    expect(store.load()).toEqual(DEFAULT_SETTINGS);
    expect(() =>
      store.save({ schemaVersion: 1, speakingSeconds: 100, researchSeconds: 100 }),
    ).not.toThrow();
    expect(store.load().speakingSeconds).toBe(100);
    globalThis.localStorage = original;
  });

  it("falls back when getItem throws (denied access)", () => {
    vi.spyOn(globalThis.localStorage, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(new LocalStorageSettingsStore().load()).toEqual(DEFAULT_SETTINGS);
  });

  it("does not throw on quota error during save", () => {
    vi.spyOn(globalThis.localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const store = new LocalStorageSettingsStore();
    expect(() =>
      store.save({ schemaVersion: 1, speakingSeconds: 100, researchSeconds: 100 }),
    ).not.toThrow();
    expect(store.load().speakingSeconds).toBe(100);
  });
});
