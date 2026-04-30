import { describe, it, expect } from 'vitest';
import { idxToRC, rcToIdx, boxIndexOf, boxDims, neighborsOrth, isAdjacent } from './coords';

describe('coords', () => {
  describe('idxToRC / rcToIdx', () => {
    it('roundtrips for size 9', () => {
      for (let i = 0; i < 81; i++) {
        const { row, col } = idxToRC(i, 9);
        expect(rcToIdx(row, col, 9)).toBe(i);
      }
    });

    it('handles size 16', () => {
      expect(idxToRC(255, 16)).toEqual({ row: 15, col: 15 });
      expect(rcToIdx(8, 4, 16)).toBe(132);
    });

    it('row-major ordering', () => {
      expect(idxToRC(9, 9)).toEqual({ row: 1, col: 0 });
      expect(idxToRC(10, 9)).toEqual({ row: 1, col: 1 });
    });
  });

  describe('boxDims', () => {
    it('returns 3x3 for size 9', () => {
      expect(boxDims(9)).toEqual({ rows: 3, cols: 3 });
    });

    it('returns 4x4 for size 16', () => {
      expect(boxDims(16)).toEqual({ rows: 4, cols: 4 });
    });

    it('throws on non-square size', () => {
      expect(() => boxDims(7)).toThrow();
    });
  });

  describe('boxIndexOf', () => {
    it('returns 0 for top-left 3x3 cells in size 9', () => {
      const cells = [0, 1, 2, 9, 10, 11, 18, 19, 20];
      for (const c of cells) expect(boxIndexOf(c, 9)).toBe(0);
    });

    it('returns 4 for the center box', () => {
      const cells = [30, 31, 32, 39, 40, 41, 48, 49, 50];
      for (const c of cells) expect(boxIndexOf(c, 9)).toBe(4);
    });

    it('returns 8 for bottom-right box', () => {
      expect(boxIndexOf(80, 9)).toBe(8);
      expect(boxIndexOf(60, 9)).toBe(8);
    });

    it('handles size 16 4x4 boxes', () => {
      expect(boxIndexOf(0, 16)).toBe(0);
      expect(boxIndexOf(255, 16)).toBe(15);
      expect(boxIndexOf(68, 16)).toBe(5);
    });
  });

  describe('neighborsOrth', () => {
    it('returns 4 neighbors for inner cell', () => {
      expect([...neighborsOrth(40, 9)].sort((a, b) => a - b)).toEqual([31, 39, 41, 49]);
    });

    it('returns 2 neighbors for corner', () => {
      expect([...neighborsOrth(0, 9)].sort((a, b) => a - b)).toEqual([1, 9]);
      expect([...neighborsOrth(80, 9)].sort((a, b) => a - b)).toEqual([71, 79]);
    });

    it('returns 3 neighbors for edge', () => {
      expect([...neighborsOrth(4, 9)].sort((a, b) => a - b)).toEqual([3, 5, 13]);
    });
  });

  describe('isAdjacent', () => {
    it('detects orthogonal adjacency', () => {
      expect(isAdjacent(0, 1, 9)).toBe(true);
      expect(isAdjacent(0, 9, 9)).toBe(true);
      expect(isAdjacent(0, 10, 9)).toBe(false);
      expect(isAdjacent(0, 2, 9)).toBe(false);
      expect(isAdjacent(8, 9, 9)).toBe(false);
    });
  });
});
