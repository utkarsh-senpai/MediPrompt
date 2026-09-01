import { describe, expect, it } from "vitest";
import { prescribe } from "./prescription";
import { scoreCoverage } from "./coverage";
import type { Concept } from "@/practice/types";

const concepts: Concept[] = [
  {
    conceptId: "c1",
    label: "Names the slider role",
    acceptedPhrases: ["slider"],
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

describe("prescribe", () => {
  it("names the highest-weight missed concept as the next action", () => {
    const report = scoreCoverage("the slider closes it", concepts); // misses c2
    const prescription = prescribe(report);
    expect(prescription.kind).toBe("ACTION");
    expect(prescription.text).toContain("Explains interlocking teeth");
  });

  it("reinforces when every concept was touched", () => {
    const report = scoreCoverage("the slider closes it and interlocking teeth engage", concepts);
    expect(report.hitCount).toBe(report.totalCount);
    const prescription = prescribe(report);
    expect(prescription.kind).toBe("FULL");
    expect(prescription.text).toContain("explain the same concepts more concisely");
  });

  it("surfaces the not-verifiable fallback when the rubric is empty", () => {
    const report = scoreCoverage("the learner spoke at length", []);
    const prescription = prescribe(report);
    expect(prescription.kind).toBe("NOT_VERIFIABLE");
    expect(prescription.text).toContain("not scored");
  });

  it("distinguishes a missing transcript from a missing rubric", () => {
    const report = scoreCoverage("", concepts);
    const prescription = prescribe(report);
    expect(prescription.kind).toBe("NOT_VERIFIABLE");
    expect(prescription.text).toContain("No transcript was provided");
    expect(prescription.text).not.toContain("No source-grounded rubric");
  });

  it("is stable for a given report (ties break by rubric order)", () => {
    const tiedConcepts: Concept[] = [
      {
        conceptId: "a",
        label: "First idea",
        acceptedPhrases: ["first-idea-unique"],
        weight: 2,
        sourceRefs: ["src"],
      },
      {
        conceptId: "b",
        label: "Second idea",
        acceptedPhrases: ["second-idea-unique"],
        weight: 2,
        sourceRefs: ["src"],
      },
    ];
    const report = scoreCoverage("nothing relevant here", tiedConcepts);
    const prescription = prescribe(report);
    expect(prescription.text).toContain("First idea");
  });
});
