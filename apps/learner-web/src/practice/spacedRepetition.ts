// v0.7 spaced-resurfacing scheduler (docs/V0.7_DEVELOPMENT_CONTEXT.md §4).
// Pure: history records and the wall clock are injected. The algorithm is an
// SM-2 variant tuned for short daily practice cadence (configurable first/second
// intervals). Coverage is mapped to an SM-2 recall quality; not-verifiable
// attempts do not advance scheduling (the caller must skip them).

import {
  type AttemptRecord,
  type CoverageReport,
  type RecallQuality,
  type ResurfacingItem,
  type ResurfacingQueue,
  type SpacedRepetitionConfig,
  type SpacedSchedule,
  type TopicRef,
  DEFAULT_SR_CONFIG,
} from "@/practice/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Stable identity for a topic across attempts. JSON preserves field order. */
export function topicFingerprint(ref: TopicRef): string {
  return JSON.stringify([
    ref.packId,
    ref.packVersion,
    ref.subjectId,
    ref.topicId,
    ref.variantId,
  ]);
}

/**
 * Map a verifiable coverage report to an SM-2 recall quality. Returns null for
 * not-verifiable reports — those attempts carry no scorable signal and must not
 * drive scheduling.
 */
export function coverageToQuality(
  report: Pick<CoverageReport, "verifiable" | "weightedFraction">,
): RecallQuality | null {
  if (!report.verifiable) return null;
  const f = report.weightedFraction;
  if (f >= 0.9) return 5;
  if (f >= 0.75) return 4;
  if (f >= 0.5) return 3;
  if (f >= 0.25) return 2;
  if (f > 0) return 1;
  return 0;
}

function clampEasiness(value: number, min: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.round(value * 1000) / 1000);
}

/** Strict learner-local calendar date parser. Returns a UTC day number. */
export function calendarDayNumber(value: string): number | null {
  const match = CALENDAR_DATE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const time = Date.UTC(year, month - 1, day);
  const parsed = new Date(time);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return Math.floor(time / MS_PER_DAY);
}

/** Calendar date in the learner's current timezone, without an implicit UTC shift. */
export function localCalendarDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addCalendarDays(date: Date, intervalDays: number): string {
  const base = calendarDayNumber(localCalendarDate(date));
  if (base === null) throw new RangeError("invalid review date");
  return new Date((base + intervalDays) * MS_PER_DAY).toISOString().slice(0, 10);
}

/**
 * Advance the schedule by one review.
 *
 * SM-2 recurrence:
 * - quality < 3 → reset: repetitions = 0, interval = firstIntervalDays.
 * - otherwise: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)), clamped to
 *   minEasiness; repetitions += 1; interval = first | second | round(prev * EF).
 *
 * `prev` is null for a topic's first scheduled review. `reviewedAtDate` is the
 * learner-local calendar day the review happened; the next due date is that day
 * plus the interval. Calendar dates avoid UTC shifts around local midnight.
 */
export function scheduleReview(
  prev: SpacedSchedule | null,
  quality: RecallQuality,
  reviewedAtDate: Date,
  config: SpacedRepetitionConfig = DEFAULT_SR_CONFIG,
): SpacedSchedule {
  const easiness = prev?.easiness ?? config.initialEasiness;

  if (quality < 3) {
    const intervalDays = config.firstIntervalDays;
    return {
      repetitions: 0,
      easiness: clampEasiness(easiness, config.minEasiness),
      intervalDays,
      nextDueOn: addCalendarDays(reviewedAtDate, intervalDays),
    };
  }

  const q = quality;
  const nextEasiness = clampEasiness(
    easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
    config.minEasiness,
  );
  const repetitions = (prev?.repetitions ?? 0) + 1;

  let intervalDays: number;
  if (repetitions === 1) {
    intervalDays = config.firstIntervalDays;
  } else if (repetitions === 2) {
    intervalDays = config.secondIntervalDays;
  } else {
    const prevInterval = prev?.intervalDays ?? config.firstIntervalDays;
    intervalDays = Math.max(1, Math.round(prevInterval * nextEasiness));
  }

  return {
    repetitions,
    easiness: nextEasiness,
    intervalDays,
    nextDueOn: addCalendarDays(reviewedAtDate, intervalDays),
  };
}

function daysBetween(from: Date, toOn: string): number | null {
  const fromDay = calendarDayNumber(localCalendarDate(from));
  const toDay = calendarDayNumber(toOn);
  return fromDay === null || toDay === null ? null : toDay - fromDay;
}

/** The most recent record for a topic (by reviewedAt), or undefined. */
export function latestRecord(records: readonly AttemptRecord[]): AttemptRecord | undefined {
  if (records.length === 0) return undefined;
  return records.reduce((best, r) =>
    r.reviewedAt > best.reviewedAt ? r : best,
  );
}

/**
 * Build the resurfacing queue from all persisted records. Each topic contributes
 * one item keyed by its latest record. `neverAttempted` topics (caller-supplied,
 * e.g. the pack's full topic list minus attempted ones) are passed through.
 */
export function buildResurfacingQueue(
  records: readonly AttemptRecord[],
  now: Date,
  neverAttempted: readonly TopicRef[] = [],
): ResurfacingQueue {
  const byTopic = new Map<string, AttemptRecord[]>();
  for (const r of records) {
    const fp = topicFingerprint(r.topicRef);
    const list = byTopic.get(fp);
    if (list) list.push(r);
    else byTopic.set(fp, [r]);
  }

  const items: ResurfacingItem[] = [];
  for (const list of byTopic.values()) {
    // An unverifiable attempt has no schedule and must not erase the prior due
    // state for the same topic.
    const last = latestRecord(list.filter((record) => record.schedule !== null));
    if (!last) continue;
    if (!last.schedule) continue;
    const daysUntilDue = daysBetween(now, last.schedule.nextDueOn);
    if (daysUntilDue === null) continue;
    items.push({
      topicRef: last.topicRef,
      lastRecord: last,
      daysUntilDue,
      due: daysUntilDue <= 0,
    });
  }

  const due = items
    .filter((i) => i.due)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  const upcoming = items
    .filter((i) => !i.due)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  const attemptedFP = new Set(byTopic.keys());
  const neverAttemptedFiltered = neverAttempted.filter(
    (ref) => !attemptedFP.has(topicFingerprint(ref)),
  );

  return { due, upcoming, neverAttempted: neverAttemptedFiltered };
}
