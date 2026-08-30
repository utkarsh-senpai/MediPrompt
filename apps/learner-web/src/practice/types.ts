// Domain types for the v0.2 first-playable loop.
// See docs/V0.2_DEVELOPMENT_CONTEXT.md §4 for the contract.

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
  reviewedAt: string;
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
  load(fingerprint: string): readonly string[];
  save(fingerprint: string, remainingVariantIds: readonly string[]): void;
  clear(): void;
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
  expectation: string;
  answerArc: SpeechArcStep[];
  timePolicy: TimePolicy;
  mode: V02PracticeMode;
  challenge: ChallengePreset;
  supportLevel: SupportLevel;
  register: Register;
  challengeIdentity: ChallengeIdentity;
}

// --- Session state machine (v0.2 slice only) ---

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
  | { type: "SPIN_AGAIN"; requestId: string; now: number };

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
  | { type: "FOCUS_VIEW"; target: "topic" | "speaking" | "complete" };

export interface ReducerDeps {
  pack: RuntimePack;
  /** Monotonic milliseconds for deadline math. */
  now: number;
  /** Wall-clock ISO timestamp for in-memory session metadata. */
  nowIso: string;
  /** Default durations when a variant omits them. */
  defaultSpeakingSeconds: number;
  defaultResearchSeconds: number;
}

export interface ReducerResult {
  state: SessionState;
  commands: readonly Command[];
}

export const DEFAULT_SETTINGS: Readonly<UserSettings> = Object.freeze({
  schemaVersion: 1,
  speakingSeconds: 90,
  researchSeconds: 120,
});

/** Documented bounds for durations; clamped by the settings store and reducer. */
export const TIME_BOUNDS = Object.freeze({
  speakingSeconds: { min: 30, max: 300 },
  researchSeconds: { min: 30, max: 600 },
});
