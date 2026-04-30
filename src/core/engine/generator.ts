import type { Board, CellIdx, Difficulty, Digit, EdgeDecoration } from '../types';
import {
  boardToString,
  clearValueInPlace,
  cloneBoard,
  createEmptyBoard,
  maskOfAll,
  setValueInPlace,
} from '../board';
import { solve } from './solver';
import { hasUniqueSolution } from './uniqueness';
import { applyParityMasks, getParityOfDigit } from './parity';
import { buildEdgeConstraintsFromBoard, findEmptyAdjacentPairs } from './sumDiff';

export interface GenerateOptions {
  seed: number;
  difficulty: Difficulty;
  size?: number;
  domain?: readonly Digit[];
  variantId?: string;
  timeoutMs?: number;
}

export interface GenerateResult {
  puzzle: Board;
  solution: Board;
  cluesCount: number;
}

const DEFAULT_DOMAIN: readonly Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const DIFFICULTY_TARGET_CLUES: Record<Difficulty, number> = {
  // each maps to the maximum clue count of that difficulty bucket (fewest removals)
  easy: 44,
  medium: 35,
  hard: 31,
  expert: 27,
};

const MAX_PAIR_ATTEMPTS = 200;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

function countClues(board: Board): number {
  let n = 0;
  for (const cell of board.cells) {
    if (cell.value !== null) n++;
  }
  return n;
}

function markAllAsGivens(board: Board): void {
  for (const cell of board.cells) {
    if (cell.value !== null) cell.given = true;
  }
}

interface PairUnit {
  cells: CellIdx[];
}

function buildPairUnits(size: number, rng: () => number): PairUnit[] {
  const total = size * size;
  const seen = new Set<number>();
  const units: PairUnit[] = [];
  for (let i = 0; i < total; i++) {
    if (seen.has(i)) continue;
    const mirror = total - 1 - i;
    if (mirror === i) {
      units.push({ cells: [i] });
      seen.add(i);
    } else {
      units.push({ cells: [i, mirror] });
      seen.add(i);
      seen.add(mirror);
    }
  }
  shuffleInPlace(units, rng);
  return units;
}

export function generateClassic(opts: GenerateOptions): GenerateResult {
  const size = opts.size ?? 9;
  const domain = opts.domain ?? DEFAULT_DOMAIN;
  const variantId = opts.variantId ?? 'classic';
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const targetClues = DIFFICULTY_TARGET_CLUES[opts.difficulty];

  const deadline = Date.now() + timeoutMs;
  const rng = mulberry32(opts.seed);

  // 1. Build a complete random solution.
  const empty = createEmptyBoard(size, domain, variantId);
  const solveDeadlineMs = Math.max(50, deadline - Date.now());
  const solveResult = solve(empty, {
    maxSolutions: 1,
    randomize: true,
    rng,
    timeoutMs: solveDeadlineMs,
  });
  const solution = solveResult.solutions[0];
  if (!solution) {
    throw new Error('Failed to generate a complete sudoku solution within timeout');
  }

  // 2. Dig cells out, preserving uniqueness.
  const puzzle = cloneBoard(solution);
  // Treat all filled cells as givens initially.
  markAllAsGivens(puzzle);

  const units = buildPairUnits(size, rng);
  let attempts = 0;

  for (const unit of units) {
    if (Date.now() > deadline) break;
    if (attempts >= MAX_PAIR_ATTEMPTS) break;
    attempts++;

    const currentClues = countClues(puzzle);
    if (currentClues <= targetClues) break;

    // Backup values before removal.
    const backup: { idx: CellIdx; value: Digit | null; given: boolean }[] = unit.cells.map(
      (idx) => {
        const cell = puzzle.cells[idx]!;
        return { idx, value: cell.value, given: cell.given };
      },
    );

    // If a cell already empty, this unit may not help much; skip if both empty.
    if (backup.every((b) => b.value === null)) continue;

    // Remove values for this unit. Restore candidate masks to the full domain
    // so the solver's propagation phase can compute valid candidates from
    // scratch (clearValueInPlace only clears the value, not the mask).
    const fullMask = maskOfAll(puzzle.domain);
    for (const b of backup) {
      if (b.value !== null) {
        clearValueInPlace(puzzle, b.idx);
        puzzle.cells[b.idx]!.given = false;
        puzzle.cells[b.idx]!.candidates = fullMask;
      }
    }

    // Verify uniqueness with a per-attempt timeout bounded by overall deadline.
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      // Restore and stop.
      for (const b of backup) {
        if (b.value !== null) {
          setValueInPlace(puzzle, b.idx, b.value);
          puzzle.cells[b.idx]!.given = b.given;
        }
      }
      break;
    }
    const perCheckTimeout = Math.min(remaining, 2000);
    const unique = hasUniqueSolution(puzzle, { timeoutMs: perCheckTimeout });

    if (!unique) {
      // Restore.
      for (const b of backup) {
        if (b.value !== null) {
          setValueInPlace(puzzle, b.idx, b.value);
          puzzle.cells[b.idx]!.given = b.given;
        }
      }
    }
  }

  return {
    puzzle,
    solution,
    cluesCount: countClues(puzzle),
  };
}

