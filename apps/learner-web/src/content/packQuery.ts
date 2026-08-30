import type {
  ChallengePreset,
  RuntimePack,
  SpeechArcStep,
  Subject,
  TimePolicy,
  Topic,
  TopicRef,
  TopicSnapshot,
  Variant,
  V02PracticeMode,
} from "@/practice/types";

export interface SubjectOption {
  subjectId: string;
  title: string;
}

export function listSubjects(pack: RuntimePack): SubjectOption[] {
  return pack.subjects.map((s) => ({ subjectId: s.subjectId, title: s.title }));
}

export function findSubject(
  pack: RuntimePack,
  subjectId: string,
): Subject | undefined {
  return pack.subjects.find((s) => s.subjectId === subjectId);
}

function variantsInSubject(pack: RuntimePack, subjectId: string): Variant[] {
  const subject = findSubject(pack, subjectId);
  if (!subject) return [];
  return subject.topics.flatMap((t) => t.variants);
}

/** Distinct challenge presets available for a subject + mode, in canonical order. */
export function presetsFor(
  pack: RuntimePack,
  subjectId: string,
  mode: V02PracticeMode,
): ChallengePreset[] {
  const order: ChallengePreset[] = ["GUIDED", "APPLIED", "VIVA"];
  const present = new Set(
    variantsInSubject(pack, subjectId)
      .filter((v) => v.mode === mode)
      .map((v) => v.challengePreset),
  );
  return order.filter((p) => present.has(p));
}

export function eligibleVariants(
  pack: RuntimePack,
  subjectId: string,
  mode: V02PracticeMode,
  challenge: ChallengePreset,
): Variant[] {
  return variantsInSubject(pack, subjectId).filter(
    (v) => v.mode === mode && v.challengePreset === challenge,
  );
}

export function eligibleVariantIds(
  pack: RuntimePack,
  subjectId: string,
  mode: V02PracticeMode,
  challenge: ChallengePreset,
): string[] {
  return eligibleVariants(pack, subjectId, mode, challenge).map((v) => v.variantId);
}

export function findVariant(
  pack: RuntimePack,
  variantId: string,
): { variant: Variant; topic: Topic; subject: Subject } | undefined {
  for (const subject of pack.subjects) {
    for (const topic of subject.topics) {
      const variant = topic.variants.find((v) => v.variantId === variantId);
      if (variant) return { variant, topic, subject };
    }
  }
  return undefined;
}

const PRESET_EXPECTATION: Record<ChallengePreset, string> = {
  GUIDED: "Explain core ideas",
  APPLIED: "Apply ideas to a bounded case",
  VIVA: "Defend under changing evidence",
};

function arcSteps(arc: string[]): SpeechArcStep[] {
  return arc.map((step) => ({
    id: step,
    label: step.charAt(0).toUpperCase() + step.slice(1),
  }));
}

function withDefaults(
  timePolicy: TimePolicy,
  defaults: { speakingSeconds: number; researchSeconds: number },
  mode: V02PracticeMode,
): TimePolicy {
  return {
    preparationSeconds: timePolicy.preparationSeconds,
    speakingSeconds: timePolicy.speakingSeconds ?? defaults.speakingSeconds,
    researchSeconds:
      mode === "DEEP_RESEARCH"
        ? (timePolicy.researchSeconds ?? defaults.researchSeconds)
        : undefined,
  };
}

export function toTopicSnapshot(
  pack: RuntimePack,
  variant: Variant,
  topic: Topic,
  subject: Subject,
  defaults: { speakingSeconds: number; researchSeconds: number },
): TopicSnapshot {
  const mode = variant.mode as V02PracticeMode;
  const topicRef: TopicRef = {
    packId: pack.packId,
    packVersion: pack.version,
    subjectId: subject.subjectId,
    topicId: topic.topicId,
    variantId: variant.variantId,
    difficultyProfileVersion: variant.difficultyProfileVersion,
    promptId: variant.promptId,
    rubricId: variant.rubricId,
  };
  return {
    topicRef,
    title: topic.title,
    wording: variant.wording,
    expectation: PRESET_EXPECTATION[variant.challengePreset],
    answerArc: arcSteps(variant.answerArc),
    timePolicy: withDefaults(variant.timePolicy, defaults, mode),
    mode,
    challenge: variant.challengePreset,
    supportLevel: variant.supportLevel,
    register: "EXAMINER",
    challengeIdentity: {
      preset: variant.challengePreset,
      difficultyProfileVersion: variant.difficultyProfileVersion,
      variantId: variant.variantId,
      supportLevel: variant.supportLevel,
    },
  };
}
