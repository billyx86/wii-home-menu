/** Lightweight Web Audio beeps — Wii-inspired soft UI sounds, no assets needed. */

const STORAGE_KEY = "wii.audio";

interface AudioPrefs {
  volume?: number;
  muted?: boolean;
}

function loadPrefs(): AudioPrefs {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as AudioPrefs) : {};
  } catch {
    // Corrupt or unreadable storage — fall back to defaults.
    return {};
  }
}

function savePrefs(nextVolume: number, nextMuted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume: nextVolume, muted: nextMuted }));
  } catch {
    // Storage unavailable (private mode etc.) — settings stay in-memory only.
  }
}

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
// Tracks an in-flight resume() so a tone fired inside the activating
// gesture can wait for the context to actually run instead of scheduling
// into a suspended one (issue #24).
let resumePromise: Promise<void> | null = null;
// True while the boot jingle is parked, waiting for user activation.
let bootDeferred = false;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : volume;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended" && !resumePromise) {
    // Autoplay policy: resume() without user activation resolves but leaves
    // the context suspended — callers must not schedule while suspended.
    resumePromise = ctx.resume().catch(() => undefined).finally(() => {
      resumePromise = null;
    });
  }
  return ctx;
}

/**
 * Parks the boot jingle until audio is actually allowed, then plays it
 * exactly once. Chrome/Safari create the AudioContext suspended and
 * refuse resume() without user activation, so the 400 ms boot timer's
 * jingle is a silent no-op on first visit (issue #24). The flush fires on
 * the first real gesture (pointerdown/keydown, capture phase so it runs
 * with the user's click) or when the context turns running on its own
 * (autoplay-permitted profiles).
 */
function armBootFlush(): void {
  if (bootDeferred || !ctx || typeof window === "undefined") return;
  bootDeferred = true;
  let resumeSettled = false;
  const play = () => {
    if (!bootDeferred) return;
    bootDeferred = false;
    window.removeEventListener("pointerdown", flush, true);
    window.removeEventListener("keydown", flush, true);
    ctx?.removeEventListener("statechange", onState);
    playBoot();
  };
  const flush = () => {
    if (!bootDeferred) return;
    window.removeEventListener("pointerdown", flush, true);
    window.removeEventListener("keydown", flush, true);
    if (!ctx) return;
    ctx.removeEventListener("statechange", onState);
    if (ctx.state === "running") {
      play();
      return;
    }
    // We are inside a real gesture now — resume() is allowed to work.
    // Settle first so the jingle schedules into a running context.
    const c = ctx;
    void c.resume()
      .catch(() => undefined)
      .then(() => {
        if (c.state === "running") {
          play();
        } else {
          // Still blocked (rare: e.g. an extension denies audio). Re-arm
          // so a later gesture can retry instead of dropping the jingle.
          bootDeferred = false;
          armBootFlush();
        }
      });
    resumeSettled = true;
  };
  const onState = () => {
    if (resumeSettled) return;
    if (ctx && ctx.state === "running") flush();
  };
  window.addEventListener("pointerdown", flush, true);
  window.addEventListener("keydown", flush, true);
  ctx.addEventListener("statechange", onState);
}

// Hydrate once at module load so boot sounds already respect saved settings.
const initial = loadPrefs();
const rawVolume = Number(initial.volume);
let volume = Number.isFinite(rawVolume) ? Math.max(0, Math.min(1, rawVolume)) : 0.55;
let muted = initial.muted === true;

export function setWiiVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  if (masterGain) masterGain.gain.value = muted ? 0 : volume;
  savePrefs(volume, muted);
}

export function setWiiMuted(m: boolean) {
  muted = m;
  if (masterGain) masterGain.gain.value = muted ? 0 : volume;
  savePrefs(volume, muted);
}

export function getWiiVolume() {
  return volume;
}

export function getWiiMuted() {
  return muted;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.12,
  delay = 0,
) {
  const ac = ensureCtx();
  if (!ac || !masterGain || muted) return;
  const master = masterGain;
  const schedule = () => {
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  };
  if (ac.state === "running") {
    schedule();
    return;
  }
  // Suspended: never schedule into a blocked context. If a resume is
  // already in flight (this tone fired inside the activating gesture,
  // before the state flipped), wait for the settle; otherwise it is a
  // transient sound that cannot be made up later, so drop it.
  if (resumePromise) {
    void resumePromise.then(() => {
      if (ac.state === "running") schedule();
    });
  }
}

export function playHover() {
  tone(880, 0.05, "sine", 0.035);
}

export function playSelect() {
  tone(523.25, 0.08, "sine", 0.08);
  tone(784, 0.1, "sine", 0.06, 0.04);
}

export function playOpen() {
  tone(392, 0.1, "triangle", 0.07);
  tone(523.25, 0.12, "sine", 0.08, 0.06);
  tone(659.25, 0.14, "sine", 0.06, 0.12);
}

export function playBack() {
  tone(659.25, 0.08, "sine", 0.06);
  tone(440, 0.12, "sine", 0.05, 0.05);
}

export function playPage() {
  tone(698.46, 0.07, "sine", 0.05);
  tone(880, 0.09, "sine", 0.04, 0.04);
}

export function playBoot() {
  const ac = ensureCtx();
  if (!ac || !masterGain || muted) return;
  if (ac.state === "running") {
    tone(392, 0.12, "sine", 0.06);
    tone(523.25, 0.14, "sine", 0.07, 0.1);
    tone(659.25, 0.16, "sine", 0.06, 0.2);
    tone(784, 0.22, "triangle", 0.05, 0.32);
    return;
  }
  // No user gesture yet, so the browser has not granted audio: park the
  // jingle and play it exactly once when activation happens (issue #24).
  armBootFlush();
}
