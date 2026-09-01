import type {
  ChallengePreset,
  RuntimePack,
  Subject,
  Topic,
  Variant,
} from "../practice/types";
import generatedSchemaValidator from "./generated/topicPackSchemaValidator";

interface SchemaError {
  instancePath?: string;
  message?: string;
}

type SchemaValidator = ((value: unknown) => boolean) & {
  errors?: SchemaError[] | null;
};

// Compiled at development time so the browser never needs `new Function`/unsafe-eval.
// Keep CSP strict and verify drift with `pnpm schema:check`.
const validateSchema = generatedSchemaValidator as SchemaValidator;

export const MAX_PACK_BYTES = 512 * 1024;
const MAX_SCAN_DEPTH = 16;
const MAX_SCAN_NODES = 10_000;

export class PackValidationError extends Error {
  constructor(
    message: string,
    readonly errors: string[],
  ) {
    super(message);
    this.name = "PackValidationError";
  }
}

const PRESET_RANK: Record<ChallengePreset, number> = {
  GUIDED: 0,
  APPLIED: 1,
  VIVA: 2,
};

const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function scanDangerousKeys(value: unknown, path: string, errors: string[]): void {
  const pending: Array<{ value: unknown; path: string; depth: number }> = [
    { value, path, depth: 0 },
  ];
  let visited = 0;

  while (pending.length > 0) {
    const current = pending.pop()!;
    visited++;
    if (visited > MAX_SCAN_NODES) {
      errors.push(`pack exceeds ${MAX_SCAN_NODES} values`);
      return;
    }
    if (current.depth > MAX_SCAN_DEPTH) {
      errors.push(`pack exceeds maximum nesting depth at ${current.path}`);
      return;
    }
    if (Array.isArray(current.value)) {
      current.value.forEach((child, index) => {
        pending.push({
          value: child,
          path: `${current.path}[${index}]`,
          depth: current.depth + 1,
        });
      });
    } else if (current.value && typeof current.value === "object") {
      const objectValue = current.value as Record<string, unknown>;
      for (const key of Object.keys(objectValue)) {
        if (DANGEROUS_KEYS.has(key)) {
          errors.push(`dangerous object key "${key}" at ${current.path}`);
        }
        pending.push({
          value: objectValue[key],
          path: `${current.path}.${key}`,
          depth: current.depth + 1,
        });
      }
    }
  }
}

function assertUnique(values: string[], label: string, errors: string[]): void {
  const seen = new Set<string>();
  for (const v of values) {
    if (seen.has(v)) errors.push(`duplicate ${label}: ${v}`);
    seen.add(v);
  }
}

function deepFreeze<T>(value: T): T {
  const pending: object[] = [];
  if (value && typeof value === "object") pending.push(value);
  while (pending.length > 0) {
    const current = pending.pop()!;
    for (const child of Object.values(current)) {
      if (child && typeof child === "object" && !Object.isFrozen(child)) {
        pending.push(child);
      }
    }
    Object.freeze(current);
  }
  return value;
}

function normalizedTitle(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

function isIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function isSafeHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.username === "" &&
      url.password === "" &&
      url.hostname.length > 0
    );
  } catch {
    return false;
  }
}

