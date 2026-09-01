import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MicPrimer } from "./MicPrimer";
import { MicControl } from "./MicControl";
import { AnswerCompass } from "./AnswerCompass";
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
import { MAX_TRANSCRIPT_CHARACTERS } from "@/practice/transcriptPolicy";
import type {
  ApprovedTranscript,
  AttemptHistoryEntry,
  AudioErrorCode,
  CoverageReport,
  DeliveryMetrics,
  RuntimePack,
  TextMetrics,
  TopicSnapshot,
  TranscriptionUnavailableReason,
  TranscriptDraft,
} from "@/practice/types";
import medicalPackJson from "@content/candidates/mpt-cardiorespiratory-review-candidate.json";

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

const COVERAGE_FULL: CoverageReport = {
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

const COVERAGE_PARTIAL: CoverageReport = {
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
    status: "READY",
    armed: false,
    issue: null,
    playback: { attemptId: "a1", url: "blob:fake-0", durationMs: 90_000 },
    transcriptionProgress: null,
    ...overrides,
  };
}

function historyEntry(coverage = COVERAGE_PARTIAL): AttemptHistoryEntry {
  const topic = topicSnapshot();
  return {
    attemptId: "a1",
    attemptIndex: 1,
    topicRef: topic.topicRef,
    mode: topic.mode,
    challenge: topic.challenge,
    supportLevel: topic.supportLevel,
    register: topic.register,
    timePolicy: topic.timePolicy,
    coverage,
    transcriptText: APPROVED.text,
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

    await user.click(screen.getByRole("button", { name: "Use mic with timer" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Not now" }));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });
});

describe("MicControl", () => {
  it("uses an accessible icon control and communicates when capture begins", async () => {
    const user = userEvent.setup();
    const onBegin = vi.fn();
    const { rerender } = render(
      <MicControl
        audio={audioUi({ status: "OFF", armed: false })}
        onBegin={onBegin}
        onConfirm={() => {}}
        onDecline={() => {}}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Enable microphone feedback" }));
    expect(onBegin).toHaveBeenCalledTimes(1);

    rerender(
      <MicControl
        audio={audioUi({ status: "READY", armed: false })}
        onBegin={() => {}}
        onConfirm={() => {}}
        onDecline={() => {}}
      />,
    );
    expect(screen.getByText("Mic starts with timer")).toBeInTheDocument();
  });
});

describe("AnswerCompass", () => {
  const steps = [
    { id: "define", label: "Define" },
    { id: "explain", label: "Explain" },
    { id: "apply", label: "Apply" },
  ];

  it("uses What, So what, and Now what and advances with elapsed time", () => {
    const { rerender } = render(
      <AnswerCompass steps={steps} remainingMs={90_000} totalMs={90_000} active />,
    );
    expect(screen.getByRole("list", { name: "Speaking path" })).toHaveTextContent(
      "What?So what?Now what?",
    );
    expect(screen.getByRole("listitem", { name: /What.*current phase/i })).toHaveAttribute(
      "aria-current",
      "step",
    );

    rerender(
      <AnswerCompass steps={steps} remainingMs={20_000} totalMs={90_000} active />,
    );
    expect(screen.getByRole("listitem", { name: /Now what.*current phase/i })).toHaveAttribute(
      "aria-current",
      "step",
    );
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
    expect(screen.getByText("Filler words in transcript")).toBeInTheDocument();
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
    const preview = screen.getByLabelText(
      "Machine transcript with uncertain passages marked",
    );
    expect(preview.querySelector("mark")).toHaveTextContent("um");

    const editor = screen.getByLabelText("Transcript (editable)");
    expect(editor).toHaveValue(DRAFT.text);
    expect(editor).toHaveAttribute("maxLength", String(MAX_TRANSCRIPT_CHARACTERS));
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

  it("rejects an oversized machine draft until the learner shortens it", () => {
    render(
      <TranscriptEditor
        draft={{ ...DRAFT, text: "x".repeat(MAX_TRANSCRIPT_CHARACTERS + 1) }}
        onApprove={() => {}}
        onTypeInstead={() => {}}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/Shorten the transcript/);
    expect(screen.getByRole("button", { name: "Approve transcript" })).toBeDisabled();
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
    expect(screen.getByLabelText(/Type what you said/i)).toHaveAttribute(
      "maxLength",
      String(MAX_TRANSCRIPT_CHARACTERS),
    );
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
        coverage={COVERAGE_PARTIAL}
        history={[]}
        refinementDelta={null}
        attemptIndex={1}
        audio={audioUi()}
        onSpinAgain={onSpinAgain}
        onTryAgain={() => {}}
        onBeginViva={() => {}}
      />,
    );
    expect(screen.getByText("Zippers interlock teeth.")).toBeInTheDocument();
    // The raw machine draft stays behind an explicit disclosure.
    const disclosure = screen.getByText("Original machine transcript (before your edits)");
    expect(disclosure.closest("details")).not.toBeNull();
    expect(screen.getByText("58.5 words per minute")).toBeInTheDocument();
    // Content coverage is shown and names the missed concept as the next action.
    expect(screen.getByText(/Concepts not yet touched/)).toBeInTheDocument();
    expect(screen.getByText("Explains interlocking teeth")).toBeInTheDocument();

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
        coverage={COVERAGE_FULL}
        history={[]}
        refinementDelta={null}
        attemptIndex={1}
        audio={audioUi({ playback: null })}
        onSpinAgain={() => {}}
        onTryAgain={() => {}}
        onBeginViva={() => {}}
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
        coverage={COVERAGE_FULL}
        history={[]}
        refinementDelta={null}
        attemptIndex={1}
        audio={audioUi({ playback: null })}
        onSpinAgain={() => {}}
        onTryAgain={() => {}}
        onBeginViva={() => {}}
      />,
    );
    expect(
      screen.queryByText("Original machine transcript (before your edits)"),
    ).toBeNull();
  });

  it("shows Refinement Delta, changed concepts, history, and the retry action", () => {
    const onTryAgain = vi.fn();
    render(
      <AttemptReview
        topic={topicSnapshot()}
        metrics={null}
        textMetrics={null}
        transcript={APPROVED}
        coverage={COVERAGE_PARTIAL}
        history={[historyEntry()]}
        refinementDelta={{
          available: true,
          score: 0.3,
          direction: "IMPROVED",
          newlyCoveredConceptIds: ["c1"],
          lostConceptIds: [],
        }}
        attemptIndex={2}
        audio={audioUi({ playback: null })}
        onSpinAgain={() => {}}
        onTryAgain={onTryAgain}
        onBeginViva={() => {}}
      />,
    );
    expect(screen.getByRole("heading", { name: "Refinement Delta" })).toBeInTheDocument();
    expect(screen.getByText("+30%")).toBeInTheDocument();
    expect(screen.getByText(/coverage improved on this attempt/i)).toBeInTheDocument();
    expect(screen.getByText(/Newly covered: Names the slider role/)).toBeInTheDocument();
    expect(screen.getByText("Attempts (2)")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Attempt review \(attempt 2\)/i })).toBeInTheDocument();
    const tryAgain = screen.getByRole("button", { name: "Try again on this topic" });
    expect(tryAgain).toBeInTheDocument();
    fireEvent.click(tryAgain);
    expect(onTryAgain).toHaveBeenCalledTimes(1);
  });

  it("hides Refinement Delta on the first attempt but offers the retry entry", () => {
    render(
      <AttemptReview
        topic={topicSnapshot()}
        metrics={null}
        textMetrics={null}
        transcript={APPROVED}
        coverage={COVERAGE_PARTIAL}
        history={[]}
        refinementDelta={null}
        attemptIndex={1}
        audio={audioUi({ playback: null })}
        onSpinAgain={() => {}}
        onTryAgain={() => {}}
        onBeginViva={() => {}}
      />,
    );
    expect(screen.queryByRole("heading", { name: "Refinement Delta" })).toBeNull();
    // The try-again action is the loop entry and is always available from review.
    expect(screen.getByRole("button", { name: "Try again on this topic" })).toBeInTheDocument();
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
