import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  unlockAudio,
  playPlaceTone,
  playClearTone,
  playMemoTone,
  playRegionCompleteTone,
  __resetSoundEngine,
} from './soundEngine';

describe('soundEngine — jsdom environment (no AudioContext)', () => {
  beforeEach(() => {
    __resetSoundEngine();
    // jsdom has no AudioContext; ensure it's truly absent
    delete (window as unknown as { AudioContext?: unknown }).AudioContext;
    delete (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext;
  });

  it('all play* functions are silent no-ops without throwing', () => {
    expect(() => playPlaceTone()).not.toThrow();
    expect(() => playClearTone()).not.toThrow();
    expect(() => playMemoTone()).not.toThrow();
    expect(() => playRegionCompleteTone()).not.toThrow();
  });

  it('unlockAudio is a safe no-op without AudioContext', () => {
    expect(() => unlockAudio()).not.toThrow();
    // calling twice is also safe
    expect(() => unlockAudio()).not.toThrow();
  });
});

describe('soundEngine — with stubbed AudioContext', () => {
  let createOscSpy: ReturnType<typeof vi.fn>;
  let createGainSpy: ReturnType<typeof vi.fn>;
  let resumeSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    __resetSoundEngine();
    createOscSpy = vi.fn(() => ({
      type: 'sine',
      frequency: { value: 0 },
      connect: vi.fn(() => ({ connect: vi.fn() })),
      start: vi.fn(),
      stop: vi.fn(),
    }));
    createGainSpy = vi.fn(() => ({
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(() => ({ connect: vi.fn() })),
    }));
    resumeSpy = vi.fn(() => Promise.resolve());

    class FakeAudioContext {
      currentTime = 0;
      state: 'running' | 'suspended' = 'suspended';
      destination = {};
      createOscillator = createOscSpy;
      createGain = createGainSpy;
      resume = resumeSpy;
    }
    (window as unknown as { AudioContext: typeof FakeAudioContext }).AudioContext =
      FakeAudioContext;
  });

  afterEach(() => {
    __resetSoundEngine();
    delete (window as unknown as { AudioContext?: unknown }).AudioContext;
  });

  it('playPlaceTone creates an oscillator and gain node', () => {
    playPlaceTone();
    expect(createOscSpy).toHaveBeenCalledTimes(1);
    expect(createGainSpy).toHaveBeenCalledTimes(1);
  });

  it('unlockAudio calls resume() on a suspended context', () => {
    unlockAudio();
    expect(resumeSpy).toHaveBeenCalled();
  });

  it('unlockAudio is idempotent (only first call resumes)', () => {
    unlockAudio();
    const firstCount = resumeSpy.mock.calls.length;
    unlockAudio();
    expect(resumeSpy.mock.calls.length).toBe(firstCount);
  });

  it('playRegionCompleteTone schedules the first oscillator immediately', () => {
    playRegionCompleteTone();
    // immediate tone scheduled now; the other two are setTimeout-deferred
    expect(createOscSpy).toHaveBeenCalledTimes(1);
  });
});
