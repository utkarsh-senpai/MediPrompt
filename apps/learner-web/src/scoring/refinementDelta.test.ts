import { describe, expect, it } from "vitest";
import {
  formatRefinementDelta,
  refinementDelta,
  refinementDirectionCopy,
  refinementUnavailableCopy,
} from "./refinementDelta";
import type { AttemptHistoryEntry, CoverageReport } from "@/practice/types";

function report(
  weightedFraction: number,
  hits: string[] = [],
  method: CoverageReport["scoring"]["method"] = "LEXICAL",
): CoverageReport {
  return {
    verifiable: true,
    unavailableReason: null,
    scoring: { method, version: method === "LEXICAL" ? "lexical-v1" : "semantic-v1" },
    conceptResults: ["a", "b", "c"].map((conceptId) => ({
      conceptId,
      label: conceptId.toUpperCase(),
      weight: 1,
      hit: hits.includes(conceptId),
      matchedPhrase: hits.includes(conceptId) ? conceptId : null,
    })),
    hitCount: hits.length,
    totalCount: 3,
    weightedFraction,
    fraction: hits.length / 3,
  };
}

function attempt(coverage: CoverageReport, overrides: Partial<AttemptHistoryEntry> = {}): AttemptHistoryEntry {
  return {
    attemptId: "attempt-1",
    attemptIndex: 1,
    topicRef: {
      packId: "pack",
      packVersion: "1.0.0",
      subjectId: "subject",
      topicId: "topic",
      variantId: "variant",
      difficultyProfileVersion: "difficulty-v1",
      promptId: "prompt",
      rubricId: "rubric",
    },
    mode: "RECALL_SPRINT",
    challenge: "GUIDED",
    supportLevel: "FULL",
    register: "EXAMINER",
    timePolicy: { speakingSeconds: 90 },
    coverage,
    transcriptText: "answer",
    ...overrides,
  };
}

describe("refinementDelta", () => {
  it("computes direction and newly covered/lost concepts", () => {
    const result = refinementDelta(
      attempt(report(1 / 3, ["a"])),
      attempt(report(2 / 3, ["b", "c"]), { attemptId: "attempt-2", attemptIndex: 2 }),
    );
    expect(result).toMatchObject({
      available: true,
      direction: "IMPROVED",
      newlyCoveredConceptIds: ["b", "c"],
      lostConceptIds: ["a"],
    });
    if (result.available) expect(result.score).toBeCloseTo(1 / 3, 5);
  });

  it("classifies regression, flat, and floating-point noise", () => {
    expect(refinementDelta(attempt(report(0.8)), attempt(report(0.5))).available).toBe(true);
    const regressed = refinementDelta(attempt(report(0.8)), attempt(report(0.5)));
    expect(regressed.available && regressed.direction).toBe("REGRESSED");
    const flat = refinementDelta(attempt(report(0.6)), attempt(report(0.6 + 1e-12)));
    expect(flat).toMatchObject({ available: true, score: 0, direction: "FLAT" });
  });

  it("rejects every mismatched practice identity field", () => {
    const prior = attempt(report(0.4));
    const variants: AttemptHistoryEntry[] = [
      attempt(report(0.6), { mode: "DEEP_RESEARCH" }),
      attempt(report(0.6), { register: "PATIENT" }),
      attempt(report(0.6), { supportLevel: "MINIMAL" }),
      attempt(report(0.6), { challenge: "VIVA" }),
      attempt(report(0.6), { timePolicy: { speakingSeconds: 120 } }),
      attempt(report(0.6), { topicRef: { ...prior.topicRef, rubricId: "other" } }),
      attempt(report(0.6), { topicRef: { ...prior.topicRef, packVersion: "2.0.0" } }),
    ];
    for (const current of variants) {
      expect(refinementDelta(prior, current)).toEqual({
        available: false,
        reason: "ATTEMPT_IDENTITY_MISMATCH",
      });
    }
  });

  it("rejects mixed lexical and semantic scoring identities", () => {
    expect(refinementDelta(attempt(report(0.4)), attempt(report(0.6, [], "LEXICAL_SEMANTIC")))).toEqual({
      available: false,
      reason: "SCORING_IDENTITY_MISMATCH",
    });
  });

  it("does not fabricate a flat delta from unavailable coverage", () => {
    const unavailable: CoverageReport = {
      ...report(0),
      verifiable: false,
      unavailableReason: "NO_TRANSCRIPT",
    };
    expect(refinementDelta(attempt(unavailable), attempt(report(0.5)))).toEqual({
      available: false,
      reason: "PRIOR_COVERAGE_UNAVAILABLE",
    });
    expect(refinementDelta(attempt(report(0.5)), attempt(unavailable))).toEqual({
      available: false,
      reason: "CURRENT_COVERAGE_UNAVAILABLE",
    });
  });
});

describe("Refinement Delta copy", () => {
  it("formats positive, negative, zero, and tiny values", () => {
    expect(formatRefinementDelta(0.18)).toBe("+18%");
    expect(formatRefinementDelta(-0.04)).toBe("−4%");
    expect(formatRefinementDelta(0)).toBe("0%");
    expect(formatRefinementDelta(0.004)).toBe("+<1%");
  });

  it("provides copy for directions and every unavailable reason", () => {
    expect(refinementDirectionCopy("IMPROVED")).toMatch(/improved/i);
    expect(refinementDirectionCopy("REGRESSED")).toMatch(/dropped/i);
    expect(refinementDirectionCopy("FLAT")).toMatch(/unchanged/i);
    for (const reason of [
      "PRIOR_COVERAGE_UNAVAILABLE",
      "CURRENT_COVERAGE_UNAVAILABLE",
      "ATTEMPT_IDENTITY_MISMATCH",
      "SCORING_IDENTITY_MISMATCH",
    ] as const) {
      expect(refinementUnavailableCopy(reason)).toMatch(/unavailable/i);
    }
  });
});
