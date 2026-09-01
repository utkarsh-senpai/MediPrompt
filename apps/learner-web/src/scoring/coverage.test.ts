import { describe, expect, it } from "vitest";
import { scoreCoverage } from "./coverage";
import type { Concept } from "@/practice/types";

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

  it("weights the fraction by concept weight", () => {
    // hits: c1 (w2) + c3 (w1) = 3; total = 6 → 0.5
    const report = scoreCoverage("slider and a pull tab", concepts);
    expect(report.hitCount).toBe(2);
    expect(report.totalCount).toBe(3);
    expect(report.fraction).toBeCloseTo(2 / 3, 5);
    expect(report.weightedFraction).toBeCloseTo(0.5, 5);
  });

  it("returns zero coverage for an empty transcript against a real rubric", () => {
    const report = scoreCoverage("", concepts);
    expect(report.verifiable).toBe(true);
    expect(report.hitCount).toBe(0);
    expect(report.weightedFraction).toBe(0);
  });

  it("falls back to not-verifiable when the rubric has no concepts", () => {
    const report = scoreCoverage("anything the learner said", []);
    expect(report.verifiable).toBe(false);
    expect(report.totalCount).toBe(0);
    expect(report.fraction).toBe(0);
    expect(report.weightedFraction).toBe(0);
  });

  it("ignores stopwords so a phrase of only stopwords does not auto-hit", () => {
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
});
