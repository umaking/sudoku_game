import { describe, it, expect } from 'vitest';
import { createEmptyBoard } from '../board';
import type { Board, EdgeDecoration } from '../types';
import {
  buildEdgeConstraint,
  buildEdgeConstraintsFromBoard,
  findAllAdjacentPairs,
  findEmptyAdjacentPairs,
} from './sumDiff';

const DOMAIN = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function makeBoard(): Board {
  return createEmptyBoard(9, DOMAIN, 'sum-diff');
}

describe('buildEdgeConstraint (sum)', () => {
  const edge: EdgeDecoration = { kind: 'sum', a: 0, b: 1, value: 10 };
  const constraint = buildEdgeConstraint(edge);

  it('accepts when both endpoints satisfy the sum', () => {
    const board = makeBoard();
    board.cells[1]!.value = 7;
    expect(constraint.predicate({ board, idx: 0, digit: 3 })).toBe(true);
  });

  it('rejects when the sum is wrong', () => {
    const board = makeBoard();
    board.cells[1]!.value = 6;
    expect(constraint.predicate({ board, idx: 0, digit: 3 })).toBe(false);
  });

  it('returns true for cells unrelated to the edge', () => {
    const board = makeBoard();
    board.cells[1]!.value = 6;
    expect(constraint.predicate({ board, idx: 5, digit: 9 })).toBe(true);
  });

  it('returns true when the other endpoint is empty', () => {
    const board = makeBoard();
    expect(constraint.predicate({ board, idx: 0, digit: 3 })).toBe(true);
  });

  it('symmetric on the other endpoint', () => {
    const board = makeBoard();
    board.cells[0]!.value = 4;
    expect(constraint.predicate({ board, idx: 1, digit: 6 })).toBe(true);
    expect(constraint.predicate({ board, idx: 1, digit: 5 })).toBe(false);
  });
});

describe('buildEdgeConstraint (diff)', () => {
  const edge: EdgeDecoration = { kind: 'diff', a: 10, b: 11, value: 4 };
  const constraint = buildEdgeConstraint(edge);

  it('accepts when |digit - other| matches the diff value', () => {
    const board = makeBoard();
    board.cells[11]!.value = 7;
    expect(constraint.predicate({ board, idx: 10, digit: 3 })).toBe(true);
    expect(constraint.predicate({ board, idx: 10, digit: 11 })).toBe(true); // 11-7=4 (just to verify abs)
  });

  it('rejects when |digit - other| does not match', () => {
    const board = makeBoard();
    board.cells[11]!.value = 7;
    expect(constraint.predicate({ board, idx: 10, digit: 5 })).toBe(false);
  });

  it('returns true when the other endpoint is empty', () => {
    const board = makeBoard();
    expect(constraint.predicate({ board, idx: 10, digit: 3 })).toBe(true);
  });

  it('produces an edge visual hint referencing both endpoints', () => {
    expect(constraint.visualHint).toEqual({
      channel: 'edge',
      edges: [{ a: 10, b: 11 }],
    });
  });
});

describe('buildEdgeConstraintsFromBoard', () => {
  it('returns an empty array when the board has no edge decorations', () => {
    const board = makeBoard();
    expect(buildEdgeConstraintsFromBoard(board)).toEqual([]);
  });

  it('produces one constraint per edge decoration', () => {
    const board = makeBoard();
    board.edgeDecorations = [
      { kind: 'sum', a: 0, b: 1, value: 5 },
      { kind: 'diff', a: 1, b: 2, value: 3 },
      { kind: 'sum', a: 9, b: 10, value: 12 },
    ];
    const constraints = buildEdgeConstraintsFromBoard(board);
    expect(constraints).toHaveLength(3);
    expect(constraints.map((c) => c.id)).toEqual([
      'edge-sum-0-1-5',
      'edge-diff-1-2-3',
      'edge-sum-9-10-12',
    ]);
  });
});

describe('findAllAdjacentPairs', () => {
  it('returns 144 ordered pairs on a 9x9 grid', () => {
    const pairs = findAllAdjacentPairs(9);
    // 9 rows * 8 horizontal neighbours + 8 rows * 9 vertical neighbours = 72 + 72.
    expect(pairs).toHaveLength(144);
  });

  it('every pair is sorted with a < b', () => {
    for (const [a, b] of findAllAdjacentPairs(9)) {
      expect(a).toBeLessThan(b);
    }
  });

  it('contains no duplicate pairs', () => {
    const pairs = findAllAdjacentPairs(9);
    const set = new Set(pairs.map(([a, b]) => `${a}-${b}`));
    expect(set.size).toBe(pairs.length);
  });
});

describe('findEmptyAdjacentPairs', () => {
  it('returns all 144 pairs on a fully empty 9x9 board', () => {
    const board = makeBoard();
    expect(findEmptyAdjacentPairs(board)).toHaveLength(144);
  });

  it('returns no pairs when every cell has a value', () => {
    const board = makeBoard();
    for (const cell of board.cells) cell.value = 1;
    expect(findEmptyAdjacentPairs(board)).toHaveLength(0);
  });

  it('returns only pairs where both cells are empty', () => {
    const board = makeBoard();
    // Fill cell 0 — pairs (0,1) and (0,9) should drop out.
    board.cells[0]!.value = 5;
    const pairs = findEmptyAdjacentPairs(board);
    expect(pairs).toHaveLength(144 - 2);
    for (const [a, b] of pairs) {
      expect(a).not.toBe(0);
      expect(b).not.toBe(0);
    }
  });
});
