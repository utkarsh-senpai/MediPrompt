import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PracticeSurface } from "./PracticeSurface";
import type { ChallengePreset, PracticeSelection } from "@/practice/types";
import type { SubjectOption } from "@/content/packQuery";

const subjects: SubjectOption[] = [
  { subjectId: "a", title: "Alpha" },
  { subjectId: "b", title: "Beta" },
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
        presets={["GUIDED"]}
        challengeVisible={false}
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
        presets={["GUIDED"]}
        challengeVisible={false}
        eligibleCount={5}
        drawing={false}
        onChange={() => {}}
        onSpin={() => {}}
      />,
    );
    expect(screen.queryByText(/^Challenge$/)).not.toBeInTheDocument();
  });

  it("shows the challenge selector when multiple presets are eligible", () => {
    render(
      <PracticeSurface
        subjects={subjects}
        selection={selection}
        presets={["GUIDED", "APPLIED", "VIVA"]}
        challengeVisible={true}
        eligibleCount={3}
        drawing={false}
        onChange={() => {}}
        onSpin={() => {}}
      />,
    );
    expect(screen.getByText(/^Challenge$/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Easy · Guided" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hard · Viva" })).toBeInTheDocument();
  });

  it("disables Spin when there are no eligible topics", () => {
    render(
      <PracticeSurface
        subjects={subjects}
        selection={selection}
        presets={["GUIDED"]}
        challengeVisible={false}
        eligibleCount={0}
        drawing={false}
        onChange={() => {}}
        onSpin={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Spin for a topic" })).toBeDisabled();
  });

  it("disables Spin while drawing", () => {
    render(
      <PracticeSurface
        subjects={subjects}
        selection={selection}
        presets={["GUIDED"]}
        challengeVisible={false}
        eligibleCount={5}
        drawing={true}
        onChange={() => {}}
        onSpin={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Spin for a topic" })).toBeDisabled();
  });

  it("mode and challenge are independent controls (changing mode does not change challenge)", () => {
    const onChange = vi.fn();
    render(
      <PracticeSurface
        subjects={subjects}
        selection={selection}
        presets={["GUIDED", "APPLIED"]}
        challengeVisible={true}
        eligibleCount={2}
        drawing={false}
        onChange={onChange}
        onSpin={() => {}}
      />,
    );
    // Pressing a challenge button reports only the challenge change.
    fireEvent.click(screen.getByRole("button", { name: "Medium · Applied" }));
    expect(onChange).toHaveBeenCalledWith({ challenge: "APPLIED" });
    // Pressing a mode button reports only the mode change.
    fireEvent.click(screen.getByRole("button", { name: "Deep Research" }));
    expect(onChange).toHaveBeenCalledWith({ mode: "DEEP_RESEARCH" });
  });

  it("subject select change reports the new subjectId", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PracticeSurface
        subjects={subjects}
        selection={selection}
        presets={["GUIDED"]}
        challengeVisible={false}
        eligibleCount={5}
        drawing={false}
        onChange={onChange}
        onSpin={() => {}}
      />,
    );
    await user.selectOptions(screen.getByLabelText("Subject"), "b");
    expect(onChange).toHaveBeenCalledWith({ subjectId: "b" });
  });
});

export type { ChallengePreset };
