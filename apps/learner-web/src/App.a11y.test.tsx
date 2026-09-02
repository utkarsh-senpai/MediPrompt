import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import { validatePack } from "@/content/packValidator";
import type { RuntimePack } from "@/practice/types";
import medicalPracticeBetaJson from "@content/candidates/mpt-cardiorespiratory-review-candidate.json";

const medicalPracticeBeta = validatePack(medicalPracticeBetaJson) as RuntimePack;

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

function fakeStream(): unknown {
  return { getTracks: () => [{ stop: () => {} }] };
}

function stubSpeechCaps(getUserMedia: () => Promise<unknown>): void {
  vi.stubGlobal(
    "MediaRecorder",
    class {
      static isTypeSupported(): boolean {
        return true;
      }
    },
  );
  vi.stubGlobal("AudioContext", class {});
  vi.stubGlobal(
    "Worker",
    class {
      postMessage(): void {}
      terminate(): void {}
      addEventListener(): void {}
      removeEventListener(): void {}
    },
  );
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
}

describe("App accessibility + capability + security", () => {
  beforeEach(() => {
    localStorage.clear();
    setMatchMedia(false);
    mockFetch(medicalPracticeBeta);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    // defineProperty stubs are not restored by vi.unstubAllGlobals.
    delete (navigator as { mediaDevices?: unknown }).mediaDevices;
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
      "neuro-physiotherapy",
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
    expect(screen.getByLabelText(/Meaning-match evidence/)).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Settings" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("persists semantic opt-in when worker and WebAssembly capabilities exist", async () => {
    vi.stubGlobal(
      "Worker",
      class {
        postMessage(): void {}
        terminate(): void {}
      },
    );
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Settings" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Settings" }));
    const semantic = screen.getByLabelText(/Meaning-match evidence/);
    expect(semantic).toBeEnabled();
    await user.click(semantic);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByLabelText(/Meaning-match evidence/)).toBeChecked();
  });

  it("requires explicit opt-in before saving a private learning plan", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Settings" })).toBeEnabled());
    expect(screen.getByText(/Learning plan · paused/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Settings" }));
    const history = screen.getByLabelText(/Private learning plan/);
    expect(history).not.toBeChecked();
    await user.click(history);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByLabelText(/Private learning plan/)).toBeChecked();
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
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Spin for a topic" }));
    // The actionable topic state appears without any network or microphone use.
    await screen.findByRole("button", { name: "Start timer" });
    expect(screen.getByRole("button", { name: "Microphone unavailable" })).toBeDisabled();
  });

  it("keeps the prompt visible and removes setup controls during focused speech", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Spin for a topic" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Spin for a topic" }));
    await screen.findByRole("button", { name: "Start timer" });
    const promptText = screen.getByRole("article").querySelector("p:not(.expectation)")?.textContent;
    expect(promptText).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Start timer" }));
    expect(screen.queryByRole("group", { name: "Practice mode" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("capabilities")).not.toBeInTheDocument();
    expect(screen.getByText(promptText!)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveFocus();
  });

  it("offers mic opt-in after a spin; the primer is keyboard operable and dismissible", async () => {
    const getUserMedia = vi.fn(() => Promise.resolve(fakeStream()));
    stubSpeechCaps(getUserMedia);
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Spin for a topic" })).toBeEnabled());
    // No opt-in affordance before a topic exists.
    expect(screen.queryByRole("button", { name: /Enable microphone feedback/i })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Spin for a topic" }));
    const enable = await screen.findByRole("button", { name: /Enable microphone feedback/i });
    enable.focus();
    expect(enable).toHaveFocus();
    await user.keyboard("{Enter}");

    // The primer explains before the browser prompt; privacy guarantee is explicit.
    expect(screen.getByRole("heading", { name: "Enable microphone feedback?" })).toBeInTheDocument();
    expect(
      screen.getByText(/never leaves this device/i, { selector: "strong" }),
    ).toBeInTheDocument();

    // "Not now" returns to the pre-opt-in state with no permission request.
    await user.click(screen.getByRole("button", { name: "Not now" }));
    expect(screen.queryByRole("heading", { name: "Enable microphone feedback?" })).toBeNull();
    expect(screen.getByRole("button", { name: /Enable microphone feedback/i })).toBeInTheDocument();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("announces mic permission denial and keeps the timer path intact", async () => {
    const getUserMedia = vi.fn(() =>
      Promise.reject(new DOMException("denied", "NotAllowedError")),
    );
    stubSpeechCaps(getUserMedia);
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Spin for a topic" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Spin for a topic" }));
    await user.click(await screen.findByRole("button", { name: /Enable microphone feedback/i }));
    await user.click(screen.getByRole("button", { name: "Use mic with timer" }));
    expect(getUserMedia).not.toHaveBeenCalled();
    // Access is requested only on Start; denial still enters the timer-only path.
    await user.click(screen.getByRole("button", { name: "Start timer" }));
    await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(1));
    expect(screen.getByText(/Microphone access was denied/i)).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Practice mode" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveFocus();
  });

  it("renders pack wording containing HTML as inert text, not as elements", async () => {
    const htmlWording = "<img src=x onerror=alert(1)><script>alert(2)</script>";
    const adversarialPack = JSON.parse(JSON.stringify(medicalPracticeBeta)) as RuntimePack;
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

  it("v0.6 viva: defends a topic and reaches the viva overview from review", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Spin for a topic" })).toBeEnabled());
    await user.selectOptions(screen.getByLabelText("Subject"), "cardiovascular-and-respiratory-physiotherapy");
    const challenge = screen.getByRole("group", { name: "Challenge" });
    await user.click(within(challenge).getByRole("button", { name: "Defend" }));
    // The merged cardioresp subject has three viva topics, but only the
    // cardiac-rehabilitation ladder resolves to authored viva questions. Pin the
    // Fisher-Yates draw to that topic by forcing the crypto RNG to 1, which
    // selects the alphabetically-first eligible variant (cardiac-rehabilitation).
    const cryptoSpy = vi
      .spyOn(globalThis.crypto, "getRandomValues")
      .mockImplementation(<T extends ArrayBufferView>(array: T): T => {
        const view = array as unknown as Uint32Array;
        if (view.length > 0) view[0] = 1;
        return array;
      });
    await user.click(screen.getByRole("button", { name: "Spin for a topic" }));
    await screen.findByRole("button", { name: "Start timer" });
    cryptoSpy.mockRestore();
    await user.click(screen.getByRole("button", { name: "Start timer" }));
    await user.click(screen.getByRole("button", { name: "Finish now" }));
    await user.click(screen.getByRole("button", { name: "Review this attempt" }));
    await screen.findByLabelText(/Type what you said/i);
    await user.type(
      screen.getByLabelText(/Type what you said/i),
      "Safety assessment and secondary prevention.",
    );
    await user.click(screen.getByRole("button", { name: "Save review" }));
    // Review exposes the viva entry on this topic.
    const beginViva = await screen.findByRole("button", { name: "Begin viva" });
    await user.click(beginViva);
    expect(screen.getByRole("heading", { name: /Viva:/ })).toBeInTheDocument();
    // The ladder overview offers Begin and a return to attempt review.
    expect(screen.getByRole("button", { name: "Begin viva" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to attempt review" })).toBeInTheDocument();
  });
});
