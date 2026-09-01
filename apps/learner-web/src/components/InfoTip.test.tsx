import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InfoTip } from "./InfoTip";

describe("InfoTip", () => {
  it("exposes the explanation as the trigger's description", () => {
    render(<InfoTip label="About modes">Recall speaks at once.</InfoTip>);
    const trigger = screen.getByRole("button", { name: "About modes" });
    const described = document.getElementById(
      trigger.getAttribute("aria-describedby") ?? "",
    );
    expect(described).toHaveTextContent("Recall speaks at once.");
    expect(described).toHaveAttribute("role", "tooltip");
  });

  it("toggles on click and closes on Escape", async () => {
    const user = userEvent.setup();
    render(<InfoTip label="About modes">Recall speaks at once.</InfoTip>);
    const trigger = screen.getByRole("button", { name: "About modes" });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger.closest(".info-tip")?.className).toContain("is-open");

    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger.closest(".info-tip")?.className).not.toContain("is-open");
  });
});
