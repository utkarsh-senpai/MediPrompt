import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CoveragePanel } from "./CoveragePanel";
import type { CoverageReport } from "@/practice/types";

const PARTIAL: CoverageReport = {
  verifiable: true,
  unavailableReason: null,
  scoring: { method: "LEXICAL", version: "lexical-v1" },
  conceptResults: [
    { conceptId: "c1", label: "Names the slider role", weight: 2, hit: true, matchedPhrase: "slider" },
    { conceptId: "c2", label: "Explains interlocking teeth", weight: 3, hit: false, matchedPhrase: null },
  ],
  hitCount: 1,
  totalCount: 2,
  weightedFraction: 0.4,
  fraction: 0.5,
};

const FULL: CoverageReport = {
  verifiable: true,
  unavailableReason: null,
  scoring: { method: "LEXICAL", version: "lexical-v1" },
  conceptResults: [
    { conceptId: "c1", label: "Names the slider role", weight: 2, hit: true, matchedPhrase: "slider" },
    { conceptId: "c2", label: "Explains interlocking teeth", weight: 3, hit: true, matchedPhrase: "interlocking teeth" },
  ],
  hitCount: 2,
  totalCount: 2,
  weightedFraction: 1,
  fraction: 1,
};

const NOT_VERIFIABLE: CoverageReport = {
  verifiable: false,
  unavailableReason: "NO_SCORABLE_RUBRIC",
  scoring: { method: "LEXICAL", version: "lexical-v1" },
  conceptResults: [],
  hitCount: 0,
  totalCount: 0,
  weightedFraction: 0,
  fraction: 0,
};

const NO_TRANSCRIPT: CoverageReport = {
  ...NOT_VERIFIABLE,
  unavailableReason: "NO_TRANSCRIPT",
};

describe("CoveragePanel", () => {
  it("reports the hit count and names the highest-weight missed concept as the next action", () => {
    render(<CoveragePanel coverage={PARTIAL} />);
    expect(screen.getByText(/You touched 1 of 2 listed concepts/)).toBeInTheDocument();
    expect(screen.getByText(/40% by weight/)).toBeInTheDocument();
    expect(screen.getByText("Explains interlocking teeth")).toBeInTheDocument();
    expect(screen.getByText(/On your next attempt/)).toBeInTheDocument();
  });

  it("reinforces and hides the missed list when every concept was touched", () => {
    render(<CoveragePanel coverage={FULL} />);
    expect(screen.getByText(/You touched 2 of 2 listed concepts/)).toBeInTheDocument();
    expect(screen.queryByText(/Concepts not yet touched/)).toBeNull();
    expect(screen.getByText(/explain the same concepts more concisely/)).toBeInTheDocument();
    expect(screen.getByText(/Matched rubric wording: “slider”/)).toBeInTheDocument();
  });

  it("explains when no transcript was provided instead of reporting zero coverage", () => {
    render(<CoveragePanel coverage={NO_TRANSCRIPT} />);
    expect(screen.getByText(/No transcript was provided/)).toBeInTheDocument();
    expect(screen.queryByText(/You touched/)).toBeNull();
  });

  it("surfaces the not-verifiable fallback and no score line", () => {
    render(<CoveragePanel coverage={NOT_VERIFIABLE} />);
    expect(screen.getByText(/content coverage was not scored/)).toBeInTheDocument();
    expect(screen.queryByText(/You touched/)).toBeNull();
  });

  it("keeps content coverage separate from delivery (no delivery heading present)", () => {
    render(<CoveragePanel coverage={PARTIAL} />);
    expect(screen.getByText("Content coverage")).toBeInTheDocument();
    expect(screen.queryByText("Delivery observations")).toBeNull();
  });

  it("renders untrusted rubric labels and phrases as inert text", () => {
    const adversarial: CoverageReport = {
      ...FULL,
      conceptResults: [
        {
          conceptId: "unsafe",
          label: "<img src=x onerror=alert(1)>",
          weight: 1,
          hit: true,
          matchedPhrase: "<script>alert(2)</script>",
        },
      ],
      hitCount: 1,
      totalCount: 1,
    };
    render(<CoveragePanel coverage={adversarial} />);
    expect(screen.getByText(/<img src=x onerror=alert\(1\)>/)).toBeInTheDocument();
    expect(screen.getByText(/<script>alert\(2\)<\/script>/)).toBeInTheDocument();
    expect(document.querySelector('img[src="x"]')).toBeNull();
    expect(document.querySelector("script")).toBeNull();
  });

  it("shows possible semantic evidence separately without counting it", () => {
    const possible: CoverageReport = {
      ...PARTIAL,
      hitCount: 0,
      weightedFraction: 0,
      fraction: 0,
      conceptResults: [
        {
          conceptId: "possible",
          label: "Connect exercise with function",
          weight: 1,
          hit: false,
          matchedPhrase: null,
          semanticEvidence: {
            status: "POSSIBLY_COVERED",
            transcriptSegment: "Training may help daily activity",
            rubricText: "exercise and function",
            similarity: 0.5,
            thresholdVersion: "test-v1",
          },
        },
      ],
      totalCount: 1,
    };
    render(<CoveragePanel coverage={possible} />);
    expect(screen.getByRole("heading", { name: /Possibly present/ })).toBeInTheDocument();
    expect(screen.getByText(/Training may help daily activity/)).toBeInTheDocument();
    expect(screen.getByText(/not counted/i)).toBeInTheDocument();
  });
});
