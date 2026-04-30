import { describe, it, expect } from 'vitest';
import type { Move } from './types';
import {
  createEmptyBoard,
  cloneBoard,
  buildStandardRegions,
  applyMove,
  applyMoveInPlace,
  revertMoveInPlace,
  setValueInPlace,
  boardFromString,
  boardToString,
  maskOfAll,
  maskToDigits,
  digitsToMask,
  addCandidate,
  removeCandidate,
  hasCandidate,
  toggleCandidate,
  popCount,
  lowestBitDigit,
} from './board';

const CLASSIC_DOMAIN = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

describe('bitmask helpers', () => {
  it('maskOfAll for classic domain has 9 bits', () => {
    expect(maskOfAll(CLASSIC_DOMAIN)).toBe(0b111111111);
    expect(popCount(maskOfAll(CLASSIC_DOMAIN))).toBe(9);
  });

  it('digitsToMask / maskToDigits roundtrip', () => {
    const m = digitsToMask([1, 3, 5], CLASSIC_DOMAIN);
    expect(maskToDigits(m, CLASSIC_DOMAIN)).toEqual([1, 3, 5]);
  });

  it('addCandidate / removeCandidate / hasCandidate', () => {
    let m = 0;
    m = addCandidate(m, 5, CLASSIC_DOMAIN);
    expect(hasCandidate(m, 5, CLASSIC_DOMAIN)).toBe(true);
    expect(hasCandidate(m, 4, CLASSIC_DOMAIN)).toBe(false);
    m = removeCandidate(m, 5, CLASSIC_DOMAIN);
    expect(hasCandidate(m, 5, CLASSIC_DOMAIN)).toBe(false);
  });

  it('toggleCandidate flips bit', () => {
    let m = 0;
    m = toggleCandidate(m, 7, CLASSIC_DOMAIN);
    expect(hasCandidate(m, 7, CLASSIC_DOMAIN)).toBe(true);
    m = toggleCandidate(m, 7, CLASSIC_DOMAIN);
    expect(hasCandidate(m, 7, CLASSIC_DOMAIN)).toBe(false);
  });

  it('popCount counts bits', () => {
    expect(popCount(0)).toBe(0);
    expect(popCount(0b101)).toBe(2);
    expect(popCount(maskOfAll(CLASSIC_DOMAIN))).toBe(9);
  });

  it('lowestBitDigit returns smallest candidate', () => {
    const m = digitsToMask([3, 5, 7], CLASSIC_DOMAIN);
    expect(lowestBitDigit(m, CLASSIC_DOMAIN)).toBe(3);
    expect(lowestBitDigit(0, CLASSIC_DOMAIN)).toBeNull();
  });
});

describe('createEmptyBoard', () => {
  it('creates 81 empty cells with all candidates', () => {
    const b = createEmptyBoard(9, CLASSIC_DOMAIN, 'classic');
    expect(b.cells).toHaveLength(81);
    for (const c of b.cells) {
      expect(c.value).toBeNull();
      expect(c.candidates).toBe(maskOfAll(CLASSIC_DOMAIN));
      expect(c.given).toBe(false);
      expect(c.decorations).toEqual([]);
    }
  });

  it('builds 27 standard regions for size 9', () => {
    const r = buildStandardRegions(9);
    expect(r).toHaveLength(27);
    expect(r.filter((x) => x.kind === 'row')).toHaveLength(9);
    expect(r.filter((x) => x.kind === 'col')).toHaveLength(9);
    expect(r.filter((x) => x.kind === 'box')).toHaveLength(9);
    for (const reg of r) expect(reg.cells).toHaveLength(9);
  });

  it('boxes have correct cells', () => {
    const r = buildStandardRegions(9);
    const box0 = r.find((x) => x.id === 'box-0')!;
    expect([...box0.cells].sort((a, b) => a - b)).toEqual([0, 1, 2, 9, 10, 11, 18, 19, 20]);
    const box4 = r.find((x) => x.id === 'box-4')!;
    expect([...box4.cells].sort((a, b) => a - b)).toEqual([30, 31, 32, 39, 40, 41, 48, 49, 50]);
    const box8 = r.find((x) => x.id === 'box-8')!;
    expect([...box8.cells].sort((a, b) => a - b)).toEqual([60, 61, 62, 69, 70, 71, 78, 79, 80]);
  });
});