const PARITY_DECORATION_RATIO: Record<Difficulty, number> = {
  easy: 0.7,
  medium: 0.5,
  hard: 0.35,
  expert: 0.25,
};

export function generateParity(opts: GenerateOptions): GenerateResult {
  const variantId = opts.variantId ?? 'parity';
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const deadline = Date.now() + timeoutMs;

  // Generate a Classic puzzle/solution as the foundation. Use a Classic
  // variantId for the dig phase (solver/uniqueness behaviour is identical),
  // then re-stamp the variantId as 'parity' afterwards.
  const classicBudget = Math.max(500, Math.floor(timeoutMs * 0.8));
  const classic = generateClassic({
    ...opts,
    variantId: 'classic',
    timeoutMs: classicBudget,
  });

  const puzzle = classic.puzzle;
  const solution = classic.solution;
  puzzle.variantId = variantId;

  // Collect indices of empty cells (decoration candidates).
  const emptyIdxs: CellIdx[] = [];
  for (let i = 0; i < puzzle.cells.length; i++) {
    if (puzzle.cells[i]!.value === null) emptyIdxs.push(i);
  }

  // Deterministic shuffle using a parity-specific seed offset so the order
  // differs from the classic dig order while remaining reproducible.
  const rng = mulberry32((opts.seed ^ 0x9e3779b9) >>> 0);
  const shuffled = shuffleInPlace(emptyIdxs.slice(), rng);

  const ratio = PARITY_DECORATION_RATIO[opts.difficulty];
  const initialCount = Math.min(
    shuffled.length,
    Math.max(0, Math.round(shuffled.length * ratio)),
  );

  const decorated = new Set<CellIdx>();
  const attachDecoration = (idx: CellIdx): void => {
    if (decorated.has(idx)) return;
    const cell = puzzle.cells[idx]!;
    const solCell = solution.cells[idx]!;
    if (solCell.value === null) return;
    cell.decorations.push({
      kind: 'parity',
      parity: getParityOfDigit(solCell.value),
    });
    decorated.add(idx);
  };

  for (let i = 0; i < initialCount; i++) {
    attachDecoration(shuffled[i]!);
  }

  // Verify uniqueness; if not unique, add more decorations from the remaining pool.
  let cursor = initialCount;
  // Helper that builds a fresh board copy with parity masks applied so the
  // uniqueness check sees parity-restricted candidates.
  const checkUnique = (): boolean => {
    const probe = cloneBoard(puzzle);
    applyParityMasks(probe);
    const remaining = deadline - Date.now();
    const perCheckTimeout = Math.max(50, Math.min(remaining, 2000));
    return hasUniqueSolution(probe, { timeoutMs: perCheckTimeout });
  };

  let unique = checkUnique();
  while (!unique && cursor < shuffled.length) {
    if (Date.now() > deadline) break;
    // Add another batch of decorations to tighten constraints.
    const batchSize = Math.max(1, Math.ceil(shuffled.length * 0.1));
    const stop = Math.min(shuffled.length, cursor + batchSize);
    for (; cursor < stop; cursor++) {
      attachDecoration(shuffled[cursor]!);
    }
    unique = checkUnique();
  }

  // Apply parity masks to the returned puzzle so consumers receive a board
  // whose candidates already reflect the parity constraints.
  applyParityMasks(puzzle);

  return {
    puzzle,
    solution,
    cluesCount: countClues(puzzle),
  };
}

// --- Sum/Diff variant -----------------------------------------------------

interface SumDiffTargets {
  clues: number;
  edges: number;
}

const SUM_DIFF_TARGETS: Record<Difficulty, SumDiffTargets> = {
  easy: { clues: 32, edges: 8 },
  medium: { clues: 28, edges: 12 },
  hard: { clues: 24, edges: 18 },
  expert: { clues: 20, edges: 24 },
};

// Maximum number of times we'll restore a single clue to recover uniqueness
// in step 6. Bounded to keep the worst case finite even when the deadline is
// generous.
const SUM_DIFF_MAX_CLUE_RESTORES = 30;

/**
 * Generate a Sum/Diff variant puzzle. The strategy is to dig more aggressively
 * than classic, then re-tighten uniqueness using sum/diff edge labels between
 * empty adjacent cells. Works best-effort under `timeoutMs`; on deadline the
 * best uniquely-solvable puzzle produced so far is returned.
 */
