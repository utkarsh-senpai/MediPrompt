import { describe, expect, it } from "vitest";
import { gapScore, formatGapScore, gapDirectionCopy } from "./gapScore";
import type { CoverageReport } from "@/practice/types";

function report(weightedFraction: number, verifiable = true): CoverageReport {
  if (!verifiable) {
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
  return {
    verifiable: true,
    unavailableReason: null,
    conceptResults: [],
    hitCount: 0,
    totalCount: 0,
    weightedFraction,
    fraction: 0,
  };
}

describe("gapScore", () => {
  it("is positive and IMPROVED when coverage rises", () => {
    const result = gapScore(report(0.4), report(0.7));
    expect(result.score).toBeCloseTo(0.3, 5);
    expect(result.direction).toBe("IMPROVED");
  });

  it("is negative and REGRESSED when coverage falls", () => {
    const result = gapScore(report(0.8), report(0.5));
    expect(result.score).toBeCloseTo(-0.3, 5);
    expect(result.direction).toBe("REGRESSED");
  });

  it("is zero and FLAT when coverage is identical", () => {
    const result = gapScore(report(0.6), report(0.6));
    expect(result.score).toBe(0);
    expect(result.direction).toBe("FLAT");
  });

  it("returns FLAT zero when there is no prior attempt", () => {
    const result = gapScore(null, report(0.5));
    expect(result).toEqual({ score: 0, direction: "FLAT" });
  });

  it("returns FLAT zero when either report is not verifiable", () => {
    expect(gapScore(report(0.5), report(0, false))).toEqual({ score: 0, direction: "FLAT" });
    expect(gapScore(report(0, false), report(0.5))).toEqual({ score: 0, direction: "FLAT" });
  });
});

describe("formatGapScore", () => {
  it("formats positive, negative, and zero", () => {
    expect(formatGapScore(0.18)).toBe("+18%");
    expect(formatGapScore(-0.04)).toBe("−4%");
    expect(formatGapScore(0)).toBe("0%");
  });
});

describe("gapDirectionCopy", () => {
  it("covers all three directions", () => {
    expect(gapDirectionCopy("IMPROVED")).toMatch(/improved/i);
    expect(gapDirectionCopy("REGRESSED")).toMatch(/dropped/i);
    expect(gapDirectionCopy("FLAT")).toMatch(/unchanged/i);
  });
});
