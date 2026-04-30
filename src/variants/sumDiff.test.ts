import { beforeEach, describe, expect, it } from 'vitest';
import { hasUniqueSolution } from '@core/engine/uniqueness';
import { boardToString } from '@core/board';
import { clearRegistry } from './registry';
import { SUMDIFF_DOMAIN, sumDiffManifest } from './sumDiff';

describe('sumDiffManifest', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('has id "sum-diff" and edge-label visual channels', () => {
    expect(sumDiffManifest.id).toBe('sum-diff');
    expect(sumDiffManifest.visualChannels).toContain('edge-label-sum');
    expect(sumDiffManifest.visualChannels).toContain('edge-label-diff');
  });

  it('domain values are 1..9', () => {
    expect(Array.from(sumDiffManifest.domain.values)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(Array.from(SUMDIFF_DOMAIN)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('adapter.generate(42, "easy") yields a sum-diff puzzle with edges and unique solution', () => {
    const { puzzle, solution } = sumDiffManifest.adapter.generate(42, 'easy');
    expect(puzzle.variantId).toBe('sum-diff');
    expect(puzzle.cells).toHaveLength(81);
    expect(solution.cells).toHaveLength(81);
    expect(solution.cells.every((c) => c.value !== null)).toBe(true);
    expect(puzzle.edgeDecorations.length).toBeGreaterThan(0);

    const constraints = sumDiffManifest.adapter.buildConstraints!(puzzle);
    expect(
      hasUniqueSolution(puzzle, { constraints, timeoutMs: 5000 }),
    ).toBe(true);
  });

  it('same seed twice produces identical serialization', () => {
    const a = sumDiffManifest.adapter.generate(123, 'easy');
    const b = sumDiffManifest.adapter.generate(123, 'easy');
    expect(sumDiffManifest.adapter.serialize(a.puzzle)).toBe(
      sumDiffManifest.adapter.serialize(b.puzzle),
    );
  });

  it('serialize/deserialize round-trips values and edges and stays unique', () => {
    const { puzzle } = sumDiffManifest.adapter.generate(7, 'easy');
    const s = sumDiffManifest.adapter.serialize(puzzle);
    const restored = sumDiffManifest.adapter.deserialize(s);

    expect(boardToString(restored)).toBe(boardToString(puzzle));
    expect(restored.edgeDecorations.length).toBe(puzzle.edgeDecorations.length);
    for (let i = 0; i < puzzle.edgeDecorations.length; i++) {
      const orig = puzzle.edgeDecorations[i]!;
      const back = restored.edgeDecorations[i]!;
      expect(back.kind).toBe(orig.kind);
      expect(back.a).toBe(orig.a);
      expect(back.b).toBe(orig.b);
      expect(back.value).toBe(orig.value);
    }
    const constraints = sumDiffManifest.adapter.buildConstraints!(restored);
    expect(
      hasUniqueSolution(restored, { constraints, timeoutMs: 5000 }),
    ).toBe(true);
  });

  it('deserializes a board with no edges (empty edges segment) like an empty Classic board', () => {
    const values = '.'.repeat(81);
    const board = sumDiffManifest.adapter.deserialize(`${values}|`);
    expect(board.variantId).toBe('sum-diff');
    expect(board.cells).toHaveLength(81);
    expect(board.cells.every((c) => c.value === null)).toBe(true);
    expect(board.edgeDecorations).toEqual([]);
  });

  it('deserialize throws on invalid edge kind', () => {
    const values = '.'.repeat(81);
    expect(() =>
      sumDiffManifest.adapter.deserialize(`${values}|x:0:1:6`),
    ).toThrow(/Invalid edge kind/);
  });

  it('deserialize throws when edge value is NaN or record malformed', () => {
    const values = '.'.repeat(81);
    expect(() =>
      sumDiffManifest.adapter.deserialize(`${values}|s:0:1:abc`),
    ).toThrow(/Invalid edge numbers/);
    expect(() =>
      sumDiffManifest.adapter.deserialize(`${values}|s:0:1`),
    ).toThrow(/Invalid edge record/);
  });

  it('deserialize throws when values part is missing', () => {
    expect(() => sumDiffManifest.adapter.deserialize('|')).toThrow(/missing values/);
  });

  it('buildConstraints length equals puzzle.edgeDecorations.length', () => {
    const { puzzle } = sumDiffManifest.adapter.generate(99, 'easy');
    const constraints = sumDiffManifest.adapter.buildConstraints!(puzzle);
    expect(constraints.length).toBe(puzzle.edgeDecorations.length);
  });
});
