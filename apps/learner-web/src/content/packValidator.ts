import Ajv2020 from "ajv/dist/2020.js";
import type {
  ChallengePreset,
  RuntimePack,
  Subject,
  Topic,
  Variant,
} from "../practice/types";
import schema from "../../../../content/schema/topic-pack.schema.json";

const ajv = new Ajv2020({ strict: false, allErrors: true });
const validateSchema = ajv.compile(schema);

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
  if (Array.isArray(value)) {
    value.forEach((v, i) => scanDangerousKeys(v, `${path}[${i}]`, errors));
    return;
  }
  if (value && typeof value === "object") {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      if (DANGEROUS_KEYS.has(key)) {
        errors.push(`dangerous object key "${key}" at ${path}`);
      }
      scanDangerousKeys(
        (value as Record<string, unknown>)[key],
        `${path}.${key}`,
        errors,
      );
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
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const k of Object.keys(value as Record<string, unknown>)) {
      deepFreeze((value as Record<string, unknown>)[k]);
    }
  }
  return value;
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

  for (const subject of pack.subjects) {
    for (const topic of subject.topics) {
      const variantIds = new Set(topic.variants.map((v) => v.variantId));
      const rubricIds = new Set(topic.rubrics.map((r) => r.rubricId));
      const caseIds = new Set(topic.cases.map((c) => c.caseId));
      const followUpIds = new Set(topic.followUps.map((f) => f.followUpId));

      for (const v of topic.variants) {
        allVariantIds.push(v.variantId);
        allPromptIds.push(v.promptId);
        if (!rubricIds.has(v.rubricId)) {
          errors.push(`topic ${topic.topicId}: variant ${v.variantId} references missing rubric ${v.rubricId}`);
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
        if (!variantIds.has(r.variantId)) {
          errors.push(`topic ${topic.topicId}: rubric ${r.rubricId} references missing variant ${r.variantId}`);
        }
        for (const c of r.concepts) {
          for (const ref of c.sourceRefs) {
            if (!sourceIds.has(ref)) {
              errors.push(`topic ${topic.topicId}: concept ${c.conceptId} references missing source ${ref}`);
            }
          }
        }
      }

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

  assertUnique(allVariantIds, "variantId", errors);
  assertUnique(allPromptIds, "promptId", errors);
}

/**
 * Structural + cross-reference validation. Does NOT enforce publication status or
 * implemented-mode policy — those are production-gate concerns (assertV02ProductionPack).
 */
export function validatePack(obj: unknown): RuntimePack {
  const errors: string[] = [];

  scanDangerousKeys(obj, "$", errors);

  if (!validateSchema(obj)) {
    for (const e of validateSchema.errors ?? []) {
      errors.push(`schema: ${e.instancePath || "$"} ${e.message ?? "invalid"}`);
    }
  }

  // Run custom checks even on schema-valid input; cast is safe after schema passes.
  if (errors.length === 0 && validateSchema(obj)) {
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
  for (const subject of pack.subjects) {
    for (const topic of subject.topics) {
      for (const v of topic.variants) {
        if (v.mode === "VIVA_ROUND" || v.mode === "TEACH_BACK") {
          errors.push(
            `v0.2 production pack must not use unimplemented mode ${v.mode} (variant ${v.variantId})`,
          );
        }
      }
    }
  }
  if (errors.length > 0) {
    throw new PackValidationError("production gate failed", errors);
  }
}

export type { Subject, Topic };
