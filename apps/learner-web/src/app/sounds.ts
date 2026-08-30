// Quiet synthesized sound cues: spin, timer start, timer end. No audio assets —
// tones are generated with WebAudio oscillators, so the CSP needs no media-src
// change and everything works offline. Every cue is a no-op when muted and must
// never break the practice loop, so all failures are swallowed.

let shared: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof AudioContext === "undefined") return null;
  try {
    if (!shared) {
      const created = new AudioContext();
      // Test doubles and exotic browsers may expose a bare constructor.
      if (typeof created.createOscillator !== "function") return null;
      shared = created;
    }
    if (shared.state === "suspended") void shared.resume();
    return shared;
  } catch {
    return null;
  }
}

function tone(
  ctx: AudioContext,
  opts: { freq: number; at: number; dur: number; type?: OscillatorType; gain?: number },
): void {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.value = opts.freq;
  const t = ctx.currentTime + opts.at;
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(opts.gain ?? 0.055, t + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + opts.dur + 0.03);
}

/** Short three-tick rattle when a topic is spun. */
export function playSpinTick(muted: boolean): void {
  if (muted) return;
  const ctx = audioContext();
  if (!ctx) return;
  try {
    tone(ctx, { freq: 660, at: 0, dur: 0.05, type: "triangle", gain: 0.045 });
    tone(ctx, { freq: 520, at: 0.07, dur: 0.05, type: "triangle", gain: 0.04 });
    tone(ctx, { freq: 880, at: 0.14, dur: 0.1, type: "triangle", gain: 0.055 });
  } catch {
    /* decorative cue only */
  }
}

/** Single soft blip when a timed phase begins. */
export function playTimerStart(muted: boolean): void {
  if (muted) return;
  const ctx = audioContext();
  if (!ctx) return;
  try {
    tone(ctx, { freq: 587.33, at: 0, dur: 0.12, gain: 0.05 });
  } catch {
    /* decorative cue only */
  }
}

/** Gentle two-note chime when time runs out. */
export function playTimerEnd(muted: boolean): void {
  if (muted) return;
  const ctx = audioContext();
  if (!ctx) return;
  try {
    tone(ctx, { freq: 659.25, at: 0, dur: 0.16, gain: 0.06 });
    tone(ctx, { freq: 880, at: 0.15, dur: 0.3, gain: 0.06 });
  } catch {
    /* decorative cue only */
  }
}
