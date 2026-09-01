// v0.7 learner-controlled practice metadata store.
//
// Privacy invariant: AttemptRecord contains scheduling and aggregate coverage
// metadata only. Audio, transcript text, and semantic transcript excerpts are
// session-local and must never reach this module.

import type {
  AttemptRecord,
  CoverageReport,
  CoverageUnavailableReason,
  HistoryStore,
  PersistedCoverage,
  SpacedSchedule,
  TopicRef,
} from "@/practice/types";
import {
  calendarDayNumber,
  topicFingerprint,
} from "@/practice/spacedRepetition";

export const HISTORY_DB_NAME = "mediprompt-history";
const DB_VERSION = 2;
const STORE = "records";
const TOPIC_INDEX = "topicFingerprint";
export const MAX_HISTORY_RECORDS = 500;

const MAX_ID_LENGTH = 200;
const MAX_VERSION_LENGTH = 80;
const MAX_SCORING_ITEMS = 2_000;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const UNAVAILABLE_REASONS: readonly CoverageUnavailableReason[] = [
  "NO_TRANSCRIPT",
  "NO_SCORABLE_RUBRIC",
];

function hasDangerousKey(obj: Record<string, unknown>): boolean {
  return ["__proto__", "prototype", "constructor"].some((key) =>
    Object.prototype.hasOwnProperty.call(obj, key),
  );
}

function hasOnlyKeys(
  obj: Record<string, unknown>,
  required: readonly string[],
): boolean {
  const allowed = new Set(required);
  const keys = Object.keys(obj);
  return (
    !hasDangerousKey(obj) &&
    keys.length === required.length &&
    required.every((key) => Object.prototype.hasOwnProperty.call(obj, key)) &&
    keys.every((key) => allowed.has(key))
  );
}

function boundedString(raw: unknown, max = MAX_ID_LENGTH): raw is string {
  return typeof raw === "string" && raw.length > 0 && raw.length <= max;
}

function finiteInteger(raw: unknown, min: number, max: number): raw is number {
  return (
    typeof raw === "number" &&
    Number.isFinite(raw) &&
    Number.isInteger(raw) &&
    raw >= min &&
    raw <= max
  );
}

function unitFraction(raw: unknown): raw is number {
  return typeof raw === "number" && Number.isFinite(raw) && raw >= 0 && raw <= 1;
}

function parseTopicRef(raw: unknown): TopicRef | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const keys = [
    "packId",
    "packVersion",
    "subjectId",
    "topicId",
    "variantId",
    "difficultyProfileVersion",
    "promptId",
    "rubricId",
  ] as const;
  if (!hasOnlyKeys(obj, keys)) return null;
  if (
    !boundedString(obj["packId"]) ||
    !boundedString(obj["packVersion"], MAX_VERSION_LENGTH) ||
    !boundedString(obj["subjectId"]) ||
    !boundedString(obj["topicId"]) ||
    !boundedString(obj["variantId"]) ||
    !boundedString(obj["difficultyProfileVersion"], MAX_VERSION_LENGTH) ||
    !boundedString(obj["promptId"]) ||
    !boundedString(obj["rubricId"])
  ) {
    return null;
  }
  return {
    packId: obj["packId"],
    packVersion: obj["packVersion"],
    subjectId: obj["subjectId"],
    topicId: obj["topicId"],
    variantId: obj["variantId"],
    difficultyProfileVersion: obj["difficultyProfileVersion"],
    promptId: obj["promptId"],
    rubricId: obj["rubricId"],
  };
}

function parseSchedule(raw: unknown): SpacedSchedule | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  if (!hasOnlyKeys(obj, ["repetitions", "easiness", "intervalDays", "nextDueOn"])) {
    return null;
  }
  if (
    !finiteInteger(obj["repetitions"], 0, 10_000) ||
    typeof obj["easiness"] !== "number" ||
    !Number.isFinite(obj["easiness"]) ||
    obj["easiness"] < 1 ||
    obj["easiness"] > 10 ||
    !finiteInteger(obj["intervalDays"], 1, 36_500) ||
    typeof obj["nextDueOn"] !== "string" ||
    calendarDayNumber(obj["nextDueOn"]) === null
  ) {
    return null;
  }
  return {
    repetitions: obj["repetitions"],
    easiness: obj["easiness"],
    intervalDays: obj["intervalDays"],
    nextDueOn: obj["nextDueOn"],
  };
}

