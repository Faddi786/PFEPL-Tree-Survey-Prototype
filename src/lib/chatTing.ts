/** Short WhatsApp-style message "ting" via Web Audio (no asset file). */

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedCtx) sharedCtx = new Ctx();
  return sharedCtx;
}

function tone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  peak = 0.18,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Soft two-note ting — similar feel to chat message receive. */
export function playChatTing() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    void ctx.resume();
    const t = ctx.currentTime;
    tone(ctx, 880, t, 0.09, 0.16);
    tone(ctx, 1318.5, t + 0.07, 0.14, 0.14);
  } catch {
    // Autoplay / unsupported — ignore
  }
}
