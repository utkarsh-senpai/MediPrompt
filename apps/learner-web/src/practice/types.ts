// Domain types for the v0.2 first-playable loop and the v0.3 private
// speech-intelligence extension.
// See docs/V0.2_DEVELOPMENT_CONTEXT.md §4 and docs/V0.3_DEVELOPMENT_CONTEXT.md §4.

// --- Selection dimensions (kept independent) ---

/** Full practice-mode domain. VIVA_ROUND and TEACH_BACK are reserved for later versions. */
export type PracticeMode =
  | "RECALL_SPRINT"
  | "VIVA_ROUND"
  | "DEEP_RESEARCH"
  | "TEACH_BACK";

/** Modes selectable in v0.2. The narrower type prevents dead controls / unreachable state. */
export type V02PracticeMode = Extract<
  PracticeMode,
  "RECALL_SPRINT" | "DEEP_RESEARCH"
>;

export type ChallengePreset = "GUIDED" | "APPLIED" | "VIVA";

export type Register = "EXAMINER" | "JUNIOR" | "PATIENT";

export type SupportLevel = "FULL" | "FADING" | "MINIMAL";

export type ReviewStatus = "APPROVED" | "DRAFT" | "NOT_FOR_PUBLICATION";

export type ReviewerRole = "MEDICAL_REVIEWER" | "CONTENT_EDITOR";

export type ContentKind = "MEDICAL" | "NON_MEDICAL_INTERACTION";

export type SubjectAvailability = "ACTIVE" | "COMING_SOON";

// --- Runtime topic pack ---

export interface Licence {
  id: string;
  attribution: string;
}

export interface Reviewer {
  id: string;
  role: ReviewerRole;
}

export interface PackReview {
  status: ReviewStatus;
  reviewers: Reviewer[];
  /** Null until an actual review has occurred; APPROVED packs require an ISO date. */
  reviewedAt: string | null;
}

export interface Source {
  sourceId: string;
  citation: string;
  url: string;
  accessedAt: string;
}

export interface Concept {
  conceptId: string;
  label: string;
  acceptedPhrases: string[];
  weight: number;
  sourceRefs: string[];
}

export interface Rubric {
  rubricId: string;
  variantId: string;
  register: Register;
  concepts: Concept[];
}

export interface FictionalCase {
  caseId: string;
  text: string;
}

export interface FollowUp {
  followUpId: string;
  text: string;
  kind: "PROBE" | "EVIDENCE_UPDATE";
}

/**
 * v0.6 viva defense ladder. A viva question targets a subset of the variant's
 * rubric concepts (by conceptId) and is answered aloud, transcribed on-device,
 * and coverage-scored against only those targets. Source-grounded to the same
 * rubric concepts — no new clinical claims.
 */
export type VivaLevel = "RECALL" | "EXPLAIN" | "APPLY" | "DIFFERENTIATE" | "DEFEND";

export interface VivaQuestion {
  id: string;
  level: VivaLevel;
  prompt: string;
  targetConceptIds: string[];
}

export interface TimePolicy {
  preparationSeconds?: number;
  speakingSeconds: number;
  researchSeconds?: number;
}

export interface Variant {
  variantId: string;
  challengePreset: ChallengePreset;
  difficultyProfileVersion: string;
  blueprint: string;
  promptId: string;
  mode: PracticeMode;
  supportLevel: SupportLevel;
  wording: string;
  answerArc: string[];
  timePolicy: TimePolicy;
  caseRef: string | null;
  followUpRefs: string[];
  rubricId: string;
}

export interface Topic {
  topicId: string;
  title: string;
  variants: Variant[];
  rubrics: Rubric[];
  cases: FictionalCase[];
  followUps: FollowUp[];
  /** v0.6: optional defense-ladder questions authored for this topic. */
  vivaQuestions?: VivaQuestion[];
}

export interface Subject {
  subjectId: string;
  title: string;
  /** Missing in legacy fixtures means ACTIVE. */
  availability?: SubjectAvailability;
  topics: Topic[];
}

export interface RuntimePack {
  schemaVersion: "1.0";
  contentKind: ContentKind;
  packId: string;
  version: string;
  title: string;
  locale: string;
  licence: Licence;
  review: PackReview;
  sources: Source[];
  subjects: Subject[];
}

// --- Session identity & settings ---

