import { describe, expect, it } from 'vitest';
import { hasUniqueSolution } from '@core/engine/uniqueness';
import { CLASSIC_DOMAIN, classicManifest } from './classic';

describe('classicManifest', () => {
  it('has id "classic"', () => {
    expect(classicManifest.id).toBe('classic');
  });

  it('domain values are 1..9', () => {
    expect(Array.from(classicManifest.domain.values)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(CLASSIC_DOMAIN).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('adapter.generate returns puzzle + solution with unique-solution puzzle', () => {
    const { puzzle, solution } = classicManifest.adapter.generate(42, 'easy');
    expect(puzzle.cells).toHaveLength(81);
    expect(solution.cells).toHaveLength(81);
    expect(solution.cells.every((c) => c.value !== null)).toBe(true);
    expect(hasUniqueSolution(puzzle, { timeoutMs: 5000 })).toBe(true);
  });

  it('serialize produces an 81-character string', () => {
    const { puzzle } = classicManifest.adapter.generate(7, 'easy');
    const s = classicManifest.adapter.serialize(puzzle);
    expect(s).toHaveLength(81);
  });

  it('serialize then deserialize round-trips cell values', () => {
    const { puzzle } = classicManifest.adapter.generate(123, 'easy');
    const s = classicManifest.adapter.serialize(puzzle);
    const restored = classicManifest.adapter.deserialize(s);
    expect(restored.cells).toHaveLength(puzzle.cells.length);
    for (let i = 0; i < puzzle.cells.length; i++) {
      expect(restored.cells[i]!.value).toBe(puzzle.cells[i]!.value);
    }
  });

  it('same seed twice produces the same puzzle', () => {
    const a = classicManifest.adapter.generate(99, 'easy');
    const b = classicManifest.adapter.generate(99, 'easy');
    expect(classicManifest.adapter.serialize(a.puzzle)).toBe(
      classicManifest.adapter.serialize(b.puzzle),
    );
  });
});
