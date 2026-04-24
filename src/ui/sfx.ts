// Lightweight WebAudio-based cues — no external assets.

let ctx: AudioContext | null = null;
let enabled = true;

function getCtx(): AudioContext | null {
  if (!enabled) return null;
  if (ctx) return ctx;
  try {
    const Ctor = (window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as
      | typeof AudioContext
      | undefined;
    if (!Ctor) {
      enabled = false;
      return null;
    }
    ctx = new Ctor();
  } catch {
    enabled = false;
    return null;
  }
  return ctx;
}

function beep(frequency: number, durationMs: number, volume = 0.08): void {
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === 'suspended') {
    audio.resume().catch(() => {});
  }
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  osc.connect(gain).connect(audio.destination);
  osc.start(now);
  osc.stop(now + durationMs / 1000 + 0.02);
}

export function playStepCue(): void {
  beep(660, 80, 0.05);
}

export function playSolvedCue(): void {
  beep(660, 120, 0.06);
  setTimeout(() => beep(880, 140, 0.06), 110);
  setTimeout(() => beep(1175, 200, 0.06), 240);
}
