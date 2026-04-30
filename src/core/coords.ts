import type { CellIdx } from './types';

export interface RC {
  row: number;
  col: number;
}

export function idxToRC(idx: CellIdx, size: number): RC {
  return { row: Math.floor(idx / size), col: idx % size };
}

export function rcToIdx(row: number, col: number, size: number): CellIdx {
  return row * size + col;
}

export interface BoxDims {
  rows: number;
  cols: number;
}

export function boxDims(size: number): BoxDims {
  const sqrt = Math.sqrt(size);
  if (Number.isInteger(sqrt)) return { rows: sqrt, cols: sqrt };
  throw new Error(`Unsupported board size: ${size}`);
}

export function boxIndexOf(idx: CellIdx, size: number): number {
  const { row, col } = idxToRC(idx, size);
  const { rows: br, cols: bc } = boxDims(size);
  return Math.floor(row / br) * Math.floor(size / bc) + Math.floor(col / bc);
}

export function neighborsOrth(idx: CellIdx, size: number): CellIdx[] {
  const { row, col } = idxToRC(idx, size);
  const out: CellIdx[] = [];
  if (row > 0) out.push(rcToIdx(row - 1, col, size));
  if (row < size - 1) out.push(rcToIdx(row + 1, col, size));
  if (col > 0) out.push(rcToIdx(row, col - 1, size));
  if (col < size - 1) out.push(rcToIdx(row, col + 1, size));
  return out;
}

export function isAdjacent(a: CellIdx, b: CellIdx, size: number): boolean {
  const ra = idxToRC(a, size);
  const rb = idxToRC(b, size);
  const dr = Math.abs(ra.row - rb.row);
  const dc = Math.abs(ra.col - rb.col);
  return dr + dc === 1;
}
