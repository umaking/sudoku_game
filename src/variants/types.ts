import type { Board, CellIdx, Constraint, Digit, Difficulty } from '@core/types';

export type VisualChannel =
  | 'cell-bg-parity'
  | 'edge-label-sum'
  | 'edge-label-diff'
  | 'cell-decoration-prime';

export interface VariantAdapter {
  /** 셀별 허용 도메인 마스크 (예: Parity가 사용). 미정의면 도메인 전체 허용. */
  buildAllowedMasks?: (board: Board) => number[];
  /** 솔버에 추가로 전달할 제약 (예: Sum-Diff). 미정의면 빈 배열. */
  buildConstraints?: (board: Board) => Constraint[];
  generate: (seed: number, difficulty: Difficulty) => { puzzle: Board; solution: Board };
  serialize: (board: Board) => string;
  deserialize: (s: string) => Board;
}

export interface TutorialMiniBoard {
  /** mini-grid의 한 변 크기 (3, 4, 또는 9). cells.length === size*size */
  size: number;
  cells: (Digit | null)[];
  givens?: CellIdx[];
  parityDecorations?: Array<{ idx: CellIdx; parity: 'even' | 'odd' }>;
  edgeDecorations?: Array<{ kind: 'sum' | 'diff'; a: CellIdx; b: CellIdx; value: number }>;
  highlightCells?: CellIdx[];
}

export interface TutorialChallenge {
  targetIdx: CellIdx;
  correctDigit: Digit;
  hint?: string;
}

export interface TutorialStep {
  title: string;
  body: string;
  miniBoard?: TutorialMiniBoard;
  challenge?: TutorialChallenge;
}

export interface VariantManifest {
  id: string;
  displayName: string;
  domain: { values: readonly Digit[] };
  regionsKind: 'standard' | 'custom';
  visualChannels: VisualChannel[];
  tutorialOneLiner: string;
  rulePanelMD: string;
  difficulties: Difficulty[];
  adapter: VariantAdapter;
  tutorialSteps?: TutorialStep[];
}
