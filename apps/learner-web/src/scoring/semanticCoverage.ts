// Optional v0.5 semantic enhancer. Exact lexical hits remain authoritative;
// semantic evidence may add conservative covered/possible results with the
// transcript segment and rubric text that produced them.

import { MAX_TRANSCRIPT_CHARACTERS } from "@/practice/transcriptPolicy";
import type { Concept, ConceptResult, CoverageReport } from "@/practice/types";
import { EMBEDDING_MODEL } from "./embeddingClient";

export interface SemanticThresholds {
  version: string;
  covered: number;
  possible: number;
}

export const SEMANTIC_THRESHOLDS: Readonly<SemanticThresholds> = Object.freeze({
  version: "minilm-l6-v2-experimental-v1",
  /** Disabled until educator-labelled calibration authorizes score promotion. */
  covered: 1.01,
  possible: 0.35,
});

const MAX_SEGMENT_WORDS = 48;
const SEGMENT_OVERLAP_WORDS = 8;
export const MAX_SEMANTIC_SEGMENTS = 96;

export interface TextEmbedding {
  text: string;
  embedding: readonly number[];
}

export interface ConceptEmbeddings {
  conceptId: string;
  /** Label and accepted-phrase embeddings, each retaining its display text. */
  rubricEmbeddings: readonly TextEmbedding[];
}

export interface SemanticCoverageInput {
  baseline: CoverageReport;
  segments: readonly TextEmbedding[];
  concepts: readonly Concept[];
  embeddings: readonly ConceptEmbeddings[];
  thresholds?: SemanticThresholds;
}

/** Cosine similarity between equal-length finite vectors. */
export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length === 0 || a.length !== b.length) return Number.NEGATIVE_INFINITY;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i];
    const bi = b[i];
    if (ai === undefined || bi === undefined || !Number.isFinite(ai) || !Number.isFinite(bi)) {
      return Number.NEGATIVE_INFINITY;
    }
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  if (normA === 0 || normB === 0) return Number.NEGATIVE_INFINITY;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Produce sentence-like, bounded windows. Long or unpunctuated speech is split
 * into overlapping word windows so one whole-answer vector cannot dilute evidence.
 */
export function segmentTranscript(text: string): string[] {
  const bounded = text.slice(0, MAX_TRANSCRIPT_CHARACTERS).trim();
  if (!bounded) return [];
  const sentences = bounded
    .split(/(?:[.!?]+\s+|[\r\n]+)/u)
    .map((part) => part.trim())
    .filter(Boolean);
  const segments: string[] = [];
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/u).filter(Boolean);
    if (words.length <= MAX_SEGMENT_WORDS) {
      segments.push(sentence);
      continue;
    }
    const step = MAX_SEGMENT_WORDS - SEGMENT_OVERLAP_WORDS;
    for (let start = 0; start < words.length; start += step) {
      const chunk = words.slice(start, start + MAX_SEGMENT_WORDS);
      if (chunk.length === 0) break;
      segments.push(chunk.join(" "));
      if (start + MAX_SEGMENT_WORDS >= words.length) break;
    }
  }
  return segments.slice(0, MAX_SEMANTIC_SEGMENTS);
}

/** Preserve lexical hits, then add semantic hits or explicit possible evidence. */
export function semanticCoverage(input: SemanticCoverageInput): CoverageReport {
  if (!input.baseline.verifiable || input.segments.length === 0) return input.baseline;
  const thresholds = input.thresholds ?? SEMANTIC_THRESHOLDS;
  if (
    !Number.isFinite(thresholds.covered) ||
    !Number.isFinite(thresholds.possible) ||
    thresholds.possible < -1 ||
    thresholds.possible > 1 ||
    thresholds.covered < thresholds.possible ||
    thresholds.covered > 1.01
  ) {
    return input.baseline;
  }
  const conceptById = new Map(input.concepts.map((concept) => [concept.conceptId, concept]));
  const embeddingById = new Map(input.embeddings.map((entry) => [entry.conceptId, entry]));
  let evaluated = false;

  const conceptResults: ConceptResult[] = input.baseline.conceptResults.map((baselineResult) => {
    if (baselineResult.hit) return baselineResult;
    const concept = conceptById.get(baselineResult.conceptId);
    const rubric = embeddingById.get(baselineResult.conceptId);
    if (!concept || !rubric || rubric.rubricEmbeddings.length === 0) return baselineResult;

    let bestSimilarity = Number.NEGATIVE_INFINITY;
    let bestSegment: string | null = null;
    let bestRubricText: string | null = null;
    for (const segment of input.segments) {
      for (const candidate of rubric.rubricEmbeddings) {
        const similarity = cosineSimilarity(segment.embedding, candidate.embedding);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestSegment = segment.text;
          bestRubricText = candidate.text;
        }
      }
    }
    if (!Number.isFinite(bestSimilarity)) return baselineResult;
    evaluated = true;
    const status =
      bestSimilarity >= thresholds.covered
        ? "COVERED"
        : bestSimilarity >= thresholds.possible
          ? "POSSIBLY_COVERED"
          : "NOT_FOUND";
    return {
      ...baselineResult,
      hit: status === "COVERED",
      matchedPhrase: status === "COVERED" ? bestRubricText : null,
      semanticEvidence: {
        status,
        transcriptSegment: status === "NOT_FOUND" ? null : bestSegment,
        rubricText: status === "NOT_FOUND" ? null : bestRubricText,
        similarity: bestSimilarity,
        thresholdVersion: thresholds.version,
      },
    };
  });

  if (!evaluated) return input.baseline;
  const hitCount = conceptResults.filter((result) => result.hit).length;
  const weightedTotal = conceptResults.reduce((sum, result) => sum + result.weight, 0);
  const weightedHit = conceptResults
    .filter((result) => result.hit)
    .reduce((sum, result) => sum + result.weight, 0);

  const hasSemanticHit = conceptResults.some(
    (result) => result.semanticEvidence?.status === "COVERED",
  );
  return {
    ...input.baseline,
    scoring: hasSemanticHit
      ? {
          method: "LEXICAL_SEMANTIC",
          version: `${EMBEDDING_MODEL.version}:${thresholds.version}`,
        }
      : input.baseline.scoring,
    conceptResults,
    hitCount,
    weightedFraction: weightedTotal > 0 ? weightedHit / weightedTotal : 0,
    fraction: conceptResults.length > 0 ? hitCount / conceptResults.length : 0,
  };
}
