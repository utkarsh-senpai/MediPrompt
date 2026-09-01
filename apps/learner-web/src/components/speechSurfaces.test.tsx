import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MicPrimer } from "./MicPrimer";
import { RecordingIndicator } from "./RecordingIndicator";
import { PlaybackBar } from "./PlaybackBar";
import { DeliveryPanel } from "./DeliveryPanel";
import { ProcessingView } from "./ProcessingView";
import { TranscriptEditor } from "./TranscriptEditor";
import { SelfReview } from "./SelfReview";
import { AttemptReview } from "./AttemptReview";
import { audioIssueCopy, transcriptionIssueCopy } from "@/app/audioCopy";
import { findVariant, toTopicSnapshot } from "@/content/packQuery";
import { validatePack } from "@/content/packValidator";
import type { AudioUiState } from "@/practice/usePracticeSession";
import type {
  ApprovedTranscript,
  AudioErrorCode,
  DeliveryMetrics,
  RuntimePack,
  TextMetrics,
  TopicSnapshot,
  TranscriptionUnavailableReason,
  TranscriptDraft,
} from "@/practice/types";
import medicalPackJson from "@content/packs/mpt-cardiorespiratory-v1.json";

const pack = validatePack(medicalPackJson) as RuntimePack;

function topicSnapshot(): TopicSnapshot {
  const found = findVariant(pack, "respiratory-assessment-guided-recall-v1");
  if (!found) throw new Error("fixture variant not found");
  return toTopicSnapshot(pack, found.variant, found.topic, found.subject, {
    speakingSeconds: 90,
    researchSeconds: 120,
  });
}

const METRICS: DeliveryMetrics = {
  durationMs: 90_000,
  spokenMs: 61_500,
  pauses: [{ startMs: 12_000, durationMs: 450, kind: "UNKNOWN" }],
  clippingRatio: 0,
  loudnessVariationDb: 9.4,
  limitations: ["Loudness is relative to this recording only."],
};

const TEXT_METRICS: TextMetrics = {
  wordsPerMinute: 58.5,
  fillerCount: 1,
  repeatedPhraseCount: 0,
};

const DRAFT: TranscriptDraft = {
  text: "um inspection then palpation",
  source: "LOCAL_WHISPER",
  model: {
    id: "onnx-community/whisper-base.en",
    version: "51eefc0af78b103839eda9e7e4f4186acc6517fe",
    quantization: "q4",
  },
  uncertainRanges: [{ start: 0, end: 2 }],
};

const APPROVED: ApprovedTranscript = {
  rawText: DRAFT.text,
  text: "Zippers interlock teeth.",
  approvedAt: "2026-08-31T00:00:00.000Z",
  wasEdited: true,
};

function audioUi(overrides: Partial<AudioUiState> = {}): AudioUiState {
  return {
    available: true,
    status: "ARMED",
    armed: true,
    issue: null,
    playback: { attemptId: "a1", url: "blob:fake-0", durationMs: 90_000 },
    transcriptionProgress: null,
    ...overrides,
  };
}

describe("MicPrimer", () => {
  it("states the privacy guarantee and wires both choices", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onDecline = vi.fn();
    render(<MicPrimer onConfirm={onConfirm} onDecline={onDecline} />);

    expect(
      screen.getByRole("heading", { name: "Enable microphone feedback?" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/never leaves this device/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Allow microphone" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Not now" }));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });
});