function customChecks(pack: RuntimePack, errors: string[]): void {
  const sourceIds = new Set(pack.sources.map((s) => s.sourceId));
  assertUnique(
    pack.sources.map((s) => s.sourceId),
    "sourceId",
    errors,
  );

  const allVariantIds: string[] = [];
  const allPromptIds: string[] = [];
  const allRubricIds: string[] = [];
  const allCaseIds: string[] = [];
  const allFollowUpIds: string[] = [];
  const allConceptIds: string[] = [];
  const allTopicIds: string[] = [];
  const allSubjectIds = pack.subjects.map((subject) => subject.subjectId);
  const allNormalizedTitles: string[] = [];

  if (pack.review.reviewedAt !== null && !isIsoDate(pack.review.reviewedAt)) {
    errors.push(`invalid review date: ${pack.review.reviewedAt}`);
  }
  for (const source of pack.sources) {
    if (source.url !== undefined && !isSafeHttpsUrl(source.url)) {
      errors.push(`source ${source.sourceId}: invalid or credential-bearing https URL`);
    }
    if (!isIsoDate(source.accessedAt)) {
      errors.push(`source ${source.sourceId}: invalid access date ${source.accessedAt}`);
    }
  }

  for (const subject of pack.subjects) {
    allNormalizedTitles.push(normalizedTitle(subject.title));
    for (const topic of subject.topics) {
      allTopicIds.push(topic.topicId);
      allNormalizedTitles.push(normalizedTitle(topic.title));
      assertUnique(
        topic.rubrics.map((rubric) => rubric.rubricId),
        `rubricId in topic ${topic.topicId}`,
        errors,
      );
      assertUnique(
        topic.cases.map((item) => item.caseId),
        `caseId in topic ${topic.topicId}`,
        errors,
      );
      assertUnique(
        topic.followUps.map((item) => item.followUpId),
        `followUpId in topic ${topic.topicId}`,
        errors,
      );
      const variantIds = new Set(topic.variants.map((v) => v.variantId));
      const caseIds = new Set(topic.cases.map((c) => c.caseId));
      const followUpIds = new Set(topic.followUps.map((f) => f.followUpId));

      for (const v of topic.variants) {
        allVariantIds.push(v.variantId);
        allPromptIds.push(v.promptId);
        const rubric = topic.rubrics.find((candidate) => candidate.rubricId === v.rubricId);
        if (!rubric) {
          errors.push(`topic ${topic.topicId}: variant ${v.variantId} references missing rubric ${v.rubricId}`);
        } else if (rubric.variantId !== v.variantId) {
          errors.push(
            `topic ${topic.topicId}: variant ${v.variantId} references rubric ${v.rubricId} owned by ${rubric.variantId}`,
          );
        }
        if (v.caseRef !== null && !caseIds.has(v.caseRef)) {
          errors.push(`topic ${topic.topicId}: variant ${v.variantId} references missing case ${v.caseRef}`);
        }
        for (const f of v.followUpRefs) {
          if (!followUpIds.has(f)) {
            errors.push(`topic ${topic.topicId}: variant ${v.variantId} references missing followUp ${f}`);
          }
        }
        if (v.challengePreset === "APPLIED") {
          if (v.caseRef === null) {
            errors.push(`topic ${topic.topicId}: APPLIED variant ${v.variantId} requires a fictional case`);
          }
          if (v.followUpRefs.length < 1) {
            errors.push(`topic ${topic.topicId}: APPLIED variant ${v.variantId} requires a reviewed follow-up`);
          }
        }
        if (v.challengePreset === "VIVA") {
          if (v.caseRef === null) {
            errors.push(`topic ${topic.topicId}: VIVA variant ${v.variantId} requires a fictional case`);
          }
          const hasEvidenceUpdate = v.followUpRefs
            .map((id) => topic.followUps.find((f) => f.followUpId === id))
            .some((f) => f?.kind === "EVIDENCE_UPDATE");
          if (!hasEvidenceUpdate) {
            errors.push(`topic ${topic.topicId}: VIVA variant ${v.variantId} requires an evidence-update follow-up`);
          }
        }
      }

      for (const r of topic.rubrics) {
        allRubricIds.push(r.rubricId);
        assertUnique(
          r.concepts.map((concept) => concept.conceptId),
          `conceptId in rubric ${r.rubricId}`,
          errors,
        );
        if (!variantIds.has(r.variantId)) {
          errors.push(`topic ${topic.topicId}: rubric ${r.rubricId} references missing variant ${r.variantId}`);
        }
        for (const c of r.concepts) {
          allConceptIds.push(c.conceptId);
          for (const ref of c.sourceRefs) {
            if (!sourceIds.has(ref)) {
              errors.push(`topic ${topic.topicId}: concept ${c.conceptId} references missing source ${ref}`);
            }
          }
        }
      }

      allCaseIds.push(...topic.cases.map((item) => item.caseId));
      allFollowUpIds.push(...topic.followUps.map((item) => item.followUpId));

      // v0.6 viva questions: targetConceptIds must resolve to a concept in some
      // rubric of this topic, and question ids must be unique within the topic.
      const topicConceptIds = new Set(
        topic.rubrics.flatMap((r) => r.concepts.map((c) => c.conceptId)),
      );
      const vivaQuestionIds: string[] = [];
      for (const q of topic.vivaQuestions ?? []) {
        vivaQuestionIds.push(q.id);
        for (const target of q.targetConceptIds) {
          if (!topicConceptIds.has(target)) {
            errors.push(
              `topic ${topic.topicId}: viva question ${q.id} references missing concept ${target}`,
            );
          }
        }
      }
      assertUnique(vivaQuestionIds, `viva question id in topic ${topic.topicId}`, errors);

      const hasGuided = topic.variants.some((v) => v.challengePreset === "GUIDED");
      if (!hasGuided) {
        errors.push(`topic ${topic.topicId}: every topic must have at least one GUIDED variant`);
      }

      // Fake-escalation: identical wording may not become harder by a shorter timer alone.
      const byWording = new Map<string, Variant[]>();
      for (const v of topic.variants) {
        const list = byWording.get(v.wording) ?? [];
        list.push(v);
        byWording.set(v.wording, list);
      }
      for (const group of byWording.values()) {
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const a = group[i]!;
            const b = group[j]!;
            const [hi, lo] =
              PRESET_RANK[a.challengePreset] >= PRESET_RANK[b.challengePreset]
                ? [a, b]
                : [b, a];
            if (
              PRESET_RANK[hi.challengePreset] > PRESET_RANK[lo.challengePreset] &&
              hi.timePolicy.speakingSeconds < lo.timePolicy.speakingSeconds
            ) {
              errors.push(
                `topic ${topic.topicId}: variants ${hi.variantId}/${lo.variantId} fake escalation (identical wording, shorter timer)`,
              );
            }
          }
        }
      }
    }
  }

  assertUnique(allSubjectIds, "subjectId", errors);
  assertUnique(allTopicIds, "topicId", errors);
  assertUnique(allVariantIds, "variantId", errors);
  assertUnique(allPromptIds, "promptId", errors);
  assertUnique(allRubricIds, "rubricId", errors);
  assertUnique(allCaseIds, "caseId", errors);
  assertUnique(allFollowUpIds, "followUpId", errors);
  assertUnique(allConceptIds, "conceptId", errors);
  assertUnique(allNormalizedTitles, "normalized subject/topic title", errors);
}

