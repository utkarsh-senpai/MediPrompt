import { describe, expect, it } from "vitest";
import {
  cosineSimilarity,
  semanticCoverage,
  SEMANTIC_HIT_THRESHOLD,
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

// Stub embeddings in 3-D space. Similarity is purely geometric here.
const SIMILAR = [1, 0, 0];
const ORTHOGONAL = [0, 1, 0];

const embeddings: ConceptEmbeddings[] = [
  { conceptId: "c1", phraseEmbeddings: [SIMILAR, SIMILAR] },
  { conceptId: "c2", phraseEmbeddings: [ORTHOGONAL] },
];

describe("cosineSimilarity", () => {
  it("is 1 for identical unit vectors, 0 for orthogonal, −1 for opposite", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 5);
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0, 5);
    expect(cosineSimilarity([1, 0, 0], [-1, 0, 0])).toBeCloseTo(-1, 5);
  });

  it("returns 0 for empty or mismatched-length input", () => {
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([1, 0], [1, 0, 0])).toBe(0);
  });

  it("returns 0 for a zero vector", () => {
    expect(cosineSimilarity([0, 0, 0], [1, 0, 0])).toBe(0);
  });
});

describe("semanticCoverage", () => {
  it("hits a concept whose phrase embedding clears the threshold", () => {
    const report = semanticCoverage({
      transcriptEmbedding: SIMILAR,
      concepts,
      embeddings,
    });
    expect(report.verifiable).toBe(true);
    expect(report.conceptResults[0]?.hit).toBe(true);
    expect(report.conceptResults[0]?.matchedPhrase).toBe("slider role");
  });

  it("misses a concept whose best phrase is orthogonal to the transcript", () => {
    const report = semanticCoverage({
      transcriptEmbedding: SIMILAR,
      concepts,
      embeddings,
    });
    expect(report.conceptResults[1]?.hit).toBe(false);
  });

  it("respects a custom threshold", () => {
    const report = semanticCoverage({
      transcriptEmbedding: SIMILAR,
      concepts,
      embeddings,
      threshold: 1.5, // above the maximum possible cosine (1) → all miss
    });
    expect(report.hitCount).toBe(0);
  });

  it("falls back to NO_SCORABLE_RUBRIC when no concept has embeddings", () => {
    const report = semanticCoverage({
      transcriptEmbedding: SIMILAR,
      concepts,
      embeddings: [],
    });
    expect(report.verifiable).toBe(false);
    expect(report.unavailableReason).toBe("NO_SCORABLE_RUBRIC");
  });

  it("weights the fraction by concept weight", () => {
    // c1 (w2) hits, c2 (w3) misses → weighted 2/5 = 0.4
    const report = semanticCoverage({
      transcriptEmbedding: SIMILAR,
      concepts,
      embeddings,
    });
    expect(report.weightedFraction).toBeCloseTo(0.4, 5);
    expect(report.fraction).toBeCloseTo(1 / 2, 5);
  });

  it("uses the documented default threshold", () => {
    expect(SEMANTIC_HIT_THRESHOLD).toBe(0.75);
  });
});
