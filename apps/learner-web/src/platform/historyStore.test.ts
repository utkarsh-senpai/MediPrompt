import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  InMemoryHistoryStore,
  IndexedDbHistoryStore,
  parseAttemptRecord,
} from "./historyStore";
import { topicFingerprint } from "@/practice/spacedRepetition";
import type { AttemptRecord, CoverageReport, TopicRef } from "@/practice/types";

const ref = (topicId = "t1"): TopicRef => ({
  packId: "pack",
  packVersion: "1.0",
  subjectId: "s",
  topicId,
  variantId: "t1-v",
  difficultyProfileVersion: "1",
  promptId: "t1-p",
  rubricId: "t1-r",
});

const verifiable = (f: number): CoverageReport => ({
  verifiable: true,
  unavailableReason: null,
  scoring: { method: "LEXICAL", version: "1" },
  conceptResults: [],
  hitCount: 0,
  totalCount: 1,
  weightedFraction: f,
  fraction: f,
});

const goodRecord = (overrides: Partial<AttemptRecord> = {}): AttemptRecord => ({
  schemaVersion: 1,
  attemptId: "att-1",
  topicRef: ref(),
  mode: "RECALL_SPRINT",
  challenge: "GUIDED",
  attemptIndex: 1,
  reviewedAt: "2026-09-01T12:00:00Z",
  coverage: verifiable(0.8),
  transcriptText: "the slider closes the zipper",
  schedule: { repetitions: 1, easiness: 2.5, intervalDays: 1, nextDueAt: "2026-09-02T00:00:00Z" },
  ...overrides,
});

describe("parseAttemptRecord", () => {
  it("round-trips a well-formed record", () => {
    const parsed = parseAttemptRecord(goodRecord());
    expect(parsed).not.toBeNull();
    expect(parsed!.attemptId).toBe("att-1");
  });

  it("rejects wrong schema versions", () => {
    expect(parseAttemptRecord({ ...goodRecord(), schemaVersion: 2 })).toBeNull();
  });

  it("rejects a malformed topic ref", () => {
    expect(parseAttemptRecord({ ...goodRecord(), topicRef: { ...ref(), topicId: 5 as unknown as string } })).toBeNull();
  });

  it("rejects a malformed schedule", () => {
    expect(parseAttemptRecord({ ...goodRecord(), schedule: { ...goodRecord().schedule, easiness: "high" as unknown as number } })).toBeNull();
  });

  it("rejects an invalid mode/challenge", () => {
    expect(parseAttemptRecord({ ...goodRecord(), mode: "TEACH_BACK" as unknown as AttemptRecord["mode"] })).toBeNull();
    expect(parseAttemptRecord({ ...goodRecord(), challenge: "BONUS" as unknown as AttemptRecord["challenge"] })).toBeNull();
  });

  it("rejects not-verifiable coverage with a bad reason", () => {
    const bad = {
      ...goodRecord(),
      coverage: {
        verifiable: false,
        unavailableReason: "INVENTED",
        scoring: { method: "LEXICAL", version: "1" },
        conceptResults: [],
        hitCount: 0,
        totalCount: 0,
        weightedFraction: 0,
        fraction: 0,
      },
    } as unknown as AttemptRecord;
    expect(parseAttemptRecord(bad)).toBeNull();
  });

  it("rejects dangerous prototype keys", () => {
    // JSON.parse creates __proto__ as an own data property; mirror that here
    // (an object literal would hit the prototype setter instead).
    const raw = Object.create(null) as Record<string, unknown>;
    Object.assign(raw, goodRecord());
    raw["__proto__"] = 1;
    expect(parseAttemptRecord(raw)).toBeNull();
  });

  it("rejects non-objects", () => {
    expect(parseAttemptRecord(null)).toBeNull();
    expect(parseAttemptRecord("nope")).toBeNull();
  });
});

describe("InMemoryHistoryStore", () => {
  let store: InMemoryHistoryStore;

  beforeEach(() => {
    store = new InMemoryHistoryStore();
  });

  it("appends and loads records per topic fingerprint", async () => {
    const r1 = goodRecord({ attemptId: "a1", reviewedAt: "2026-09-01T00:00:00Z" });
    const r2 = goodRecord({ attemptId: "a2", reviewedAt: "2026-09-02T00:00:00Z" });
    await store.append(r1);
    await store.append(r2);
    const loaded = await store.loadTopic(topicFingerprint(r1.topicRef));
    expect(loaded).toHaveLength(2);
    expect(loaded.map((r) => r.attemptId)).toEqual(["a1", "a2"]);
  });

  it("loadAll returns every record across topics", async () => {
    await store.append(goodRecord({ attemptId: "a1", topicRef: ref("t1") }));
    await store.append(goodRecord({ attemptId: "a2", topicRef: ref("t2") }));
    const all = await store.loadAll();
    expect(all).toHaveLength(2);
  });

  it("clearTopic removes only that topic", async () => {
    const r1 = goodRecord({ attemptId: "a1", topicRef: ref("t1") });
    const r2 = goodRecord({ attemptId: "a2", topicRef: ref("t2") });
    await store.append(r1);
    await store.append(r2);
    await store.clearTopic(topicFingerprint(r1.topicRef));
    expect(await store.loadAll()).toHaveLength(1);
  });

  it("clear empties the store", async () => {
    await store.append(goodRecord());
    await store.clear();
    expect(await store.loadAll()).toEqual([]);
  });

  it("returns copies, not internal references", async () => {
    await store.append(goodRecord());
    const a = await store.loadAll();
    const b = await store.loadAll();
    expect(a[0]).not.toBe(b[0]);
    expect(a[0]).toEqual(b[0]);
  });
});

describe("IndexedDbHistoryStore fallback", () => {
  const original = globalThis.indexedDB;

  afterEach(() => {
    Object.defineProperty(globalThis, "indexedDB", {
      value: original,
      configurable: true,
      writable: true,
    });
  });

  it("degrades to the in-memory store when IndexedDB is absent", async () => {
    Object.defineProperty(globalThis, "indexedDB", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    const store = new IndexedDbHistoryStore();
    await store.append(goodRecord());
    const all = await store.loadAll();
    expect(all).toHaveLength(1);
    expect(all[0]!.attemptId).toBe("att-1");
  });
});

