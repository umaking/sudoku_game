import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useStore } from '@state/store';
import {
  clearRegistry,
  registerVariant,
} from '@variants/registry';
import { createEmptyBoard } from '@core/board';
import type { TutorialStep, VariantManifest } from '@variants/types';
import { Tutorial } from './Tutorial';

const DOMAIN = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function fakeManifest(
  id: string,
  steps: TutorialStep[] | undefined,
): VariantManifest {
  return {
    id,
    displayName: id,
    domain: { values: DOMAIN },
    regionsKind: 'standard',
    visualChannels: [],
    tutorialOneLiner: 'tut',
    rulePanelMD: '# rule',
    difficulties: ['easy'],
    ...(steps !== undefined ? { tutorialSteps: steps } : {}),
    adapter: {
      generate() {
        return {
          puzzle: createEmptyBoard(9, DOMAIN, id),
          solution: createEmptyBoard(9, DOMAIN, id),
        };
      },
      serialize() {
        return '';
      },
      deserialize() {
        return createEmptyBoard(9, DOMAIN, id);
      },
    },
  };
}

function resetStore(): void {
  const s = useStore.getState();
  act(() => {
    s.resetSession();
    s.clearHistory();
    useStore.setState({
      board: null,
      selectedIdx: null,
      pencilMode: false,
    });
  });
}

describe('Tutorial', () => {
  beforeEach(() => {
    clearRegistry();
    resetStore();
  });

  it('shows fallback message when variant has no tutorial steps', () => {
    registerVariant(fakeManifest('classic', []));
    act(() => {
      useStore.getState().startSession('classic', 'easy');
    });
    render(<Tutorial open={true} onClose={() => {}} />);
    expect(screen.getByText(/이 변형은 튜토리얼이 없습니다/)).toBeTruthy();
  });

  it('walks step by step using 다음 button', async () => {
    const user = userEvent.setup();
    const steps: TutorialStep[] = [
      { title: 'Step 1', body: 'first' },
      { title: 'Step 2', body: 'second' },
    ];
    registerVariant(fakeManifest('classic', steps));
    act(() => {
      useStore.getState().startSession('classic', 'easy');
    });
    render(<Tutorial open={true} onClose={() => {}} />);
    expect(screen.getByText('Step 1')).toBeTruthy();
    expect(screen.getByTestId('tutorial-progress').textContent).toBe('1 / 2');

    const next = screen.getByTestId('tutorial-next');
    await user.click(next);
    expect(screen.getByText('Step 2')).toBeTruthy();
    expect(screen.getByTestId('tutorial-progress').textContent).toBe('2 / 2');
  });

  it('blocks 다음 until challenge digit is correct', async () => {
    const user = userEvent.setup();
    const steps: TutorialStep[] = [
      {
        title: 'Solve',
        body: 'pick the right digit',
        miniBoard: {
          size: 3,
          cells: [1, 2, null, null, null, null, null, null, null],
          givens: [0, 1],
          highlightCells: [2],
        },
        challenge: { targetIdx: 2, correctDigit: 3 },
      },
      { title: 'Done', body: 'final' },
    ];
    registerVariant(fakeManifest('classic', steps));
    act(() => {
      useStore.getState().startSession('classic', 'easy');
    });
    render(<Tutorial open={true} onClose={() => {}} />);

    const next = screen.getByTestId('tutorial-next');
    expect((next as HTMLButtonElement).disabled).toBe(true);

    // Wrong attempt first (size=3 mini-board only renders 1..3)
    await user.click(screen.getByTestId('tutorial-digit-2'));
    expect(screen.getByTestId('tutorial-feedback-wrong')).toBeTruthy();
    expect((next as HTMLButtonElement).disabled).toBe(true);

    // Correct attempt
    await user.click(screen.getByTestId('tutorial-digit-3'));
    expect(screen.getByTestId('tutorial-feedback-correct')).toBeTruthy();
    expect((next as HTMLButtonElement).disabled).toBe(false);
  });
});
