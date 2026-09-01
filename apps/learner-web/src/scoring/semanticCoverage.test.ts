import { describe, expect, it } from "vitest";
import { scoreCoverage } from "./coverage";
import {
  cosineSimilarity,
  MAX_SEMANTIC_SEGMENTS,
  segmentTranscript,
  semanticCoverage,
  SEMANTIC_THRESHOLDS,
  type ConceptEmbeddings,
} from "./semanticCoverage";
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
    acceptedPhrases: ["interlocking teeth"],
    weight: 3,
    sourceRefs: ["src"],
  },
];

const segment = { text: "The fastener joins two rows.", embedding: [1, 0, 0] };
const embeddings: ConceptEmbeddings[] = [
  {
    conceptId: "c1",
    rubricEmbeddings: [{ text: "slider role", embedding: [1, 0, 0] }],
  },
  {
    conceptId: "c2",
    rubricEmbeddings: [{ text: "interlocking teeth", embedding: [0, 1, 0] }],
  },
];

describe("cosineSimilarity", () => {
  it("returns expected similarity for valid vectors", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 5);
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0, 5);
    expect(cosineSimilarity([1, 0, 0], [-1, 0, 0])).toBeCloseTo(-1, 5);
  });

  it("rejects empty, mismatched, degenerate, and non-finite vectors", () => {
    expect(cosineSimilarity([], [])).toBe(Number.NEGATIVE_INFINITY);
    expect(cosineSimilarity([1, 0], [1, 0, 0])).toBe(Number.NEGATIVE_INFINITY);
    expect(cosineSimilarity([0, 0], [1, 0])).toBe(Number.NEGATIVE_INFINITY);
    expect(cosineSimilarity([Number.NaN], [1])).toBe(Number.NEGATIVE_INFINITY);
  });
});

describe("segmentTranscript", () => {
  it("uses sentences and bounded overlapping windows for unpunctuated speech", () => {
    expect(segmentTranscript("First idea. Second idea?\nThird idea!")).toEqual([
      "First idea",
      "Second idea",
      "Third idea!",
    ]);
    const long = Array.from({ length: 90 }, (_, index) => `word${index}`).join(" ");
    const chunks = segmentTranscript(long);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]?.split(" ")).toHaveLength(48);
    expect(chunks[1]?.startsWith("word40 ")).toBe(true);
  });

  it("caps adversarial sentence counts", () => {
    const many = Array.from({ length: MAX_SEMANTIC_SEGMENTS + 20 }, (_, i) => `item ${i}.`).join(" ");
    expect(segmentTranscript(many)).toHaveLength(MAX_SEMANTIC_SEGMENTS);
  });
});

describe("semanticCoverage", () => {
  it("preserves exact lexical hits even when semantic vectors disagree", () => {
    const baseline = scoreCoverage("I would explain the slider role.", concepts);
    const report = semanticCoverage({ baseline, segments: [segment], concepts, embeddings });
    expect(report.conceptResults[0]?.hit).toBe(true);
    expect(report.conceptResults[0]?.matchedPhrase).toBe("slider role");
  });

  it("can add a semantic hit only when an explicitly supplied calibrated threshold allows it", () => {
    const baseline = scoreCoverage("unrelated wording", concepts);
    const report = semanticCoverage({
      baseline,
      segments: [segment],
      concepts,
      embeddings,
      thresholds: { version: "calibrated-test-v1", covered: 0.7, possible: 0.35 },
    });
    expect(report.scoring.method).toBe("LEXICAL_SEMANTIC");
    expect(report.conceptResults[0]).toMatchObject({
      hit: true,
      matchedPhrase: "slider role",
      semanticEvidence: {
        status: "COVERED",
        transcriptSegment: segment.text,
        rubricText: "slider role",
        thresholdVersion: "calibrated-test-v1",
      },
    });
  });

  it("does not promote even identical vectors under the uncalibrated beta defaults", () => {
    const baseline = scoreCoverage("unrelated wording", concepts);
    const report = semanticCoverage({ baseline, segments: [segment], concepts, embeddings });
    expect(report.hitCount).toBe(0);
    expect(report.scoring).toEqual(baseline.scoring);
    expect(report.conceptResults[0]?.semanticEvidence?.status).toBe("POSSIBLY_COVERED");
    expect(report.conceptResults[0]?.semanticEvidence?.thresholdVersion).toBe(
      SEMANTIC_THRESHOLDS.version,
    );
  });

  it("keeps possible evidence explicit and out of weighted coverage", () => {
    const baseline = scoreCoverage("unrelated wording", concepts);
    const report = semanticCoverage({
      baseline,
      segments: [{ text: "possible paraphrase", embedding: [1, 0, 0] }],
      concepts,
      embeddings: [
        {
          conceptId: "c1",
          rubricEmbeddings: [{ text: "slider role", embedding: [0.4, 0.9165, 0] }],
        },
      ],
    });
    expect(report.hitCount).toBe(0);
    expect(report.weightedFraction).toBe(0);
    expect(report.conceptResults[0]?.semanticEvidence?.status).toBe("POSSIBLY_COVERED");
  });

  it("marks low similarity as not found without fabricating visible evidence", () => {
    const baseline = scoreCoverage("unrelated wording", concepts);
    const report = semanticCoverage({ baseline, segments: [segment], concepts, embeddings });
    expect(report.conceptResults[1]?.semanticEvidence).toMatchObject({
      status: "NOT_FOUND",
      transcriptSegment: null,
      rubricText: null,
    });
  });

  it("retains the lexical fallback when coverage or usable vectors are unavailable", () => {
    const unavailable = scoreCoverage("", concepts);
    expect(
      semanticCoverage({ baseline: unavailable, segments: [segment], concepts, embeddings }),
    ).toBe(unavailable);
    const baseline = scoreCoverage("unrelated wording", concepts);
    expect(semanticCoverage({ baseline, segments: [], concepts, embeddings })).toBe(baseline);
    expect(semanticCoverage({ baseline, segments: [segment], concepts, embeddings: [] })).toBe(
      baseline,
    );
  });
});
