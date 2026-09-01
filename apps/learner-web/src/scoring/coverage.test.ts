import { describe, expect, it } from "vitest";
import { scoreCoverage } from "./coverage";
import { findRubric, findVariant } from "@/content/packQuery";
import { validatePack } from "@/content/packValidator";
import { MAX_TRANSCRIPT_CHARACTERS } from "@/practice/transcriptPolicy";
import type { Concept, RuntimePack } from "@/practice/types";
import medicalCandidateJson from "@content/candidates/mpt-cardiorespiratory-review-candidate.json";

const medicalCandidate = validatePack(medicalCandidateJson) as RuntimePack;

const concepts: Concept[] = [
  {
    conceptId: "c1",
    label: "Names the slider role",
    acceptedPhrases: ["slider role", "slider"],
    weight: 2,
    sourceRefs: ["src"],
  },
  {
    conceptId: "c2",
    label: "Explains interlocking teeth",
    acceptedPhrases: ["interlocking teeth", "interlock the teeth"],
    weight: 3,
    sourceRefs: ["src"],
  },
  {
    conceptId: "c3",
    label: "Mentions the pull tab",
    acceptedPhrases: ["pull tab"],
    weight: 1,
    sourceRefs: ["src"],
  },
];

describe("scoreCoverage", () => {
  it("marks a concept hit when an accepted phrase appears verbatim", () => {
    const report = scoreCoverage("the zipper uses a slider to close", concepts);
    expect(report.verifiable).toBe(true);
    expect(report.conceptResults[0]?.hit).toBe(true);
    expect(report.conceptResults[0]?.matchedPhrase).toBe("slider");
  });

  it("hits when all significant phrase tokens appear out of order", () => {
    const report = scoreCoverage("the teeth interlock as it closes", concepts);
    expect(report.conceptResults[1]?.hit).toBe(true);
  });

  it("misses when a required significant token is absent", () => {
    const report = scoreCoverage("it has a slider and a pull tab", concepts);
    expect(report.conceptResults[1]?.hit).toBe(false);
  });

  it("is case- and punctuation-insensitive", () => {
    const report = scoreCoverage("The Slider? Role! Clearly.", concepts);
    expect(report.conceptResults[0]?.hit).toBe(true);
  });

  it("matches whole tokens rather than substrings inside unrelated words", () => {
    const fitt: Concept = {
      conceptId: "fitt",
      label: "Uses FITT",
      acceptedPhrases: ["FITT"],
      weight: 1,
      sourceRefs: ["src"],
    };
    expect(scoreCoverage("The plan seems fitting.", [fitt]).hitCount).toBe(0);
    expect(scoreCoverage("I would use FITT principles.", [fitt]).hitCount).toBe(1);
  });

  it("keeps unordered phrase evidence inside a local token window", () => {
    const concept: Concept = {
      conceptId: "window",
      label: "Links symptoms and function",
      acceptedPhrases: ["symptoms and function"],
      weight: 1,
      sourceRefs: ["src"],
    };
    expect(scoreCoverage("Function is limited by these symptoms.", [concept]).hitCount).toBe(1);
    expect(
      scoreCoverage(
        "Symptoms matter. This unrelated sentence contains enough filler words to separate the evidence completely. Function also matters.",
        [concept],
      ).hitCount,
    ).toBe(0);
  });

  it("normalizes diacritics without discarding the surrounding word", () => {
    const concept: Concept = {
      conceptId: "accent",
      label: "Mentions rehabilitation",
      acceptedPhrases: ["rehabilitation"],
      weight: 1,
      sourceRefs: ["src"],
    };
    expect(scoreCoverage("réhabilitation", [concept]).hitCount).toBe(1);
  });

  it("weights the fraction by concept weight", () => {
    // hits: c1 (w2) + c3 (w1) = 3; total = 6 → 0.5
    const report = scoreCoverage("slider and a pull tab", concepts);
    expect(report.hitCount).toBe(2);
    expect(report.totalCount).toBe(3);
    expect(report.fraction).toBeCloseTo(2 / 3, 5);
    expect(report.weightedFraction).toBeCloseTo(0.5, 5);
  });

  it("does not turn an empty transcript into a zero-coverage result", () => {
    const report = scoreCoverage("", concepts);
    expect(report.verifiable).toBe(false);
    expect(report.unavailableReason).toBe("NO_TRANSCRIPT");
    expect(report.hitCount).toBe(0);
    expect(report.weightedFraction).toBe(0);
  });

  it("falls back to not-verifiable when the rubric has no concepts", () => {
    const report = scoreCoverage("anything the learner said", []);
    expect(report.verifiable).toBe(false);
    expect(report.unavailableReason).toBe("NO_SCORABLE_RUBRIC");
    expect(report.totalCount).toBe(0);
    expect(report.fraction).toBe(0);
    expect(report.weightedFraction).toBe(0);
  });

  it("does not let glue words hide a missing significant term", () => {
    const stopwordConcept: Concept = {
      conceptId: "stop",
      label: "Vague idea",
      acceptedPhrases: ["the role of the part"],
      weight: 1,
      sourceRefs: ["src"],
    };
    const report = scoreCoverage("the part", [stopwordConcept]);
    // "part" is significant; "the role of the" are stopwords. Phrase significant
    // tokens = ["role", "part"]; transcript lacks "role" → miss.
    expect(report.conceptResults[0]?.hit).toBe(false);
  });

  it("does not treat a phrase made only of stopwords as scorable evidence", () => {
    const report = scoreCoverage("the and of", [
      {
        conceptId: "glue",
        label: "Invalid glue-only phrase",
        acceptedPhrases: ["the and of"],
        weight: 1,
        sourceRefs: ["src"],
      },
    ]);
    expect(report.verifiable).toBe(false);
    expect(report.unavailableReason).toBe("NO_SCORABLE_RUBRIC");
  });

  it("treats concepts without meaningful accepted phrases as unscorable", () => {
    const report = scoreCoverage("anything", [
      {
        conceptId: "empty",
        label: "No evidence phrases",
        acceptedPhrases: [],
        weight: 1,
        sourceRefs: ["src"],
      },
    ]);
    expect(report.verifiable).toBe(false);
    expect(report.unavailableReason).toBe("NO_SCORABLE_RUBRIC");
  });

  it("bounds defensive scoring work for oversized programmatic input", () => {
    const tailOnly = `${"unrelated ".repeat(MAX_TRANSCRIPT_CHARACTERS / 5)}slider`;
    expect(scoreCoverage(tailOnly, concepts).conceptResults[0]?.hit).toBe(false);
  });
});

