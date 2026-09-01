import { describe, expect, it } from "vitest";
import {
  buildResurfacingQueue,
  coverageToQuality,
  latestRecord,
  scheduleReview,
  topicFingerprint,
} from "./spacedRepetition";
import type {
  AttemptRecord,
  CoverageReport,
  SpacedSchedule,
  TopicRef,
} from "@/practice/types";

const ref = (topicId: string): TopicRef => ({
  packId: "pack",
  packVersion: "1.0",
  subjectId: "s",
  topicId,
  variantId: `${topicId}-v`,
  difficultyProfileVersion: "1",
  promptId: `${topicId}-p`,
  rubricId: `${topicId}-r`,
});

const verifiable = (weightedFraction: number): CoverageReport => ({
  verifiable: true,
  unavailableReason: null,
  scoring: { method: "LEXICAL", version: "1" },
  conceptResults: [],
  hitCount: 0,
  totalCount: 1,
  weightedFraction,
  fraction: weightedFraction,
});

const notVerifiable = (): CoverageReport => ({
  verifiable: false,
  unavailableReason: "NO_SCORABLE_RUBRIC",
  scoring: { method: "LEXICAL", version: "1" },
  conceptResults: [],
  hitCount: 0,
  totalCount: 0,
  weightedFraction: 0,
  fraction: 0,
});

const record = (
  topicId: string,
  reviewedAt: string,
  schedule: SpacedSchedule,
  coverage: CoverageReport = verifiable(0.8),
): AttemptRecord => ({
  schemaVersion: 1,
  attemptId: `${topicId}-${reviewedAt}`,
  topicFingerprint: topicFingerprint(ref(topicId)),
  topicRef: ref(topicId),
  mode: "RECALL_SPRINT",
  challenge: "GUIDED",
  attemptIndex: 1,
  reviewedAt,
  coverage,
  schedule,
});

describe("topicFingerprint", () => {
  it("collides only for identical topic identity", () => {
    expect(topicFingerprint(ref("a"))).toBe(topicFingerprint(ref("a")));
    expect(topicFingerprint(ref("a"))).not.toBe(topicFingerprint(ref("b")));
  });
});

describe("coverageToQuality", () => {
  it("maps fractions to SM-2 quality bands", () => {
    expect(coverageToQuality(verifiable(0.95))).toBe(5);
    expect(coverageToQuality(verifiable(0.8))).toBe(4);
    expect(coverageToQuality(verifiable(0.6))).toBe(3);
    expect(coverageToQuality(verifiable(0.3))).toBe(2);
    expect(coverageToQuality(verifiable(0.1))).toBe(1);
    expect(coverageToQuality(verifiable(0))).toBe(0);
  });

  it("returns null for not-verifiable coverage", () => {
    expect(coverageToQuality(notVerifiable())).toBeNull();
  });
});

describe("scheduleReview", () => {
  const reviewed = new Date(2026, 8, 2, 10);

  it("schedules the first successful review one day out", () => {
    const s = scheduleReview(null, 4, reviewed);
    expect(s.repetitions).toBe(1);
    expect(s.intervalDays).toBe(1);
    expect(s.nextDueOn).toBe("2026-09-03");
  });

  it("uses the second interval on the second successful review", () => {
    const first = scheduleReview(null, 4, reviewed);
    const second = scheduleReview(first, 4, reviewed);
    expect(second.repetitions).toBe(2);
    expect(second.intervalDays).toBe(3);
  });

  it("multiplies the prior interval by easiness on later reviews", () => {
    const first = scheduleReview(null, 5, reviewed);
    const second = scheduleReview(first, 5, reviewed);
    const third = scheduleReview(second, 5, reviewed);
    expect(third.repetitions).toBe(3);
    expect(third.intervalDays).toBe(Math.round(second.intervalDays * third.easiness));
  });

  it("resets repetitions and interval when quality is below 3", () => {
    const first = scheduleReview(null, 5, reviewed);
    const reset = scheduleReview(first, 2, reviewed);
    expect(reset.repetitions).toBe(0);
    expect(reset.intervalDays).toBe(1);
  });

  it("never drops easiness below the configured floor", () => {
    let s: SpacedSchedule | null = null;
    for (let i = 0; i < 5; i++) s = scheduleReview(s, 0, reviewed);
    expect(s!.easiness).toBeGreaterThanOrEqual(1.3);
  });

  it("anchors the due date to the review day, not the prior due date", () => {
    const late = new Date(2026, 8, 10, 22);
    const s = scheduleReview(null, 4, late);
    expect(s.nextDueOn).toBe("2026-09-11");
  });
});

