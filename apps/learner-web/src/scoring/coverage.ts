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

import { MAX_TRANSCRIPT_CHARACTERS } from "@/practice/transcriptPolicy";
import type {
  Concept,
  ConceptResult,
  CoverageReport,
  CoverageUnavailableReason,
} from "@/practice/types";

export type { ConceptResult, CoverageReport };

/** Stopwords dropped before token matching so phrase logic is not noise-driven. */
const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "of", "to", "in", "for", "with", "on",
  "is", "are", "be", "it", "this", "that", "as", "by", "at", "from", "into",
]);

/** Keeps unordered phrase tokens local instead of matching across a full answer. */
const TOKEN_WINDOW_PADDING = 6;

function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function significantTokens(phrase: string): string[] {
  return normalize(phrase)
    .split(" ")
    .filter((token) => token.length > 0 && !STOPWORDS.has(token));
}

function containsTokenSequence(transcriptTokens: string[], phraseTokens: string[]): boolean {
  if (phraseTokens.length === 0 || phraseTokens.length > transcriptTokens.length) return false;
  const lastStart = transcriptTokens.length - phraseTokens.length;
  for (let start = 0; start <= lastStart; start++) {
    if (phraseTokens.every((token, offset) => transcriptTokens[start + offset] === token)) {
      return true;
    }
  }
  return false;
}

function containsNearbyTokens(transcriptTokens: string[], phraseTokens: string[]): boolean {
  if (phraseTokens.length < 2 || phraseTokens.length > transcriptTokens.length) return false;
  const required = new Map<string, number>();
  for (const token of phraseTokens) required.set(token, (required.get(token) ?? 0) + 1);
  const windowSize = Math.min(
    transcriptTokens.length,
    phraseTokens.length + TOKEN_WINDOW_PADDING,
  );
  const available = new Map<string, number>();

  for (let end = 0; end < transcriptTokens.length; end++) {
    const added = transcriptTokens[end]!;
    if (required.has(added)) available.set(added, (available.get(added) ?? 0) + 1);

    if (end >= windowSize) {
      const removed = transcriptTokens[end - windowSize]!;
      if (required.has(removed)) {
        available.set(removed, (available.get(removed) ?? 0) - 1);
      }
    }
    if ([...required].every(([token, count]) => (available.get(token) ?? 0) >= count)) {
      return true;
    }
  }
  return false;
}

/**
 * Match a whole normalized phrase, or all of its significant tokens inside a
 * small local window. Whole-token matching prevents terms such as `FITT` from
 * matching unrelated words such as `fitting`; the local window still tolerates
 * modest word-order drift without joining evidence from distant sentences.
 */
function phraseHits(phrase: string, transcriptTokens: string[]): boolean {
  const normPhrase = normalize(phrase);
  if (normPhrase.length === 0) return false;
  const tokens = significantTokens(phrase);
  if (tokens.length === 0) return false;
  const phraseTokens = normPhrase.split(" ");
  if (containsTokenSequence(transcriptTokens, phraseTokens)) return true;
  return containsNearbyTokens(transcriptTokens, tokens);
}

function firstMatchedPhrase(concept: Concept, transcriptTokens: string[]): string | null {
  for (const phrase of concept.acceptedPhrases) {
    if (phraseHits(phrase, transcriptTokens)) return phrase;
  }
  return null;
}

function unavailable(reason: CoverageUnavailableReason): CoverageReport {
  return {
    verifiable: false,
    unavailableReason: reason,
    conceptResults: [],
    hitCount: 0,
    totalCount: 0,
    weightedFraction: 0,
    fraction: 0,
  };
}

/**
 * Score the transcript against the rubric concepts. Missing text and rubrics
 * without usable accepted phrases return explicit unavailable outcomes rather
 * than fabricated zero-coverage results.
 */
export function scoreCoverage(transcript: string, concepts: readonly Concept[]): CoverageReport {
  const scorableConcepts = concepts.filter((concept) =>
    concept.acceptedPhrases.some((phrase) => significantTokens(phrase).length > 0),
  );
  if (scorableConcepts.length === 0) return unavailable("NO_SCORABLE_RUBRIC");

  const normalizedTranscript = normalize(transcript.slice(0, MAX_TRANSCRIPT_CHARACTERS));
  if (normalizedTranscript.length === 0) return unavailable("NO_TRANSCRIPT");
  const transcriptTokens = normalizedTranscript.split(" ").filter(Boolean);

  const conceptResults: ConceptResult[] = scorableConcepts.map((concept) => {
    const matchedPhrase = firstMatchedPhrase(concept, transcriptTokens);
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
    verifiable: true,
    unavailableReason: null,
    conceptResults,
    hitCount,
    totalCount,
    weightedFraction: weightedTotal > 0 ? weightedHit / weightedTotal : 0,
    fraction: totalCount > 0 ? hitCount / totalCount : 0,
  };
}
