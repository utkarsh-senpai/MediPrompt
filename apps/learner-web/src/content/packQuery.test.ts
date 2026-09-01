import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import medicalCandidateJson from "@content/candidates/mpt-cardiorespiratory-review-candidate.json";
import {
  eligibleVariants,
  listSubjects,
  presetsFor,
  toTopicSnapshot,
} from "./packQuery";
import { validatePack } from "./packValidator";

const pack = validatePack(medicalCandidateJson);

describe("curriculum subject availability", () => {
  it("shows all eight subjects but activates exactly three", () => {
    const subjects = listSubjects(pack);
    expect(subjects).toHaveLength(8);
    expect(
      subjects.filter((subject) => subject.availability === "ACTIVE").map((subject) => subject.subjectId),
    ).toEqual([
      "neuro-physiotherapy",
      "respiratory-physiotherapy",
      "cardiovascular-physiotherapy",
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
      (candidate) => candidate.subjectId === "sports-physiotherapy",
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
  it("ships all 35 Neuro topics with sourced criteria for every variant", () => {
    const neuro = pack.subjects.find(
      (subject) => subject.subjectId === "neuro-physiotherapy",
    )!;
    expect(neuro.topics).toHaveLength(35);
    for (const topic of neuro.topics) {
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
    const respiratory = pack.subjects.find(
      (subject) => subject.subjectId === "respiratory-physiotherapy",
    )!;
    const cardiovascular = pack.subjects.find(
      (subject) => subject.subjectId === "cardiovascular-physiotherapy",
    )!;
    expect(digest(respiratory.topics.slice(0, 11))).toBe(
      "3008206005415e1071b3b2d9a4c4da4206379f2a2061cd8201b4c9471ee6818e",
    );
    expect(digest(cardiovascular.topics.slice(0, 9))).toBe(
      "3d436fb74cf87337b3276e51d670339e61fc150f698367e69a446c4f195ddb53",
    );
  });
});
