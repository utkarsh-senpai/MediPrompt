// v0.5 semantic cosine coverage — the optional enhancer on top of the v0.4
// lexical engine. See docs/V0.5_DEVELOPMENT_CONTEXT.md §4.
//
// This module is the pure, embedding-driven scorer. It takes pre-computed
// embeddings (transcript + each accepted phrase) and produces the same
// CoverageReport shape as the lexical engine. The embedding client that
// fetches the vectors lives in embeddingClient.ts and is feature-gated; when
// it is unavailable, the orchestrator falls back to scoreCoverage (lexical).
//
// Keeping this pure means cosine math and threshold behavior are CI-deterministic
// and testable with stub embeddings — no model download in tests.

import type { Concept, ConceptResult, CoverageReport } from "@/practice/types";

/** Default cosine threshold for a phrase hit; calibrated for all-MiniLM-L6-v2. */
export const SEMANTIC_HIT_THRESHOLD = 0.75;

/** Cosine similarity between two equal-length vectors. Returns 0 for empty/degenerate input. */
export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] as number;
    const bi = b[i] as number;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface ConceptEmbeddings {
  conceptId: string;
  /** One embedding per acceptedPhrase, aligned with concept.acceptedPhrases. */
  phraseEmbeddings: readonly (readonly number[])[];
}

export interface SemanticCoverageInput {
  transcriptEmbedding: readonly number[];
  concepts: readonly Concept[];
  embeddings: readonly ConceptEmbeddings[];
  threshold?: number;
}

/**
 * Score coverage from embeddings. A concept hits when its best phrase embedding
 * reaches the threshold against the transcript embedding. Concepts without
 * embeddings are ignored (treated as not scorable for the semantic pass).
 */
export function semanticCoverage(input: SemanticCoverageInput): CoverageReport {
  const threshold = input.threshold ?? SEMANTIC_HIT_THRESHOLD;
  const embeddingById = new Map(input.embeddings.map((e) => [e.conceptId, e]));

  const scorable = input.concepts.filter((concept) => {
    const emb = embeddingById.get(concept.conceptId);
    return emb !== undefined && emb.phraseEmbeddings.length > 0;
  });

  if (scorable.length === 0) {
    return {
      verifiable: false,
      unavailableReason: "NO_SCORABLE_RUBRIC",
      conceptResults: [],
      hitCount: 0,
      totalCount: 0,
      weightedFraction: 0,
      fraction: 0,
    };
  }

  const conceptResults: ConceptResult[] = scorable.map((concept) => {
    const emb = embeddingById.get(concept.conceptId);
    let bestSim = -Infinity;
    let bestPhrase: string | null = null;
    if (emb) {
      for (let i = 0; i < concept.acceptedPhrases.length; i++) {
        const phraseEmb = emb.phraseEmbeddings[i];
        if (!phraseEmb) continue;
        const sim = cosineSimilarity(input.transcriptEmbedding, phraseEmb);
        if (sim > bestSim) {
          bestSim = sim;
          bestPhrase = concept.acceptedPhrases[i] ?? null;
        }
      }
    }
    const hit = bestSim >= threshold;
    return {
      conceptId: concept.conceptId,
      label: concept.label,
      weight: concept.weight,
      hit,
      matchedPhrase: hit ? bestPhrase : null,
    };
  });

  const hitCount = conceptResults.filter((r) => r.hit).length;
  const totalCount = conceptResults.length;
  const weightedTotal = conceptResults.reduce((sum, r) => sum + r.weight, 0);
  const weightedHit = conceptResults
    .filter((r) => r.hit)
    .reduce((sum, r) => sum + r.weight, 0);

  return {
    verifiable: true,
    unavailableReason: null,
    conceptResults,
    hitCount,
    totalCount,
    weightedFraction: weightedTotal > 0 ? weightedHit / weightedTotal : 0,
    fraction: totalCount > 0 ? hitCount / totalCount : 0,
  };
}
