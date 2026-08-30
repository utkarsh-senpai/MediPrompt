import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  type RuntimePack,
  type SettingsStore,
  type TopicSnapshot,
  type UserSettings,
  type V02PracticeMode,
  DEFAULT_SETTINGS,
} from "@/practice/types";
import { remainingMs } from "@/practice/deadlineTimer";
import { usePracticeSession } from "@/practice/usePracticeSession";
import { loadBundledPack } from "@/content/packLoader";
import { detectCapabilities, type Capabilities } from "@/app/capabilities";
import { systemMonotonicClock, systemWallClock } from "@/platform/clock";
import { CryptoRandom } from "@/platform/random";
import { InMemoryBagStore } from "@/platform/bagStore";
import { LocalStorageSettingsStore } from "@/platform/settingsStore";
import { PracticeSurface } from "@/components/PracticeSurface";
import { CountdownRing } from "@/components/CountdownRing";
import { SettingsDialog } from "@/components/SettingsDialog";

interface PracticeAppProps {
  pack: RuntimePack;
  settings: UserSettings;
  settingsStore: SettingsStore;
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
    <>
      <p className="expectation">{topic.expectation}</p>
      <p>{topic.wording}</p>
      {topic.caseText ? (
        <p className="case-context">
          <strong>Scenario:</strong> {topic.caseText}
        </p>
      ) : null}
    </>
  );
}

function TopicCard({
  topic,
  headingId,
  children,
}: {
  topic: TopicSnapshot;
  headingId: string;
  children: ReactNode;
}) {
  return (
    <article className="topic-card">
      <h2 id={headingId} tabIndex={-1}>
        {topic.title}
      </h2>
      <PromptDetails topic={topic} />
      <ol className="arc" aria-label="Answer arc">
        {topic.answerArc.map((step) => (
          <li key={step.id}>{step.label}</li>
        ))}
      </ol>
      <div className="toolbar">{children}</div>
    </article>
  );
}

function PracticeApp({
  pack,
  settings,
  settingsStore,
  onSettingsChange,
  onFocusModeChange,
}: PracticeAppProps) {
  const monotonic = useMemo(() => systemMonotonicClock(), []);
  const wall = useMemo(() => systemWallClock(), []);
  const random = useMemo(() => new CryptoRandom(), []);
  const bagStore = useMemo(() => new InMemoryBagStore(), []);

  const session = usePracticeSession({
    pack,
    settings,
    monotonic,
    wall,
    random,
    bagStore,
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

  const showSurface = s.name !== "SPEAKING" && s.name !== "RESEARCHING";
  useEffect(() => {
    onFocusModeChange(!showSurface);
    return () => onFocusModeChange(false);
  }, [onFocusModeChange, showSurface]);

  return (
    <>
      {showSurface ? (
        <PracticeSurface
          subjects={subjects}
          selection={s.selection}
          presets={presets}
          challengeVisible={challengeVisible}
          eligibleCount={eligibleCount}
          drawing={s.name === "DRAWING"}
          onChange={actions.setSelection}
          onSpin={s.name === "IDLE" ? actions.spin : actions.spinAgain}
        />
      ) : null}

      {s.name === "TOPIC_READY" ? (
        <TopicCard topic={s.topic} headingId="topic-heading">
          {s.selection.mode === "DEEP_RESEARCH" ? (
            <button type="button" onClick={actions.startResearch}>
              Begin research
            </button>
          ) : (
            <button type="button" onClick={actions.startTimer}>
              Start timer
            </button>
          )}
          <button type="button" onClick={actions.spinAgain}>
            Spin again
          </button>
        </TopicCard>
      ) : null}

      {s.name === "READY_TO_SPEAK" ? (
        <TopicCard topic={s.topic} headingId="topic-heading">
          <button type="button" onClick={actions.confirmReady}>
            Start speaking
          </button>
          <button type="button" onClick={actions.spinAgain}>
            Spin again
          </button>
        </TopicCard>
      ) : null}

      {s.name === "RESEARCHING" ? (
        <section className="focus-view" aria-labelledby="speaking-heading">
          <h2 id="speaking-heading" tabIndex={-1}>
            {s.topic.title}
          </h2>
          <PromptDetails topic={s.topic} />
          <CountdownRing
            remainingMs={remaining ?? 0}
            totalMs={totalMs}
            caption="Research time left"
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
          <h2 id="speaking-heading" tabIndex={-1}>
            {s.topic.title}
          </h2>
          <PromptDetails topic={s.topic} />
          <CountdownRing
            remainingMs={remaining ?? 0}
            totalMs={totalMs}
            caption="Speaking time left"
          />
          <ol className="arc" aria-label="Answer arc">
            {s.topic.answerArc.map((step) => (
              <li key={step.id}>{step.label}</li>
            ))}
          </ol>
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
          <div className="toolbar">
            <button type="button" onClick={actions.spinAgain}>
              Spin again
            </button>
          </div>
        </section>
      ) : null}

      <p className="status" aria-live="polite">
        {milestone}
      </p>

      {showSurface ? (
        <div className="toolbar">
          <button type="button" onClick={() => setShowSettings(true)}>
            Settings
          </button>
        </div>
      ) : null}

      {showSettings ? (
        <SettingsDialog
          store={settingsStore}
          settings={settings}
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
    <main>
      <header className={focusMode ? "sr-only" : "app-intro"}>
        <h1>MediPrompt</h1>
        <p className="status">
          Practice mode + challenge + subject → Spin → timed speech. No account, no
          recording, no model download.
        </p>
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
          onSettingsChange={setSettings}
          onFocusModeChange={handleFocusModeChange}
        />
      ) : null}

      {!focusMode ? (
        <p className="status" aria-label="capabilities">
          Microphone: {caps.microphone ? "available" : "unavailable"} · Storage:{" "}
          {caps.storage ? "available" : "unavailable"} · Online:{" "}
          {caps.online ? "yes" : "no"}
        </p>
      ) : null}
    </main>
  );
}

export type { V02PracticeMode };
