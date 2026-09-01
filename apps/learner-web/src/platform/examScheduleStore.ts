import {
  DEFAULT_EXAM_SCHEDULE,
  type ExamSchedule,
  type ExamScheduleStore,
} from "@/practice/types";
import { parseExamSchedule } from "@/practice/examCountdown";

const STORAGE_KEY = "mediprompt:exam-schedule:v1";

export class LocalStorageExamScheduleStore implements ExamScheduleStore {
  private current: ExamSchedule = { ...DEFAULT_EXAM_SCHEDULE };

  load(): ExamSchedule {
    try {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
      const parsed = raw ? parseExamSchedule(JSON.parse(raw)) : null;
      if (parsed) this.current = parsed;
    } catch {
      // Denied or malformed storage leaves the current-session value intact.
    }
    return { ...this.current };
  }

  save(schedule: ExamSchedule): void {
    const parsed = parseExamSchedule(schedule);
    if (!parsed) throw new TypeError("Invalid exam schedule");
    this.current = parsed;
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch {
      // The in-memory copy remains usable for this page session.
    }
  }

  clear(): void {
    this.current = { ...DEFAULT_EXAM_SCHEDULE };
    try {
      globalThis.localStorage?.removeItem(STORAGE_KEY);
    } catch {
      // Storage is an enhancement; memory is already cleared.
    }
  }
}