function parseCoverage(raw: unknown): PersistedCoverage | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  if (
    !hasOnlyKeys(obj, [
      "verifiable",
      "unavailableReason",
      "scoring",
      "hitCount",
      "totalCount",
      "weightedFraction",
      "fraction",
    ]) ||
    typeof obj["verifiable"] !== "boolean"
  ) {
    return null;
  }
  const scoring = obj["scoring"];
  if (typeof scoring !== "object" || scoring === null) return null;
  const scoringObj = scoring as Record<string, unknown>;
  if (
    !hasOnlyKeys(scoringObj, ["method", "version"]) ||
    (scoringObj["method"] !== "LEXICAL" && scoringObj["method"] !== "LEXICAL_SEMANTIC") ||
    !boundedString(scoringObj["version"], MAX_VERSION_LENGTH)
  ) {
    return null;
  }
  if (
    !finiteInteger(obj["hitCount"], 0, MAX_SCORING_ITEMS) ||
    !finiteInteger(obj["totalCount"], 0, MAX_SCORING_ITEMS) ||
    obj["hitCount"] > obj["totalCount"] ||
    !unitFraction(obj["weightedFraction"]) ||
    !unitFraction(obj["fraction"])
  ) {
    return null;
  }
  const expectedFraction =
    obj["totalCount"] === 0 ? 0 : obj["hitCount"] / obj["totalCount"];
  if (Math.abs(obj["fraction"] - expectedFraction) > 1e-9) return null;

  if (obj["verifiable"]) {
    if (obj["unavailableReason"] !== null || obj["totalCount"] === 0) return null;
  } else if (
    typeof obj["unavailableReason"] !== "string" ||
    !UNAVAILABLE_REASONS.includes(obj["unavailableReason"] as CoverageUnavailableReason) ||
    obj["hitCount"] !== 0 ||
    obj["weightedFraction"] !== 0 ||
    obj["fraction"] !== 0
  ) {
    return null;
  }

  return {
    verifiable: obj["verifiable"],
    unavailableReason: obj["unavailableReason"] as CoverageUnavailableReason | null,
    scoring: {
      method: scoringObj["method"],
      version: scoringObj["version"],
    },
    hitCount: obj["hitCount"],
    totalCount: obj["totalCount"],
    weightedFraction: obj["weightedFraction"],
    fraction: obj["fraction"],
  };
}

export function toPersistedCoverage(report: CoverageReport): PersistedCoverage {
  return {
    verifiable: report.verifiable,
    unavailableReason: report.unavailableReason,
    scoring: { ...report.scoring },
    hitCount: report.hitCount,
    totalCount: report.totalCount,
    weightedFraction: report.weightedFraction,
    fraction: report.fraction,
  };
}

export function parseAttemptRecord(raw: unknown): AttemptRecord | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  if (
    !hasOnlyKeys(obj, [
      "schemaVersion",
      "attemptId",
      "topicFingerprint",
      "topicRef",
      "mode",
      "challenge",
      "attemptIndex",
      "reviewedAt",
      "coverage",
      "schedule",
    ]) ||
    obj["schemaVersion"] !== 1 ||
    !boundedString(obj["attemptId"]) ||
    !boundedString(obj["topicFingerprint"], 1_000)
  ) {
    return null;
  }
  const topicRef = parseTopicRef(obj["topicRef"]);
  if (!topicRef || obj["topicFingerprint"] !== topicFingerprint(topicRef)) return null;
  if (obj["mode"] !== "RECALL_SPRINT" && obj["mode"] !== "DEEP_RESEARCH") return null;
  if (
    obj["challenge"] !== "GUIDED" &&
    obj["challenge"] !== "APPLIED" &&
    obj["challenge"] !== "VIVA"
  ) {
    return null;
  }
  if (!finiteInteger(obj["attemptIndex"], 1, 10_000)) return null;
  if (
    typeof obj["reviewedAt"] !== "string" ||
    !ISO_INSTANT.test(obj["reviewedAt"]) ||
    Number.isNaN(Date.parse(obj["reviewedAt"])) ||
    new Date(obj["reviewedAt"]).toISOString() !== obj["reviewedAt"]
  ) {
    return null;
  }
  const coverage = parseCoverage(obj["coverage"]);
  if (!coverage) return null;
  const schedule = obj["schedule"] === null ? null : parseSchedule(obj["schedule"]);
  if (obj["schedule"] !== null && !schedule) return null;
  if (coverage.verifiable !== (schedule !== null)) return null;

  return {
    schemaVersion: 1,
    attemptId: obj["attemptId"],
    topicFingerprint: obj["topicFingerprint"],
    topicRef,
    mode: obj["mode"],
    challenge: obj["challenge"],
    attemptIndex: obj["attemptIndex"],
    reviewedAt: obj["reviewedAt"],
    coverage,
    schedule,
  };
}

function cloneRecord(record: AttemptRecord): AttemptRecord {
  return structuredClone(record);
}