describe("buildResurfacingQueue", () => {
  const now = new Date(2026, 8, 2, 12);
  const due = (topicId: string, nextDueOn: string): AttemptRecord =>
    record(topicId, "2026-08-30T00:00:00Z", {
      repetitions: 1,
      easiness: 2.5,
      intervalDays: 1,
      nextDueOn,
    });

  it("splits due and upcoming, most overdue / soonest first", () => {
    const records = [
      due("a", "2026-09-01"), // 1 day overdue
      due("b", "2026-08-31"), // 2 days overdue
      due("c", "2026-09-03"), // upcoming in 1 day
      due("d", "2026-09-05"), // upcoming in 3 days
    ];
    const q = buildResurfacingQueue(records, now);
    expect(q.due.map((i) => i.topicRef.topicId)).toEqual(["b", "a"]);
    expect(q.upcoming.map((i) => i.topicRef.topicId)).toEqual(["c", "d"]);
  });

  it("uses only the latest record per topic", () => {
    const records = [
      // Older record: not yet due per its own (stale) schedule.
      record("a", "2026-08-01T00:00:00Z", {
        repetitions: 1,
        easiness: 2.5,
        intervalDays: 1,
        nextDueOn: "2026-09-10",
      }),
      // Latest record: overdue by 2 days as of now (2026-09-02).
      record("a", "2026-09-01T00:00:00Z", {
        repetitions: 2,
        easiness: 2.5,
        intervalDays: 3,
        nextDueOn: "2026-08-31",
      }),
    ];
    const q = buildResurfacingQueue(records, now);
    expect(q.due).toHaveLength(1);
    expect(q.due[0]!.daysUntilDue).toBe(-2);
    expect(q.upcoming).toEqual([]);
  });

  it("passes never-attempted topics through, minus attempted ones", () => {
    const q = buildResurfacingQueue([due("a", "2026-09-01")], now, [
      ref("a"),
      ref("x"),
      ref("y"),
    ]);
    expect(q.neverAttempted.map((t) => t.topicId)).toEqual(["x", "y"]);
  });

  it("returns empty partitions for no history", () => {
    const q = buildResurfacingQueue([], now);
    expect(q.due).toEqual([]);
    expect(q.upcoming).toEqual([]);
  });

  it("keeps the prior schedule when the latest attempt is unverifiable", () => {
    const scheduled = due("a", "2026-09-01");
    const unverifiable = {
      ...record(
        "a",
        "2026-09-02T10:00:00Z",
        scheduled.schedule!,
        notVerifiable(),
      ),
      attemptId: "a-unverifiable",
      schedule: null,
    };
    const q = buildResurfacingQueue([scheduled, unverifiable], now);
    expect(q.due).toHaveLength(1);
    expect(q.due[0]!.lastRecord.attemptId).toBe(scheduled.attemptId);
  });
});

describe("latestRecord", () => {
  it("picks the record with the greatest reviewedAt", () => {
    const records = [
      record("a", "2026-08-01T00:00:00Z", { repetitions: 1, easiness: 2.5, intervalDays: 1, nextDueOn: "2026-08-02" }),
      record("a", "2026-09-01T00:00:00Z", { repetitions: 2, easiness: 2.5, intervalDays: 3, nextDueOn: "2026-09-04" }),
    ];
    expect(latestRecord(records)?.reviewedAt).toBe("2026-09-01T00:00:00Z");
  });

  it("returns undefined for empty input", () => {
    expect(latestRecord([])).toBeUndefined();
  });
});
