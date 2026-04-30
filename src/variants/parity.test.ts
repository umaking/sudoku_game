import { beforeEach, describe, expect, it } from 'vitest';
import { hasUniqueSolution } from '@core/engine/uniqueness';
import { getParityDecoration } from '@core/engine/parity';
import { clearRegistry } from './registry';
import { PARITY_DOMAIN, parityManifest } from './parity';

describe('parityManifest', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('has id "parity" and visual channel cell-bg-parity', () => {
    expect(parityManifest.id).toBe('parity');
    expect(parityManifest.visualChannels).toContain('cell-bg-parity');
  });

  it('domain values are 1..9', () => {
    expect(Array.from(parityManifest.domain.values)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(Array.from(PARITY_DOMAIN)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('adapter.generate(42, "easy") yields a parity puzzle with decorations and unique solution', () => {
    const { puzzle, solution } = parityManifest.adapter.generate(42, 'easy');
    expect(puzzle.variantId).toBe('parity');
    expect(puzzle.cells).toHaveLength(81);
    expect(solution.cells).toHaveLength(81);
    expect(solution.cells.every((c) => c.value !== null)).toBe(true);

    const decoCount = puzzle.cells.reduce(
      (n, c) => n + (c.decorations.some((d) => d.kind === 'parity') ? 1 : 0),
      0,
    );
    expect(decoCount).toBeGreaterThan(0);

    expect(hasUniqueSolution(puzzle, { timeoutMs: 5000 })).toBe(true);
  });

  it('same seed twice produces identical serialization', () => {
    const a = parityManifest.adapter.generate(123, 'easy');
    const b = parityManifest.adapter.generate(123, 'easy');
    expect(parityManifest.adapter.serialize(a.puzzle)).toBe(
      parityManifest.adapter.serialize(b.puzzle),
    );
  });

  it('serialize/deserialize round-trips values and parity decorations and stays unique', () => {
    const { puzzle } = parityManifest.adapter.generate(7, 'easy');
    const s = parityManifest.adapter.serialize(puzzle);
    const restored = parityManifest.adapter.deserialize(s);

    expect(restored.cells).toHaveLength(puzzle.cells.length);
    for (let i = 0; i < puzzle.cells.length; i++) {
      const orig = puzzle.cells[i]!;
      const back = restored.cells[i]!;
      expect(back.value).toBe(orig.value);
      expect(getParityDecoration(restored, i)).toBe(getParityDecoration(puzzle, i));
    }
    expect(hasUniqueSolution(restored, { timeoutMs: 5000 })).toBe(true);
  });

  it('serialize result splits on "|" into two parts of size² length each', () => {
    const { puzzle } = parityManifest.adapter.generate(99, 'easy');
    const s = parityManifest.adapter.serialize(puzzle);
    const parts = s.split('|');
    expect(parts).toHaveLength(2);
    const expectedLen = puzzle.size * puzzle.size;
    expect(parts[0]!.length).toBe(expectedLen);
    expect(parts[1]!.length).toBe(expectedLen);
  });

  it('deserializes a parity-string with no decorations (all dots) like a Classic board', () => {
    const values = '.'.repeat(81);
    const parities = '.'.repeat(81);
    const board = parityManifest.adapter.deserialize(`${values}|${parities}`);
    expect(board.variantId).toBe('parity');
    expect(board.cells).toHaveLength(81);
    expect(board.cells.every((c) => c.value === null)).toBe(true);
    expect(board.cells.every((c) => c.decorations.length === 0)).toBe(true);
    // Without decorations, every empty cell should keep the full 1..9 candidate
    // mask (just like Classic).
    const fullMask = (1 << 9) - 1;
    expect(board.cells.every((c) => c.candidates === fullMask)).toBe(true);
  });

  it('deserialize throws when values part is missing', () => {
    expect(() => parityManifest.adapter.deserialize('|')).toThrow(/missing values/);
  });
});
