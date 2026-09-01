// v0.7 exam-countdown triage (docs/V0.7_DEVELOPMENT_CONTEXT.md §5).
// Pure: takes a resurfacing queue and an optional exam date and reorders the
// due items for exam-aware practice. When the exam is far away, the most
// overdue topics come first. When it is close (within the cram window), the
// weakest-covered due topics come first so limited time goes to the gaps most
// likely to cost marks.

import type { ExamSchedule, ResurfacingItem, ResurfacingQueue } from "@/practice/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** Days before the exam at which triage switches to cram mode. */
export const CRAM_WINDOW_DAYS = 14;

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/**
 * Whole days until the exam (negative if past). Returns null when no exam is
 * set or the stored date is unparseable.
 */
export function daysUntilExam(examAt: string | null, now: Date): number | null {
  if (!examAt) return null;
  const exam = new Date(examAt);
  if (Number.isNaN(exam.getTime())) return null;
  return Math.floor(
    (startOfUtcDay(exam).getTime() - startOfUtcDay(now).getTime()) / MS_PER_DAY,
  );
}

function verifiableFraction(item: ResurfacingItem): number {
  const c = item.lastRecord.coverage;
  return c.verifiable ? c.weightedFraction : 0;
}

/**
 * Reorder the queue's due items for exam-aware practice. Cram mode (exam within
 * CRAM_WINDOW_DAYS, inclusive) sorts by coverage weakest-first; otherwise
 * most-overdue-first. Upcoming and neverAttempted are returned unchanged.
 */
export function examTriage(
  queue: ResurfacingQueue,
  examAt: string | null,
  now: Date,
): ResurfacingQueue {
  const days = daysUntilExam(examAt, now);
  const cramming = days !== null && days <= CRAM_WINDOW_DAYS;

  const due = [...queue.due].sort((a, b) => {
    if (cramming) {
      const byCoverage = verifiableFraction(a) - verifiableFraction(b);
      if (byCoverage !== 0) return byCoverage;
    }
    return a.daysUntilDue - b.daysUntilDue;
  });

  return {
    due,
    upcoming: queue.upcoming,
    neverAttempted: queue.neverAttempted,
  };
}

/** Validate and normalize a stored ExamSchedule payload; null if malformed. */
export function parseExamSchedule(raw: unknown): ExamSchedule | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  for (const dangerous of ["__proto__", "prototype", "constructor"]) {
    if (Object.prototype.hasOwnProperty.call(obj, dangerous)) return null;
  }
  if (obj["schemaVersion"] !== 1) return null;
  const examAt = obj["examAt"];
  if (examAt === null) return { schemaVersion: 1, examAt: null };
  if (typeof examAt !== "string") return null;
  const parsed = new Date(examAt);
  if (Number.isNaN(parsed.getTime())) return null;
  return { schemaVersion: 1, examAt };
}
