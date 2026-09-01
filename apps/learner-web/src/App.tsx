import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  type RuntimePack,
  type SettingsStore,
  type TopicSnapshot,
  type UserSettings,
  type V02PracticeMode,
  DEFAULT_SETTINGS,
} from "@/practice/types";
import { remainingMs } from "@/practice/deadlineTimer";
import {
  usePracticeSession,
  type AudioDeps,
} from "@/practice/usePracticeSession";
import { loadBundledPack } from "@/content/packLoader";
import {
  detectCapabilities,
  semanticCoverageAvailable,
  speechFeedbackAvailable,
  type Capabilities,
} from "@/app/capabilities";
import { audioIssueCopy } from "@/app/audioCopy";
import { playSpinTick, playTimerEnd, playTimerStart } from "@/app/sounds";
import { subjectEmoji } from "@/app/subjectEmoji";
import { AttemptRecorder } from "@/audio/recorder";
import { createWebAudioDecoder } from "@/audio/pcmDecode";
import { createDefaultTranscriptionClient } from "@/speech/transcriptionClient";
import { createDefaultEmbeddingClient } from "@/scoring/embeddingClient";
import { systemMonotonicClock, systemWallClock } from "@/platform/clock";
import { CryptoRandom } from "@/platform/random";
import { InMemoryBagStore } from "@/platform/bagStore";
import { LocalStorageSettingsStore } from "@/platform/settingsStore";
import { PracticeSurface } from "@/components/PracticeSurface";
import { CountdownRing } from "@/components/CountdownRing";
import { SettingsDialog } from "@/components/SettingsDialog";
import { MicControl } from "@/components/MicControl";
import { RecordingIndicator } from "@/components/RecordingIndicator";
import { AnswerCompass } from "@/components/AnswerCompass";
import { InfoTip } from "@/components/InfoTip";
import { ProcessingView } from "@/components/ProcessingView";
import { TranscriptEditor } from "@/components/TranscriptEditor";
import { SelfReview } from "@/components/SelfReview";
import { AttemptReview } from "@/components/AttemptReview";

interface PracticeAppProps {
  pack: RuntimePack;
  settings: UserSettings;
  settingsStore: SettingsStore;
  caps: Capabilities;
  onSettingsChange: (next: UserSettings) => void;
  onFocusModeChange: (active: boolean) => void;
}

function useMilestones(remainingMsValue: number | null): string {
  const [msg, setMsg] = useState("");
  const last = useRef<number | null>(null);
  useEffect(() => {
    if (remainingMsValue == null) {
      if (last.current !== null) {
        last.current = null;
        setMsg("");
      }
      return;
    }
    const sec = Math.ceil(remainingMsValue / 1000);
    let milestone: number | null = null;
    if (sec <= 0) milestone = 0;
    else if (sec <= 10) milestone = 10;
    else if (sec <= 30) milestone = 30;
    if (milestone !== null && last.current !== milestone) {
      last.current = milestone;
      setMsg(milestone === 0 ? "Time's up." : `${milestone} seconds remaining.`);
    }
  }, [remainingMsValue]);
  return msg;
}

function PromptDetails({ topic }: { topic: TopicSnapshot }) {
  return (
    <p className="prompt-copy">{topic.wording}</p>
  );
}

function TopicInfo({ topic }: { topic: TopicSnapshot }) {
  return (
    <InfoTip label="More about this topic">
      <span className="topic-info-copy">{topic.expectation}</span>
      {topic.caseText ? (
        <span className="topic-info-copy">
          <strong>Fictional scenario:</strong> {topic.caseText}
        </span>
      ) : null}
    </InfoTip>
  );
}

function TopicCard({
  topic,
  headingId,
  eyebrow,
  children,
}: {
  topic: TopicSnapshot;
  headingId: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <article className="topic-card">
      {eyebrow ? (
        <span className="eyebrow" aria-hidden="true">
          {eyebrow}
        </span>
      ) : null}
      <div className="topic-title-row">
        <h2 id={headingId} tabIndex={-1}>
          {topic.title}
        </h2>
        <TopicInfo topic={topic} />
      </div>
      <PromptDetails topic={topic} />
      <AnswerCompass steps={topic.answerArc} />
      <div className="toolbar">{children}</div>
    </article>
  );
}