export interface TopicRef {
  packId: string;
  packVersion: string;
  subjectId: string;
  topicId: string;
  variantId: string;
  difficultyProfileVersion: string;
  promptId: string;
  rubricId: string;
}

export interface SpeechArcStep {
  id: string;
  label: string;
}

export interface ChallengeIdentity {
  preset: ChallengePreset;
  difficultyProfileVersion: string;
  variantId: string;
  supportLevel: SupportLevel;
}

export interface UserSettings {
  schemaVersion: 1;
  speakingSeconds: number;
  researchSeconds: number;
  /** Sound cues off when true; absent in legacy stored settings (treated as false). */
  soundMuted?: boolean;
  /**
   * v0.5: when true and an embedding model is available, refine content coverage
   * with all-MiniLM-L6-v2 cosine similarity instead of the lexical baseline.
   * Default false; the lexical engine always runs first as the guaranteed fallback.
   */
  semanticCoverage?: boolean;
  /**
   * v0.7: explicitly opt into saving minimal practice metadata on this device.
   * Audio, transcripts, and transcript excerpts are never part of this record.
   */
  practiceHistory?: boolean;
  /**
   * v0.9: opt into a wobbly "hard-to-catch" hint button that drifts to random
   * spots during the speaking timer. Deliberately adds cognitive load while
   * speaking; off by default for accessibility. Reduced-motion users get a
   * static, keyboard-accessible fallback regardless of this flag.
   */
  hardToCatchHints?: boolean;
}

export interface PracticeSelection {
  mode: V02PracticeMode;
  challenge: ChallengePreset;
  subjectId: string;
  register: Register;
}

export interface SettingsStore {
  load(): UserSettings;
  save(settings: UserSettings): void;
  clear(): void;
}

export interface BagStore {
  load(fingerprint: string): BagState | undefined;
  save(fingerprint: string, state: BagState): void;
  clear(): void;
}

export interface BagState {
  eligibleVariantIds: readonly string[];
  remainingVariantIds: readonly string[];
}

export interface PracticeSession {
  id: string;
  topic: TopicRef;
  mode: V02PracticeMode;
  challenge: ChallengePreset;
  supportLevel: SupportLevel;
  register: Register;
  timePolicy: TimePolicy;
  attemptIds: string[];
  createdAt: string;
  completedAt?: string;
}

// --- Resolved topic snapshot handed to the UI ---

export interface TopicSnapshot {
  topicRef: TopicRef;
  title: string;
  wording: string;
  caseText?: string;
  expectation: string;
  answerArc: SpeechArcStep[];
  timePolicy: TimePolicy;
  mode: V02PracticeMode;
  challenge: ChallengePreset;
  supportLevel: SupportLevel;
  register: Register;
  challengeIdentity: ChallengeIdentity;
  /**
   * v0.6: viva questions whose targetConceptIds all exist in the variant's
   * rubric. Empty when the topic has no usable viva ladder; the UI treats that
   * as an explicit "viva unavailable" outcome rather than hiding the feature.
   */
  vivaQuestions: VivaQuestion[];
}

// --- v0.3 speech intelligence contracts (verbatim from L4) ---

export type TranscriptSource = "LOCAL_WHISPER" | "WEB_SPEECH" | "TYPED";

export interface TranscriptModel {
  id: string;
  /** Pinned model revision (commit hash). */
  version: string;
  quantization: string;
}

export interface TranscriptDraft {
  text: string;
  source: TranscriptSource;
  model?: TranscriptModel;
  /** Character ranges the transcriber flagged as low-confidence; never auto-corrected. */
  uncertainRanges: Array<{ start: number; end: number }>;
}

export interface ApprovedTranscript {
  rawText?: string;
  text: string;
  approvedAt: string;
  wasEdited: boolean;
}

export type PauseKind = "MID_CLAUSE" | "BOUNDARY" | "UNKNOWN";

export interface PauseObservation {
  startMs: number;
  durationMs: number;
  kind: PauseKind;
}

/**
 * Delivery observations. Absent optional fields mean "not measurable on this
 * device/recording", never zero. Audio-derived fields are final when computed;
 * transcript-derived fields appear only after the learner approves a transcript.
 */
export interface DeliveryMetrics {
  durationMs: number;
  spokenMs?: number;
  wordsPerMinute?: number;
  fillerCount?: number;
  repeatedPhraseCount?: number;
  pauses: PauseObservation[];
  clippingRatio?: number;
  loudnessVariationDb?: number;
  limitations: string[];
}

