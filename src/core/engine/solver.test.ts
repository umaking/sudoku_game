import { describe, it, expect } from 'vitest';
import { solve } from './solver';
import { boardFromString, boardToString } from '../board';

const CLASSIC_DOMAIN = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

describe('solver', () => {
  it('solves an easy puzzle', () => {
    const puzzle =
      '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const expected =
      '534678912672195348198342567859761423426853791713924856961537284287419635345286179';
    const b = boardFromString(puzzle, CLASSIC_DOMAIN);
    const r = solve(b);
    expect(r.solutions).toHaveLength(1);
    expect(boardToString(r.solutions[0]!)).toBe(expected);
  });

  it('solves a 17-clue puzzle', () => {
    const puzzle =
      '000000010400000000020000000000050407008000300001090000300400200050100000000806000';
    const expected =
      '693784512487512936125963874932651487568247391741398625319475268856129743274836159';
    const b = boardFromString(puzzle, CLASSIC_DOMAIN);
    const r = solve(b, { timeoutMs: 10000 });
    expect(r.timedOut).toBe(false);
    expect(r.solutions).toHaveLength(1);
    expect(boardToString(r.solutions[0]!)).toBe(expected);
  });

  it('finds up to maxSolutions on empty board', () => {
    const b = boardFromString('.'.repeat(81), CLASSIC_DOMAIN);
    const r = solve(b, { maxSolutions: 2 });
    expect(r.solutions).toHaveLength(2);
  });

  it('returns no solutions for puzzle with conflicting givens', () => {
    const puzzle = '11' + '.'.repeat(79);
    const b = boardFromString(puzzle, CLASSIC_DOMAIN);
    const r = solve(b);
    expect(r.solutions).toHaveLength(0);
  });

  it('does not mutate the input board', () => {
    const puzzle =
      '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const b = boardFromString(puzzle, CLASSIC_DOMAIN);
    const before = boardToString(b);
    solve(b);
    expect(boardToString(b)).toBe(before);
  });

  it('respects timeoutMs', () => {
    const b = boardFromString('.'.repeat(81), CLASSIC_DOMAIN);
    const r = solve(b, { maxSolutions: 1_000_000_000, timeoutMs: 1 });
    expect(r.timedOut).toBe(true);
  });
});
