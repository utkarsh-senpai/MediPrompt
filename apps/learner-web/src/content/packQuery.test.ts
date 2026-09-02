import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import medicalCandidateJson from "@content/candidates/mpt-cardiorespiratory-review-candidate.json";
import neuroCatalogJson from "@content/catalogs/neuro-physiotherapy-topics.json";
import {
  eligibleVariants,
  listSubjects,
  presetsFor,
  toTopicSnapshot,
} from "./packQuery";
import { validatePack } from "./packValidator";

const pack = validatePack(medicalCandidateJson);

describe("curriculum subject availability", () => {
  it("shows all seven subjects but activates exactly three", () => {
    const subjects = listSubjects(pack);
    expect(subjects).toHaveLength(7);
    expect(
      subjects.filter((subject) => subject.availability === "ACTIVE").map((subject) => subject.subjectId),
    ).toEqual([
      "neuro-physiotherapy",
      "cardiovascular-and-respiratory-physiotherapy",
      "sports-physiotherapy",
    ]);
  });

  it("returns no playable presets or variants for coming-soon subjects", () => {
    expect(
      presetsFor(pack, "musculoskeletal-physiotherapy", "RECALL_SPRINT"),
    ).toEqual([]);
    expect(
      eligibleVariants(
        pack,
        "community-health-physiotherapy",
        "DEEP_RESEARCH",
        "GUIDED",
      ),
    ).toEqual([]);
  });

  it("rejects a direct snapshot launch from an inactive subject", () => {
    const subject = pack.subjects.find(
      (candidate) => candidate.subjectId === "musculoskeletal-physiotherapy",
    )!;
    const topic = subject.topics[0]!;
    expect(() =>
      toTopicSnapshot(pack, topic.variants[0]!, topic, subject, {
        speakingSeconds: 60,
        researchSeconds: 600,
      }),
    ).toThrow(/inactive subject/);
  });
});

describe("active medical-content completeness", () => {
  it("generates every Neuro catalog topic with stable section-qualified titles", () => {
    const neuro = pack.subjects.find(
      (subject) => subject.subjectId === "neuro-physiotherapy",
    )!;
    const catalogTopics = neuroCatalogJson.sections.flatMap((section) =>
      section.topics.map((topic) => ({
        topicId: topic.topicId,
        title: `${section.titlePrefix} — ${topic.label}`,
      })),
    );
    expect(catalogTopics).toHaveLength(neuroCatalogJson.expectedTopicCount);
    expect(
      neuro.topics.map((topic) => ({ topicId: topic.topicId, title: topic.title })),
    ).toEqual(catalogTopics);
    expect(neuro.topics.find((topic) => topic.topicId === "stroke-hemiplegic-gait")?.title)
      .toBe("Stroke — Hemiplegic gait");
    for (const topic of neuro.topics) {
      const authored = topic.rubrics.some((rubric) => rubric.concepts.length > 0);
      if (!authored) {
        // Scaffolded topic: variants exist but rubric concepts are empty — valid under DRAFT.
        for (const variant of topic.variants) {
          const rubric = topic.rubrics.find(
            (candidate) => candidate.rubricId === variant.rubricId,
          );
          expect(rubric?.concepts.length, variant.variantId).toBe(0);
        }
        continue;
      }
      // Authored topic: every variant's rubric has sourced criteria.
      for (const variant of topic.variants) {
        const rubric = topic.rubrics.find(
          (candidate) => candidate.rubricId === variant.rubricId,
        );
        expect(rubric?.concepts.length, variant.variantId).toBeGreaterThan(0);
        expect(
          rubric?.concepts.every((concept) => concept.sourceRefs.length > 0),
          variant.variantId,
        ).toBe(true);
      }
    }
  });

  it("preserves the original 20 cardiorespiratory topic definitions", () => {
    const digest = (value: unknown) =>
      createHash("sha256").update(JSON.stringify(value)).digest("hex");
    const cardioresp = pack.subjects.find(
      (subject) => subject.subjectId === "cardiovascular-and-respiratory-physiotherapy",
    )!;
    expect(cardioresp.topics).toHaveLength(26);
    expect(digest(cardioresp.topics.slice(0, 11))).toBe(
      "3008206005415e1071b3b2d9a4c4da4206379f2a2061cd8201b4c9471ee6818e",
    );
    expect(digest(cardioresp.topics.slice(13, 22))).toBe(
      "3d436fb74cf87337b3276e51d670339e61fc150f698367e69a446c4f195ddb53",
    );
  });
});