/** Transcript-derived subset of DeliveryMetrics, computed on approval. */
export type TextMetrics = Pick<
  DeliveryMetrics,
  "wordsPerMinute" | "fillerCount" | "repeatedPhraseCount"
>;

// --- v0.4 content-coverage contracts ---
// Coverage is "did the expected idea appear in the approved transcript", not a
// correctness grade. The lexical engine lives in src/scoring/coverage.ts; these
// domain shapes live here so practice/ does not depend on the scoring module.

export interface ConceptResult {
  conceptId: string;
  label: string;
  weight: number;
  hit: boolean;
  /** Rubric phrase/label that matched, for evidence; null on miss. */
  matchedPhrase: string | null;
  /** Optional sentence-level evidence from the v0.5 semantic enhancer. */
  semanticEvidence?: {
    status: "COVERED" | "POSSIBLY_COVERED" | "NOT_FOUND";
    transcriptSegment: string | null;
    rubricText: string | null;
    similarity: number | null;
    thresholdVersion: string;
  };
}

export type CoverageUnavailableReason =
  | "NO_TRANSCRIPT"
  | "NO_SCORABLE_RUBRIC";

interface CoverageReportValues {
  /** Reproducible scoring identity; comparisons require an exact match. */
  scoring: {
    method: "LEXICAL" | "LEXICAL_SEMANTIC";
    version: string;
  };
  conceptResults: ConceptResult[];
  hitCount: number;
  totalCount: number;
  /** Weighted hit / weighted total, 0..1. 0 when not verifiable. */
  weightedFraction: number;
  /** Flat-fraction echo (hitCount/totalCount) for copy that ignores weight. */
  fraction: number;
}

export type CoverageReport =
  | (CoverageReportValues & {
      verifiable: true;
      unavailableReason: null;
    })
  | (CoverageReportValues & {
      verifiable: false;
      unavailableReason: CoverageUnavailableReason;
    });

/** Direction of a valid same-identity Refinement Delta. */
export type RefinementDirection = "IMPROVED" | "FLAT" | "REGRESSED";

export type RefinementDeltaUnavailableReason =
  | "PRIOR_COVERAGE_UNAVAILABLE"
  | "CURRENT_COVERAGE_UNAVAILABLE"
  | "ATTEMPT_IDENTITY_MISMATCH"
  | "SCORING_IDENTITY_MISMATCH";

/** A delta is numeric only when both attempts and their scorers are comparable. */
export type RefinementDeltaResult =
  | {
      available: true;
      score: number;
      direction: RefinementDirection;
      newlyCoveredConceptIds: string[];
      lostConceptIds: string[];
    }
  | {
      available: false;
      reason: RefinementDeltaUnavailableReason;
    };

// --- v0.6 viva defense-ladder contracts ---
// Viva coverage is "did the expected idea appear in this defense answer",
// scored against the question's targetConceptIds. It is separate from the main
// attempt coverage, is never a correctness grade, and never feeds Refinement Delta.

/** One completed defense answer, session-local only. */
export interface VivaAnswer {
  questionIndex: number;
  question: VivaQuestion;
  attemptId: string;
  transcript: ApprovedTranscript;
  coverage: CoverageReport;
  textMetrics: TextMetrics | null;
  metrics: DeliveryMetrics | null;
}

/** Bounded viva attempt trace (≤ MAX_VIVA_ANSWERS) carried across viva states. */
export interface VivaRuntime {
  requestId: string;
  questions: VivaQuestion[];
  index: number;
  answers: VivaAnswer[];
  /** The REVIEW state to restore on EXIT_VIVA (main attempt coverage preserved). */
  base: ReviewState;
}

export interface VivaFollowUpSummary {
  questionId: string;
  level: VivaLevel;
  coverage: CoverageReport;
}

export interface VivaSummary {
  answeredCount: number;
  /** Answers included in the numeric aggregate. */
  scoredCount: number;
  notVerifiableCount: number;
  /** Weighted fraction across verifiable answers; 0 when none are verifiable. */
  weightedFraction: number;
  perFollowUp: VivaFollowUpSummary[];
}

/** Captured when the ladder is exhausted; derived purely from the answers. */
export type VivaCompleteState = {
  name: "VIVA_COMPLETE";
  selection: PracticeSelection;
  topic: TopicSnapshot;
  viva: VivaRuntime;
  summary: VivaSummary;
};

