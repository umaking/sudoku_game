import type { Board, CandidateMask, Cell, CellIdx, Digit, Move, Region } from './types';
import { boxDims, rcToIdx } from './coords';

export function maskOfAll(domain: readonly Digit[]): CandidateMask {
  return (1 << domain.length) - 1;
}

export function digitToBit(d: Digit, domain: readonly Digit[]): number {
  const i = domain.indexOf(d);
  if (i < 0) throw new Error(`Digit ${d} not in domain`);
  return i;
}

export function bitToDigit(bit: number, domain: readonly Digit[]): Digit {
  const d = domain[bit];
  if (d === undefined) throw new Error(`Bit ${bit} out of domain`);
  return d;
}

export function maskToDigits(mask: CandidateMask, domain: readonly Digit[]): Digit[] {
  const out: Digit[] = [];
  for (let i = 0; i < domain.length; i++) {
    if (mask & (1 << i)) out.push(domain[i]!);
  }
  return out;
}

export function digitsToMask(
  digits: Iterable<Digit>,
  domain: readonly Digit[],
): CandidateMask {
  let mask = 0;
  for (const d of digits) mask |= 1 << digitToBit(d, domain);
  return mask;
}

export function addCandidate(
  mask: CandidateMask,
  d: Digit,
  domain: readonly Digit[],
): CandidateMask {
  return mask | (1 << digitToBit(d, domain));
}

export function removeCandidate(
  mask: CandidateMask,
  d: Digit,
  domain: readonly Digit[],
): CandidateMask {
  return mask & ~(1 << digitToBit(d, domain));
}

export function hasCandidate(
  mask: CandidateMask,
  d: Digit,
  domain: readonly Digit[],
): boolean {
  return (mask & (1 << digitToBit(d, domain))) !== 0;
}

export function toggleCandidate(
  mask: CandidateMask,
  d: Digit,
  domain: readonly Digit[],
): CandidateMask {
  return mask ^ (1 << digitToBit(d, domain));
}

export function popCount(mask: CandidateMask): number {
  let n = 0;
  let m = mask;
  while (m) {
    m &= m - 1;
    n++;
  }
  return n;
}

export function lowestBitDigit(mask: CandidateMask, domain: readonly Digit[]): Digit | null {
  if (mask === 0) return null;
  const bit = 31 - Math.clz32(mask & -mask);
  return bitToDigit(bit, domain);
}

export function buildStandardRegions(size: number): Region[] {
  const { rows: br, cols: bc } = boxDims(size);
  const regions: Region[] = [];

  for (let r = 0; r < size; r++) {
    const cells: CellIdx[] = [];
    for (let c = 0; c < size; c++) cells.push(rcToIdx(r, c, size));
    regions.push({ id: `row-${r}`, kind: 'row', cells });
  }
  for (let c = 0; c < size; c++) {
    const cells: CellIdx[] = [];
    for (let r = 0; r < size; r++) cells.push(rcToIdx(r, c, size));
    regions.push({ id: `col-${c}`, kind: 'col', cells });
  }
  const boxesPerRow = Math.floor(size / bc);
  for (let b = 0; b < size; b++) {
    const cells: CellIdx[] = [];
    const boxRow = Math.floor(b / boxesPerRow);
    const boxCol = b % boxesPerRow;
    for (let dr = 0; dr < br; dr++) {
      for (let dc = 0; dc < bc; dc++) {
        cells.push(rcToIdx(boxRow * br + dr, boxCol * bc + dc, size));
      }
    }
    regions.push({ id: `box-${b}`, kind: 'box', cells });
  }
  return regions;
}

export function createEmptyBoard(
  size: number,
  domain: readonly Digit[],
  variantId: string,
): Board {
  const allMask = maskOfAll(domain);
  const cells: Cell[] = Array.from({ length: size * size }, () => ({
    value: null,
    candidates: allMask,
    given: false,
    decorations: [],
  }));
  return {
    size,
    domain,
    cells,
    regions: buildStandardRegions(size),
    edgeDecorations: [],
    variantId,
  };
}

export function cloneBoard(b: Board): Board {
  return {
    ...b,
    cells: b.cells.map((c) => ({ ...c, decorations: c.decorations.slice() })),
    edgeDecorations: b.edgeDecorations.slice(),
  };
}

export function getCell(b: Board, idx: CellIdx): Cell {
  const cell = b.cells[idx];
  if (!cell) throw new Error(`Cell ${idx} out of bounds (size ${b.size})`);
  return cell;
}

export function setValueInPlace(b: Board, idx: CellIdx, digit: Digit): void {
  const cell = getCell(b, idx);
  cell.value = digit;
  cell.candidates = 0;
}

export function clearValueInPlace(b: Board, idx: CellIdx): void {
  const cell = getCell(b, idx);
  cell.value = null;
}

export function applyMoveInPlace(b: Board, move: Move): void {
  const cell = getCell(b, move.idx);
  switch (move.kind) {
    case 'set':
      if (move.digit === undefined) throw new Error('set move requires digit');
      cell.value = move.digit;
      cell.candidates = 0;
      break;
    case 'clear':
      cell.value = null;
      break;
    case 'candidate-toggle':
      if (move.digit === undefined) throw new Error('candidate-toggle requires digit');
      cell.candidates = toggleCandidate(cell.candidates, move.digit, b.domain);
      break;
  }
}

export function revertMoveInPlace(b: Board, move: Move): void {
  const cell = getCell(b, move.idx);
  cell.value = move.prev.value;
  cell.candidates = move.prev.candidates;
}

export function applyMove(b: Board, move: Move): Board {
  const next = cloneBoard(b);
  applyMoveInPlace(next, move);
  return next;
}

export function boardFromString(
  s: string,
  domain: readonly Digit[],
  variantId = 'classic',
): Board {
  const size = Math.sqrt(s.length);
  if (!Number.isInteger(size)) {
    throw new Error(`Invalid puzzle string length: ${s.length}`);
  }
  const board = createEmptyBoard(size, domain, variantId);
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    if (ch !== '.' && ch !== '0') {
      const d = parseInt(ch, 10);
      if (Number.isNaN(d)) throw new Error(`Invalid digit '${ch}' at position ${i}`);
      const cell = board.cells[i]!;
      cell.value = d;
      cell.given = true;
      cell.candidates = 0;
    }
  }
  return board;
}

export function boardToString(b: Board): string {
  return b.cells.map((c) => (c.value === null ? '.' : String(c.value))).join('');
}
