import type { Board, Digit } from '@core/types';
import { boardFromString, boardToString } from '@core/board';
import { generateParity } from '@core/engine/generator';
import { applyParityMasks } from '@core/engine/parity';
import type { TutorialStep, VariantAdapter, VariantManifest } from './types';

export const PARITY_DOMAIN = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const parityAdapter: VariantAdapter = {
  generate(seed, difficulty) {
    const r = generateParity({ seed, difficulty });
    return { puzzle: r.puzzle, solution: r.solution };
  },
  // applyParityMasks is invoked at generate-time and again in deserialize, so
  // puzzle.cells.candidates already encode parity restrictions. Leave
  // buildAllowedMasks undefined to avoid double-restriction.
  serialize(board: Board): string {
    const values = boardToString(board);
    const parities = board.cells
      .map((c) => {
        const p = c.decorations.find((d) => d.kind === 'parity');
        if (!p) return '.';
        return p.parity === 'even' ? 'e' : 'o';
      })
      .join('');
    return `${values}|${parities}`;
  },
  deserialize(s: string): Board {
    const parts = s.split('|');
    const valuesStr = parts[0];
    const paritiesStr = parts[1];
    if (!valuesStr) {
      throw new Error('Invalid parity serialization: missing values part');
    }
    const board = boardFromString(valuesStr, PARITY_DOMAIN, 'parity');
    if (paritiesStr !== undefined) {
      if (paritiesStr.length !== 0 && paritiesStr.length !== valuesStr.length) {
        throw new Error(
          `Invalid parity serialization: parities length ${paritiesStr.length} != values length ${valuesStr.length}`,
        );
      }
      for (let i = 0; i < paritiesStr.length; i++) {
        const ch = paritiesStr[i];
        if (ch === 'e' || ch === 'o') {
          const cell = board.cells[i];
          if (cell) {
            cell.decorations.push({
              kind: 'parity',
              parity: ch === 'e' ? 'even' : 'odd',
            });
          }
        } else if (ch !== '.' && ch !== undefined) {
          throw new Error(
            `Invalid parity serialization: unexpected char '${ch}' at position ${i}`,
          );
        }
      }
    }
    applyParityMasks(board);
    return board;
  },
};

const parityTutorialSteps: TutorialStep[] = [
  {
    title: 'Parity 규칙 소개',
    body:
      'Parity 스도쿠에서는 일부 셀에 짝수(even) 또는 홀수(odd) 표시가 붙어 있습니다. 짝수 표시 셀에는 2, 4, 6, 8만, 홀수 표시 셀에는 1, 3, 5, 7, 9만 들어갈 수 있습니다. 표준 스도쿠 규칙도 함께 지켜야 합니다.',
  },
  {
    title: '짝수 셀 채우기',
    body:
      '강조된 셀에는 짝수 표시가 붙어 있습니다. 같은 행에 이미 2와 4가 있다면, 빈 짝수 셀에는 어떤 숫자가 들어가야 할까요?',
    miniBoard: {
      size: 3,
      cells: [2, 4, null, null, null, null, null, null, null],
      givens: [0, 1],
      parityDecorations: [{ idx: 2, parity: 'even' }],
      highlightCells: [2],
    },
    challenge: {
      targetIdx: 2,
      correctDigit: 6,
      hint: '미니 그리드 도메인에서 사용 가능한 짝수 중 행/열에 없는 값을 고르세요.',
    },
  },
  {
    title: '홀수 셀 채우기',
    body:
      '이번에는 홀수 표시가 붙은 셀입니다. 같은 행에 3과 5가 있을 때, 강조된 빈 홀수 셀에 들어갈 값을 골라보세요.',
    miniBoard: {
      size: 3,
      cells: [3, 5, null, null, null, null, null, null, null],
      givens: [0, 1],
      parityDecorations: [{ idx: 2, parity: 'odd' }],
      highlightCells: [2],
    },
    challenge: {
      targetIdx: 2,
      correctDigit: 1,
      hint: '홀수 셀에는 홀수만 가능합니다.',
    },
  },
  {
    title: '혼합 패턴',
    body:
      '실제 보드에서는 짝수와 홀수 셀이 섞여 있습니다. 표시가 없는 셀에는 어떤 숫자라도 들어갈 수 있지만, 행/열/박스의 중복 금지 규칙은 항상 적용됩니다.',
    miniBoard: {
      size: 3,
      cells: [1, 2, null, null, null, null, null, null, null],
      givens: [0, 1],
      parityDecorations: [
        { idx: 0, parity: 'odd' },
        { idx: 1, parity: 'even' },
      ],
    },
  },
];

export const parityManifest: VariantManifest = {
  id: 'parity',
  displayName: 'Parity Sudoku',
  domain: { values: PARITY_DOMAIN as readonly Digit[] },
  regionsKind: 'standard',
  visualChannels: ['cell-bg-parity'],
  tutorialOneLiner:
    '회색 셀에는 짝수만, 흰색 셀에는 홀수만 들어갑니다. 1~9 표준 규칙도 적용.',
  rulePanelMD: `# Parity Sudoku\n\n표준 스도쿠 규칙(1~9 행/열/3x3 박스 distinct)에 더해, **짝수 표시(파란 배경)된 셀에는 짝수만, 홀수 표시(주황 배경)된 셀에는 홀수만** 들어갈 수 있습니다.\n\n표시되지 않은 셀은 1~9 어느 숫자나 가능합니다.`,
  difficulties: ['easy', 'medium', 'hard', 'expert'],
  tutorialSteps: parityTutorialSteps,
  adapter: parityAdapter,
};
