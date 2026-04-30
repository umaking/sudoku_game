import type { Board, CandidateMask, CellIdx, Digit } from '../types';
import { digitsToMask } from '../board';

export type Parity = 'even' | 'odd';

export function getParityOfDigit(d: Digit): Parity {
  return d % 2 === 0 ? 'even' : 'odd';
}

export function parityMask(parity: Parity, domain: readonly Digit[]): CandidateMask {
  const filtered: Digit[] = [];
  for (const d of domain) {
    if (getParityOfDigit(d) === parity) filtered.push(d);
  }
  return digitsToMask(filtered, domain);
}

/** Returns the parity decoration on a cell, or null if none. */
export function getParityDecoration(board: Board, idx: CellIdx): Parity | null {
  const cell = board.cells[idx];
  if (!cell) return null;
  for (const deco of cell.decorations) {
    if (deco.kind === 'parity') return deco.parity;
  }
  return null;
}

/**
 * For each cell with a parity decoration, restrict cell.candidates to digits
 * matching the decoration's parity. Given/filled cells (candidates === 0) are
 * left untouched. Idempotent.
 */
export function applyParityMasks(board: Board): void {
  for (let i = 0; i < board.cells.length; i++) {
    const cell = board.cells[i]!;
    if (cell.value !== null) continue;
    const parity = getParityDecoration(board, i);
    if (parity === null) continue;
    cell.candidates = cell.candidates & parityMask(parity, board.domain);
  }
}
