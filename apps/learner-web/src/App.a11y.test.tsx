import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import { validatePack } from "@/content/packValidator";
import type { RuntimePack } from "@/practice/types";
import demoPackJson from "@content/packs/demo-interaction-fixture.json";

const demoPack = validatePack(demoPackJson) as RuntimePack;

function mockFetch(pack: unknown): void {
  const body = JSON.stringify(pack);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      status: 200,
      redirected: false,
      type: "basic",
      url: "",
      headers: new Headers({ "content-length": String(new TextEncoder().encode(body).byteLength) }),
      text: async () => body,
    })),
  );
}

function setMatchMedia(reduceMotion = false): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).matchMedia = (query: string) => ({
    matches: /reduce/.test(query) ? reduceMotion : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

describe("App accessibility + capability + security", () => {
  beforeEach(() => {
    setMatchMedia(false);
    mockFetch(demoPack);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders a single main landmark, a single page heading, and an aria-live region", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1));
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(document.querySelector('[aria-live="polite"]')).not.toBeNull();
  });

  it("exposes challenge state via aria-pressed, not color alone", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Spin for a topic" })).toBeEnabled());
    // Select a subject that has multiple challenge presets for Recall Sprint.
    await user.selectOptions(
      screen.getByLabelText("Subject"),
      "reasoning-and-tradeoffs",
    );
    const challengeGroup = screen.getByRole("group", { name: "Challenge" });
    const pressedButtons = within(challengeGroup).getAllByRole("button");
    expect(pressedButtons.length).toBeGreaterThan(1);
    // Exactly one preset is pressed at a time; aria-pressed is the signal.
    expect(pressedButtons.filter((b) => b.getAttribute("aria-pressed") === "true")).toHaveLength(1);
  });

  it("the Spin control is keyboard reachable", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Spin for a topic" })).toBeEnabled());
    const spin = screen.getByRole("button", { name: "Spin for a topic" });
    spin.focus();
    expect(document.activeElement).toBe(spin);
  });

  it("uses a modal settings dialog and restores focus when it closes", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Settings" })).toBeEnabled());
    const trigger = screen.getByRole("button", { name: "Settings" });
    trigger.focus();
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Speaking time/)).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Settings" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("renders at a 320px viewport without throwing", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      get: () => 320,
    });
    render(<App />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Spin for a topic" })).toBeInTheDocument());
  });

  it("honors prefers-reduced-motion (app still renders the setup surface)", async () => {
    setMatchMedia(true);
    render(<App />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Spin for a topic" })).toBeEnabled());
  });

  it("no-capability: reaches a topic with microphone/network/storage unavailable", async () => {
    // jsdom has no mediaDevices → microphone unavailable; the loop must still work.
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("offline"))));
    render(<App />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Spin for a topic" })).toBeEnabled());
    expect(screen.getByText(/Microphone: unavailable/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Spin for a topic" }));
    // A topic heading appears (TOPIC_READY) without any network or microphone use.
    await waitFor(() =>
      expect(screen.getAllByRole("heading", { level: 2 }).length).toBeGreaterThan(0),
    );
  });

  it("keeps the prompt visible and removes setup controls during focused speech", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Spin for a topic" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Spin for a topic" }));
    const promptText = screen.getByRole("article").querySelector("p:not(.expectation)")?.textContent;
    expect(promptText).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Start timer" }));
    expect(screen.queryByRole("group", { name: "Practice mode" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("capabilities")).not.toBeInTheDocument();
    expect(screen.getByText(promptText!)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveFocus();
  });

  it("renders pack wording containing HTML as inert text, not as elements", async () => {
    const htmlWording = "<img src=x onerror=alert(1)><script>alert(2)</script>";
    const adversarialPack = JSON.parse(JSON.stringify(demoPack)) as RuntimePack;
    for (const subject of adversarialPack.subjects) {
      for (const topic of subject.topics) {
        for (const variant of topic.variants) variant.wording = htmlWording;
      }
    }
    expect(() => validatePack(adversarialPack)).not.toThrow();
    mockFetch(adversarialPack);

    const u = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Spin for a topic" })).toBeEnabled());
    await u.click(screen.getByRole("button", { name: "Spin for a topic" }));
    // The only eligible variant is drawn, so the HTML wording is shown as text.
    await waitFor(() =>
      expect(screen.getByText(/<img src=x onerror=alert\(1\)>/)).toBeInTheDocument(),
    );
    // No <img> or <script> from the pack was injected into the DOM.
    expect(document.querySelector('img[src="x"]')).toBeNull();
    expect(document.querySelector("script")).toBeNull();
  });
});
