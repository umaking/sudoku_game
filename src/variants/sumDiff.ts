import type { Board, Constraint, Digit, EdgeDecoration } from '@core/types';
import { boardFromString, boardToString } from '@core/board';
import { generateSumDiff } from '@core/engine/generator';
import { buildEdgeConstraintsFromBoard } from '@core/engine/sumDiff';
import type { TutorialStep, VariantAdapter, VariantManifest } from './types';

export const SUMDIFF_DOMAIN = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const sumDiffAdapter: VariantAdapter = {
  generate(seed, difficulty) {
    const r = generateSumDiff({ seed, difficulty });
    return { puzzle: r.puzzle, solution: r.solution };
  },
  buildConstraints(board: Board): Constraint[] {
    return buildEdgeConstraintsFromBoard(board);
  },
  serialize(board: Board): string {
    const values = boardToString(board);
    const edges = board.edgeDecorations
      .map((e) => `${e.kind === 'sum' ? 's' : 'd'}:${e.a}:${e.b}:${e.value}`)
      .join(',');
    return `${values}|${edges}`;
  },
  deserialize(s: string): Board {
    const parts = s.split('|');
    const valuesStr = parts[0];
    if (!valuesStr) {
      throw new Error('Invalid sum-diff serialization: missing values part');
    }
    const board = boardFromString(valuesStr, SUMDIFF_DOMAIN, 'sum-diff');
    const edgesStr = parts[1] ?? '';
    if (edgesStr.length > 0) {
      for (const rec of edgesStr.split(',')) {
        const seg = rec.split(':');
        if (seg.length !== 4) {
          throw new Error(`Invalid edge record: ${rec}`);
        }
        const kindCh = seg[0];
        let kind: EdgeDecoration['kind'];
        if (kindCh === 's') kind = 'sum';
        else if (kindCh === 'd') kind = 'diff';
        else throw new Error(`Invalid edge kind '${kindCh}' in: ${rec}`);
        const a = parseInt(seg[1]!, 10);
        const b = parseInt(seg[2]!, 10);
        const value = parseInt(seg[3]!, 10);
        if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(value)) {
          throw new Error(`Invalid edge numbers in: ${rec}`);
        }
        board.edgeDecorations.push({ kind, a, b, value });
      }
    }
    return board;
  },
};

const sumDiffTutorialSteps: TutorialStep[] = [
  {
    title: 'Sum-Diff 규칙 소개',
    body:
      '두 인접 셀 사이에 +N 또는 −N 라벨이 붙을 수 있습니다. +N은 두 셀의 합이 N이라는 뜻이고, −N은 두 셀의 차의 절댓값이 N이라는 뜻입니다. 라벨이 없는 인접 셀에는 제약이 없으며, 표준 스도쿠 규칙은 항상 적용됩니다.',
  },
  {
    title: '합(+) 라벨',
    body:
      '두 셀 사이에 +10 라벨이 있고 한 셀이 3이라면, 다른 셀은 무엇이어야 할까요? 강조된 빈 셀에 정답을 입력하세요.',
    miniBoard: {
      size: 3,
      cells: [3, null, null, null, null, null, null, null, null],
      givens: [0],
      edgeDecorations: [{ kind: 'sum', a: 0, b: 1, value: 10 }],
      highlightCells: [1],
    },
    challenge: {
      targetIdx: 1,
      correctDigit: 7,
      hint: '두 셀의 합이 10이 되어야 합니다.',
    },
  },
  {
    title: '차(−) 라벨',
    body:
      '−3 라벨은 두 셀의 차의 절댓값이 3임을 의미합니다. 한 셀이 5이고 다른 셀이 같은 행에 있을 때, 두 가지 후보(2 또는 8) 중 행 제약을 만족시키는 값이 정답입니다. 이 예시에서는 8을 입력해 보세요.',
    miniBoard: {
      size: 3,
      cells: [5, null, null, null, null, null, null, null, null],
      givens: [0],
      edgeDecorations: [{ kind: 'diff', a: 0, b: 1, value: 3 }],
      highlightCells: [1],
    },
    challenge: {
      targetIdx: 1,
      correctDigit: 8,
      hint: '|5 - x| = 3 이라면 x는 2 또는 8 입니다.',
    },
  },
  {
    title: '라벨이 없는 인접 셀',
    body:
      '두 인접 셀 사이에 라벨이 없다면 합/차 제약은 적용되지 않습니다. 단, 행/열/박스의 distinct 규칙은 그대로 유지됩니다. 이 점을 잘 활용하면 빠르게 단서를 좁힐 수 있습니다.',
  },
];

export const sumDiffManifest: VariantManifest = {
  id: 'sum-diff',
  displayName: 'Sum-Diff Sudoku',
  domain: { values: SUMDIFF_DOMAIN as readonly Digit[] },
  regionsKind: 'standard',
  visualChannels: ['edge-label-sum', 'edge-label-diff'],
  tutorialOneLiner:
    '두 인접 셀 사이에 적힌 라벨이 두 값의 합(+) 또는 차(−)와 일치해야 합니다.',
  rulePanelMD: `# Sum-Diff Sudoku\n\n표준 스도쿠 규칙(1~9 행/열/3x3 박스 distinct)에 더해, **두 인접 셀 사이에 표시된 라벨**이 다음을 강제합니다:\n\n- **+N**: 두 셀의 합이 N\n- **−N**: 두 셀의 차의 절댓값이 N\n\n라벨이 없는 인접 셀은 자유.`,
  difficulties: ['easy', 'medium', 'hard', 'expert'],
  tutorialSteps: sumDiffTutorialSteps,
  adapter: sumDiffAdapter,
};
