import type { AudioUiState } from "@/practice/usePracticeSession";
import type { DeliveryMetrics, TopicSnapshot } from "@/practice/types";
import { PlaybackBar } from "./PlaybackBar";

interface ProcessingViewProps {
  topic: TopicSnapshot;
  metrics: DeliveryMetrics | null;
  transcription: "IDLE" | "RUNNING";
  audio: AudioUiState;
  onTranscribe: () => void;
  /** "I'll review it myself" while transcription is idle (DECLINED outcome). */
  onDecline: () => void;
  /** Cancel while transcription runs (typed path, job cancelled). */
  onCancel: () => void;
}

/**
 * Post-attempt hub: listen to the recording, watch analysis land, and choose
 * whether to transcribe on-device. Every path here is optional; self-review is
 * always available.
 */
export function ProcessingView({
  topic,
  metrics,
  transcription,
  audio,
  onTranscribe,
  onDecline,
  onCancel,
}: ProcessingViewProps) {
  const running = transcription === "RUNNING";
  const progress = audio.transcriptionProgress;

  return (
    <section aria-labelledby="processing-heading">
      <h2 id="processing-heading" tabIndex={-1}>
        Your recording
      </h2>
      <p className="status">{topic.title}</p>

      {audio.playback ? (
        <PlaybackBar url={audio.playback.url} durationMs={audio.playback.durationMs} />
      ) : null}

      <p className="status" role="status">
        {metrics
          ? "Delivery analysis complete — full observations appear in your review."
          : "Analyzing delivery on this device…"}
      </p>

      <section className="topic-card" aria-labelledby="transcribe-heading">
        <h3 id="transcribe-heading">Transcribe on this device</h3>
        {running ? (
          <>
            <p className="status" role="status">
              {progress !== null
                ? `Downloading the speech model… ${Math.round(progress * 100)}% (one-time, then cached for offline use)`
                : "Transcribing on this device…"}
            </p>
            <progress
              value={progress !== null ? progress : undefined}
              max={1}
              aria-label="Transcription progress"
            />
            <div className="toolbar">
              <button type="button" onClick={onCancel}>
                Cancel — I&apos;ll review it myself
              </button>
            </div>
          </>
        ) : (
          <>
            <p>
              A quantized whisper-base.en model downloads on first use and is cached for
              later offline attempts. Progress appears before inference. Transcription
              stays on this device; your audio is never uploaded.
            </p>
            <div className="toolbar">
              <button type="button" className="primary" onClick={onTranscribe}>
                Transcribe my attempt
              </button>
              <button type="button" onClick={onDecline}>
                I&apos;ll review it myself
              </button>
            </div>
          </>
        )}
      </section>
    </section>
  );
}
