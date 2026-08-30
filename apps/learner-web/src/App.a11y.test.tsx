import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import { validatePack } from "@/content/packValidator";
import type { RuntimePack } from "@/practice/types";
import demoPackJson from "@content/packs/demo-interaction-fixture.json";

const demoPack = validatePack(demoPackJson) as RuntimePack;

function mockFetch(pack: unknown): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => pack,
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

  it("renders pack wording containing HTML as inert text, not as elements", async () => {
    const htmlWording = "<img src=x onerror=alert(1)><script>alert(2)</script>";
    const singleVariantPack = {
      schemaVersion: "1.0",
      packId: "security-fixture",
      version: "1.0.0",
      title: "Security fixture",
      locale: "en-IN",
      licence: { id: "CC-BY-4.0", attribution: "Security fixture" },
      review: {
        status: "APPROVED",
        reviewers: [{ id: "tester", role: "CONTENT_EDITOR" }],
        reviewedAt: "2026-08-30",
      },
      sources: [
        {
          sourceId: "src-1",
          citation: "Fixture.",
          url: "https://example.org/x",
          accessedAt: "2026-08-30",
        },
      ],
      subjects: [
        {
          subjectId: "subj",
          title: "Subject",
          topics: [
            {
              topicId: "topic",
              title: "Topic",
              variants: [
                {
                  variantId: "topic-guided-rs-v1",
                  challengePreset: "GUIDED",
                  difficultyProfileVersion: "difficulty-profile/1.0",
                  blueprint: "explain-concept",
                  promptId: "prompt-topic-guided-rs",
                  mode: "RECALL_SPRINT",
                  supportLevel: "FULL",
                  wording: htmlWording,
                  answerArc: ["define", "explain"],
                  timePolicy: { speakingSeconds: 90 },
                  caseRef: null,
                  followUpRefs: [],
                  rubricId: "topic-guided-rs-rubric-v1",
                },
              ],
              rubrics: [
                {
                  rubricId: "topic-guided-rs-rubric-v1",
                  variantId: "topic-guided-rs-v1",
                  register: "EXAMINER",
                  concepts: [
                    {
                      conceptId: "c1",
                      label: "Core idea",
                      acceptedPhrases: ["core"],
                      weight: 2,
                      sourceRefs: ["src-1"],
                    },
                  ],
                },
              ],
              cases: [],
              followUps: [],
            },
          ],
        },
      ],
    };
    // The pack is structurally valid and production-gate clean (HTML is just text).
    expect(() => validatePack(singleVariantPack)).not.toThrow();
    mockFetch(singleVariantPack);

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
