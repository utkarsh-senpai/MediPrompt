// v0.7 persisted-history store (docs/V0.7_DEVELOPMENT_CONTEXT.md §3).
// IndexedDB-backed with an in-memory fallback when IndexedDB is unavailable
// (private mode, SSR, tests). Stored records are untrusted: malformed JSON,
// unknown schema versions, or structurally invalid coverage are dropped. The
// store never uploads anything — records are local-only.

import {
  type AttemptRecord,
  type CoverageReport,
  type CoverageUnavailableReason,
  type HistoryStore,
  type SpacedSchedule,
  type TopicRef,
} from "@/practice/types";
import { topicFingerprint } from "@/practice/spacedRepetition";

const DB_NAME = "mediprompt-history";
const DB_VERSION = 1;
const STORE = "records";
const INDEX = "topicFingerprint";

const UNAVAILABLE_REASONS: readonly CoverageUnavailableReason[] = [
  "NO_TRANSCRIPT",
  "NO_SCORABLE_RUBRIC",
];

function parseTopicRef(raw: unknown): TopicRef | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (
    typeof o["packId"] !== "string" ||
    typeof o["packVersion"] !== "string" ||
    typeof o["subjectId"] !== "string" ||
    typeof o["topicId"] !== "string" ||
    typeof o["variantId"] !== "string" ||
    typeof o["difficultyProfileVersion"] !== "string" ||
    typeof o["promptId"] !== "string" ||
    typeof o["rubricId"] !== "string"
  ) {
    return null;
  }
  return {
    packId: o["packId"],
    packVersion: o["packVersion"],
    subjectId: o["subjectId"],
    topicId: o["topicId"],
    variantId: o["variantId"],
    difficultyProfileVersion: o["difficultyProfileVersion"],
    promptId: o["promptId"],
    rubricId: o["rubricId"],
  };
}

function parseSchedule(raw: unknown): SpacedSchedule | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const repetitions = o["repetitions"];
  const easiness = o["easiness"];
  const intervalDays = o["intervalDays"];
  const nextDueAt = o["nextDueAt"];
  if (
    typeof repetitions !== "number" || !Number.isFinite(repetitions) ||
    repetitions < 0 ||
    typeof easiness !== "number" || !Number.isFinite(easiness) ||
    easiness < 1 ||
    typeof intervalDays !== "number" || !Number.isFinite(intervalDays) ||
    intervalDays < 0 ||
    typeof nextDueAt !== "string"
  ) {
    return null;
  }
  const due = new Date(nextDueAt);
  if (Number.isNaN(due.getTime())) return null;
  return {
    repetitions: Math.floor(repetitions),
    easiness,
    intervalDays: Math.floor(intervalDays),
    nextDueAt,
  };
}

function parseCoverage(raw: unknown): CoverageReport | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o["verifiable"] !== "boolean") return null;
  const scoring = o["scoring"];
  if (typeof scoring !== "object" || scoring === null) return null;
  const s = scoring as Record<string, unknown>;
  if (s["method"] !== "LEXICAL" && s["method"] !== "LEXICAL_SEMANTIC") return null;
  if (typeof s["version"] !== "string") return null;
  if (!Array.isArray(o["conceptResults"])) return null;
  if (typeof o["hitCount"] !== "number" || !Number.isFinite(o["hitCount"])) return null;
  if (typeof o["totalCount"] !== "number" || !Number.isFinite(o["totalCount"])) return null;
  if (typeof o["weightedFraction"] !== "number" || !Number.isFinite(o["weightedFraction"])) return null;
  if (typeof o["fraction"] !== "number" || !Number.isFinite(o["fraction"])) return null;
  const weightedFraction = Math.max(0, Math.min(1, o["weightedFraction"]));
  const fraction = Math.max(0, Math.min(1, o["fraction"]));
  if (o["verifiable"]) {
    if (o["unavailableReason"] !== null) return null;
    return {
      verifiable: true,
      unavailableReason: null,
      scoring: { method: s["method"], version: s["version"] },
      conceptResults: o["conceptResults"],
      hitCount: Math.floor(o["hitCount"]),
      totalCount: Math.floor(o["totalCount"]),
      weightedFraction,
      fraction,
    } as CoverageReport;
  }
  const reason = o["unavailableReason"];
  if (typeof reason !== "string" || !UNAVAILABLE_REASONS.includes(reason as CoverageUnavailableReason)) {
    return null;
  }
  return {
    verifiable: false,
    unavailableReason: reason as CoverageUnavailableReason,
    scoring: { method: s["method"], version: s["version"] },
    conceptResults: o["conceptResults"],
    hitCount: Math.floor(o["hitCount"]),
    totalCount: Math.floor(o["totalCount"]),
    weightedFraction,
    fraction,
  } as CoverageReport;
}

