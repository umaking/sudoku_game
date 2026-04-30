export type CellIdx = number;

export type Digit = number;

export type CandidateMask = number;

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type CellDecoration = { kind: 'parity'; parity: 'even' | 'odd' };

export type EdgeDecoration = {
  kind: 'sum' | 'diff';
  a: CellIdx;
  b: CellIdx;
  value: number;
};

export interface Cell {
  value: Digit | null;
  candidates: CandidateMask;
  given: boolean;
  decorations: CellDecoration[];
}

export type RegionKind = 'row' | 'col' | 'box' | 'extra';

export interface Region {
  id: string;
  kind: RegionKind;
  cells: CellIdx[];
}

export interface Board {
  size: number;
  domain: readonly Digit[];
  cells: Cell[];
  regions: Region[];
  edgeDecorations: EdgeDecoration[];
  variantId: string;
}

export type MoveKind = 'set' | 'clear' | 'candidate-toggle';

export interface Move {
  id: string;
  kind: MoveKind;
  idx: CellIdx;
  digit?: Digit;
  prev: { value: Digit | null; candidates: CandidateMask };
}

export interface ConstraintCtx {
  board: Board;
  idx: CellIdx;
  digit: Digit;
}

export type VisualHint =
  | { channel: 'cell-bg'; cells: CellIdx[]; tone: 'error' | 'warn' }
  | { channel: 'edge'; edges: { a: CellIdx; b: CellIdx }[] }
  | { channel: 'region-outline'; regionId: string };

export interface Constraint {
  id: string;
  predicate: (ctx: ConstraintCtx) => boolean;
  visualHint?: VisualHint;
}

export interface Conflict {
  idx: CellIdx;
  reason: string;
  constraintId?: string;
}

export interface ValidationResult {
  valid: boolean;
  complete: boolean;
  conflicts: Conflict[];
}
