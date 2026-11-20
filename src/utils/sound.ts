/**
 * Synthesized retro 90s UI sound effects using Web Audio API.
 * Strictly respects the global muted state (muted by default).
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export type SoundEffect =
  | 'click'
  | 'open'
  | 'close'
  | 'beep'
  | 'bsod'
  | 'hit'
  | 'score'
  | 'win'
  | 'boom';

export function playRetroSound(effect: SoundEffect, enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (effect === 'click') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.setValueAtTime(440, now + 0.02);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (effect === 'open') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.setValueAtTime(520, now + 0.04);
    osc.frequency.setValueAtTime(720, now + 0.08);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.start(now);
    osc.stop(now + 0.14);
  } else if (effect === 'close') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.setValueAtTime(320, now + 0.045);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (effect === 'beep') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.09);
  } else if (effect === 'hit') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.setValueAtTime(640, now + 0.025);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.start(now);
    osc.stop(now + 0.065);
  } else if (effect === 'score') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(587, now);
    osc.frequency.setValueAtTime(880, now + 0.05);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.start(now);
    osc.stop(now + 0.15);
  } else if (effect === 'win') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(523, now);
    osc.frequency.setValueAtTime(659, now + 0.07);
    osc.frequency.setValueAtTime(784, now + 0.14);
    osc.frequency.setValueAtTime(1046, now + 0.21);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
    osc.start(now);
    osc.stop(now + 0.35);
  } else if (effect === 'boom') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.24);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc.start(now);
    osc.stop(now + 0.27);
  } else if (effect === 'bsod') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(165, now + 0.12);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.start(now);
    osc.stop(now + 0.3);
  }
}