function medicalRubric(variantId: string) {
  const found = findVariant(medicalCandidate, variantId);
  if (!found) throw new Error(`missing golden variant ${variantId}`);
  const rubric = findRubric(medicalCandidate, {
    variantId,
    rubricId: found.variant.rubricId,
  });
  if (!rubric) throw new Error(`missing golden rubric for ${variantId}`);
  return rubric;
}

describe("scoreCoverage — curriculum-beta golden evidence", () => {
  it.each([
    {
      challenge: "Explain",
      variantId: "cardiac-rehabilitation-guided-recall-v1",
      transcript:
        "Begin with person-centred assessment and goal setting. Include exercise and education with psychosocial support, then plan long-term support and outcome audit.",
    },
    {
      challenge: "Apply",
      variantId: "cardiac-rehabilitation-applied-recall-v1",
      transcript:
        "Complete individualized assessment and shared goals before exercise prescription. Use multicomponent rehabilitation with risk-factor management, then arrange outpatient cardiac rehabilitation and reassessment.",
    },
    {
      challenge: "Defend",
      variantId: "cardiac-rehabilitation-viva-recall-v1",
      transcript:
        "Start with safety assessment and secondary prevention. Exercise should use risk stratification and supervision, with shared decision making and escalation for recurrent symptoms.",
    },
  ])("covers all listed phrases in the $challenge fixture", ({ variantId, transcript }) => {
    const report = scoreCoverage(transcript, medicalRubric(variantId).concepts);
    expect(report.verifiable).toBe(true);
    expect(report.hitCount).toBe(report.totalCount);
    expect(report.weightedFraction).toBe(1);
  });
});
