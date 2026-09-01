// v0.4 content-coverage scoring.
// See docs/V0.4_DEVELOPMENT_CONTEXT.md §3.
//
// Coverage is a deterministic, lexical, on-device measure: for each rubric
// concept we test whether the learner's approved transcript expresses one of
// the concept's acceptedPhrases. It is deliberately NOT a correctness grade —
// it reports "did the expected idea appear in your spoken answer", nothing
// more. Semantic cosine (all-MiniLM-L6-v2) is a planned v0.5 enhancement; the
// lexical engine here is the zero-cost, offline, CI-deterministic baseline that
// always runs and never needs a model download.

import type { Concept, ConceptResult, CoverageReport } from "@/practice/types";

export type { ConceptResult, CoverageReport };

/** Stopwords dropped before token matching so phrase logic is not noise-driven. */
const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "of", "to", "in", "for", "with", "on",
  "is", "are", "be", "it", "this", "that", "as", "by", "at", "from", "into",
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function significantTokens(phrase: string): string[] {
  return normalize(phrase)
    .split(" ")
    .filter((token) => token.length > 0 && !STOPWORDS.has(token));
}

/**
 * A phrase is present when its normalized form appears as a substring OR every
 * significant token appears in the transcript. The token path catches word-order
 * drift and minor Whisper errors on accented speech; the substring path catches
 * tight multi-word terms.
 */
function phraseHits(phrase: string, transcript: string, transcriptTokens: Set<string>): boolean {
  const normPhrase = normalize(phrase);
  if (normPhrase.length === 0) return false;
  if (transcript.includes(normPhrase)) return true;
  const tokens = significantTokens(phrase);
  if (tokens.length === 0) return false;
  return tokens.every((token) => transcriptTokens.has(token));
}

function firstMatchedPhrase(concept: Concept, transcript: string, transcriptTokens: Set<string>): string | null {
  for (const phrase of concept.acceptedPhrases) {
    if (phraseHits(phrase, transcript, transcriptTokens)) return phrase;
  }
  return null;
}

/**
 * Score the transcript against the rubric concepts. An empty concept list, or a
 * transcript with no scorable content against a non-empty rubric, still returns a
 * report — coverage is simply zero. `verifiable` is false only when the rubric
 * itself has no concepts, which triggers the "not verifiable from sources" copy.
 */
export function scoreCoverage(transcript: string, concepts: readonly Concept[]): CoverageReport {
  const normalizedTranscript = normalize(transcript);
  const transcriptTokens = new Set(normalizedTranscript.split(" ").filter(Boolean));

  const conceptResults: ConceptResult[] = concepts.map((concept) => {
    const matchedPhrase = firstMatchedPhrase(concept, normalizedTranscript, transcriptTokens);
    return {
      conceptId: concept.conceptId,
      label: concept.label,
      weight: concept.weight,
      hit: matchedPhrase !== null,
      matchedPhrase,
    };
  });

  const hitCount = conceptResults.filter((result) => result.hit).length;
  const totalCount = conceptResults.length;
  const weightedTotal = conceptResults.reduce((sum, result) => sum + result.weight, 0);
  const weightedHit = conceptResults
    .filter((result) => result.hit)
    .reduce((sum, result) => sum + result.weight, 0);

  return {
    verifiable: totalCount > 0,
    conceptResults,
    hitCount,
    totalCount,
    weightedFraction: weightedTotal > 0 ? weightedHit / weightedTotal : 0,
    fraction: totalCount > 0 ? hitCount / totalCount : 0,
  };
}