function parseAttemptRecord(raw: unknown): AttemptRecord | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  for (const dangerous of ["__proto__", "prototype", "constructor"]) {
    if (Object.prototype.hasOwnProperty.call(o, dangerous)) return null;
  }
  if (o["schemaVersion"] !== 1) return null;
  if (typeof o["attemptId"] !== "string") return null;
  const topicRef = parseTopicRef(o["topicRef"]);
  if (!topicRef) return null;
  if (o["mode"] !== "RECALL_SPRINT" && o["mode"] !== "DEEP_RESEARCH") return null;
  if (
    o["challenge"] !== "GUIDED" &&
    o["challenge"] !== "APPLIED" &&
    o["challenge"] !== "VIVA"
  ) {
    return null;
  }
  if (typeof o["attemptIndex"] !== "number" || !Number.isFinite(o["attemptIndex"]) || o["attemptIndex"] < 1) {
    return null;
  }
  if (typeof o["reviewedAt"] !== "string") return null;
  if (Number.isNaN(new Date(o["reviewedAt"]).getTime())) return null;
  const coverage = parseCoverage(o["coverage"]);
  if (!coverage) return null;
  if (typeof o["transcriptText"] !== "string") return null;
  const schedule = parseSchedule(o["schedule"]);
  if (!schedule) return null;
  return {
    schemaVersion: 1,
    attemptId: o["attemptId"],
    topicRef,
    mode: o["mode"],
    challenge: o["challenge"],
    attemptIndex: Math.floor(o["attemptIndex"]),
    reviewedAt: o["reviewedAt"],
    coverage,
    transcriptText: o["transcriptText"],
    schedule,
  };
}

/** Open the IndexedDB database, or null when unavailable/blocked. */
function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    const factory = globalThis.indexedDB;
    if (!factory) {
      resolve(null);
      return;
    }
    let db: IDBDatabase | null = null;
    try {
      const req = factory.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "attemptId" });
          store.createIndex(INDEX, "topicFingerprint", { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** In-memory fallback used when IndexedDB is unavailable and in tests. */
export class InMemoryHistoryStore implements HistoryStore {
  private readonly map = new Map<string, AttemptRecord[]>();

  async loadTopic(fp: string): Promise<AttemptRecord[]> {
    const list = this.map.get(fp);
    return list ? list.map((r) => ({ ...r })) : [];
  }

  async loadAll(): Promise<AttemptRecord[]> {
    const all: AttemptRecord[] = [];
    for (const list of this.map.values()) all.push(...list);
    return all.map((r) => ({ ...r }));
  }

  async append(record: AttemptRecord): Promise<AttemptRecord> {
    const parsed = parseAttemptRecord(record) ?? record;
    const fp = topicFingerprint(parsed.topicRef);
    const list = this.map.get(fp) ?? [];
    list.push({ ...parsed });
    this.map.set(fp, list);
    return { ...parsed };
  }

  async clearTopic(fp: string): Promise<void> {
    this.map.delete(fp);
  }

  async clear(): Promise<void> {
    this.map.clear();
  }
}

/**
 * IndexedDB-backed history store. Degrades to an in-memory store when IndexedDB
 * cannot be opened, so the practice loop never hard-fails on persistence.
 */
export class IndexedDbHistoryStore implements HistoryStore {
  private readonly mem = new InMemoryHistoryStore();
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  private db(): Promise<IDBDatabase | null> {
    if (!this.dbPromise) this.dbPromise = openDb();
    return this.dbPromise;
  }

  async loadTopic(fp: string): Promise<AttemptRecord[]> {
    const db = await this.db();
    if (!db) return this.mem.loadTopic(fp);
    try {
      const tx = db.transaction(STORE, "readonly");
      const index = tx.objectStore(STORE).index(INDEX);
      const raw = await reqToPromise(index.getAll(IDBKeyRange.only(fp)));
      await txDone(tx);
      const records: AttemptRecord[] = [];
      for (const item of raw as unknown[]) {
        const parsed = parseAttemptRecord(item);
        if (parsed) records.push(parsed);
      }
      return records;
    } catch {
      return this.mem.loadTopic(fp);
    }
  }

  async loadAll(): Promise<AttemptRecord[]> {
    const db = await this.db();
    if (!db) return this.mem.loadAll();
    try {
      const tx = db.transaction(STORE, "readonly");
      const raw = await reqToPromise(tx.objectStore(STORE).getAll());
      await txDone(tx);
      const records: AttemptRecord[] = [];
      for (const item of raw as unknown[]) {
        const parsed = parseAttemptRecord(item);
        if (parsed) records.push(parsed);
      }
      return records;
    } catch {
      return this.mem.loadAll();
    }
  }

  async append(record: AttemptRecord): Promise<AttemptRecord> {
    const parsed = parseAttemptRecord(record) ?? record;
    // Mirror into the memory fallback so a later failed read still sees it.
    await this.mem.append(parsed);
    const db = await this.db();
    if (!db) return parsed;
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(parsed);
      await txDone(tx);
      return parsed;
    } catch {
      return parsed;
    }
  }

  async clearTopic(fp: string): Promise<void> {
    await this.mem.clearTopic(fp);
    const db = await this.db();
    if (!db) return;
    try {
      const tx = db.transaction(STORE, "readwrite");
      const index = tx.objectStore(STORE).index(INDEX);
      const keys = await reqToPromise(index.getAllKeys(IDBKeyRange.only(fp)));
      const store = tx.objectStore(STORE);
      for (const key of keys as IDBValidKey[]) store.delete(key);
      await txDone(tx);
    } catch {
      /* best-effort; memory fallback already cleared */
    }
  }

  async clear(): Promise<void> {
    await this.mem.clear();
    const db = await this.db();
    if (!db) return;
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      await txDone(tx);
    } catch {
      /* best-effort */
    }
  }
}

/** True when the runtime exposes a usable IndexedDB factory. */
export function historyStoreAvailable(): boolean {
  return typeof globalThis !== "undefined" && !!globalThis.indexedDB;
}

export { parseAttemptRecord };
