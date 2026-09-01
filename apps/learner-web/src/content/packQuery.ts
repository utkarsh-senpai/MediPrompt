import type {
  ChallengePreset,
  Rubric,
  RuntimePack,
  SpeechArcStep,
  Subject,
  SubjectAvailability,
  TimePolicy,
  Topic,
  TopicRef,
  TopicSnapshot,
  Variant,
  VivaQuestion,
  V02PracticeMode,
} from "@/practice/types";

export interface SubjectOption {
  subjectId: string;
  title: string;
  availability: SubjectAvailability;
}

export function listSubjects(pack: RuntimePack): SubjectOption[] {
  return pack.subjects.map((s) => ({
    subjectId: s.subjectId,
    title: s.title,
    availability: s.availability ?? "ACTIVE",
  }));
}

export function isSubjectActive(subject: Subject | undefined): boolean {
  return subject !== undefined && subject.availability !== "COMING_SOON";
}

export function findSubject(
  pack: RuntimePack,
  subjectId: string,
): Subject | undefined {
  return pack.subjects.find((s) => s.subjectId === subjectId);
}

function variantsInSubject(pack: RuntimePack, subjectId: string): Variant[] {
  const subject = findSubject(pack, subjectId);
  if (!subject || !isSubjectActive(subject)) return [];
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

/**
 * Resolve the rubric for a drawn topic ref. Returns the rubric whose id matches
 * the variant's rubricId, or undefined when the pack has no such rubric (the
 * not-verifiable coverage fallback handles that case).
 */
export function findRubric(
  pack: RuntimePack,
  topicRef: Pick<TopicRef, "variantId" | "rubricId">,
): Rubric | undefined {
  const found = findVariant(pack, topicRef.variantId);
  if (!found) return undefined;
  return found.topic.rubrics.find((r) => r.rubricId === topicRef.rubricId);
}

/**
 * v0.6: resolve the viva defense ladder for a drawn topic ref. Only questions
 * whose targetConceptIds all exist in the variant's rubric are exposed. The
 * ladder is all-or-nothing so a partially mismatched pack cannot silently skip
 * a question or change the authored progression. Returns an empty array when
 * the topic has no usable ladder.
 */
export function vivaQuestionsFor(
  pack: RuntimePack,
  topicRef: Pick<TopicRef, "variantId" | "rubricId">,
): VivaQuestion[] {
  const rubric = findRubric(pack, topicRef);
  if (!rubric) return [];
  const found = findVariant(pack, topicRef.variantId);
  if (!found) return [];
  const conceptIds = new Set(rubric.concepts.map((c) => c.conceptId));
  const questions = found.topic.vivaQuestions ?? [];
  return questions.every((question) =>
    question.targetConceptIds.every((id) => conceptIds.has(id)),
  )
    ? questions
    : [];
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
    // These are the effective accessibility settings used by the timer and
    // captured in AttemptDraft. Challenge remains encoded by the variant.
    speakingSeconds: defaults.speakingSeconds,
    researchSeconds:
      mode === "DEEP_RESEARCH"
        ? defaults.researchSeconds
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
  if (!isSubjectActive(subject)) {
    throw new Error(`inactive subject cannot start practice: ${subject.subjectId}`);
  }
  if (variant.mode !== "RECALL_SPRINT" && variant.mode !== "DEEP_RESEARCH") {
    throw new Error(`unsupported v0.2 mode: ${variant.mode}`);
  }
  const mode: V02PracticeMode = variant.mode;
  const caseText =
    variant.caseRef === null
      ? undefined
      : topic.cases.find((candidate) => candidate.caseId === variant.caseRef)?.text;
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
    caseText,
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
    vivaQuestions: vivaQuestionsFor(pack, topicRef),
  };
}
