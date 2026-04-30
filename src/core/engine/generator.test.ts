import { describe, it, expect } from 'vitest';
import { boardToString } from '../board';
import { generateClassic, generateParity, generateSumDiff } from './generator';
import { hasUniqueSolution } from './uniqueness';
import { applyParityMasks, getParityDecoration, parityMask } from './parity';
import { buildEdgeConstraintsFromBoard } from './sumDiff';
import type { Difficulty, EdgeDecoration } from '../types';
import { cloneBoard } from '../board';

function serializeEdges(edges: readonly EdgeDecoration[]): string {
  return edges
    .map((e) => `${e.kind}:${e.a}-${e.b}=${e.value}`)
    .slice()
    .sort()
    .join('|');
}

describe('generateClassic', () => {
  it('produces a puzzle with a unique solution (easy)', () => {
    const result = generateClassic({ seed: 42, difficulty: 'easy', timeoutMs: 5000 });
    expect(hasUniqueSolution(result.puzzle, { timeoutMs: 5000 })).toBe(true);
  });

  it('is deterministic for the same seed and difficulty', () => {
    const a = generateClassic({ seed: 1234, difficulty: 'medium', timeoutMs: 5000 });
    const b = generateClassic({ seed: 1234, difficulty: 'medium', timeoutMs: 5000 });
    expect(boardToString(a.puzzle)).toBe(boardToString(b.puzzle));
    expect(boardToString(a.solution)).toBe(boardToString(b.solution));
  });

  it('hits the easy clue floor (>= 36)', () => {
    const result = generateClassic({ seed: 7, difficulty: 'easy', timeoutMs: 5000 });
    expect(result.cluesCount).toBeGreaterThanOrEqual(36);
  });

  it('hits the expert clue floor (>= 22)', () => {
    const result = generateClassic({ seed: 7, difficulty: 'expert', timeoutMs: 5000 });
    expect(result.cluesCount).toBeGreaterThanOrEqual(22);
  });

  it('produces unique-solution puzzles across multiple seeds', () => {
    const seeds = [1, 2, 3, 4, 5];
    for (const seed of seeds) {
      const result = generateClassic({ seed, difficulty: 'medium', timeoutMs: 5000 });
      expect(hasUniqueSolution(result.puzzle, { timeoutMs: 5000 })).toBe(true);
    }
  });

  it('completes within the timeout', () => {
    const start = Date.now();
    const result = generateClassic({ seed: 99, difficulty: 'hard', timeoutMs: 5000 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThanOrEqual(6000);
    expect(result.puzzle).toBeDefined();
  });
});

describe('generateParity', () => {
  it('attaches parity decorations and produces a uniquely solvable puzzle', () => {
    const result = generateParity({ seed: 42, difficulty: 'easy', timeoutMs: 5000 });
    expect(result.puzzle.variantId).toBe('parity');

    let decoratedCount = 0;
    for (let i = 0; i < result.puzzle.cells.length; i++) {
      if (getParityDecoration(result.puzzle, i) !== null) decoratedCount++;
    }
    expect(decoratedCount).toBeGreaterThan(0);

    // Re-applying parity masks to a fresh clone must still yield a unique solution.
    const probe = cloneBoard(result.puzzle);
    applyParityMasks(probe);
    expect(hasUniqueSolution(probe, { timeoutMs: 5000 })).toBe(true);
  });

  it('is deterministic for the same seed and difficulty', () => {
    const a = generateParity({ seed: 1234, difficulty: 'medium', timeoutMs: 5000 });
    const b = generateParity({ seed: 1234, difficulty: 'medium', timeoutMs: 5000 });
    expect(boardToString(a.puzzle)).toBe(boardToString(b.puzzle));
    expect(boardToString(a.solution)).toBe(boardToString(b.solution));

    const aPattern = a.puzzle.cells.map((_, i) => `${i}:${getParityDecoration(a.puzzle, i) ?? '-'}`);
    const bPattern = b.puzzle.cells.map((_, i) => `${i}:${getParityDecoration(b.puzzle, i) ?? '-'}`);
    expect(aPattern).toEqual(bPattern);
  });

  it('produces unique-solution puzzles across all difficulties', () => {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
    for (const difficulty of difficulties) {
      const result = generateParity({ seed: 11, difficulty, timeoutMs: 5000 });
      const probe = cloneBoard(result.puzzle);
      applyParityMasks(probe);
      expect(hasUniqueSolution(probe, { timeoutMs: 5000 })).toBe(true);
    }
  });

  it('candidates of decorated cells are a subset of the parity mask', () => {
    const result = generateParity({ seed: 7, difficulty: 'medium', timeoutMs: 5000 });
    const domain = result.puzzle.domain;
    for (let i = 0; i < result.puzzle.cells.length; i++) {
      const cell = result.puzzle.cells[i]!;
      if (cell.value !== null) continue;
      const parity = getParityDecoration(result.puzzle, i);
      if (parity === null) continue;
      const mask = parityMask(parity, domain);
      // Cell.candidates must be a subset of the parity mask.
      expect(cell.candidates & ~mask).toBe(0);
    }
  });
});

describe('generateSumDiff', () => {
  it('produces a uniquely-solvable sum-diff puzzle (easy)', () => {
    const result = generateSumDiff({ seed: 42, difficulty: 'easy', timeoutMs: 8000 });
    expect(result.puzzle.variantId).toBe('sum-diff');
    expect(result.puzzle.edgeDecorations.length).toBeGreaterThan(0);
    const constraints = buildEdgeConstraintsFromBoard(result.puzzle);
    expect(hasUniqueSolution(result.puzzle, { constraints, timeoutMs: 5000 })).toBe(true);
  });

  it('is deterministic for the same seed and difficulty', () => {
    const a = generateSumDiff({ seed: 1234, difficulty: 'medium', timeoutMs: 8000 });
    const b = generateSumDiff({ seed: 1234, difficulty: 'medium', timeoutMs: 8000 });
    expect(boardToString(a.puzzle)).toBe(boardToString(b.puzzle));
    expect(boardToString(a.solution)).toBe(boardToString(b.solution));
    expect(serializeEdges(a.puzzle.edgeDecorations)).toBe(
      serializeEdges(b.puzzle.edgeDecorations),
    );
  });

  it('produces unique-solution puzzles across all difficulties', () => {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
    for (const difficulty of difficulties) {
      const result = generateSumDiff({ seed: 11, difficulty, timeoutMs: 10000 });
      const constraints = buildEdgeConstraintsFromBoard(result.puzzle);
      expect(hasUniqueSolution(result.puzzle, { constraints, timeoutMs: 5000 })).toBe(true);
    }
  });

  it('every edge decoration agrees with the solution', () => {
    const result = generateSumDiff({ seed: 7, difficulty: 'medium', timeoutMs: 8000 });
    for (const edge of result.puzzle.edgeDecorations) {
      const va = result.solution.cells[edge.a]!.value!;
      const vb = result.solution.cells[edge.b]!.value!;
      const expected = edge.kind === 'sum' ? va + vb : Math.abs(va - vb);
      expect(edge.value).toBe(expected);
    }
  });
});
