import { describe, expect, it } from "vitest";
import {
  daysUntilExam,
  examTriage,
  parseExamSchedule,
} from "./examCountdown";
import { topicFingerprint } from "./spacedRepetition";
import type { ResurfacingQueue, TopicRef } from "@/practice/types";

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

const item = (
  topicId: string,
  daysUntilDue: number,
  weightedFraction: number,
) => {
  const lastRecord = {
    schemaVersion: 1 as const,
    attemptId: `${topicId}-1`,
    topicFingerprint: topicFingerprint(ref(topicId)),
    topicRef: ref(topicId),
    mode: "RECALL_SPRINT" as const,
    challenge: "GUIDED" as const,
    attemptIndex: 1,
    reviewedAt: "2026-08-30T00:00:00Z",
    coverage: {
      verifiable: true as const,
      unavailableReason: null,
      scoring: { method: "LEXICAL" as const, version: "1" },
      conceptResults: [],
      hitCount: 0,
      totalCount: 1,
      weightedFraction,
      fraction: weightedFraction,
    },
    schedule: {
      repetitions: 1,
      easiness: 2.5,
      intervalDays: 1,
      nextDueOn: "2026-09-03",
    },
  };
  return {
    topicRef: ref(topicId),
    lastRecord,
    daysUntilDue,
    due: daysUntilDue <= 0,
  };
};

const queue = (...items: ReturnType<typeof item>[]): ResurfacingQueue => ({
  due: items,
  upcoming: [],
  neverAttempted: [],
});

describe("daysUntilExam", () => {
  const now = new Date(2026, 8, 2, 12);

  it("returns null when no exam is set", () => {
    expect(daysUntilExam(null, now)).toBeNull();
  });

  it("counts whole days to the exam day", () => {
    expect(daysUntilExam("2026-09-12", now)).toBe(10);
    expect(daysUntilExam("2026-09-02", now)).toBe(0);
  });

  it("is negative after the exam day", () => {
    expect(daysUntilExam("2026-08-30", now)).toBe(-3);
  });

  it("returns null for an unparseable date", () => {
    expect(daysUntilExam("not-a-date", now)).toBeNull();
  });
});

describe("examTriage", () => {
  const now = new Date(2026, 8, 2, 12);

  it("keeps most-overdue-first when the exam is far away", () => {
    const q = queue(item("a", -1, 0.9), item("b", -3, 0.2));
    const triaged = examTriage(q, "2026-12-01", now);
    expect(triaged.due.map((i) => i.topicRef.topicId)).toEqual(["b", "a"]);
  });

  it("reorders weakest-coverage-first inside the cram window", () => {
    const q = queue(item("a", -1, 0.9), item("b", -3, 0.2));
    const exam = "2026-09-16";
    const triaged = examTriage(q, exam, now);
    expect(triaged.due.map((i) => i.topicRef.topicId)).toEqual(["b", "a"]);
    // Strong item a (0.9) is less overdue than b but should still sort after b by coverage.
    const q2 = queue(item("a", -3, 0.9), item("b", -1, 0.2));
    const triaged2 = examTriage(q2, exam, now);
    expect(triaged2.due.map((i) => i.topicRef.topicId)).toEqual(["b", "a"]);
  });

  it("falls back to overdue order when coverage is equal", () => {
    const q = queue(item("a", -1, 0.5), item("b", -3, 0.5));
    const exam = "2026-09-16";
    const triaged = examTriage(q, exam, now);
    expect(triaged.due.map((i) => i.topicRef.topicId)).toEqual(["b", "a"]);
  });

  it("leaves upcoming and neverAttempted untouched", () => {
    const q: ResurfacingQueue = {
      due: [item("a", -1, 0.5)],
      upcoming: [item("u", 5, 0.5)],
      neverAttempted: [ref("n")],
    };
    const triaged = examTriage(q, null, now);
    expect(triaged.upcoming).toBe(q.upcoming);
    expect(triaged.neverAttempted).toBe(q.neverAttempted);
  });

  it("does not use cram sorting after the exam has passed", () => {
    const q = queue(item("a", -3, 0.9), item("b", -1, 0.2));
    const triaged = examTriage(q, "2026-09-01", now);
    expect(triaged.due.map((entry) => entry.topicRef.topicId)).toEqual(["a", "b"]);
  });
});

describe("parseExamSchedule", () => {
  it("accepts a null exam date", () => {
    expect(parseExamSchedule({ schemaVersion: 1, examOn: null })).toEqual({
      schemaVersion: 1,
      examOn: null,
    });
  });

  it("accepts a valid ISO date string", () => {
    expect(parseExamSchedule({ schemaVersion: 1, examOn: "2026-12-01" })).toEqual({
      schemaVersion: 1,
      examOn: "2026-12-01",
    });
  });

  it("rejects wrong schema versions and dangerous keys", () => {
    expect(parseExamSchedule({ schemaVersion: 2, examOn: null })).toBeNull();
    const malicious = Object.create(null) as Record<string, unknown>;
    malicious["schemaVersion"] = 1;
    malicious["examOn"] = null;
    malicious["__proto__"] = 1;
    expect(parseExamSchedule(malicious)).toBeNull();
  });

  it("rejects malformed exam dates", () => {
    expect(parseExamSchedule({ schemaVersion: 1, examOn: "soon" })).toBeNull();
    expect(parseExamSchedule({ schemaVersion: 1, examOn: "2026-02-30" })).toBeNull();
    expect(parseExamSchedule({ schemaVersion: 1, examOn: 123 })).toBeNull();
    expect(parseExamSchedule({ schemaVersion: 1, examOn: null, extra: true })).toBeNull();
  });

  it("rejects non-objects", () => {
    expect(parseExamSchedule("nope")).toBeNull();
    expect(parseExamSchedule(null)).toBeNull();
  });
});