/**
 * Structural + cross-reference validation. Does NOT enforce publication status or
 * implemented-mode policy — those are production-gate concerns (assertV02ProductionPack).
 */
export function validatePack(obj: unknown): RuntimePack {
  const errors: string[] = [];

  scanDangerousKeys(obj, "$", errors);

  const schemaValid = validateSchema(obj);
  if (!schemaValid) {
    for (const e of validateSchema.errors ?? []) {
      errors.push(`schema: ${e.instancePath || "$"} ${e.message ?? "invalid"}`);
    }
  }

  // Run custom checks even on schema-valid input; cast is safe after schema passes.
  if (errors.length === 0 && schemaValid) {
    customChecks(obj as unknown as RuntimePack, errors);
  }

  if (errors.length > 0) {
    throw new PackValidationError("topic pack failed validation", errors);
  }

  return deepFreeze(structuredClone(obj)) as unknown as RuntimePack;
}

/** v0.2 production gate: only APPROVED packs without unimplemented modes may activate. */
export function assertV02ProductionPack(pack: RuntimePack): void {
  const errors: string[] = [];
  if (pack.review.status !== "APPROVED") {
    errors.push(`production pack must be APPROVED, got ${pack.review.status}`);
  }
  if (
    pack.contentKind === "MEDICAL" &&
    !pack.review.reviewers.some((reviewer) => reviewer.role === "MEDICAL_REVIEWER")
  ) {
    errors.push("an APPROVED medical pack requires a MEDICAL_REVIEWER");
  }
  for (const subject of pack.subjects) {
    for (const topic of subject.topics) {
      for (const v of topic.variants) {
        if (v.mode === "VIVA_ROUND" || v.mode === "TEACH_BACK") {
          errors.push(
            `v0.2 production pack must not use unimplemented mode ${v.mode} (variant ${v.variantId})`,
          );
        }
        if (v.supportLevel !== "FULL") {
          errors.push(
            `v0.2 has no reviewed scaffold contract; variant ${v.variantId} must use FULL support`,
          );
        }
        const rubric = topic.rubrics.find((candidate) => candidate.rubricId === v.rubricId);
        if (rubric?.register !== "EXAMINER") {
          errors.push(`v0.2 variant ${v.variantId} requires an EXAMINER rubric`);
        }
      }
    }
  }
  if (errors.length > 0) {
    throw new PackValidationError("production gate failed", errors);
  }
}