describe('moves', () => {
  it('applyMove set returns new board, original unchanged', () => {
    const b = createEmptyBoard(9, CLASSIC_DOMAIN, 'classic');
    const move: Move = {
      id: 'm1',
      kind: 'set',
      idx: 0,
      digit: 5,
      prev: { value: b.cells[0]!.value, candidates: b.cells[0]!.candidates },
    };
    const b2 = applyMove(b, move);
    expect(b.cells[0]!.value).toBeNull();
    expect(b2.cells[0]!.value).toBe(5);
    expect(b2.cells[0]!.candidates).toBe(0);
  });

  it('revertMoveInPlace restores prev state', () => {
    const b = createEmptyBoard(9, CLASSIC_DOMAIN, 'classic');
    const prevCands = b.cells[0]!.candidates;
    const move: Move = {
      id: 'm1',
      kind: 'set',
      idx: 0,
      digit: 5,
      prev: { value: null, candidates: prevCands },
    };
    applyMoveInPlace(b, move);
    expect(b.cells[0]!.value).toBe(5);
    revertMoveInPlace(b, move);
    expect(b.cells[0]!.value).toBeNull();
    expect(b.cells[0]!.candidates).toBe(prevCands);
  });

  it('clear move sets value to null', () => {
    const b = createEmptyBoard(9, CLASSIC_DOMAIN, 'classic');
    setValueInPlace(b, 5, 7);
    const move: Move = {
      id: 'm2',
      kind: 'clear',
      idx: 5,
      prev: { value: 7, candidates: 0 },
    };
    applyMoveInPlace(b, move);
    expect(b.cells[5]!.value).toBeNull();
  });

  it('candidate-toggle flips candidate bit', () => {
    const b = createEmptyBoard(9, CLASSIC_DOMAIN, 'classic');
    setValueInPlace(b, 0, 1);
    b.cells[0]!.value = null;
    b.cells[0]!.candidates = 0;
    const move: Move = {
      id: 'm3',
      kind: 'candidate-toggle',
      idx: 0,
      digit: 4,
      prev: { value: null, candidates: 0 },
    };
    applyMoveInPlace(b, move);
    expect(hasCandidate(b.cells[0]!.candidates, 4, CLASSIC_DOMAIN)).toBe(true);
    applyMoveInPlace(b, move);
    expect(hasCandidate(b.cells[0]!.candidates, 4, CLASSIC_DOMAIN)).toBe(false);
  });
});

describe('boardFromString / boardToString', () => {
  const puzzle =
    '530070000600195000098000060800060003400803001700020006060000280000419005000080079';

  it('parses 81-char string', () => {
    const b = boardFromString(puzzle, CLASSIC_DOMAIN);
    expect(b.cells[0]!.value).toBe(5);
    expect(b.cells[0]!.given).toBe(true);
    expect(b.cells[3]!.value).toBeNull();
    expect(b.cells[3]!.given).toBe(false);
  });

  it('roundtrips via boardToString', () => {
    const b = boardFromString(puzzle, CLASSIC_DOMAIN);
    expect(boardToString(b)).toBe(puzzle.replaceAll('0', '.'));
  });

  it('throws on invalid length', () => {
    expect(() => boardFromString('123', CLASSIC_DOMAIN)).toThrow();
  });
});

describe('cloneBoard', () => {
  it('is independent from original', () => {
    const b = createEmptyBoard(9, CLASSIC_DOMAIN, 'classic');
    const b2 = cloneBoard(b);
    setValueInPlace(b2, 0, 5);
    expect(b.cells[0]!.value).toBeNull();
    expect(b2.cells[0]!.value).toBe(5);
  });
});
