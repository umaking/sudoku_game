import type { StateCreator } from 'zustand';
import type { Difficulty } from '@core/types';

export interface CompletionRecord {
  variantId: string;
  difficulty: Difficulty;
  timeMs: number;
  mistakes: number;
  completedAt: number;
}

export interface VariantStats {
  bestTimeMs: number | null;
  completedCount: number;
  totalMistakes: number;
}

export type StatsKey = `${string}:${Difficulty}`;

export const STATS_RECORDS_CAP = 100;

export const EMPTY_VARIANT_STATS: VariantStats = {
  bestTimeMs: null,
  completedCount: 0,
  totalMistakes: 0,
};

function makeKey(variantId: string, difficulty: Difficulty): StatsKey {
  return `${variantId}:${difficulty}`;
}

export interface StatsSlice {
  records: CompletionRecord[];
  byVariant: Record<StatsKey, VariantStats>;
  recordCompletion: (
    record: Omit<CompletionRecord, 'completedAt'>,
  ) => { isPersonalBest: boolean };
  getStats: (variantId: string, difficulty: Difficulty) => VariantStats;
  clearStats: () => void;
}

export const createStatsSlice: StateCreator<StatsSlice, [], [], StatsSlice> = (
  set,
  get,
) => ({
  records: [],
  byVariant: {},

  recordCompletion: (record) => {
    const key = makeKey(record.variantId, record.difficulty);
    const state = get();
    const prev = state.byVariant[key] ?? EMPTY_VARIANT_STATS;
    const isPersonalBest =
      prev.bestTimeMs === null || record.timeMs < prev.bestTimeMs;
    const nextStats: VariantStats = {
      bestTimeMs: isPersonalBest ? record.timeMs : prev.bestTimeMs,
      completedCount: prev.completedCount + 1,
      totalMistakes: prev.totalMistakes + record.mistakes,
    };
    const completedRecord: CompletionRecord = {
      ...record,
      completedAt: Date.now(),
    };
    const nextRecords = [completedRecord, ...state.records].slice(
      0,
      STATS_RECORDS_CAP,
    );
    set({
      records: nextRecords,
      byVariant: { ...state.byVariant, [key]: nextStats },
    });
    return { isPersonalBest };
  },

  getStats: (variantId, difficulty) => {
    const key = makeKey(variantId, difficulty);
    return get().byVariant[key] ?? EMPTY_VARIANT_STATS;
  },

  clearStats: () => set({ records: [], byVariant: {} }),
});