function PracticeApp({
  pack,
  settings,
  settingsStore,
  caps,
  onSettingsChange,
  onFocusModeChange,
}: PracticeAppProps) {
  const monotonic = useMemo(() => systemMonotonicClock(), []);
  const wall = useMemo(() => systemWallClock(), []);
  const random = useMemo(() => new CryptoRandom(), []);
  const bagStore = useMemo(() => new InMemoryBagStore(), []);

  // v0.3 speech feedback: constructed once, only where every required platform
  // piece exists. The worker spawns lazily on explicit learner activation.
  const audioDeps = useMemo<AudioDeps | undefined>(() => {
    if (!speechFeedbackAvailable(caps)) return undefined;
    return {
      recorder: new AttemptRecorder({
        getUserMedia: (constraints) => navigator.mediaDevices.getUserMedia(constraints),
        createMediaRecorder: (stream, mimeType) =>
          new MediaRecorder(stream, { mimeType }),
        isTypeSupported: (mimeType) => MediaRecorder.isTypeSupported(mimeType),
        createObjectUrl: (blob) => URL.createObjectURL(blob),
        revokeObjectUrl: (url) => URL.revokeObjectURL(url),
        now: () => monotonic.now(),
      }),
      decoder: createWebAudioDecoder(() => new AudioContext()),
      transcription: createDefaultTranscriptionClient(),
    };
  }, [caps, monotonic]);

  // v0.5: semantic embedding client, constructed only where workers + wasm exist.
  // Used only when the learner enables semantic coverage in settings.
  const embeddingClient = useMemo(
    () => (semanticCoverageAvailable(caps) ? createDefaultEmbeddingClient() : undefined),
    [caps],
  );

  const session = usePracticeSession({
    pack,
    settings,
    monotonic,
    wall,
    random,
    bagStore,
    audio: audioDeps,
    embedding: embeddingClient,
  });

  const { state, now, subjects, presets, challengeVisible, eligibleCount, actions } =
    session;

  const [showSettings, setShowSettings] = useState(false);

  const s = state;
  let remaining: number | null = null;
  let totalMs = 0;
  if (s.name === "SPEAKING") {
    remaining = remainingMs(s.deadlineAt, now);
    totalMs = s.topic.timePolicy.speakingSeconds * 1000;
  } else if (s.name === "RESEARCHING") {
    remaining = remainingMs(s.deadlineAt, now);
    totalMs = (s.topic.timePolicy.researchSeconds ?? settings.researchSeconds) * 1000;
  }
  const milestone = useMilestones(remaining);

  const muted = settings.soundMuted ?? false;
  useEffect(() => {
    if (milestone === "Time's up.") playTimerEnd(muted);
  }, [milestone, muted]);

  const spin = useCallback(() => {
    playSpinTick(muted);
    actions.spin();
  }, [actions, muted]);
  const spinAgain = useCallback(() => {
    playSpinTick(muted);
    actions.spinAgain();
  }, [actions, muted]);
  const startTimer = useCallback(() => {
    void actions.startTimer().then((started) => {
      if (started) playTimerStart(muted);
    });
  }, [actions, muted]);
  const startResearch = useCallback(() => {
    playTimerStart(muted);
    actions.startResearch();
  }, [actions, muted]);
  const confirmReady = useCallback(() => {
    void actions.confirmReady().then((started) => {
      if (started) playTimerStart(muted);
    });
  }, [actions, muted]);

  const topicEyebrow =
    s.name !== "IDLE" && s.name !== "DRAWING" && "topic" in s
      ? (() => {
          const subjectTitle =
            subjects.find((opt) => opt.subjectId === s.topic.topicRef.subjectId)?.title ??
            "";
          const modeLabel =
            s.topic.mode === "RECALL_SPRINT" ? "Recall Sprint" : "Deep Research";
          return subjectTitle
            ? `${subjectEmoji(subjectTitle)} ${subjectTitle} · ${modeLabel}`
            : modeLabel;
        })()
      : undefined;

  const showSurface = s.name !== "SPEAKING" && s.name !== "RESEARCHING";
  useEffect(() => {
    onFocusModeChange(!showSurface);
    return () => onFocusModeChange(false);
  }, [onFocusModeChange, showSurface]);

  return (
    <>
      {pack.review.status === "DRAFT" ? (
        <aside className="draft-notice" role="note">
          <strong>Curriculum beta · unreviewed draft</strong>
          <span>Practice only — not for diagnosis, treatment, or clinical decisions.</span>
        </aside>
      ) : null}

      {showSurface ? (
        <PracticeSurface
          subjects={subjects}
          selection={s.selection}
          presets={presets}
          challengeVisible={challengeVisible}
          eligibleCount={eligibleCount}
          drawing={s.name === "DRAWING"}
          onChange={actions.setSelection}
          onSpin={s.name === "IDLE" ? spin : spinAgain}
        />
      ) : null}

      {s.name === "TOPIC_READY" ? (
        <>
          <TopicCard topic={s.topic} headingId="topic-heading" eyebrow={topicEyebrow}>
            {s.selection.mode === "DEEP_RESEARCH" ? (
              <button type="button" className="primary" onClick={startResearch}>
                Begin research
              </button>
            ) : (
              <button
                type="button"
                className="primary"
                onClick={startTimer}
                disabled={session.audio.status === "STARTING"}
              >
                {session.audio.status === "STARTING" ? "Starting mic…" : "Start timer"}
              </button>
            )}
            <button type="button" onClick={spinAgain}>
              Spin again
            </button>
          </TopicCard>
          <MicControl
            audio={session.audio}
            onBegin={actions.beginAudioOptIn}
            onConfirm={actions.confirmAudioOptIn}
            onDecline={actions.cancelAudioOptIn}
          />
        </>
      ) : null}

      {s.name === "READY_TO_SPEAK" ? (
        <>
          <TopicCard topic={s.topic} headingId="topic-heading" eyebrow={topicEyebrow}>
            <button
              type="button"
              className="primary"
              onClick={confirmReady}
              disabled={session.audio.status === "STARTING"}
            >
              {session.audio.status === "STARTING" ? "Starting mic…" : "Start speaking"}
            </button>
            <button type="button" onClick={spinAgain}>
              Spin again
            </button>
          </TopicCard>
          <MicControl
            audio={session.audio}
            onBegin={actions.beginAudioOptIn}
            onConfirm={actions.confirmAudioOptIn}
            onDecline={actions.cancelAudioOptIn}
          />
        </>
      ) : null}

      {s.name === "RESEARCHING" ? (
        <section className="focus-view" aria-labelledby="speaking-heading">
          <div className="focus-title-row">
            <h2 id="speaking-heading" tabIndex={-1}>
              {s.topic.title}
            </h2>
            <TopicInfo topic={s.topic} />
          </div>
          <PromptDetails topic={s.topic} />
          <CountdownRing
            remainingMs={remaining ?? 0}
            totalMs={totalMs}
            caption="Research time left"
            variant="research"
          />
          <div className="toolbar">
            <button type="button" onClick={actions.doneResearching}>
              Done researching
            </button>
            <button type="button" onClick={actions.closeTimer}>
              End
            </button>
          </div>
        </section>
      ) : null}

      {s.name === "SPEAKING" ? (
        <section className="focus-view" aria-labelledby="speaking-heading">
          <div className="focus-title-row">
            <h2 id="speaking-heading" tabIndex={-1}>
              {s.topic.title}
            </h2>
            <TopicInfo topic={s.topic} />
          </div>
          <PromptDetails topic={s.topic} />
          <CountdownRing
            remainingMs={remaining ?? 0}
            totalMs={totalMs}
            caption="Speaking time left"
          />
          {session.audio.status === "ACTIVE" ? <RecordingIndicator /> : null}
          {session.audio.issue ? (
            <p className="status" role="status">
              {audioIssueCopy(session.audio.issue)}
            </p>
          ) : null}
          <AnswerCompass
            steps={s.topic.answerArc}
            remainingMs={remaining}
            totalMs={totalMs}
            active
          />
          <div className="toolbar">
            <button type="button" onClick={actions.closeTimer}>
              Finish now
            </button>
          </div>
        </section>
      ) : null}

      {s.name === "ATTEMPT_COMPLETE" ? (
        <section aria-labelledby="complete-heading">
          <h2 id="complete-heading" tabIndex={-1}>
            Attempt complete
          </h2>
          <p className="status">
            You finished a timed attempt on {s.topic.title}. Spin again to keep practicing.
          </p>
          {session.audio.issue ? (
            <p className="status" role="status">
              {audioIssueCopy(session.audio.issue)}
            </p>
          ) : null}
          {session.audio.armed && !session.audio.issue ? (
            <p className="status" role="status">
              Finalizing your recording…
            </p>
          ) : null}
          <div className="toolbar">
            <button type="button" className="primary" onClick={actions.startTypedReview}>
              Review this attempt
            </button>
            <button type="button" onClick={spinAgain}>
              Spin again
            </button>
          </div>
        </section>
      ) : null}

      {s.name === "PROCESSING" ? (
        <ProcessingView
          topic={s.topic}
          metrics={s.metrics}
          transcription={s.transcription}
          audio={session.audio}
          onTranscribe={actions.requestTranscription}
          onDecline={actions.declineTranscription}
          onCancel={actions.startTypedReview}
        />
      ) : null}

      {s.name === "TRANSCRIPT_REVIEW" ? (
        <TranscriptEditor
          draft={s.draft}
          onApprove={actions.approveTranscript}
          onTypeInstead={actions.startTypedReview}
        />
      ) : null}

      {s.name === "SELF_REVIEW" ? (
        <SelfReview
          metrics={s.metrics}
          transcriptionIssue={s.transcriptionIssue}
          audio={session.audio}
          onSubmit={actions.submitSelfReview}
          onRetryTranscription={actions.requestTranscription}
        />
      ) : null}

      {s.name === "REVIEW" ? (
        <AttemptReview
          topic={s.topic}
          metrics={s.metrics}
          textMetrics={s.textMetrics}
          transcript={s.transcript}
          coverage={s.coverage}
          history={s.attempt.history}
          refinementDelta={s.refinementDelta}
          attemptIndex={s.attempt.attemptIndex}
          semanticRefining={session.semanticRefining}
          audio={session.audio}
          onSpinAgain={spinAgain}
          onTryAgain={actions.startSecondAttempt}
        />
      ) : null}

      <p className="status" aria-live="polite">
        {milestone}
      </p>

      {showSurface ? (
        <button
          type="button"
          className="settings-trigger"
          aria-label="Settings"
          title="Settings"
          onClick={() => setShowSettings(true)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      ) : null}

      {showSettings ? (
        <SettingsDialog
          store={settingsStore}
          settings={settings}
          semanticCoverageAvailable={semanticCoverageAvailable(caps)}
          onSaved={onSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      ) : null}
    </>
  );
}

export function App() {
  const settingsStore = useMemo(() => new LocalStorageSettingsStore(), []);
  const [settings, setSettings] = useState<UserSettings>(() => ({
    ...(settingsStore.load() ?? DEFAULT_SETTINGS),
  }));
  const [pack, setPack] = useState<RuntimePack | null>(null);
  const [packWarning, setPackWarning] = useState<string | null>(null);
  const [packError, setPackError] = useState<string | null>(null);
  const [caps] = useState<Capabilities>(() => detectCapabilities());
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const handleFocusModeChange = useCallback((active: boolean) => {
    setFocusMode(active);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadBundledPack()
      .then((result) => {
        if (!cancelled) {
          setPack(result.pack);
          setPackWarning(result.warning ?? null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setPackError((err as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    const observeWorker = (worker: ServiceWorker | null) => {
      if (!worker) return;
      const stateChange = () => {
        if (
          !cancelled &&
          worker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          setWaitingWorker(worker);
        }
      };
      worker.addEventListener("statechange", stateChange);
    };
    const register = () => {
      navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`)
        .then((reg) => {
          if (cancelled) return;
          if (reg.waiting && navigator.serviceWorker.controller) {
            setWaitingWorker(reg.waiting);
          }
          reg.addEventListener("updatefound", () => {
            observeWorker(reg.installing);
          });
        })
        .catch(() => {
          /* registration is an enhancement; the loop works without it */
        });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", register);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waitingWorker) return;
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => window.location.reload(),
      { once: true },
    );
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }, [waitingWorker]);

  return (
    <>
      <div className="atmosphere" aria-hidden="true" />
      <main>
        <header className={focusMode ? "sr-only" : "brand"}>
          <h1>MediPrompt</h1>
          <p className="brand-line">Think clearly. Speak clinically.</p>
        </header>

      {waitingWorker && !focusMode ? (
        <div className="topic-card" role="status">
          <p>An update is available.</p>
          <button type="button" onClick={applyUpdate}>
            Reload to update
          </button>
        </div>
      ) : null}

      {packWarning && !focusMode ? (
        <div className="topic-card" role="status">
          <p>{packWarning}</p>
        </div>
      ) : null}

      {packError && !focusMode ? (
        <div className="topic-card" role="alert">
          <p>Could not load the practice pack: {packError}</p>
          <p className="status">
            Reload to retry. Once loaded, the app works offline.
          </p>
        </div>
      ) : null}

      {!pack && !packError ? <p className="status">Loading practice pack…</p> : null}

      {pack ? (
        <PracticeApp
          pack={pack}
          settings={settings}
          settingsStore={settingsStore}
          caps={caps}
          onSettingsChange={setSettings}
          onFocusModeChange={handleFocusModeChange}
        />
      ) : null}

      </main>
    </>
  );
}

export type { V02PracticeMode };