describe("RecordingIndicator", () => {
  it("announces recording via text, not color alone", () => {
    render(<RecordingIndicator />);
    // role=status takes its name from the author, so assert the text content.
    expect(screen.getByRole("status")).toHaveTextContent(
      /recording · on this device only/i,
    );
    const dot = document.querySelector(".recording-dot");
    expect(dot).not.toBeNull();
    expect(dot!.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("PlaybackBar", () => {
  it("renders a labelled player with the formatted duration and privacy note", () => {
    render(<PlaybackBar url="blob:fake-0" durationMs={90_000} />);
    const region = screen.getByRole("region", { name: "Listen to your attempt" });
    expect(region).toBeInTheDocument();
    const audio = region.querySelector("audio");
    expect(audio).not.toBeNull();
    expect(audio!.getAttribute("src")).toBe("blob:fake-0");
    expect(screen.getByText(/1:30/)).toBeInTheDocument();
    expect(screen.getByText(/never leaves your device/i)).toBeInTheDocument();
  });
});

describe("DeliveryPanel", () => {
  it("renders the metric list and the what-it-measures disclaimer", () => {
    render(<DeliveryPanel metrics={METRICS} />);
    expect(
      screen.getByRole("heading", { name: "Delivery observations" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/What this measures/i)).toBeInTheDocument();
    expect(screen.getByText("Recording length")).toBeInTheDocument();
    expect(screen.getByText("1m 30s")).toBeInTheDocument();
    expect(screen.getByText("Time speaking")).toBeInTheDocument();
    expect(screen.getByText("1m 2s")).toBeInTheDocument();
    expect(screen.getByText(/1 \(about 0s total\)/)).toBeInTheDocument();
    expect(screen.getByText("None detected")).toBeInTheDocument();
    expect(screen.getByText(/9\.4 dB/)).toBeInTheDocument();
    expect(
      screen.getByText("Loudness is relative to this recording only."),
    ).toBeInTheDocument();
  });

  it("says not measurable instead of zero when a field is absent", () => {
    render(<DeliveryPanel metrics={{ durationMs: 5000, pauses: [], limitations: [] }} />);
    expect(screen.getByText("Not measurable on this recording")).toBeInTheDocument();
    expect(screen.queryByText("Mic clipping")).not.toBeInTheDocument();
    expect(screen.queryByText("Loudness variation")).not.toBeInTheDocument();
  });

  it("adds transcript-derived rows only when text metrics exist", () => {
    const { rerender } = render(<DeliveryPanel metrics={METRICS} />);
    expect(screen.queryByText("Speaking pace")).not.toBeInTheDocument();
    rerender(<DeliveryPanel metrics={METRICS} textMetrics={TEXT_METRICS} />);
    expect(screen.getByText("58.5 words per minute")).toBeInTheDocument();
    expect(screen.getByText("Filler words heard")).toBeInTheDocument();
    expect(screen.getByText("Repeated phrases")).toBeInTheDocument();
  });
});

describe("ProcessingView", () => {
  it("offers transcribe and self-review choices while idle", async () => {
    const user = userEvent.setup();
    const onTranscribe = vi.fn();
    const onDecline = vi.fn();
    render(
      <ProcessingView
        topic={topicSnapshot()}
        metrics={null}
        transcription="IDLE"
        audio={audioUi()}
        onTranscribe={onTranscribe}
        onDecline={onDecline}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText(/Analyzing delivery on this device/i)).toBeInTheDocument();
    expect(screen.getByText(/never uploaded/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Transcribe my attempt" }));
    expect(onTranscribe).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: /review it myself/i }));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it("shows download progress and a cancel path while running", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <ProcessingView
        topic={topicSnapshot()}
        metrics={METRICS}
        transcription="RUNNING"
        audio={audioUi({ transcriptionProgress: 0.4 })}
        onTranscribe={() => {}}
        onDecline={() => {}}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByText(/Delivery analysis complete/i)).toBeInTheDocument();
    expect(screen.getByText(/Downloading the speech model… 40%/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Transcription progress" })).toHaveAttribute(
      "value",
      "0.4",
    );
    expect(
      screen.queryByRole("button", { name: "Transcribe my attempt" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel — i'll review it myself/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("describes inference (not download) when progress is null", () => {
    render(
      <ProcessingView
        topic={topicSnapshot()}
        metrics={null}
        transcription="RUNNING"
        audio={audioUi()}
        onTranscribe={() => {}}
        onDecline={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText(/Transcribing on this device…/i)).toBeInTheDocument();
  });
});

describe("TranscriptEditor", () => {
  it("prefills the draft, reports provenance and uncertainty, and approves edits", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    render(
      <TranscriptEditor draft={DRAFT} onApprove={onApprove} onTypeInstead={() => {}} />,
    );
    expect(screen.getByText(/onnx-community\/whisper-base\.en/)).toBeInTheDocument();
    expect(screen.getByText(/q4, pinned build/)).toBeInTheDocument();
    expect(screen.getByText(/One part was uncertain/)).toBeInTheDocument();

    const editor = screen.getByLabelText("Transcript (editable)");
    expect(editor).toHaveValue(DRAFT.text);
    await user.clear(editor);
    await user.type(editor, "Zippers interlock teeth.");
    await user.click(screen.getByRole("button", { name: "Approve transcript" }));
    expect(onApprove).toHaveBeenCalledWith("Zippers interlock teeth.");
  });

  it("disables approve for an empty transcript and offers the typed path", async () => {
    const user = userEvent.setup();
    const onTypeInstead = vi.fn();
    render(
      <TranscriptEditor draft={DRAFT} onApprove={() => {}} onTypeInstead={onTypeInstead} />,
    );
    const editor = screen.getByLabelText("Transcript (editable)");
    await user.clear(editor);
    expect(screen.getByRole("button", { name: "Approve transcript" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Type from scratch instead" }));
    expect(onTypeInstead).toHaveBeenCalledTimes(1);
  });
});

describe("SelfReview", () => {
  it("shows the issue copy and a retry path when transcription failed and a clip exists", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <SelfReview
        metrics={METRICS}
        transcriptionIssue="LOAD_FAILED"
        audio={audioUi()}
        onSubmit={() => {}}
        onRetryTranscription={onRetry}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/could not be loaded/i);
    expect(screen.getByRole("heading", { name: "Delivery observations" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try transcription again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("announces an audio failure (e.g. undecodable recording) on the typed fallback", () => {
    render(
      <SelfReview
        metrics={null}
        transcriptionIssue={null}
        audio={audioUi({ issue: "AUDIO_DECODE_FAILED" })}
        onSubmit={() => {}}
        onRetryTranscription={() => {}}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/could not be read for analysis/i);
  });

  it("hides retry when the learner declined or no clip exists", () => {
    const { rerender } = render(
      <SelfReview
        metrics={null}
        transcriptionIssue="DECLINED"
        audio={audioUi()}
        onSubmit={() => {}}
        onRetryTranscription={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: "Try transcription again" })).toBeNull();

    rerender(
      <SelfReview
        metrics={null}
        transcriptionIssue="ERROR"
        audio={audioUi({ playback: null })}
        onSubmit={() => {}}
        onRetryTranscription={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: "Try transcription again" })).toBeNull();
  });

  it("submits the typed recap", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <SelfReview
        metrics={null}
        transcriptionIssue={null}
        audio={audioUi({ playback: null })}
        onSubmit={onSubmit}
        onRetryTranscription={() => {}}
      />,
    );
    expect(screen.queryByRole("status")).toBeNull();
    await user.type(
      screen.getByLabelText(/Type what you said/i),
      "Zippers interlock rows of teeth.",
    );
    await user.click(screen.getByRole("button", { name: "Save review" }));
    expect(onSubmit).toHaveBeenCalledWith("Zippers interlock rows of teeth.");
  });
});

describe("AttemptReview", () => {
  it("shows the approved transcript, original draft disclosure, and text metrics", async () => {
    const user = userEvent.setup();
    const onSpinAgain = vi.fn();
    render(
      <AttemptReview
        topic={topicSnapshot()}
        metrics={METRICS}
        textMetrics={TEXT_METRICS}
        transcript={APPROVED}
        audio={audioUi()}
        onSpinAgain={onSpinAgain}
      />,
    );
    expect(screen.getByText("Zippers interlock teeth.")).toBeInTheDocument();
    // The raw machine draft stays behind an explicit disclosure.
    const disclosure = screen.getByText("Original machine transcript (before your edits)");
    expect(disclosure.closest("details")).not.toBeNull();
    expect(screen.getByText("58.5 words per minute")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Spin again" }));
    expect(onSpinAgain).toHaveBeenCalledTimes(1);
  });

  it("renders transcript text as inert text even when it looks like HTML", () => {
    const adversarial: ApprovedTranscript = {
      text: "<img src=x onerror=alert(1)>",
      approvedAt: "2026-08-31T00:00:00.000Z",
      wasEdited: false,
    };
    render(
      <AttemptReview
        topic={topicSnapshot()}
        metrics={null}
        textMetrics={null}
        transcript={adversarial}
        audio={audioUi({ playback: null })}
        onSpinAgain={() => {}}
      />,
    );
    expect(screen.getByText(/<img src=x onerror=alert\(1\)>/)).toBeInTheDocument();
    expect(document.querySelector('img[src="x"]')).toBeNull();
  });

  it("omits the original-draft disclosure when the transcript was not edited", () => {
    render(
      <AttemptReview
        topic={topicSnapshot()}
        metrics={null}
        textMetrics={null}
        transcript={{ ...APPROVED, wasEdited: false, rawText: undefined }}
        audio={audioUi({ playback: null })}
        onSpinAgain={() => {}}
      />,
    );
    expect(
      screen.queryByText("Original machine transcript (before your edits)"),
    ).toBeNull();
  });
});

describe("audioCopy", () => {
  it("covers every audio error code with copy that names a working fallback", () => {
    const codes: AudioErrorCode[] = [
      "AUDIO_MIC_PERMISSION_DENIED",
      "AUDIO_MIC_UNAVAILABLE",
      "AUDIO_RECORD_FAILED",
      "AUDIO_DECODE_FAILED",
      "AUDIO_ANALYSIS_FAILED",
    ];
    const seen = new Set(codes.map((code) => audioIssueCopy(code)));
    expect(seen.size).toBe(codes.length);
    for (const copy of seen) {
      expect(copy.length).toBeGreaterThan(0);
      expect(copy).toMatch(/timer|self-review|typing|playback|review/i);
    }
  });

  it("covers every transcription-unavailable reason", () => {
    const reasons: TranscriptionUnavailableReason[] = [
      "DECLINED",
      "LOAD_FAILED",
      "OFFLINE",
      "TIMEOUT",
      "LOW_MEMORY",
      "CANCELLED",
      "ERROR",
    ];
    const seen = new Set(reasons.map((reason) => transcriptionIssueCopy(reason)));
    expect(seen.size).toBe(reasons.length);
    for (const copy of seen) {
      expect(copy.length).toBeGreaterThan(0);
    }
  });
});
