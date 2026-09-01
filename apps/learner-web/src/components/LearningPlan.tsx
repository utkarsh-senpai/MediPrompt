import { useEffect, useState } from "react";
import { findVariant, isSubjectActive } from "@/content/packQuery";
import { daysUntilExam, examTriage } from "@/practice/examCountdown";
import {
  buildResurfacingQueue,
  localCalendarDate,
} from "@/practice/spacedRepetition";
import type {
  AttemptRecord,
  ExamScheduleStore,
  HistoryStore,
  RuntimePack,
  TopicRef,
} from "@/practice/types";

interface LearningPlanProps {
  pack: RuntimePack;
  store: HistoryStore;
  examStore: ExamScheduleStore;
  enabled: boolean;
  revision: number;
  onPractice: (ref: TopicRef) => boolean;
  onChanged: () => void;
}

function topicTitle(pack: RuntimePack, ref: TopicRef): string | null {
  if (ref.packId !== pack.packId || ref.packVersion !== pack.version) return null;
  const found = findVariant(pack, ref.variantId);
  return found?.topic.topicId === ref.topicId && isSubjectActive(found.subject)
    ? found.topic.title
    : null;
}

function currentTopicRefs(pack: RuntimePack): TopicRef[] {
  return pack.subjects.flatMap((subject) => {
    if (!isSubjectActive(subject)) return [];
    return subject.topics.flatMap((topic) =>
      topic.variants.flatMap((variant) =>
        variant.mode === "RECALL_SPRINT" || variant.mode === "DEEP_RESEARCH"
          ? [
              {
                packId: pack.packId,
                packVersion: pack.version,
                subjectId: subject.subjectId,
                topicId: topic.topicId,
                variantId: variant.variantId,
                difficultyProfileVersion: variant.difficultyProfileVersion,
                promptId: variant.promptId,
                rubricId: variant.rubricId,
              },
            ]
          : [],
      ),
    );
  });
}

export function LearningPlan({
  pack,
  store,
  examStore,
  enabled,
  revision,
  onPractice,
  onChanged,
}: LearningPlanProps) {
  const [records, setRecords] = useState<AttemptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageMode, setStorageMode] = useState<"DEVICE" | "SESSION" | null>(null);
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [examOn, setExamOn] = useState(() => examStore.load().examOn ?? "");

  useEffect(() => {
    let cancelled = false;
    void Promise.all([store.loadAll(), store.storageMode()])
      .then(([loaded, mode]) => {
        if (!cancelled) {
          setRecords(loaded);
          setStorageMode(mode);
          setMessage((current) =>
            current === "Saved practice data could not be read on this browser." ? "" : current,
          );
        }
      })
      .catch(() => {
        if (!cancelled) setMessage("Saved practice data could not be read on this browser.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [revision, store]);

  const now = new Date();
  const currentRecords = records.filter((record) => topicTitle(pack, record.topicRef) !== null);
  const queue = examTriage(
    buildResurfacingQueue(currentRecords, now, currentTopicRefs(pack)),
    examOn || null,
    now,
  );
  const nextDue = queue.due[0];
  const nextUpcoming = queue.upcoming[0];
  const examDays = daysUntilExam(examOn || null, now);

  const saveExamDate = (value: string) => {
    try {
      examStore.save({ schemaVersion: 1, examOn: value || null });
      setExamOn(value);
      setMessage(value ? "Exam date saved on this device." : "Exam date cleared.");
    } catch {
      setMessage("Choose a valid calendar date.");
    }
  };

  const exportHistory = () => {
    try {
      const body = JSON.stringify(
        {
          schemaVersion: 1,
          exportedAt: new Date().toISOString(),
          privacy: "No audio, transcript text, or transcript excerpts are included.",
          records,
        },
        null,
        2,
      );
      const url = URL.createObjectURL(new Blob([body], { type: "application/json" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `mediprompt-learning-plan-${localCalendarDate(new Date())}.json`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setMessage("Learning-plan metadata exported.");
    } catch {
      setMessage("This browser could not export the learning plan.");
    }
  };

  const deleteAll = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setMessage("Press “Delete all plan data” again to confirm.");
      return;
    }
    setConfirmDelete(false);
    try {
      await store.clear();
      const remaining = await store.loadAll();
      if (remaining.length !== 0) throw new Error("history clear was not verified");
      examStore.clear();
      setExamOn("");
      setRecords([]);
      setMessage("All saved learning-plan data was deleted from this browser.");
      onChanged();
    } catch {
      setMessage("Deletion could not be verified. Your browser may still hold saved data.");
    }
  };

  return (
    <details className="learning-plan">
      <summary>
        Learning plan · {enabled ? (loading ? "loading" : `${queue.due.length} due`) : "paused"}
      </summary>
      <div className="learning-plan-body">
        <p className="status">
          {enabled
            ? "Only topic, date, and aggregate coverage metadata is saved on this device."
            : "New attempts are not being saved. Existing data stays available until you delete it."}
        </p>
        {enabled && storageMode === "SESSION" ? (
          <p className="status" role="status">
            Browser storage is unavailable. This learning plan will last only for the current tab.
          </p>
        ) : null}

        {enabled && nextDue ? (
          <div className="learning-plan-next">
            <span className="eyebrow">Next to resurface</span>
            <strong>{topicTitle(pack, nextDue.topicRef)}</strong>
            <span className="status">
              {nextDue.daysUntilDue < 0
                ? `${Math.abs(nextDue.daysUntilDue)} day${Math.abs(nextDue.daysUntilDue) === 1 ? "" : "s"} overdue`
                : "Due today"}
            </span>
            <button
              type="button"
              className="primary"
              onClick={() => {
                if (!onPractice(nextDue.topicRef)) {
                  setMessage("That saved topic is no longer available in this pack version.");
                }
              }}
            >
              Practice due topic
            </button>
          </div>
        ) : enabled ? (
          <p className="status">
            {nextUpcoming
              ? `Nothing due. Next review is in ${nextUpcoming.daysUntilDue} day${nextUpcoming.daysUntilDue === 1 ? "" : "s"}.`
              : "No scheduled reviews yet. Complete and review an answer to begin."}
          </p>
        ) : null}

        <div className="control-row learning-plan-date">
          <label htmlFor="exam-date">Optional exam date</label>
          <input
            id="exam-date"
            type="date"
            value={examOn}
            onChange={(event) => saveExamDate(event.target.value)}
          />
          {examDays !== null ? (
            <span className="status">
              {examDays < 0
                ? "This exam date has passed; urgency sorting is off."
                : examDays === 0
                  ? "Exam day"
                  : `${examDays} day${examDays === 1 ? "" : "s"} until the exam`}
            </span>
          ) : null}
        </div>

        <p className="status">
          {records.length} saved attempt{records.length === 1 ? "" : "s"}; maximum 500.
        </p>
        <div className="toolbar">
          <button type="button" disabled={records.length === 0} onClick={exportHistory}>
            Export data
          </button>
          <button
            type="button"
            className={confirmDelete ? "danger-button" : undefined}
            disabled={records.length === 0 && !examOn}
            onClick={() => void deleteAll()}
          >
            {confirmDelete ? "Delete all plan data" : "Delete saved data"}
          </button>
          {confirmDelete ? (
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(false);
                setMessage("Deletion cancelled.");
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
        <p className="status" role="status" aria-live="polite">
          {message}
        </p>
      </div>
    </details>
  );
}