export type AudioErrorCode =
  | "AUDIO_MIC_PERMISSION_DENIED"
  | "AUDIO_MIC_UNAVAILABLE"
  | "AUDIO_RECORD_FAILED"
  | "AUDIO_DECODE_FAILED"
  | "AUDIO_ANALYSIS_FAILED";

export type TranscriptionUnavailableReason =
  | "DECLINED"
  | "LOAD_FAILED"
  | "OFFLINE"
  | "TIMEOUT"
  | "LOW_MEMORY"
  | "CANCELLED"
  | "ERROR";

// --- Session state machine ---

export interface AttemptDraft {
  sessionId: string;
  attemptId: string;
  topicRef: TopicRef;
  mode: V02PracticeMode;
  challenge: ChallengePreset;
  supportLevel: SupportLevel;
  register: Register;
  timePolicy: TimePolicy;
  challengeIdentity: ChallengeIdentity;
  createdAt: string;
  /** 1 for the first attempt on a topic; increments on each same-topic re-attempt. */
  attemptIndex: number;
  /** Completed prior attempts for the current same-topic retry chain; session-local only. */
  history: AttemptHistoryEntry[];
}

/** Immutable, session-local record used for traceability and safe comparison. */
export interface AttemptHistoryEntry {
  attemptId: string;
  attemptIndex: number;
  topicRef: TopicRef;
  mode: V02PracticeMode;
  challenge: ChallengePreset;
  supportLevel: SupportLevel;
  register: Register;
  timePolicy: TimePolicy;
  coverage: CoverageReport;
  transcriptText: string;
}

export type SessionState =
  | { name: "IDLE"; selection: PracticeSelection }
  | { name: "DRAWING"; selection: PracticeSelection; requestId: string }
  | {
      name: "TOPIC_READY";
      selection: PracticeSelection;
      requestId: string;
      topic: TopicSnapshot;
      attempt: AttemptDraft;
    }
  | {
      name: "RESEARCHING";
      selection: PracticeSelection;
      requestId: string;
      topic: TopicSnapshot;
      attempt: AttemptDraft;
      deadlineAt: number;
    }
  | {
      name: "READY_TO_SPEAK";
      selection: PracticeSelection;
      requestId: string;
      topic: TopicSnapshot;
      attempt: AttemptDraft;
    }
  | {
      name: "SPEAKING";
      selection: PracticeSelection;
      requestId: string;
      topic: TopicSnapshot;
      attempt: AttemptDraft;
      deadlineAt: number;
    }
  | {
      name: "ATTEMPT_COMPLETE";
      selection: PracticeSelection;
      topic: TopicSnapshot;
      attempt: AttemptDraft;
    }
  // --- v0.3 post-attempt extension states (optional; removing them must leave
  // the v0.2 paths behaviorally identical). Stale async results are dropped by
  // attemptId, the post-attempt identity key. ---
  | {
      name: "PROCESSING";
      selection: PracticeSelection;
      topic: TopicSnapshot;
      attempt: AttemptDraft;
      metrics: DeliveryMetrics | null;
      draft: TranscriptDraft | null;
      transcription: "IDLE" | "RUNNING";
    }
  | {
      name: "TRANSCRIPT_REVIEW";
      selection: PracticeSelection;
      topic: TopicSnapshot;
      attempt: AttemptDraft;
      metrics: DeliveryMetrics;
      draft: TranscriptDraft;
    }
  | {
      name: "SELF_REVIEW";
      selection: PracticeSelection;
      topic: TopicSnapshot;
      attempt: AttemptDraft;
      metrics: DeliveryMetrics | null;
      /** Why no transcript is in play (null when the learner chose the typed path directly). */
      transcriptionIssue: TranscriptionUnavailableReason | null;
    }
  | {
      name: "REVIEW";
      selection: PracticeSelection;
      topic: TopicSnapshot;
      attempt: AttemptDraft;
      metrics: DeliveryMetrics | null;
      textMetrics: TextMetrics | null;
      transcript: ApprovedTranscript;
      /** Content coverage against the variant rubric; computed on approval. */
      coverage: CoverageReport;
      /** Same-identity coverage change; null on attempt 1. */
      refinementDelta: RefinementDeltaResult | null;
    }
  // --- v0.6 viva defense-ladder states. Kept separate from the v0.2–v0.5
  // paths so the main loop is untouched; async results are stale-dropped by the
  // current viva attempt's attemptId. `attempt` is the in-flight defense answer
  // so the shared recorder/transcription pipeline keys off it unchanged. ---
  | {
      name: "VIVA_READY";
      selection: PracticeSelection;
      topic: TopicSnapshot;
      viva: VivaRuntime;
      attempt: AttemptDraft;
    }
  | {
      name: "VIVA_ASKING";
      selection: PracticeSelection;
      topic: TopicSnapshot;
      viva: VivaRuntime;
      attempt: AttemptDraft;
    }
  | {
      name: "VIVA_SPEAKING";
      selection: PracticeSelection;
      topic: TopicSnapshot;
      viva: VivaRuntime;
      attempt: AttemptDraft;
      deadlineAt: number;
    }
  | {
      name: "VIVA_ATTEMPT_COMPLETE";
      selection: PracticeSelection;
      topic: TopicSnapshot;
      viva: VivaRuntime;
      attempt: AttemptDraft;
    }
  | {
      name: "VIVA_PROCESSING";
      selection: PracticeSelection;
      topic: TopicSnapshot;
      viva: VivaRuntime;
      attempt: AttemptDraft;
      metrics: DeliveryMetrics | null;
      draft: TranscriptDraft | null;
      transcription: "IDLE" | "RUNNING";
    }
  | {
      name: "VIVA_TRANSCRIPT_REVIEW";
      selection: PracticeSelection;
      topic: TopicSnapshot;
      viva: VivaRuntime;
      attempt: AttemptDraft;
      metrics: DeliveryMetrics;
      draft: TranscriptDraft;
    }
  | {
      name: "VIVA_SELF_REVIEW";
      selection: PracticeSelection;
      topic: TopicSnapshot;
      viva: VivaRuntime;
      attempt: AttemptDraft;
      metrics: DeliveryMetrics | null;
      transcriptionIssue: TranscriptionUnavailableReason | null;
    }
  | {
      name: "VIVA_ANSWER_REVIEW";
      selection: PracticeSelection;
      topic: TopicSnapshot;
      viva: VivaRuntime;
      attempt: AttemptDraft;
      metrics: DeliveryMetrics | null;
      textMetrics: TextMetrics | null;
      transcript: ApprovedTranscript;
      /** Coverage against the current question's targetConceptIds. */
      coverage: CoverageReport;
    }
  | VivaCompleteState;

