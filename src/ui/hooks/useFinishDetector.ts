import { useEffect, useMemo } from 'react';
import { useStore } from '@state/store';
import { idxToRC, boxIndexOf } from '@core/coords';
import type { Board } from '@core/types';

function isBoardSolved(board: Board): boolean {
  for (const cell of board.cells) {
    if (cell.value === null) return false;
  }
  const size = board.size;
  for (let i = 0; i < board.cells.length; i++) {
    const cell = board.cells[i];
    if (!cell || cell.value === null) return false;
    const { row, col } = idxToRC(i, size);
    const box = boxIndexOf(i, size);
    for (let j = i + 1; j < board.cells.length; j++) {
      const other = board.cells[j];
      if (!other || other.value === null) continue;
      const orc = idxToRC(j, size);
      const obox = boxIndexOf(j, size);
      if (
        cell.value === other.value &&
        (orc.row === row || orc.col === col || obox === box)
      ) {
        return false;
      }
    }
  }
  // Edge-decoration constraints
  for (const edge of board.edgeDecorations) {
    const va = board.cells[edge.a]?.value;
    const vb = board.cells[edge.b]?.value;
    if (va == null || vb == null) return false;
    if (edge.kind === 'sum' && va + vb !== edge.value) return false;
    if (edge.kind === 'diff' && Math.abs(va - vb) !== edge.value) return false;
  }
  // Parity decoration check
  for (const cell of board.cells) {
    const parity = cell.decorations.find((d) => d.kind === 'parity');
    if (!parity || cell.value === null) continue;
    const isEven = cell.value % 2 === 0;
    const requiredEven = parity.parity === 'even';
    if (isEven !== requiredEven) return false;
  }
  return true;
}

/**
 * Watches the loaded board and dispatches `finishSession` when the puzzle
 * has been solved (all cells filled, no row/col/box conflicts, all
 * decoration constraints satisfied). No-op if `finished` is already true.
 */
export function useFinishDetector(): void {
  const board = useStore((s) => s.board);
  const finished = useStore((s) => s.finished);
  const finishSession = useStore((s) => s.finishSession);

  const solved = useMemo(() => (board ? isBoardSolved(board) : false), [board]);

  useEffect(() => {
    if (solved && !finished) {
      finishSession();
    }
  }, [solved, finished, finishSession]);
}

export default useFinishDetector;
