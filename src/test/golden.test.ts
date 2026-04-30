import { describe, it, expect } from 'vitest';
import { classicManifest } from '@variants/classic';
import { parityManifest } from '@variants/parity';
import { sumDiffManifest } from '@variants/sumDiff';
import { hasUniqueSolution } from '@core/engine/uniqueness';
import { solve } from '@core/engine/solver';
import { boardToString } from '@core/board';
import { getParityDecoration } from '@core/engine/parity';
import { buildEdgeConstraintsFromBoard } from '@core/engine/sumDiff';

describe('M1 golden scenario — end-to-end Classic pipeline', () => {
  it('generates a Classic puzzle that solves to the generator-reported solution', () => {
    const { puzzle, solution } = classicManifest.adapter.generate(42, 'easy');

    expect(hasUniqueSolution(puzzle, { timeoutMs: 5000 })).toBe(true);

    const r = solve(puzzle, { timeoutMs: 5000 });
    expect(r.solutions).toHaveLength(1);
    expect(boardToString(r.solutions[0]!)).toBe(boardToString(solution));
  });

  it('serialize/deserialize roundtrip preserves a generated puzzle', () => {
    const { puzzle } = classicManifest.adapter.generate(7, 'medium');
    const s = classicManifest.adapter.serialize(puzzle);
    const round = classicManifest.adapter.deserialize(s);
    expect(boardToString(round)).toBe(boardToString(puzzle));
  });

  it('different difficulties produce solvable Classic puzzles', () => {
    const difficulties = ['easy', 'medium', 'hard', 'expert'] as const;
    for (const d of difficulties) {
      const { puzzle } = classicManifest.adapter.generate(100, d);
      expect(hasUniqueSolution(puzzle, { timeoutMs: 5000 })).toBe(true);
    }
  });
});

describe('M2 golden scenario — Parity pipeline', () => {
  it('generates a Parity puzzle with parity decorations and unique solution', () => {
    const { puzzle, solution } = parityManifest.adapter.generate(42, 'easy');
    expect(puzzle.variantId).toBe('parity');
    expect(hasUniqueSolution(puzzle, { timeoutMs: 5000 })).toBe(true);

    const decoratedCount = puzzle.cells.reduce(
      (acc, _, i) => acc + (getParityDecoration(puzzle, i) ? 1 : 0),
      0,
    );
    expect(decoratedCount).toBeGreaterThan(0);

    const r = solve(puzzle, { timeoutMs: 5000 });
    expect(r.solutions).toHaveLength(1);
    expect(boardToString(r.solutions[0]!)).toBe(boardToString(solution));
  });

  it('serialize/deserialize roundtrip preserves values and parity decorations', () => {
    const { puzzle } = parityManifest.adapter.generate(7, 'medium');
    const s = parityManifest.adapter.serialize(puzzle);
    const round = parityManifest.adapter.deserialize(s);
    expect(boardToString(round)).toBe(boardToString(puzzle));
    for (let i = 0; i < puzzle.cells.length; i++) {
      expect(getParityDecoration(round, i)).toBe(getParityDecoration(puzzle, i));
    }
    expect(hasUniqueSolution(round, { timeoutMs: 5000 })).toBe(true);
  });

  it('parity decorations on empty cells correctly restrict candidates', () => {
    const { puzzle } = parityManifest.adapter.generate(123, 'medium');
    for (let i = 0; i < puzzle.cells.length; i++) {
      const cell = puzzle.cells[i]!;
      const parity = getParityDecoration(puzzle, i);
      if (cell.value !== null || !parity) continue;
      const allowedDigits = parity === 'even' ? [2, 4, 6, 8] : [1, 3, 5, 7, 9];
      for (let bit = 0; bit < 9; bit++) {
        const digit = bit + 1;
        const isCandidateBit = (cell.candidates & (1 << bit)) !== 0;
        if (isCandidateBit) {
          expect(allowedDigits).toContain(digit);
        }
      }
    }
  });
});

describe('M3 golden scenario — Sum-Diff pipeline', () => {
  it('generates a Sum-Diff puzzle with edge labels and unique solution', () => {
    const { puzzle, solution } = sumDiffManifest.adapter.generate(42, 'easy');
    expect(puzzle.variantId).toBe('sum-diff');
    expect(puzzle.edgeDecorations.length).toBeGreaterThan(0);

    const constraints = sumDiffManifest.adapter.buildConstraints!(puzzle);
    expect(constraints.length).toBe(puzzle.edgeDecorations.length);
    expect(hasUniqueSolution(puzzle, { constraints, timeoutMs: 5000 })).toBe(true);

    const r = solve(puzzle, { constraints, timeoutMs: 5000 });
    expect(r.solutions).toHaveLength(1);
    expect(boardToString(r.solutions[0]!)).toBe(boardToString(solution));
  });

  it('every edge decoration matches the actual solution', () => {
    const { puzzle, solution } = sumDiffManifest.adapter.generate(7, 'medium');
    for (const edge of puzzle.edgeDecorations) {
      const va = solution.cells[edge.a]!.value!;
      const vb = solution.cells[edge.b]!.value!;
      const expected = edge.kind === 'sum' ? va + vb : Math.abs(va - vb);
      expect(edge.value).toBe(expected);
    }
  });

  it('serialize/deserialize roundtrip preserves values and edges', () => {
    const { puzzle } = sumDiffManifest.adapter.generate(99, 'medium');
    const s = sumDiffManifest.adapter.serialize(puzzle);
    const round = sumDiffManifest.adapter.deserialize(s);
    expect(boardToString(round)).toBe(boardToString(puzzle));
    expect(round.edgeDecorations).toEqual(puzzle.edgeDecorations);
    const constraints = buildEdgeConstraintsFromBoard(round);
    expect(hasUniqueSolution(round, { constraints, timeoutMs: 5000 })).toBe(true);
  });
});
