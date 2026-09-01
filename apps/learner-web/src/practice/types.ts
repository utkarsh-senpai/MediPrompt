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
}

export interface Subject {
  subjectId: string;
  title: string;
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
    };

export type SessionEvent =
  | { type: "CHANGE_SELECTION"; selection: PracticeSelection }
  | { type: "SPIN"; requestId: string; now: number }
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
      now: number;
    }
  | {
      type: "SELF_REVIEW_DONE";
      attemptId: string;
      transcript: ApprovedTranscript;
      textMetrics: TextMetrics;
      now: number;
    };

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
      target: "topic" | "speaking" | "complete" | "processing" | "review";
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
  speakingSeconds: 90,
  researchSeconds: 120,
  soundMuted: false,
});

/** Documented bounds for durations; clamped by the settings store and reducer. */
export const TIME_BOUNDS = Object.freeze({
  speakingSeconds: { min: 30, max: 300 },
  researchSeconds: { min: 30, max: 600 },
});