/**
 * Narrow gate for the explicitly labelled public medical practice beta. It
 * never converts a draft into approved content: the pack must remain
 * unattested, useful enough for practice, and unable to pass the medical
 * release gate.
 */
export function assertPublicDraftPracticePack(pack: RuntimePack): void {
  const errors: string[] = [];
  if (pack.contentKind !== "MEDICAL") {
    errors.push(`public practice draft must be MEDICAL, got ${pack.contentKind}`);
  }
  if (pack.review.status !== "DRAFT") {
    errors.push(`public practice draft must remain DRAFT, got ${pack.review.status}`);
  }
  if (pack.review.reviewers.length !== 0 || pack.review.reviewedAt !== null) {
    errors.push("unattested draft must have no reviewers or review date");
  }
  try {
    assertV02PracticeMinimums(pack);
  } catch (error) {
    if (error instanceof PackValidationError) errors.push(...error.errors);
    else errors.push((error as Error).message);
  }
  try {
    assertV02ProductionPack(pack);
    errors.push("public practice draft unexpectedly passed the medical release gate");
  } catch {
    // Required: public beta access must never imply educator attestation.
  }
  if (errors.length > 0) {
    throw new PackValidationError("public draft practice gate failed", errors);
  }
}

/** Minimum useful breadth/depth shared by the regression and public-beta packs. */
export function assertV02PracticeMinimums(pack: RuntimePack): void {
  const topics = pack.subjects.flatMap((subject) => subject.topics);
  const trioCount = topics.filter((topic) => {
    const byMode = new Map<string, Set<ChallengePreset>>();
    for (const variant of topic.variants) {
      const presets = byMode.get(variant.mode) ?? new Set<ChallengePreset>();
      presets.add(variant.challengePreset);
      byMode.set(variant.mode, presets);
    }
    return [...byMode.values()].some(
      (presets) =>
        presets.has("GUIDED") && presets.has("APPLIED") && presets.has("VIVA"),
    );
  }).length;

  const errors: string[] = [];
  if (topics.length < 20) {
    errors.push(`practice pack requires at least 20 topics, got ${topics.length}`);
  }
  if (trioCount < 3) {
    errors.push(
      `practice pack requires at least 3 complete challenge trios, got ${trioCount}`,
    );
  }
  if (errors.length > 0) {
    throw new PackValidationError("practice content gate failed", errors);
  }
}

export type { Subject, Topic };
