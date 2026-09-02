import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PracticeSurface } from "./PracticeSurface";
import type { ChallengePreset, PracticeSelection } from "@/practice/types";
import type { SubjectOption } from "@/content/packQuery";

const subjects: SubjectOption[] = [
  { subjectId: "a", title: "Alpha", availability: "ACTIVE" },
  { subjectId: "b", title: "Beta", availability: "ACTIVE" },
  { subjectId: "c", title: "Gamma", availability: "COMING_SOON" },
];

const selection: PracticeSelection = {
  mode: "RECALL_SPRINT",
  challenge: "GUIDED",
  subjectId: "a",
  register: "EXAMINER",
};

describe("PracticeSurface", () => {
  it("renders only Recall Sprint and Deep Research modes", () => {
    render(
      <PracticeSurface
        subjects={subjects}
        selection={selection}
        eligibleCount={5}
        drawing={false}
        onChange={() => {}}
        onSpin={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Recall Sprint" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Deep Research" })).toBeInTheDocument();
    // Reserved modes must NOT appear as controls.
    expect(screen.queryByText(/Viva Round/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Teach-back/i)).not.toBeInTheDocument();
  });

  it("hides the challenge selector when only one preset is eligible", () => {
    render(
      <PracticeSurface
        subjects={subjects}
        selection={selection}
        eligibleCount={5}
        drawing={false}
        onChange={() => {}}
        onSpin={() => {}}
      />,
    );
    expect(screen.queryByText(/^Challenge$/)).not.toBeInTheDocument();
  });

  it("disables Spin when there are no eligible topics", () => {
    render(
      <PracticeSurface
        subjects={subjects}
        selection={selection}
        eligibleCount={0}
        drawing={false}
        onChange={() => {}}
        onSpin={() => {}}
      />,
    );
    const spin = screen.getByRole("button", { name: "Spin for a topic" });
    expect(spin).toBeDisabled();
    expect(spin).toHaveAttribute("aria-busy", "false");
    expect(spin).not.toHaveAttribute("data-drawing");
  });

  it("disables Spin while drawing", () => {
    render(
      <PracticeSurface
        subjects={subjects}
        selection={selection}
        eligibleCount={5}
        drawing={true}
        onChange={() => {}}
        onSpin={() => {}}
      />,
    );
    const spin = screen.getByRole("button", { name: "Spin for a topic" });
    expect(spin).toBeDisabled();
    expect(spin).toHaveAttribute("aria-busy", "true");
    expect(spin).toHaveAttribute("data-drawing", "true");
  });

  it("subject select change reports the new subjectId", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PracticeSurface
        subjects={subjects}
        selection={selection}
        eligibleCount={5}
        drawing={false}
        onChange={onChange}
        onSpin={() => {}}
      />,
    );
    await user.selectOptions(screen.getByLabelText("Subject"), "b");
    expect(onChange).toHaveBeenCalledWith({ subjectId: "b" });
  });

  it("shows unavailable subjects but prevents selecting them", () => {
    render(
      <PracticeSurface
        subjects={subjects}
        selection={selection}
        eligibleCount={5}
        drawing={false}
        onChange={() => {}}
        onSpin={() => {}}
      />,
    );
    const option = screen.getByRole("option", { name: /Gamma — coming soon/ });
    expect(option).toBeDisabled();
  });
});

export type { ChallengePreset };
