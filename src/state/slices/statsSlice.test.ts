import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import {
  createStatsSlice,
  type StatsSlice,
  STATS_RECORDS_CAP,
  EMPTY_VARIANT_STATS,
} from './statsSlice';

function makeStore() {
  return create<StatsSlice>()((set, get, store) => ({
    ...createStatsSlice(set, get, store),
  }));
}

describe('statsSlice', () => {
  let useTestStore: ReturnType<typeof makeStore>;

  beforeEach(() => {
    useTestStore = makeStore();
  });

  it('first recordCompletion sets bestTimeMs and isPersonalBest=true', () => {
    const result = useTestStore.getState().recordCompletion({
      variantId: 'classic',
      difficulty: 'easy',
      timeMs: 60_000,
      mistakes: 2,
    });
    expect(result.isPersonalBest).toBe(true);

    const stats = useTestStore.getState().getStats('classic', 'easy');
    expect(stats.bestTimeMs).toBe(60_000);
    expect(stats.completedCount).toBe(1);
    expect(stats.totalMistakes).toBe(2);
  });

  it('faster second time updates PB and reports isPersonalBest=true', () => {
    useTestStore.getState().recordCompletion({
      variantId: 'classic',
      difficulty: 'easy',
      timeMs: 90_000,
      mistakes: 1,
    });
    const result = useTestStore.getState().recordCompletion({
      variantId: 'classic',
      difficulty: 'easy',
      timeMs: 70_000,
      mistakes: 0,
    });
    expect(result.isPersonalBest).toBe(true);

    const stats = useTestStore.getState().getStats('classic', 'easy');
    expect(stats.bestTimeMs).toBe(70_000);
    expect(stats.completedCount).toBe(2);
    expect(stats.totalMistakes).toBe(1);
  });

  it('slower time keeps PB and reports isPersonalBest=false', () => {
    const s = useTestStore.getState();
    s.recordCompletion({
      variantId: 'classic',
      difficulty: 'easy',
      timeMs: 90_000,
      mistakes: 1,
    });
    s.recordCompletion({
      variantId: 'classic',
      difficulty: 'easy',
      timeMs: 70_000,
      mistakes: 0,
    });
    const result = useTestStore.getState().recordCompletion({
      variantId: 'classic',
      difficulty: 'easy',
      timeMs: 120_000,
      mistakes: 3,
    });
    expect(result.isPersonalBest).toBe(false);

    const stats = useTestStore.getState().getStats('classic', 'easy');
    expect(stats.bestTimeMs).toBe(70_000);
    expect(stats.completedCount).toBe(3);
    expect(stats.totalMistakes).toBe(4);
  });

  it('different variant/difficulty have isolated stats', () => {
    const s = useTestStore.getState();
    s.recordCompletion({
      variantId: 'classic',
      difficulty: 'easy',
      timeMs: 60_000,
      mistakes: 0,
    });
    s.recordCompletion({
      variantId: 'parity',
      difficulty: 'hard',
      timeMs: 200_000,
      mistakes: 5,
    });
    s.recordCompletion({
      variantId: 'classic',
      difficulty: 'medium',
      timeMs: 120_000,
      mistakes: 1,
    });

    const easy = useTestStore.getState().getStats('classic', 'easy');
    const medium = useTestStore.getState().getStats('classic', 'medium');
    const parityHard = useTestStore.getState().getStats('parity', 'hard');

    expect(easy.bestTimeMs).toBe(60_000);
    expect(easy.completedCount).toBe(1);
    expect(medium.bestTimeMs).toBe(120_000);
    expect(medium.completedCount).toBe(1);
    expect(parityHard.bestTimeMs).toBe(200_000);
    expect(parityHard.completedCount).toBe(1);
  });

  it('records list is capped at STATS_RECORDS_CAP', () => {
    const s = useTestStore.getState();
    for (let i = 0; i < STATS_RECORDS_CAP + 5; i++) {
      s.recordCompletion({
        variantId: 'classic',
        difficulty: 'easy',
        timeMs: 100_000 + i,
        mistakes: 0,
      });
    }
    const records = useTestStore.getState().records;
    expect(records.length).toBe(STATS_RECORDS_CAP);
    // Most recent should be at the head.
    const head = records[0];
    expect(head?.timeMs).toBe(100_000 + (STATS_RECORDS_CAP + 5 - 1));
  });

  it('clearStats resets records and byVariant', () => {
    const s = useTestStore.getState();
    s.recordCompletion({
      variantId: 'classic',
      difficulty: 'easy',
      timeMs: 60_000,
      mistakes: 0,
    });
    expect(useTestStore.getState().records.length).toBe(1);

    useTestStore.getState().clearStats();
    expect(useTestStore.getState().records).toEqual([]);
    expect(useTestStore.getState().byVariant).toEqual({});
  });

  it('getStats returns EMPTY_VARIANT_STATS for unknown key', () => {
    const stats = useTestStore.getState().getStats('classic', 'expert');
    expect(stats).toEqual(EMPTY_VARIANT_STATS);
    expect(stats.bestTimeMs).toBeNull();
    expect(stats.completedCount).toBe(0);
    expect(stats.totalMistakes).toBe(0);
  });
});
