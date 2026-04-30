import { useEffect } from 'react';
import { useStore } from '@state/store';
import { idxToRC, rcToIdx } from '@core/coords';

export interface KeyboardNavOptions {
  enabled?: boolean;
}

export function useKeyboardNav(options: KeyboardNavOptions = {}): void {
  const enabled = options.enabled ?? true;
  useEffect(() => {
    if (!enabled) return;
    function handler(e: KeyboardEvent): void {
      const state = useStore.getState();
      const board = state.board;
      if (!board) return;
      const size = board.size;
      const sel = state.selectedIdx;

      // Undo / Redo first (mod-key combos)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          state.redo();
        } else {
          state.undo();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        state.redo();
        return;
      }

      // Toggle pencil mode
      if (e.key === 'm' || e.key === 'M') {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        e.preventDefault();
        state.togglePencilMode();
        return;
      }

      // Escape: deselect
      if (e.key === 'Escape') {
        e.preventDefault();
        state.selectCell(null);
        return;
      }

      // Movement keys
      if (
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
      ) {
        e.preventDefault();
        const current = sel ?? 0;
        const { row, col } = idxToRC(current, size);
        let nr = row;
        let nc = col;
        if (e.key === 'ArrowUp') nr = Math.max(0, row - 1);
        else if (e.key === 'ArrowDown') nr = Math.min(size - 1, row + 1);
        else if (e.key === 'ArrowLeft') nc = Math.max(0, col - 1);
        else if (e.key === 'ArrowRight') nc = Math.min(size - 1, col + 1);
        state.selectCell(rcToIdx(nr, nc, size));
        return;
      }

      // Backspace / Delete: clear cell
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (sel === null) return;
        e.preventDefault();
        state.clearCell(sel);
        return;
      }

      // Digit keys 1-9
      if (/^[1-9]$/.test(e.key)) {
        if (sel === null) return;
        e.preventDefault();
        const digit = parseInt(e.key, 10);
        if (e.shiftKey) {
          state.toggleCandidate(sel, digit);
        } else if (state.pencilMode) {
          state.toggleCandidate(sel, digit);
        } else {
          state.setDigit(sel, digit);
        }
        return;
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled]);
}
