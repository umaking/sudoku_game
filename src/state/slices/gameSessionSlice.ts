import type { StateCreator } from 'zustand';
import type { Difficulty } from '@core/types';
import type { StatsSlice } from './statsSlice';

export interface GameSessionSlice {
  startedAt: number | null;
  elapsedMs: number;
  mistakes: number;
  paused: boolean;
  finished: boolean;
  variantId: string | null;
  difficulty: Difficulty | null;
  startSession: (variantId: string, difficulty: Difficulty) => void;
  tick: (deltaMs: number) => void;
  recordMistake: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  finishSession: () => void;
  resetSession: () => void;
}

const initialSessionState = {
  startedAt: null as number | null,
  elapsedMs: 0,
  mistakes: 0,
  paused: false,
  finished: false,
  variantId: null as string | null,
  difficulty: null as Difficulty | null,
};

/**
 * GameSessionSlice — `finishSession` calls into StatsSlice.recordCompletion via
 * `get()`. The cross-slice reference means we need StateCreator's first type
 * arg to include StatsSlice fields when finishing. The exported creator stays
 * compatible with the regular RootState combination in store.ts.
 */
export const createGameSessionSlice: StateCreator<
  GameSessionSlice & StatsSlice,
  [],
  [],
  GameSessionSlice
> = (set, get) => ({
  ...initialSessionState,

  startSession: (variantId, difficulty) =>
    set({
      ...initialSessionState,
      startedAt: Date.now(),
      variantId,
      difficulty,
    }),

  tick: (deltaMs) => {
    const s = get();
    if (s.paused || s.finished) return;
    if (s.startedAt === null) return;
    set({ elapsedMs: s.elapsedMs + deltaMs });
  },

  recordMistake: () => set((s) => ({ mistakes: s.mistakes + 1 })),

  pauseSession: () => set({ paused: true }),

  resumeSession: () => set({ paused: false }),

  finishSession: () => {
    const s = get();
    set({ finished: true, paused: false });
    if (
      s.variantId !== null &&
      s.difficulty !== null &&
      s.startedAt !== null &&
      typeof s.recordCompletion === 'function'
    ) {
      s.recordCompletion({
        variantId: s.variantId,
        difficulty: s.difficulty,
        timeMs: s.elapsedMs,
        mistakes: s.mistakes,
      });
    }
  },

  resetSession: () => set({ ...initialSessionState }),
});
