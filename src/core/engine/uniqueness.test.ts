import { describe, it, expect } from 'vitest';
import { boardFromString } from '../board';
import type { Digit } from '../types';
import { hasUniqueSolution, countSolutions } from './uniqueness';

const DOMAIN: readonly Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

describe('hasUniqueSolution', () => {
  it('returns true for a known unique-solution puzzle', () => {
    const puzzle =
      '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const board = boardFromString(puzzle, DOMAIN);
    expect(hasUniqueSolution(board, { timeoutMs: 5000 })).toBe(true);
  });

  it('returns false for an empty board (many solutions)', () => {
    const board = boardFromString('.'.repeat(81), DOMAIN);
    expect(hasUniqueSolution(board, { timeoutMs: 5000 })).toBe(false);
  });

  it('returns false for conflicting givens', () => {
    const board = boardFromString('11' + '.'.repeat(79), DOMAIN);
    expect(hasUniqueSolution(board, { timeoutMs: 5000 })).toBe(false);
  });
});

describe('countSolutions', () => {
  it('caps at max for an empty board', () => {
    const board = boardFromString('.'.repeat(81), DOMAIN);
    expect(countSolutions(board, { max: 5, timeoutMs: 5000 })).toBe(5);
  });
});