/** The REVIEW member of SessionState, restored when the learner exits viva. */
export type ReviewState = Extract<SessionState, { name: "REVIEW" }>;

/** Bounds the session-local viva answer trace. */
export const MAX_VIVA_ANSWERS = 19;

// --- v0.7 private learning-plan contracts ---
// Persistence is learner-controlled and metadata-only. In particular, neither
// transcript text nor semantic transcript excerpts may enter AttemptRecord.

/** Privacy-minimized coverage snapshot; sufficient for scheduling and export. */
export interface PersistedCoverage {
  verifiable: boolean;
  unavailableReason: CoverageUnavailableReason | null;
  scoring: CoverageReport["scoring"];
  hitCount: number;
  totalCount: number;
  weightedFraction: number;
  fraction: number;
}

/** Persisted summary of one completed, reviewed attempt. Local-only. */
export interface AttemptRecord {
  schemaVersion: 1;
  /** Matches the in-memory AttemptDraft.attemptId; stable per attempt. */
  attemptId: string;
  /** Materialized IndexedDB index; must equal topicFingerprint(topicRef). */
  topicFingerprint: string;
  topicRef: TopicRef;
  mode: V02PracticeMode;
  challenge: ChallengePreset;
  attemptIndex: number;
  /** ISO wall-clock timestamp the attempt was reviewed. */
  reviewedAt: string;
  /** Frozen, transcript-free coverage summary from review time. */
  coverage: PersistedCoverage;
  /** Null when the attempt was not verifiable and cannot advance scheduling. */
  schedule: SpacedSchedule | null;
}

/** SM-2-style per-topic scheduling state. */
export interface SpacedSchedule {
  /** Successful-review repetition count (n). */
  repetitions: number;
  /** Easiness factor (EF). */
  easiness: number;
  /** Interval in days until the next due review. */
  intervalDays: number;
  /** Learner-local calendar date (YYYY-MM-DD) the next review is due. */
  nextDueOn: string;
}

