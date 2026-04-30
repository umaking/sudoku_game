import type { Board, CellIdx, Constraint, Digit } from '../types';
import {
  cloneBoard,
  hasCandidate,
  maskToDigits,
  popCount,
  removeCandidate,
} from '../board';

export interface SolveOptions {
  maxSolutions?: number;
  timeoutMs?: number;
  constraints?: Constraint[];
  randomize?: boolean;
  rng?: () => number;
}

export interface SolveResult {
  solutions: Board[];
  nodesExplored: number;
  timedOut: boolean;
}

interface TrailEntry {
  idx: CellIdx;
  prev: number;
}

export function solve(input: Board, options: SolveOptions = {}): SolveResult {
  const board = cloneBoard(input);
  const maxSolutions = options.maxSolutions ?? 1;
  const constraints = options.constraints ?? [];
  const deadline = options.timeoutMs ? Date.now() + options.timeoutMs : Infinity;

  const peers = buildPeers(board);
  const result: SolveResult = { solutions: [], nodesExplored: 0, timedOut: false };

  if (!propagateGivens(board, peers)) return result;
  if (!checkInitialDomains(board)) return result;

  const trail: TrailEntry[] = [];
  search(board, peers, constraints, options, deadline, maxSolutions, result, trail);
  return result;
}

function search(
  board: Board,
  peers: readonly (readonly CellIdx[])[],
  constraints: readonly Constraint[],
  options: SolveOptions,
  deadline: number,
  maxSolutions: number,
  result: SolveResult,
  trail: TrailEntry[],
): void {
  if (Date.now() > deadline) {
    result.timedOut = true;
    return;
  }
  if (result.solutions.length >= maxSolutions) return;

  const pick = pickMRV(board);
  if (pick.idx === -1) {
    result.solutions.push(cloneBoard(board));
    return;
  }
  if (pick.count === 0) return;

  result.nodesExplored++;

  const idx = pick.idx;
  const cell = board.cells[idx]!;
  const candidates = orderCandidates(maskToDigits(cell.candidates, board.domain), options);

  const prevVal = cell.value;
  const prevMask = cell.candidates;

  for (const d of candidates) {
    if (!satisfiesConstraints(constraints, board, idx, d)) continue;

    cell.value = d;
    cell.candidates = 0;

    const trailMark = trail.length;
    let ok = true;

    for (const peerIdx of peers[idx]!) {
      const peer = board.cells[peerIdx]!;
      if (peer.value === null && hasCandidate(peer.candidates, d, board.domain)) {
        trail.push({ idx: peerIdx, prev: peer.candidates });
        peer.candidates = removeCandidate(peer.candidates, d, board.domain);
        if (peer.candidates === 0) {
          ok = false;
          break;
        }
      }
    }

    if (ok) {
      search(board, peers, constraints, options, deadline, maxSolutions, result, trail);
    }

    while (trail.length > trailMark) {
      const entry = trail.pop()!;
      board.cells[entry.idx]!.candidates = entry.prev;
    }

    if (result.solutions.length >= maxSolutions) {
      cell.value = prevVal;
      cell.candidates = prevMask;
      return;
    }
    if (result.timedOut) {
      cell.value = prevVal;
      cell.candidates = prevMask;
      return;
    }
  }

  cell.value = prevVal;
  cell.candidates = prevMask;
}

function buildPeers(board: Board): CellIdx[][] {
  const N = board.cells.length;
  const peerSets: Set<CellIdx>[] = Array.from({ length: N }, () => new Set<CellIdx>());
  for (const region of board.regions) {
    for (const a of region.cells) {
      const set = peerSets[a]!;
      for (const b of region.cells) {
        if (a !== b) set.add(b);
      }
    }
  }
  return peerSets.map((s) => Array.from(s));
}

function propagateGivens(
  board: Board,
  peers: readonly (readonly CellIdx[])[],
): boolean {
  for (let i = 0; i < board.cells.length; i++) {
    const cell = board.cells[i]!;
    if (cell.value !== null) {
      const d = cell.value;
      cell.candidates = 0;
      for (const peerIdx of peers[i]!) {
        const peer = board.cells[peerIdx]!;
        if (peer.value === d) return false;
        if (peer.value === null) {
          peer.candidates = removeCandidate(peer.candidates, d, board.domain);
        }
      }
    }
  }
  return true;
}

function checkInitialDomains(board: Board): boolean {
  for (const cell of board.cells) {
    if (cell.value === null && cell.candidates === 0) return false;
  }
  return true;
}

function pickMRV(board: Board): { idx: CellIdx; count: number } {
  let bestIdx = -1;
  let bestCount = Infinity;
  for (let i = 0; i < board.cells.length; i++) {
    const cell = board.cells[i]!;
    if (cell.value === null) {
      const cnt = popCount(cell.candidates);
      if (cnt === 0) return { idx: i, count: 0 };
      if (cnt < bestCount) {
        bestCount = cnt;
        bestIdx = i;
        if (cnt === 1) return { idx: i, count: 1 };
      }
    }
  }
  return bestIdx === -1 ? { idx: -1, count: 0 } : { idx: bestIdx, count: bestCount };
}

function orderCandidates(cands: Digit[], options: SolveOptions): Digit[] {
  if (!options.randomize) return cands;
  const rng = options.rng ?? Math.random;
  const arr = cands.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

function satisfiesConstraints(
  constraints: readonly Constraint[],
  board: Board,
  idx: CellIdx,
  digit: Digit,
): boolean {
  for (const c of constraints) {
    if (!c.predicate({ board, idx, digit })) return false;
  }
  return true;
}
