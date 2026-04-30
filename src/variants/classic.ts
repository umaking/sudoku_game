import { generateClassic } from '@core/engine/generator';
import { boardFromString, boardToString } from '@core/board';
import type { TutorialStep, VariantManifest } from './types';

export const CLASSIC_DOMAIN = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const classicTutorialSteps: TutorialStep[] = [
  {
    title: '스도쿠 기본 규칙',
    body:
      '9x9 보드의 모든 행, 열, 그리고 굵게 표시된 3x3 박스에는 1부터 9까지의 숫자가 정확히 한 번씩 들어가야 합니다. 같은 줄이나 같은 박스 안에 같은 숫자가 두 번 나타나면 안 됩니다.',
  },
  {
    title: '한 행 채우기',
    body:
      '아래 3x3 미니 그리드의 첫 번째 행을 살펴보세요. 1과 2가 이미 채워져 있습니다. 마지막 빈 셀에는 어떤 숫자가 와야 할까요?',
    miniBoard: {
      size: 3,
      cells: [1, 2, null, null, null, null, null, null, null],
      givens: [0, 1],
      highlightCells: [2],
    },
    challenge: {
      targetIdx: 2,
      correctDigit: 3,
      hint: '한 행에 1, 2, 3이 한 번씩 들어가야 합니다.',
    },
  },
  {
    title: '박스 제약 이해',
    body:
      '3x3 박스도 행/열과 마찬가지로 1~3(미니 그리드 기준)이 한 번씩 들어가야 합니다. 강조된 빈 셀에 들어갈 숫자는 무엇일까요?',
    miniBoard: {
      size: 3,
      cells: [3, 1, 2, 2, null, 1, 1, 2, 3],
      givens: [0, 1, 2, 3, 5, 6, 7, 8],
      highlightCells: [4],
    },
    challenge: {
      targetIdx: 4,
      correctDigit: 3,
      hint: '박스 안에서 빠진 숫자를 찾아보세요.',
    },
  },
];

export const classicManifest: VariantManifest = {
  id: 'classic',
  displayName: 'Classic Sudoku',
  domain: { values: CLASSIC_DOMAIN },
  regionsKind: 'standard',
  visualChannels: [],
  tutorialOneLiner: '1~9를 모든 행/열/3x3 박스에 한 번씩 배치하세요.',
  rulePanelMD: `# Classic Sudoku\n\n각 행, 열, 3x3 박스에 1부터 9까지 한 번씩 들어가도록 채우세요.`,
  difficulties: ['easy', 'medium', 'hard', 'expert'],
  tutorialSteps: classicTutorialSteps,
  adapter: {
    generate(seed, difficulty) {
      const r = generateClassic({ seed, difficulty });
      return { puzzle: r.puzzle, solution: r.solution };
    },
    serialize(b) {
      return boardToString(b);
    },
    deserialize(s) {
      return boardFromString(s, CLASSIC_DOMAIN, 'classic');
    },
  },
};
