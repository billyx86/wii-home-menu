/** Lightweight Web Audio beeps — Wii-inspired soft UI sounds, no assets needed. */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let volume = 0.55;
let muted = false;

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
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

export function setWiiVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  if (masterGain) masterGain.gain.value = muted ? 0 : volume;
}

export function setWiiMuted(m: boolean) {
  muted = m;
  if (masterGain) masterGain.gain.value = muted ? 0 : volume;
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
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
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
  tone(392, 0.12, "sine", 0.06);
  tone(523.25, 0.14, "sine", 0.07, 0.1);
  tone(659.25, 0.16, "sine", 0.06, 0.2);
  tone(784, 0.22, "triangle", 0.05, 0.32);
}
