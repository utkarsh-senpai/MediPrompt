import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { IDBFactory, IDBKeyRange } from "fake-indexeddb";
import {
  InMemoryHistoryStore,
  IndexedDbHistoryStore,
  HISTORY_DB_NAME,
  MAX_HISTORY_RECORDS,
  parseAttemptRecord,
} from "./historyStore";
import { topicFingerprint } from "@/practice/spacedRepetition";
import type { AttemptRecord, PersistedCoverage, TopicRef } from "@/practice/types";

const ref = (topicId = "t1"): TopicRef => ({
  packId: "pack",
  packVersion: "1.0",
  subjectId: "s",
  topicId,
  variantId: `${topicId}-v`,
  difficultyProfileVersion: "1",
  promptId: `${topicId}-p`,
  rubricId: `${topicId}-r`,
});

const verifiable = (hitCount = 4, totalCount = 5): PersistedCoverage => ({
  verifiable: true,
  unavailableReason: null,
  scoring: { method: "LEXICAL", version: "1" },
  hitCount,
  totalCount,
  weightedFraction: hitCount / totalCount,
  fraction: hitCount / totalCount,
});

const goodRecord = (overrides: Partial<AttemptRecord> = {}): AttemptRecord => {
  const topicRef = overrides.topicRef ?? ref();
  return {
    schemaVersion: 1,
    attemptId: "att-1",
    topicFingerprint: topicFingerprint(topicRef),
    topicRef,
    mode: "RECALL_SPRINT",
    challenge: "GUIDED",
    attemptIndex: 1,
    reviewedAt: "2026-09-01T12:00:00.000Z",
    coverage: verifiable(),
    schedule: { repetitions: 1, easiness: 2.5, intervalDays: 1, nextDueOn: "2026-09-02" },
    ...overrides,
  };
};

describe("parseAttemptRecord", () => {
  it("round-trips the minimal metadata shape", () => {
    expect(parseAttemptRecord(goodRecord())).toEqual(goodRecord());
  });

  it("rejects unknown, dangerous, and transcript-bearing fields", () => {
    expect(parseAttemptRecord({ ...goodRecord(), transcriptText: "must not persist" })).toBeNull();
    const malicious = Object.assign(Object.create(null), goodRecord()) as Record<string, unknown>;
    malicious["__proto__"] = { polluted: true };
    expect(parseAttemptRecord(malicious)).toBeNull();
  });

  it("rejects a mismatched materialized topic index", () => {
    expect(parseAttemptRecord({ ...goodRecord(), topicFingerprint: "wrong" })).toBeNull();
  });

  it("rejects invalid nested objects, counts, fractions, and dates", () => {
    expect(parseAttemptRecord({ ...goodRecord(), topicRef: { ...ref(), extra: true } })).toBeNull();
    expect(
      parseAttemptRecord({ ...goodRecord(), coverage: { ...verifiable(), hitCount: 6 } }),
    ).toBeNull();
    expect(
      parseAttemptRecord({ ...goodRecord(), coverage: { ...verifiable(), fraction: 0.7 } }),
    ).toBeNull();
    expect(parseAttemptRecord({ ...goodRecord(), reviewedAt: "September 1" })).toBeNull();
    expect(
      parseAttemptRecord({
        ...goodRecord(),
        schedule: { ...goodRecord().schedule!, nextDueOn: "2026-02-30" },
      }),
    ).toBeNull();
  });

  it("requires schedule and verifiability to agree", () => {
    expect(parseAttemptRecord({ ...goodRecord(), schedule: null })).toBeNull();
    const unavailable: PersistedCoverage = {
      verifiable: false,
      unavailableReason: "NO_TRANSCRIPT",
      scoring: { method: "LEXICAL", version: "1" },
      hitCount: 0,
      totalCount: 0,
      weightedFraction: 0,
      fraction: 0,
    };
    expect(
      parseAttemptRecord({ ...goodRecord(), coverage: unavailable, schedule: null }),
    ).not.toBeNull();
  });
});

