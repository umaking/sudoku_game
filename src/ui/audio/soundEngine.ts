/**
 * soundEngine — procedural Web Audio API tones for the sudoku UI.
 *
 * Goals:
 * - Zero external dependencies and zero binary assets.
 * - Safe in jsdom (no AudioContext): every public function silently no-ops.
 * - Browser autoplay policy compliant: AudioContext is created lazily,
 *   and `unlockAudio()` should be called from the first user gesture.
 *
 * Tones:
 * - place:  triangle 660Hz, ~90ms — short, friendly "tick" for placing a digit
 * - clear:  sine 320Hz, ~80ms, lower volume — softer "untick"
 * - memo:   sine 880Hz, ~50ms, very quiet — tiny ping for candidate toggle
 * - region: C5–E5–G5 arpeggio (523/659/784Hz) — celebratory chime when a
 *           full row/col/box is completed with 1..9 distinct.
 *
 * Volumes are intentionally low (0.05–0.08) — these are interaction
 * accents, not music. They must not fatigue the user across hundreds of
 * inputs in a single session.
 */

interface AudioCtorWindow {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

let ctx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  const w = window as unknown as AudioCtorWindow;
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    ctx = null;
    return null;
  }
  return ctx;
}

/**
 * Resume a suspended AudioContext after a user gesture (click/keydown).
 * Idempotent — safe to call repeatedly. Browser autoplay policies block
 * audio output until a context has been resumed in a gesture handler;
 * call this from a click/touch/keydown listener at app boot.
 */
export function unlockAudio(): void {
  if (unlocked) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') {
    void c.resume();
  }
  unlocked = true;
}

interface ToneOpts {
  freq: number;
  durationMs: number;
  volume?: number;
  type?: OscillatorType;
  attackMs?: number;
}

function playTone(opts: ToneOpts): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') {
    // best-effort resume; ignored if user hasn't gestured yet
    void c.resume();
  }
  try {
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = opts.type ?? 'sine';
    osc.frequency.value = opts.freq;
    const vol = opts.volume ?? 0.08;
    const attack = (opts.attackMs ?? 5) / 1000;
    const dur = opts.durationMs / 1000;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + attack);
    // exponentialRampToValueAtTime cannot reach 0; ramp to a tiny epsilon.
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  } catch {
    // Any AudioContext error (closed, exhausted, etc) is non-fatal.
  }
}

export function playPlaceTone(): void {
  playTone({ freq: 660, durationMs: 90, type: 'triangle' });
}

export function playClearTone(): void {
  playTone({ freq: 320, durationMs: 80, volume: 0.06, type: 'sine' });
}

export function playMemoTone(): void {
  playTone({ freq: 880, durationMs: 50, volume: 0.05, type: 'sine' });
}

/**
 * Region-completion chime: ascending C5–E5–G5 arpeggio.
 * Slightly louder and longer than the per-cell tones to mark the moment.
 */
export function playRegionCompleteTone(): void {
  playTone({ freq: 523, durationMs: 110, type: 'sine' });
  setTimeout(() => playTone({ freq: 659, durationMs: 110, type: 'sine' }), 80);
  setTimeout(() => playTone({ freq: 784, durationMs: 220, type: 'sine' }), 160);
}

/**
 * Test-only: reset module state so subsequent getCtx() re-creates the
 * AudioContext from the (potentially newly-stubbed) global.
 */
export function __resetSoundEngine(): void {
  ctx = null;
  unlocked = false;
}