function sortRecords(records: AttemptRecord[]): AttemptRecord[] {
  return records.sort((a, b) =>
    a.reviewedAt === b.reviewedAt
      ? a.attemptId.localeCompare(b.attemptId)
      : a.reviewedAt.localeCompare(b.reviewedAt),
  );
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    const factory = globalThis.indexedDB;
    if (!factory) {
      resolve(null);
      return;
    }
    try {
      const request = factory.open(HISTORY_DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        // v1 could contain transcript text and had an unusable index. Remove it
        // rather than migrating sensitive or structurally invalid records.
        if (db.objectStoreNames.contains(STORE)) db.deleteObjectStore(STORE);
        const store = db.createObjectStore(STORE, { keyPath: "attemptId" });
        store.createIndex(TOPIC_INDEX, "topicFingerprint", { unique: false });
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function reqToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}

/** In-memory fallback used when IndexedDB cannot be opened. */
export class InMemoryHistoryStore implements HistoryStore {
  private readonly records = new Map<string, AttemptRecord>();

  async storageMode(): Promise<"SESSION"> {
    return "SESSION";
  }

  async loadTopic(fp: string): Promise<AttemptRecord[]> {
    return sortRecords(
      [...this.records.values()]
        .filter((record) => record.topicFingerprint === fp)
        .map(cloneRecord),
    );
  }

  async loadAll(): Promise<AttemptRecord[]> {
    return sortRecords([...this.records.values()].map(cloneRecord));
  }

  async append(record: AttemptRecord): Promise<AttemptRecord> {
    const parsed = parseAttemptRecord(record);
    if (!parsed) throw new TypeError("Invalid practice-history record");
    this.records.set(parsed.attemptId, cloneRecord(parsed));
    const ordered = sortRecords([...this.records.values()]);
    for (const oldest of ordered.slice(0, -MAX_HISTORY_RECORDS)) {
      this.records.delete(oldest.attemptId);
    }
    return cloneRecord(parsed);
  }

  async clearTopic(fp: string): Promise<void> {
    for (const [attemptId, record] of this.records) {
      if (record.topicFingerprint === fp) this.records.delete(attemptId);
    }
  }

  async clear(): Promise<void> {
    this.records.clear();
  }
}

/** IndexedDB store with an in-memory fallback only when IndexedDB cannot open. */
export class IndexedDbHistoryStore implements HistoryStore {
  private readonly memory = new InMemoryHistoryStore();
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  private db(): Promise<IDBDatabase | null> {
    this.dbPromise ??= openDb();
    return this.dbPromise;
  }

  async storageMode(): Promise<"DEVICE" | "SESSION"> {
    return (await this.db()) ? "DEVICE" : "SESSION";
  }

  async loadTopic(fp: string): Promise<AttemptRecord[]> {
    const db = await this.db();
    if (!db) return this.memory.loadTopic(fp);
    const tx = db.transaction(STORE, "readonly");
    const done = txDone(tx);
    const raw = await reqToPromise(
      tx.objectStore(STORE).index(TOPIC_INDEX).getAll(IDBKeyRange.only(fp)),
    );
    await done;
    return sortRecords(
      (raw as unknown[])
        .map(parseAttemptRecord)
        .filter((record): record is AttemptRecord => record !== null),
    );
  }

  async loadAll(): Promise<AttemptRecord[]> {
    const db = await this.db();
    if (!db) return this.memory.loadAll();
    const tx = db.transaction(STORE, "readonly");
    const done = txDone(tx);
    const raw = await reqToPromise(tx.objectStore(STORE).getAll());
    await done;
    return sortRecords(
      (raw as unknown[])
        .map(parseAttemptRecord)
        .filter((record): record is AttemptRecord => record !== null),
    );
  }

  async append(record: AttemptRecord): Promise<AttemptRecord> {
    const parsed = parseAttemptRecord(record);
    if (!parsed) throw new TypeError("Invalid practice-history record");
    const db = await this.db();
    if (!db) return this.memory.append(parsed);

    const tx = db.transaction(STORE, "readwrite");
    const done = txDone(tx);
    const store = tx.objectStore(STORE);
    const putRequest = store.put(parsed);
    const allRequest = store.getAll();
    const keysRequest = store.getAllKeys();
    await reqToPromise(putRequest);
    const raw = (await reqToPromise(allRequest)) as unknown[];
    const keys = await reqToPromise(keysRequest);
    const valid: AttemptRecord[] = [];
    raw.forEach((item, index) => {
      const validItem = parseAttemptRecord(item);
      if (validItem) valid.push(validItem);
      else if (keys[index] !== undefined) store.delete(keys[index]!);
    });
    sortRecords(valid);
    for (const oldest of valid.slice(0, -MAX_HISTORY_RECORDS)) {
      store.delete(oldest.attemptId);
    }
    await done;
    await this.memory.append(parsed);
    return cloneRecord(parsed);
  }

  async clearTopic(fp: string): Promise<void> {
    const db = await this.db();
    if (!db) return this.memory.clearTopic(fp);
    const tx = db.transaction(STORE, "readwrite");
    const done = txDone(tx);
    const store = tx.objectStore(STORE);
    const keys = await reqToPromise(
      store.index(TOPIC_INDEX).getAllKeys(IDBKeyRange.only(fp)),
    );
    for (const key of keys) store.delete(key);
    await done;
    await this.memory.clearTopic(fp);
  }

  async clear(): Promise<void> {
    const db = await this.db();
    if (!db) return this.memory.clear();
    const tx = db.transaction(STORE, "readwrite");
    const done = txDone(tx);
    tx.objectStore(STORE).clear();
    await done;
    await this.memory.clear();
  }
}

export function historyStoreAvailable(): boolean {
  return typeof globalThis !== "undefined" && !!globalThis.indexedDB;
}
