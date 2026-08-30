// MediaRecorder wrapper. All platform touchpoints are injected so the module
// is fully testable in jsdom; the recorder owns the playback URL lifetime.
// See docs/V0.3_DEVELOPMENT_CONTEXT.md §6/§7.

import { AudioError, micErrorFromException } from "./audioErrors";

/** Codec preference order; first supported wins. None supported => no recording at all. */
export const PREFERRED_MIME_TYPES: readonly string[] = Object.freeze([
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
]);

export interface RecordedClip {
  attemptId: string;
  blob: Blob;
  mimeType: string;
  durationMs: number;
  /** Object URL for in-app playback; revoked by revoke()/release(). */
  url: string;
}

export interface RecorderDeps {
  getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  createMediaRecorder: (stream: MediaStream, mimeType: string) => MediaRecorder;
  isTypeSupported: (mimeType: string) => boolean;
  createObjectUrl: (blob: Blob) => string;
  revokeObjectUrl: (url: string) => void;
  /** Monotonic ms, for clip duration. */
  now: () => number;
}

export type RecorderState = "IDLE" | "ARMED" | "RECORDING" | "FAILED";

export class AttemptRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private mimeType: string | null = null;
  private startedAt = 0;
  private clip: RecordedClip | null = null;
  private state: RecorderState = "IDLE";

  constructor(private readonly deps: RecorderDeps) {}

  getState(): RecorderState {
    return this.state;
  }

  /**
   * Acquire the microphone. Called only after the learner accepts the primer;
   * the stream stays open for the session so the speaking window starts
   * without a permission prompt mid-attempt.
   */
  async arm(): Promise<void> {
    if (this.state === "ARMED" || this.state === "RECORDING") return;
    try {
      this.stream = await this.deps.getUserMedia({ audio: true });
    } catch (err) {
      this.state = "FAILED";
      throw micErrorFromException(err);
    }
    this.mimeType =
      PREFERRED_MIME_TYPES.find((t) => this.deps.isTypeSupported(t)) ?? null;
    if (this.mimeType === null) {
      this.releaseStream();
      this.state = "FAILED";
      throw new AudioError(
        "AUDIO_MIC_UNAVAILABLE",
        "This browser cannot record audio in a supported format.",
      );
    }
    this.state = "ARMED";
  }

  start(): void {
    if (this.state !== "ARMED" || !this.stream || !this.mimeType) {
      throw new AudioError(
        "AUDIO_RECORD_FAILED",
        "Recorder is not armed.",
      );
    }
    this.discardClip();
    this.chunks = [];
    try {
      this.recorder = this.deps.createMediaRecorder(this.stream, this.mimeType);
      this.recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) this.chunks.push(event.data);
      };
      this.recorder.start();
    } catch {
      this.recorder = null;
      throw new AudioError(
        "AUDIO_RECORD_FAILED",
        "Recording could not be started.",
      );
    }
    this.startedAt = this.deps.now();
    this.state = "RECORDING";
  }

  /**
   * Finalize the clip. On any failure the chunks are discarded: no partial
   * blob is kept, per the error matrix.
   */
  async stop(attemptId: string): Promise<RecordedClip | null> {
    if (this.state !== "RECORDING" || !this.recorder) return null;
    const recorder = this.recorder;
    this.recorder = null;
    this.state = "ARMED";

    const blob = await new Promise<Blob | null>((resolve) => {
      recorder.onstop = () => {
        if (this.chunks.length === 0) {
          resolve(null);
          return;
        }
        resolve(new Blob(this.chunks, { type: this.mimeType! }));
      };
      recorder.onerror = () => resolve(null);
      try {
        recorder.stop();
      } catch {
        resolve(null);
      }
    });
    this.chunks = [];
    if (!blob || blob.size === 0) return null;
    // Measured at finalization, not at stop() call time: MediaRecorder flushes
    // asynchronously and the last chunk lands between the two.
    const durationMs = Math.max(0, Math.round(this.deps.now() - this.startedAt));

    this.discardClip();
    this.clip = {
      attemptId,
      blob,
      mimeType: this.mimeType!,
      durationMs,
      url: this.deps.createObjectUrl(blob),
    };
    return this.clip;
  }

  getClip(attemptId: string): RecordedClip | null {
    return this.clip?.attemptId === attemptId ? this.clip : null;
  }

  /** Revoke the playback URL and drop the clip. Idempotent. */
  revoke(attemptId: string): void {
    if (this.clip && this.clip.attemptId === attemptId) this.discardClip();
  }

  /** Stop the microphone and release everything (session teardown). */
  release(): void {
    this.discardClip();
    try {
      this.recorder?.stop();
    } catch {
      /* already stopped */
    }
    this.recorder = null;
    this.releaseStream();
    this.state = "IDLE";
  }

  private discardClip(): void {
    if (this.clip) {
      this.deps.revokeObjectUrl(this.clip.url);
      this.clip = null;
    }
  }

  private releaseStream(): void {
    if (this.stream) {
      for (const track of this.stream.getTracks()) track.stop();
      this.stream = null;
    }
  }
}
