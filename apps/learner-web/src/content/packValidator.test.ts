import { describe, expect, it } from "vitest";
import {
  assertV02ProductionPack,
  PackValidationError,
  validatePack,
} from "./packValidator";
import type { RuntimePack } from "@/practice/types";
import demoPackJson from "@content/packs/demo-interaction-fixture.json";
import nfpFixture from "@content/fixtures/not-for-publication.fixture.json";

function basePack(): unknown {
  return JSON.parse(
    JSON.stringify({
      schemaVersion: "1.0",
      packId: "test-pack",
      version: "1.0.0",
      title: "Test pack",
      locale: "en-IN",
      licence: { id: "CC-BY-4.0", attribution: "Tester" },
      review: {
        status: "APPROVED",
        reviewers: [{ id: "tester", role: "CONTENT_EDITOR" }],
        reviewedAt: "2026-08-30",
      },
      sources: [
        {
          sourceId: "src-1",
          citation: "General knowledge.",
          url: "https://example.org/x",
          accessedAt: "2026-08-30",
        },
      ],
      subjects: [
        {
          subjectId: "subj",
          title: "Subject",
          topics: [
            {
              topicId: "topic",
              title: "Topic",
              variants: [
                {
                  variantId: "topic-guided-rs-v1",
                  challengePreset: "GUIDED",
                  difficultyProfileVersion: "difficulty-profile/1.0",
                  blueprint: "explain-concept",
                  promptId: "prompt-topic-guided-rs",
                  mode: "RECALL_SPRINT",
                  supportLevel: "FULL",
                  wording: "Explain the topic.",
                  answerArc: ["define", "explain"],
                  timePolicy: { speakingSeconds: 90 },
                  caseRef: null,
                  followUpRefs: [],
                  rubricId: "topic-guided-rs-rubric-v1",
                },
              ],
              rubrics: [
                {
                  rubricId: "topic-guided-rs-rubric-v1",
                  variantId: "topic-guided-rs-v1",
                  register: "EXAMINER",
                  concepts: [
                    {
                      conceptId: "c1",
                      label: "Core idea",
                      acceptedPhrases: ["core"],
                      weight: 2,
                      sourceRefs: ["src-1"],
                    },
                  ],
                },
              ],
              cases: [],
              followUps: [],
            },
          ],
        },
      ],
    }),
  );
}

function withTopicVariant(pack: unknown, variant: unknown): unknown {
  const p = pack as RuntimePack;
  (p.subjects[0]!.topics[0]!.variants as unknown[]).push(variant);
  return p;
}

function expectInvalid(pack: unknown, fragment: string): void {
  try {
    validatePack(pack);
    throw new Error("expected validation to fail");
  } catch (err) {
    if (!(err instanceof PackValidationError)) throw err;
    expect(err.errors.join("\n")).toContain(fragment);
  }
}

describe("validatePack — happy paths", () => {
  it("validates the demo interaction fixture", () => {
    const pack = validatePack(demoPackJson);
    expect(pack.subjects.reduce((n, s) => n + s.topics.length, 0)).toBe(20);
  });

  it("validates a minimal base pack", () => {
    expect(() => validatePack(basePack())).not.toThrow();
  });

  it("freezes the validated pack", () => {
    const pack = validatePack(basePack()) as RuntimePack;
    expect(Object.isFrozen(pack)).toBe(true);
    expect(() => (pack.title = "mutate")).toThrow();
  });
});

describe("assertV02ProductionPack", () => {
  it("accepts the demo pack", () => {
    expect(() => assertV02ProductionPack(validatePack(demoPackJson))).not.toThrow();
  });

  it("rejects the NOT_FOR_PUBLICATION fixture", () => {
    const pack = validatePack(nfpFixture);
    expect(() => assertV02ProductionPack(pack)).toThrow();
  });

  it("rejects an APPROVED pack containing an unimplemented mode", () => {
    const p = basePack();
    (p as RuntimePack).subjects[0]!.topics[0]!.variants[0]!.mode = "VIVA_ROUND";
    expect(() => assertV02ProductionPack(validatePack(p))).toThrow();
  });

  it("rejects a DRAFT pack at the production gate while validatePack accepts it", () => {
    const p = basePack();
    (p as RuntimePack).review.status = "DRAFT";
    expect(() => validatePack(p)).not.toThrow();
    expect(() => assertV02ProductionPack(validatePack(p))).toThrow();
  });
});

