import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CoveragePanel } from "./CoveragePanel";
import type { CoverageReport } from "@/practice/types";

const PARTIAL: CoverageReport = {
  verifiable: true,
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
  conceptResults: [],
  hitCount: 0,
  totalCount: 0,
  weightedFraction: 0,
  fraction: 0,
};

describe("CoveragePanel", () => {
  it("reports the hit count and names the highest-weight missed concept as the next action", () => {
    render(<CoveragePanel coverage={PARTIAL} />);
    expect(screen.getByText(/You touched 1 of 2 listed concepts/)).toBeInTheDocument();
    expect(screen.getByText(/40% by weight/)).toBeInTheDocument();
    expect(screen.getByText("Explains interlocking teeth")).toBeInTheDocument();
    expect(screen.getByText(/Next attempt/)).toBeInTheDocument();
  });

  it("reinforces and hides the missed list when every concept was touched", () => {
    render(<CoveragePanel coverage={FULL} />);
    expect(screen.getByText(/You touched 2 of 2 listed concepts/)).toBeInTheDocument();
    expect(screen.queryByText(/Concepts not yet touched/)).toBeNull();
    expect(screen.getByText(/tighten your timing|harder variant/)).toBeInTheDocument();
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
});
