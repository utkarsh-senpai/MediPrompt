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
export function coverageToQuality(report: CoverageReport): RecallQuality | null {
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

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
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
 * wall-clock day the review happened; the next due date is that day + interval.
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
    const base = startOfUtcDay(reviewedAtDate);
    const nextDueAt = new Date(base.getTime() + intervalDays * MS_PER_DAY);
    return {
      repetitions: 0,
      easiness: clampEasiness(easiness, config.minEasiness),
      intervalDays,
      nextDueAt: nextDueAt.toISOString(),
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

  const base = startOfUtcDay(reviewedAtDate);
  const nextDueAt = new Date(base.getTime() + intervalDays * MS_PER_DAY);
  return {
    repetitions,
    easiness: nextEasiness,
    intervalDays,
    nextDueAt: nextDueAt.toISOString(),
  };
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime()) / MS_PER_DAY);
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
    const last = latestRecord(list);
    if (!last) continue;
    const daysUntilDue = daysBetween(now, new Date(last.schedule.nextDueAt));
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