describe("validatePack — schema rejections", () => {
  it("rejects unknown top-level fields", () => {
    const p = basePack() as Record<string, unknown>;
    p.unexpected = "x";
    expectInvalid(p, "schema");
  });

  it("rejects an unsupported schema version", () => {
    const p = basePack() as RuntimePack;
    (p as { schemaVersion: string }).schemaVersion = "2.0";
    expectInvalid(p, "schema");
  });

  it("rejects a non-https source url", () => {
    const p = basePack() as RuntimePack;
    p.sources[0]!.url = "http://example.org/x";
    expectInvalid(p, "schema");
  });

  it("rejects an invalid locale", () => {
    const p = basePack() as RuntimePack;
    p.locale = "english";
    expectInvalid(p, "schema");
  });

  it("rejects out-of-range speaking seconds", () => {
    const p = basePack() as RuntimePack;
    p.subjects[0]!.topics[0]!.variants[0]!.timePolicy.speakingSeconds = 1;
    expectInvalid(p, "schema");
  });
});

describe("validatePack — custom cross-reference rejections", () => {
  it("rejects a dangerous __proto__ key", () => {
    const p = basePack() as unknown as Record<string, unknown>;
    // attach a dangerous key on the parsed object
    Object.defineProperty(p, "__proto__", {
      enumerable: true,
      value: {},
    });
    expectInvalid(p, "dangerous");
  });

  it("rejects duplicate variantIds", () => {
    const p = withTopicVariant(
      basePack(),
      JSON.parse(JSON.stringify((basePack() as RuntimePack).subjects[0]!.topics[0]!.variants[0])),
    );
    expectInvalid(p, "duplicate variantId");
  });

  it("rejects a variant referencing a missing rubric", () => {
    const p = basePack() as RuntimePack;
    p.subjects[0]!.topics[0]!.variants[0]!.rubricId = "nope";
    expectInvalid(p, "missing rubric");
  });

  it("rejects an Applied variant without a fictional case", () => {
    const p = basePack() as RuntimePack;
    p.subjects[0]!.topics[0]!.variants[0]!.challengePreset = "APPLIED";
    p.subjects[0]!.topics[0]!.variants[0]!.caseRef = null;
    expectInvalid(p, "APPLIED");
  });

  it("rejects a Viva variant without an evidence-update follow-up", () => {
    const p = basePack() as RuntimePack;
    const v = p.subjects[0]!.topics[0]!.variants[0]!;
    v.challengePreset = "VIVA";
    v.caseRef = "case-1";
    v.followUpRefs = ["fu-1"];
    p.subjects[0]!.topics[0]!.cases = [{ caseId: "case-1", text: "fictional case" }];
    p.subjects[0]!.topics[0]!.followUps = [
      { followUpId: "fu-1", text: "probe", kind: "PROBE" },
    ];
    expectInvalid(p, "evidence-update");
  });

  it("rejects fake escalation: identical wording, harder preset, shorter timer", () => {
    const p = basePack() as RuntimePack;
    const base = p.subjects[0]!.topics[0]!.variants[0]!;
    const viva = JSON.parse(JSON.stringify(base));
    viva.variantId = "topic-viva-rs-v1";
    viva.promptId = "prompt-topic-viva-rs";
    viva.challengePreset = "VIVA";
    viva.caseRef = "case-1";
    viva.followUpRefs = ["fu-1"];
    viva.timePolicy = { preparationSeconds: 45, speakingSeconds: 60 }; // shorter than 90
    viva.rubricId = "topic-viva-rubric-v1";
    p.subjects[0]!.topics[0]!.variants.push(viva);
    p.subjects[0]!.topics[0]!.cases = [{ caseId: "case-1", text: "fictional case" }];
    p.subjects[0]!.topics[0]!.followUps = [
      { followUpId: "fu-1", text: "update", kind: "EVIDENCE_UPDATE" },
    ];
    p.subjects[0]!.topics[0]!.rubrics.push({
      rubricId: "topic-viva-rubric-v1",
      variantId: "topic-viva-rs-v1",
      register: "EXAMINER",
      concepts: [
        { conceptId: "c2", label: "X", acceptedPhrases: ["x"], weight: 1, sourceRefs: ["src-1"] },
      ],
    });
    expectInvalid(p, "fake escalation");
  });

  it("rejects a topic without a GUIDED variant", () => {
    const p = basePack() as RuntimePack;
    p.subjects[0]!.topics[0]!.variants[0]!.challengePreset = "APPLIED";
    p.subjects[0]!.topics[0]!.variants[0]!.caseRef = "case-1";
    p.subjects[0]!.topics[0]!.variants[0]!.followUpRefs = ["fu-1"];
    p.subjects[0]!.topics[0]!.cases = [{ caseId: "case-1", text: "case" }];
    p.subjects[0]!.topics[0]!.followUps = [
      { followUpId: "fu-1", text: "probe", kind: "PROBE" },
    ];
    expectInvalid(p, "GUIDED");
  });

  it("rejects a concept with a dangling source reference", () => {
    const p = basePack() as RuntimePack;
    p.subjects[0]!.topics[0]!.rubrics[0]!.concepts[0]!.sourceRefs = ["missing-src"];
    expectInvalid(p, "missing source");
  });
});