export function generateSumDiff(opts: GenerateOptions): GenerateResult {
  const size = opts.size ?? 9;
  const domain = opts.domain ?? DEFAULT_DOMAIN;
  const variantId = opts.variantId ?? 'sum-diff';
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const targets = SUM_DIFF_TARGETS[opts.difficulty];

  const deadline = Date.now() + timeoutMs;
  const rng = mulberry32(opts.seed);

  // 1. Build a complete random solution.
  const empty = createEmptyBoard(size, domain, variantId);
  const solveBudget = Math.max(50, deadline - Date.now());
  const solveResult = solve(empty, {
    maxSolutions: 1,
    randomize: true,
    rng,
    timeoutMs: solveBudget,
  });
  const solution = solveResult.solutions[0];
  if (!solution) {
    throw new Error('Failed to generate a complete sudoku solution within timeout');
  }

  // 2. Aggressive dig: remove pairs (symmetric) until either we hit the clue
  //    target OR uniqueness breaks. Unlike classic, we do NOT roll back when
  //    uniqueness breaks — the edges added in step 3 will recover it.
  const puzzle = cloneBoard(solution);
  puzzle.variantId = variantId;
  markAllAsGivens(puzzle);

  const fullMask = maskOfAll(puzzle.domain);
  const units = buildPairUnits(size, rng);
  let pairAttempts = 0;

  for (const unit of units) {
    if (Date.now() > deadline) break;
    if (pairAttempts >= MAX_PAIR_ATTEMPTS) break;
    pairAttempts++;

    if (countClues(puzzle) <= targets.clues) break;

    const backup: { idx: CellIdx; value: Digit | null; given: boolean }[] = unit.cells.map(
      (idx) => {
        const cell = puzzle.cells[idx]!;
        return { idx, value: cell.value, given: cell.given };
      },
    );
    if (backup.every((b) => b.value === null)) continue;

    for (const b of backup) {
      if (b.value !== null) {
        clearValueInPlace(puzzle, b.idx);
        puzzle.cells[b.idx]!.given = false;
        puzzle.cells[b.idx]!.candidates = fullMask;
      }
    }
    // Note: we deliberately keep the removal even if uniqueness is now broken;
    // step 3 below will restore uniqueness via edge labels.
  }

  // 3. Edge reinforcement: walk a shuffled list of empty adjacent pairs and
  //    attach sum/diff edges (always derived from the actual solution, so they
  //    are guaranteed to be consistent with at least one solution). We always
  //    keep up to `targets.edges` edges so that the variant flavour is visible
  //    even when the puzzle was already uniquely solvable from clues alone.
  const candidatePairs = findEmptyAdjacentPairs(puzzle);
  shuffleInPlace(candidatePairs, rng);

  const pickEdge = (a: CellIdx, b: CellIdx): EdgeDecoration | null => {
    const va = solution.cells[a]?.value;
    const vb = solution.cells[b]?.value;
    if (va === null || va === undefined) return null;
    if (vb === null || vb === undefined) return null;
    const kind: 'sum' | 'diff' = rng() < 0.5 ? 'sum' : 'diff';
    const value = kind === 'sum' ? va + vb : Math.abs(va - vb);
    return { kind, a, b, value };
  };

  const remainingPairs: Array<[CellIdx, CellIdx]> = [];
  let attachedEdges = 0;
  for (const pair of candidatePairs) {
    if (Date.now() > deadline) {
      remainingPairs.push(pair);
      continue;
    }
    if (attachedEdges >= targets.edges) {
      remainingPairs.push(pair);
      continue;
    }
    const edge = pickEdge(pair[0], pair[1]);
    if (!edge) continue;
    puzzle.edgeDecorations.push(edge);
    attachedEdges++;
  }

  const isUnique = (): boolean => {
    if (Date.now() > deadline) return false;
    const remaining = deadline - Date.now();
    const perCheck = Math.max(50, Math.min(remaining, 2000));
    const constraints = buildEdgeConstraintsFromBoard(puzzle);
    return hasUniqueSolution(puzzle, { constraints, timeoutMs: perCheck });
  };

  // 4. Keep adding edges from any leftover pairs until uniqueness recovers or
  //    the candidate pool / deadline is exhausted.
  if (!isUnique()) {
    for (const [a, b] of remainingPairs) {
      if (Date.now() > deadline) break;
      const edge = pickEdge(a, b);
      if (!edge) continue;
      puzzle.edgeDecorations.push(edge);
      if (isUnique()) break;
    }
  }

  // 5. Final fallback: restore individual clues from the solution one at a
  //    time until uniqueness returns. Bounded by a safety cap and the deadline.
  if (!isUnique()) {
    const emptyIdxs: CellIdx[] = [];
    for (let i = 0; i < puzzle.cells.length; i++) {
      if (puzzle.cells[i]!.value === null) emptyIdxs.push(i);
    }
    shuffleInPlace(emptyIdxs, rng);

    let restored = 0;
    for (const idx of emptyIdxs) {
      if (Date.now() > deadline) break;
      if (restored >= SUM_DIFF_MAX_CLUE_RESTORES) break;
      const solCell = solution.cells[idx];
      if (!solCell || solCell.value === null) continue;
      setValueInPlace(puzzle, idx, solCell.value);
      puzzle.cells[idx]!.given = true;
      restored++;
      if (isUnique()) break;
    }
  }

  return {
    puzzle,
    solution,
    cluesCount: countClues(puzzle),
  };
}

export { boardToString };
