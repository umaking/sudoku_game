import type { Board, CellIdx, Constraint, EdgeDecoration } from '../types';
import { isAdjacent, neighborsOrth } from '../coords';

/**
 * Build a Constraint that enforces a single sum/diff edge decoration during
 * solver search. The predicate is consulted whenever the solver attempts to
 * place a digit at some cell: if that cell is one of the edge's endpoints and
 * the other endpoint is already filled, the edge equation must hold; otherwise
 * the constraint cannot rule the candidate out yet (and returns true).
 */
export function buildEdgeConstraint(edge: EdgeDecoration): Constraint {
  return {
    id: `edge-${edge.kind}-${edge.a}-${edge.b}-${edge.value}`,
    predicate: ({ board, idx, digit }) => {
      let otherIdx: CellIdx;
      if (idx === edge.a) otherIdx = edge.b;
      else if (idx === edge.b) otherIdx = edge.a;
      else return true;
      const other = board.cells[otherIdx];
      if (!other || other.value === null) return true;
      if (edge.kind === 'sum') return digit + other.value === edge.value;
      return Math.abs(digit - other.value) === edge.value;
    },
    visualHint: { channel: 'edge', edges: [{ a: edge.a, b: edge.b }] },
  };
}

/**
 * Build constraints for every edge decoration on the given board. Empty input
 * returns an empty array.
 */
export function buildEdgeConstraintsFromBoard(board: Board): Constraint[] {
  return board.edgeDecorations.map((edge) => buildEdgeConstraint(edge));
}

/**
 * All orthogonally adjacent (a, b) index pairs with a < b on a size×size grid.
 * The result is deterministic: walked in row-major order with each cell
 * contributing its right and down neighbours when in range.
 */
export function findAllAdjacentPairs(size: number): Array<[CellIdx, CellIdx]> {
  const out: Array<[CellIdx, CellIdx]> = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const a = r * size + c;
      // Right neighbour.
      if (c + 1 < size) out.push([a, a + 1]);
      // Down neighbour.
      if (r + 1 < size) out.push([a, a + size]);
    }
  }
  return out;
}

/**
 * All orthogonally adjacent pairs (a, b) with a < b where BOTH endpoints are
 * empty (cell.value === null). Useful when assigning sum/diff edge decorations
 * to spots that still need disambiguation.
 */
export function findEmptyAdjacentPairs(board: Board): Array<[CellIdx, CellIdx]> {
  const size = board.size;
  const pairs = findAllAdjacentPairs(size);
  const out: Array<[CellIdx, CellIdx]> = [];
  for (const [a, b] of pairs) {
    const ca = board.cells[a];
    const cb = board.cells[b];
    if (!ca || !cb) continue;
    if (ca.value === null && cb.value === null) out.push([a, b]);
  }
  return out;
}

// Re-exported helpers (kept for callers that already import them via this module).
export { isAdjacent, neighborsOrth };
