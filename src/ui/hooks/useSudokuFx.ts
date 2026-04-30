import { useEffect, useRef, useState } from 'react';
import { useStore } from '@state/store';
import type { Board, Region } from '@core/types';
import {
  playPlaceTone,
  playClearTone,
  playMemoTone,
  playRegionCompleteTone,
  unlockAudio,
} from '@ui/audio/soundEngine';

export interface SudokuFxState {
  /**
   * IDs of regions currently in the "completion flash" animation window
   * (e.g. 'row-3', 'col-7', 'box-4'). Cells whose region.id is in this
   * set should render with the regionCompleting CSS class.
   */
  animatingRegionIds: ReadonlySet<string>;
}

/**
 * isRegionComplete — true iff every cell in the region has a value, and
 * the values are all distinct (i.e. a valid 1..N permutation).
 */
function isRegionComplete(board: Board, region: Region): boolean {
  const seen = new Set<number>();
  for (const idx of region.cells) {
    const cell = board.cells[idx];
    if (!cell) return false;
    const v = cell.value;
    if (v === null) return false;
    if (seen.has(v)) return false;
    seen.add(v);
  }
  return seen.size === region.cells.length;
}

/**
 * useSudokuFx — diff the board across renders and produce two effects:
 *
 *  1. Sound: short procedural tone on place / clear / memo. A region-
 *     completion chime supersedes the place tone for the move that
 *     finished a row/col/box.
 *  2. Animation: when one or more regions newly complete, flash their
 *     cells for ~800ms via a CSS keyframe.
 *
 * Audio is gated by `soundEnabled`. Animation is independent — even with
 * sound off, the visual flash still fires (intentional: it confirms the
 * "you just finished a unit" beat without requiring audio).
 *
 * The hook also installs a one-shot global gesture listener that calls
 * `unlockAudio()` on the first pointer/key event after mount, satisfying
 * browser autoplay policy without coupling the call site to any specific
 * UI affordance.
 */
export function useSudokuFx(): SudokuFxState {
  const board = useStore((s) => s.board);
  const soundEnabled = useStore((s) => s.soundEnabled);

  const prevRef = useRef<Board | null>(null);
  const [animatingRegionIds, setAnimatingRegionIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );

  // One-shot autoplay unlock. AudioContext starts suspended and must be
  // resumed inside a user gesture handler. We attach to the document so
  // ANY first interaction (cell click, key, tap on anything) unlocks.
  useEffect(() => {
    const onUserGesture = (): void => {
      unlockAudio();
      window.removeEventListener('pointerdown', onUserGesture);
      window.removeEventListener('keydown', onUserGesture);
    };
    window.addEventListener('pointerdown', onUserGesture);
    window.addEventListener('keydown', onUserGesture);
    return () => {
      window.removeEventListener('pointerdown', onUserGesture);
      window.removeEventListener('keydown', onUserGesture);
    };
  }, []);

  useEffect(() => {
    if (!board) {
      prevRef.current = null;
      return;
    }
    const prev = prevRef.current;
    prevRef.current = board;

    // No previous board, or fundamentally different board (new game /
    // variant change) → don't fire effects.
    if (
      !prev ||
      prev.variantId !== board.variantId ||
      prev.cells.length !== board.cells.length
    ) {
      return;
    }

    let placed = 0;
    let cleared = 0;
    let memo = 0;
    const len = board.cells.length;
    for (let i = 0; i < len; i++) {
      const a = prev.cells[i];
      const b = board.cells[i];
      if (!a || !b) continue;
      if (a.value !== b.value) {
        if (b.value !== null && a.value === null) placed++;
        else if (b.value === null && a.value !== null) cleared++;
      } else if (a.candidates !== b.candidates) {
        memo++;
      }
    }

    // Detect regions that just transitioned from incomplete → complete.
    const newlyCompleted: string[] = [];
    for (const region of board.regions) {
      const wasComplete = isRegionComplete(prev, region);
      const isComplete = isRegionComplete(board, region);
      if (!wasComplete && isComplete) newlyCompleted.push(region.id);
    }

    if (soundEnabled) {
      if (newlyCompleted.length > 0) {
        playRegionCompleteTone();
      } else if (placed > 0) {
        playPlaceTone();
      } else if (cleared > 0) {
        playClearTone();
      } else if (memo > 0) {
        playMemoTone();
      }
    }

    if (newlyCompleted.length > 0) {
      setAnimatingRegionIds((current) => {
        const next = new Set(current);
        for (const id of newlyCompleted) next.add(id);
        return next;
      });
      const timeoutId = window.setTimeout(() => {
        setAnimatingRegionIds((current) => {
          const next = new Set(current);
          for (const id of newlyCompleted) next.delete(id);
          return next;
        });
      }, 800);
      return () => window.clearTimeout(timeoutId);
    }
    return undefined;
  }, [board, soundEnabled]);

  return { animatingRegionIds };
}

export default useSudokuFx;
