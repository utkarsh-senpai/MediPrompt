// v0.7 exam-countdown triage (docs/V0.7_DEVELOPMENT_CONTEXT.md §5).
// Pure: takes a resurfacing queue and an optional exam date and reorders the
// due items for exam-aware practice. When the exam is far away, the most
// overdue topics come first. When it is close (within the cram window), the
// weakest-covered due topics come first so limited time goes to the gaps most
// likely to cost marks.

import type { ExamSchedule, ResurfacingItem, ResurfacingQueue } from "@/practice/types";
import { calendarDayNumber, localCalendarDate } from "@/practice/spacedRepetition";

/** Days before the exam at which triage switches to cram mode. */
export const CRAM_WINDOW_DAYS = 14;

/**
 * Whole days until the exam (negative if past). Returns null when no exam is
 * set or the stored date is unparseable.
 */
export function daysUntilExam(examOn: string | null, now: Date): number | null {
  if (!examOn) return null;
  const examDay = calendarDayNumber(examOn);
  const today = calendarDayNumber(localCalendarDate(now));
  return examDay === null || today === null ? null : examDay - today;
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
  examOn: string | null,
  now: Date,
): ResurfacingQueue {
  const days = daysUntilExam(examOn, now);
  const cramming = days !== null && days >= 0 && days <= CRAM_WINDOW_DAYS;

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
  const keys = Object.keys(obj);
  if (keys.some((key) => key !== "schemaVersion" && key !== "examOn")) return null;
  if (!Object.prototype.hasOwnProperty.call(obj, "examOn")) return null;
  const examOn = obj["examOn"];
  if (examOn === null) return { schemaVersion: 1, examOn: null };
  if (typeof examOn !== "string" || calendarDayNumber(examOn) === null) return null;
  return { schemaVersion: 1, examOn };
}
