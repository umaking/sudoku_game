import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useStore } from '@state/store';
import {
  clearRegistry,
  registerVariant,
} from '@variants/registry';
import { createEmptyBoard } from '@core/board';
import type { VariantManifest } from '@variants/types';
import { ResultScreen } from './ResultScreen';

const DOMAIN = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function fakeManifest(id: string): VariantManifest {
  return {
    id,
    displayName: id,
    domain: { values: DOMAIN },
    regionsKind: 'standard',
    visualChannels: [],
    tutorialOneLiner: 'tut',
    rulePanelMD: 'rule',
    difficulties: ['easy'],
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
    s.clearStats();
    useStore.setState({
      board: null,
      selectedIdx: null,
      pencilMode: false,
    });
  });
}

describe('ResultScreen', () => {
  beforeEach(() => {
    clearRegistry();
    resetStore();
  });

  it('shows formatted time and mistakes', () => {
    act(() => {
      useStore.getState().startSession('classic', 'easy');
      useStore.setState({ elapsedMs: 75_000, mistakes: 3 });
    });
    render(<ResultScreen open={true} onClose={() => {}} />);
    expect(screen.getByTestId('result-time').textContent).toBe('01:15');
    expect(screen.getByTestId('result-mistakes').textContent).toBe('3');
  });

  it('shows PB badge when current time matches the recorded best', () => {
    act(() => {
      useStore.getState().startSession('classic', 'easy');
      useStore.setState({ elapsedMs: 30_000, mistakes: 0 });
      // record this completion to make it the PB
      useStore.getState().recordCompletion({
        variantId: 'classic',
        difficulty: 'easy',
        timeMs: 30_000,
        mistakes: 0,
      });
    });
    render(<ResultScreen open={true} onClose={() => {}} />);
    expect(screen.queryByTestId('result-pb')).not.toBeNull();
  });

  it('does not show PB badge when elapsed time is slower than best', () => {
    act(() => {
      useStore.getState().startSession('classic', 'easy');
      // record fast completion as PB
      useStore.getState().recordCompletion({
        variantId: 'classic',
        difficulty: 'easy',
        timeMs: 20_000,
        mistakes: 0,
      });
      // current attempt is slower
      useStore.setState({ elapsedMs: 60_000, mistakes: 1 });
    });
    render(<ResultScreen open={true} onClose={() => {}} />);
    expect(screen.queryByTestId('result-pb')).toBeNull();
  });

  it('clicking 다시 도전 starts a new game and calls onClose', async () => {
    const user = userEvent.setup();
    registerVariant(fakeManifest('classic'));
    const onClose = vi.fn();
    act(() => {
      useStore.getState().startSession('classic', 'easy');
      useStore.setState({ elapsedMs: 5_000, mistakes: 0 });
    });
    render(<ResultScreen open={true} onClose={onClose} />);
    const btn = screen.getByRole('button', { name: '다시 도전' });
    await user.click(btn);
    expect(onClose).toHaveBeenCalled();
    // newGame loads a board through the fake adapter
    expect(useStore.getState().board).not.toBeNull();
  });
});
