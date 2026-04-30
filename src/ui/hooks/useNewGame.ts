import { useCallback } from 'react';
import { useStore } from '@state/store';
import { getVariant, isVariantRegistered } from '@variants/registry';
import type { Difficulty } from '@core/types';

export type NewGameFn = (variantId: string, difficulty: Difficulty) => void;

/**
 * Returns a stable callback that starts a new game for the given variantId
 * and difficulty. Generates a fresh puzzle through the variant adapter,
 * loads it into the store, and starts a session.
 *
 * If the variant is not registered, the call is a no-op (defensive — the UI
 * may render before all variants have been registered).
 */
export function useNewGame(): NewGameFn {
  const loadBoard = useStore((s) => s.loadBoard);
  const startSession = useStore((s) => s.startSession);

  return useCallback(
    (variantId: string, difficulty: Difficulty) => {
      if (!isVariantRegistered(variantId)) return;
      const variant = getVariant(variantId);
      const seed = Date.now();
      const { puzzle } = variant.adapter.generate(seed, difficulty);
      loadBoard(puzzle);
      startSession(variantId, difficulty);
    },
    [loadBoard, startSession],
  );
}

export default useNewGame;
