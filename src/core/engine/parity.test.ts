import { describe, it, expect } from 'vitest';
import { createEmptyBoard, maskToDigits, maskOfAll } from '../board';
import type { Digit } from '../types';
import {
  applyParityMasks,
  getParityDecoration,
  getParityOfDigit,
  parityMask,
} from './parity';

const DOMAIN: readonly Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

describe('getParityOfDigit', () => {
  it('returns "even" for even digits', () => {
    expect(getParityOfDigit(2)).toBe('even');
    expect(getParityOfDigit(4)).toBe('even');
    expect(getParityOfDigit(8)).toBe('even');
  });

  it('returns "odd" for odd digits', () => {
    expect(getParityOfDigit(1)).toBe('odd');
    expect(getParityOfDigit(7)).toBe('odd');
    expect(getParityOfDigit(9)).toBe('odd');
  });
});

describe('parityMask', () => {
  it('"even" yields exactly [2,4,6,8]', () => {
    const mask = parityMask('even', DOMAIN);
    expect(maskToDigits(mask, DOMAIN)).toEqual([2, 4, 6, 8]);
  });

  it('"odd" yields exactly [1,3,5,7,9]', () => {
    const mask = parityMask('odd', DOMAIN);
    expect(maskToDigits(mask, DOMAIN)).toEqual([1, 3, 5, 7, 9]);
  });
});

describe('applyParityMasks', () => {
  it('restricts decorated empty cells and leaves others alone', () => {
    const board = createEmptyBoard(9, DOMAIN, 'parity');
    const all = maskOfAll(DOMAIN);

    board.cells[0]!.decorations.push({ kind: 'parity', parity: 'even' });
    board.cells[5]!.decorations.push({ kind: 'parity', parity: 'odd' });

    applyParityMasks(board);

    expect(board.cells[0]!.candidates).toBe(parityMask('even', DOMAIN));
    expect(board.cells[5]!.candidates).toBe(parityMask('odd', DOMAIN));
    // Untouched cells keep the full domain.
    expect(board.cells[1]!.candidates).toBe(all);
    expect(board.cells[80]!.candidates).toBe(all);
  });

  it('is idempotent — second call produces the same candidates', () => {
    const board = createEmptyBoard(9, DOMAIN, 'parity');
    board.cells[3]!.decorations.push({ kind: 'parity', parity: 'even' });
    board.cells[7]!.decorations.push({ kind: 'parity', parity: 'odd' });

    applyParityMasks(board);
    const snap = board.cells.map((c) => c.candidates);
    applyParityMasks(board);
    const after = board.cells.map((c) => c.candidates);

    expect(after).toEqual(snap);
  });

  it('does not modify cells with a value already set (candidates stay 0)', () => {
    const board = createEmptyBoard(9, DOMAIN, 'parity');
    const cell = board.cells[10]!;
    cell.value = 4;
    cell.candidates = 0;
    cell.decorations.push({ kind: 'parity', parity: 'even' });

    applyParityMasks(board);

    expect(cell.candidates).toBe(0);
  });
});

describe('getParityDecoration', () => {
  it('returns the parity for a decorated cell', () => {
    const board = createEmptyBoard(9, DOMAIN, 'parity');
    board.cells[2]!.decorations.push({ kind: 'parity', parity: 'odd' });
    expect(getParityDecoration(board, 2)).toBe('odd');
  });

  it('returns null when no parity decoration is present', () => {
    const board = createEmptyBoard(9, DOMAIN, 'parity');
    expect(getParityDecoration(board, 0)).toBeNull();
  });
});