describe("InMemoryHistoryStore", () => {
  let store: InMemoryHistoryStore;

  beforeEach(() => {
    store = new InMemoryHistoryStore();
  });

  it("appends, replaces by attempt id, and loads by topic index", async () => {
    const first = goodRecord();
    await store.append(first);
    await store.append({ ...first, attemptIndex: 2 });
    expect(await store.loadTopic(first.topicFingerprint)).toHaveLength(1);
    expect((await store.loadAll())[0]!.attemptIndex).toBe(2);
  });

  it("deep-clones returned and stored records", async () => {
    const input = goodRecord();
    await store.append(input);
    input.topicRef.topicId = "mutated-input";
    const first = await store.loadAll();
    first[0]!.topicRef.topicId = "mutated-output";
    first[0]!.coverage.scoring.version = "changed";
    const second = await store.loadAll();
    expect(second[0]!.topicRef.topicId).toBe("t1");
    expect(second[0]!.coverage.scoring.version).toBe("1");
  });

  it("rejects invalid writes instead of persisting them", async () => {
    await expect(
      store.append({ ...goodRecord(), topicFingerprint: "wrong" }),
    ).rejects.toThrow(TypeError);
    expect(await store.loadAll()).toEqual([]);
  });

  it("bounds retention to the newest records", async () => {
    for (let index = 0; index <= MAX_HISTORY_RECORDS; index += 1) {
      await store.append(
        goodRecord({
          attemptId: `attempt-${String(index).padStart(4, "0")}`,
          reviewedAt: new Date(Date.UTC(2025, 0, 1, 0, index)).toISOString(),
        }),
      );
    }
    const loaded = await store.loadAll();
    expect(loaded).toHaveLength(MAX_HISTORY_RECORDS);
    expect(loaded[0]!.attemptId).toBe("attempt-0001");
  });

  it("clears one topic or all data", async () => {
    const first = goodRecord({ attemptId: "a1" });
    const secondRef = ref("t2");
    const second = goodRecord({
      attemptId: "a2",
      topicRef: secondRef,
      topicFingerprint: topicFingerprint(secondRef),
    });
    await store.append(first);
    await store.append(second);
    await store.clearTopic(first.topicFingerprint);
    expect((await store.loadAll()).map((record) => record.attemptId)).toEqual(["a2"]);
    await store.clear();
    expect(await store.loadAll()).toEqual([]);
  });
});

describe("IndexedDbHistoryStore", () => {
  const originalIndexedDb = globalThis.indexedDB;
  const originalKeyRange = globalThis.IDBKeyRange;

  beforeEach(() => {
    Object.defineProperty(globalThis, "indexedDB", {
      value: new IDBFactory(),
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "IDBKeyRange", {
      value: IDBKeyRange,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "indexedDB", {
      value: originalIndexedDb,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "IDBKeyRange", {
      value: originalKeyRange,
      configurable: true,
      writable: true,
    });
  });

  it("round-trips through the real IndexedDB adapter and working topic index", async () => {
    const store = new IndexedDbHistoryStore();
    const first = goodRecord({ attemptId: "a1" });
    const secondRef = ref("t2");
    await store.append(first);
    await store.append(
      goodRecord({
        attemptId: "a2",
        topicRef: secondRef,
        topicFingerprint: topicFingerprint(secondRef),
      }),
    );
    expect((await store.loadTopic(first.topicFingerprint)).map((r) => r.attemptId)).toEqual([
      "a1",
    ]);
    await store.clearTopic(first.topicFingerprint);
    expect((await store.loadAll()).map((r) => r.attemptId)).toEqual(["a2"]);
    await store.clear();
    expect(await store.loadAll()).toEqual([]);
  });

  it("purges the unreleased transcript-bearing v1 store during upgrade", async () => {
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open(HISTORY_DB_NAME, 1);
      open.onupgradeneeded = () => {
        open.result.createObjectStore("records", { keyPath: "attemptId" });
      };
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction("records", "readwrite");
        tx.objectStore("records").put({
          attemptId: "legacy",
          transcriptText: "sensitive legacy text",
        });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });

    const store = new IndexedDbHistoryStore();
    expect(await store.loadAll()).toEqual([]);
    await store.append(goodRecord());
    expect(await store.loadAll()).toHaveLength(1);
  });

  it("degrades to memory when IndexedDB is absent", async () => {
    Object.defineProperty(globalThis, "indexedDB", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    const store = new IndexedDbHistoryStore();
    await store.append(goodRecord());
    expect(await store.loadAll()).toHaveLength(1);
  });
});