/** SM-2 recall quality, 0 (blackout) .. 5 (perfect). */
export type RecallQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SpacedRepetitionConfig {
  /** Minimum easiness factor (SM-2 floor). */
  minEasiness: number;
  /** Initial easiness factor for a new topic. */
  initialEasiness: number;
  /** First interval in days after a successful first review. */
  firstIntervalDays: number;
  /** Second interval in days. */
  secondIntervalDays: number;
}

export const DEFAULT_SR_CONFIG: Readonly<SpacedRepetitionConfig> = Object.freeze({
  minEasiness: 1.3,
  initialEasiness: 2.5,
  firstIntervalDays: 1,
  secondIntervalDays: 3,
});

/** One item in the resurfacing queue, derived from persisted history. */
export interface ResurfacingItem {
  topicRef: TopicRef;
  /** Most recent record for the topic. */
  lastRecord: AttemptRecord;
  /** Days until the next due review; negative = overdue. */
  daysUntilDue: number;
  /** Whether the next review is due now (daysUntilDue <= 0). */
  due: boolean;
}

export interface ResurfacingQueue {
  /** Due/overdue items, most overdue first. */
  due: ResurfacingItem[];
  /** Upcoming (not yet due), soonest first. */
  upcoming: ResurfacingItem[];
  /** Topics never attempted, when the caller provided them. */
  neverAttempted: TopicRef[];
}

/** Optional exam-date schedule, persisted in localStorage (v0.7). */
export interface ExamSchedule {
  schemaVersion: 1;
  /** Learner-local calendar date (YYYY-MM-DD), or null when unset. */
  examOn: string | null;
}

export const DEFAULT_EXAM_SCHEDULE: Readonly<ExamSchedule> = Object.freeze({
  schemaVersion: 1,
  examOn: null,
});

/**
 * Persisted-history port. IndexedDB is async, so the interface is async. Records
 * are keyed by attemptId and indexed by a topic fingerprint (see
 * spacedRepetition.topicFingerprint). Implementations must treat stored data as
 * untrusted and drop malformed records.
 */
export interface HistoryStore {
  storageMode(): Promise<"DEVICE" | "SESSION">;
  loadTopic(topicFingerprint: string): Promise<AttemptRecord[]>;
  loadAll(): Promise<AttemptRecord[]>;
  append(record: AttemptRecord): Promise<AttemptRecord>;
  clearTopic(topicFingerprint: string): Promise<void>;
  clear(): Promise<void>;
}

export interface ExamScheduleStore {
  load(): ExamSchedule;
  save(schedule: ExamSchedule): void;
  clear(): void;
}

export type SessionEvent =
  | { type: "CHANGE_SELECTION"; selection: PracticeSelection }
  | { type: "SPIN"; requestId: string; now: number }
  | {
      type: "RESURFACE_TOPIC";
      requestId: string;
      selection: PracticeSelection;
      topic: TopicSnapshot;
      now: number;
    }
  | { type: "TOPIC_DRAWN"; requestId: string; topic: TopicSnapshot; now: number }
  | { type: "START_RESEARCH"; now: number }
  | { type: "DONE_RESEARCHING"; requestId: string; now: number }
  | { type: "CONFIRM_READY"; now: number }
  | { type: "START_TIMER"; now: number }
  | { type: "TIMER_ELAPSED"; requestId: string; now: number }
  | { type: "CLOSE_TIMER"; now: number }
  | { type: "SPIN_AGAIN"; requestId: string; now: number }
  // --- v0.3 post-attempt events ---
  | { type: "START_TYPED_REVIEW"; attemptId: string; now: number }
  | { type: "RECORDING_READY"; attemptId: string; now: number }
  | {
      type: "METRICS_READY";
      attemptId: string;
      metrics: DeliveryMetrics;
      now: number;
    }
  | { type: "TRANSCRIBE_REQUESTED"; attemptId: string; now: number }
  | {
      type: "TRANSCRIPT_READY";
      attemptId: string;
      draft: TranscriptDraft;
      now: number;
    }
  | {
      type: "TRANSCRIPTION_UNAVAILABLE";
      attemptId: string;
      reason: TranscriptionUnavailableReason;
      now: number;
    }
  | {
      type: "TRANSCRIPT_APPROVED";
      attemptId: string;
      transcript: ApprovedTranscript;
      textMetrics: TextMetrics;
      coverage: CoverageReport;
      /** Same-identity Refinement Delta; null on attempt 1. */
      refinementDelta: RefinementDeltaResult | null;
      now: number;
    }
  | {
      type: "SELF_REVIEW_DONE";
      attemptId: string;
      transcript: ApprovedTranscript;
      textMetrics: TextMetrics;
      coverage: CoverageReport;
      /** Same-identity Refinement Delta; null on attempt 1. */
      refinementDelta: RefinementDeltaResult | null;
      now: number;
    }
  | {
      // Begin a same-topic re-attempt from the review screen.
      type: "START_SECOND_ATTEMPT";
      requestId: string;
      now: number;
    }
  | {
      // v0.5: an async semantic pass refined the coverage after the lexical baseline.
      type: "COVERAGE_REFINED";
      attemptId: string;
      coverage: CoverageReport;
      /** Recomputed delta after a semantic refinement. */
      refinementDelta: RefinementDeltaResult | null;
      now: number;
    }
  // --- v0.6 viva events ---
  | { type: "START_VIVA"; requestId: string; now: number }
  | { type: "BEGIN_VIVA_QUESTION"; attemptId: string; now: number }
  | { type: "START_VIVA_SPEAKING"; now: number }
  | {
      type: "APPROVE_VIVA_TRANSCRIPT";
      attemptId: string;
      transcript: ApprovedTranscript;
      textMetrics: TextMetrics;
      coverage: CoverageReport;
      now: number;
    }
  | {
      type: "VIVA_SELF_REVIEW_DONE";
      attemptId: string;
      transcript: ApprovedTranscript;
      textMetrics: TextMetrics;
      coverage: CoverageReport;
      now: number;
    }
  | {
      type: "VIVA_COVERAGE_REFINED";
      attemptId: string;
      coverage: CoverageReport;
      now: number;
    }
  | { type: "NEXT_VIVA_QUESTION"; attemptId: string; now: number }
  | { type: "EXIT_VIVA"; now: number };

// --- Commands the orchestrator runs as effects ---

export type Command =
  | {
      type: "REQUEST_DRAW";
      requestId: string;
      fingerprint: string;
      eligibleVariantIds: readonly string[];
    }
  | { type: "START_DEADLINE"; deadlineAt: number }
  | { type: "STOP_DEADLINE" }
  | {
      type: "FOCUS_VIEW";
      target:
        | "topic"
        | "speaking"
        | "complete"
        | "processing"
        | "review"
        | "viva-asking"
        | "viva-processing"
        | "viva-review"
        | "viva-complete";
    }
  // --- v0.3 commands (orchestrator effects; reducer stays pure) ---
  | { type: "START_RECORDING"; attemptId: string }
  | { type: "STOP_RECORDING"; attemptId: string }
  | { type: "RUN_ANALYSIS"; attemptId: string }
  | { type: "START_TRANSCRIPTION"; attemptId: string }
  | { type: "CANCEL_TRANSCRIPTION"; attemptId: string }
  | { type: "REVOKE_RECORDING"; attemptId: string };

export interface ReducerDeps {
  pack: RuntimePack;
  /** Monotonic milliseconds for deadline math. */
  now: number;
  /** Wall-clock ISO timestamp for in-memory session metadata. */
  nowIso: string;
  /** Default durations when a variant omits them. */
  defaultSpeakingSeconds: number;
  defaultResearchSeconds: number;
  /**
   * Whether the recorder is armed for this attempt (capability present,
   * primer accepted, permission granted, codec supported). Owned by the
   * orchestrator; the reducer only uses it to emit recording commands.
   */
  audioArmed: boolean;
}

export interface ReducerResult {
  state: SessionState;
  commands: readonly Command[];
}

export const DEFAULT_SETTINGS: Readonly<UserSettings> = Object.freeze({
  schemaVersion: 1,
  speakingSeconds: 60,
  researchSeconds: 600,
  soundMuted: false,
  semanticCoverage: false,
  practiceHistory: false,
  hardToCatchHints: false,
});

/**
 * Weighted coverage fraction at which a review is treated as "full coverage"
 * for the v0.9 celebratory confetti + chime. 1.0 = every weighted concept hit.
 */
export const FULL_COVERAGE_THRESHOLD = 1.0;

/** Documented bounds for durations; clamped by the settings store and reducer. */
export const TIME_BOUNDS = Object.freeze({
  speakingSeconds: { min: 30, max: 300 },
  researchSeconds: { min: 30, max: 600 },
});
