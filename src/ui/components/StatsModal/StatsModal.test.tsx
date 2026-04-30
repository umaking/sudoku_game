import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useStore } from '@state/store';
import {
  clearRegistry,
  registerVariant,
} from '@variants/registry';
import { createEmptyBoard } from '@core/board';
import type { VariantManifest } from '@variants/types';
import type { Difficulty } from '@core/types';
import { StatsModal } from './StatsModal';

const DOMAIN = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function fakeManifest(
  id: string,
  displayName: string,
  difficulties: Difficulty[],
): VariantManifest {
  return {
    id,
    displayName,
    domain: { values: DOMAIN },
    regionsKind: 'standard',
    visualChannels: [],
    tutorialOneLiner: 'tut',
    rulePanelMD: 'rule',
    difficulties,
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

function resetStats(): void {
  act(() => {
    useStore.getState().clearStats();
  });
}

describe('StatsModal', () => {
  beforeEach(() => {
    clearRegistry();
    resetStats();
  });

  afterEach(() => {
    clearRegistry();
  });

  it('renders one row per variant × difficulty combination', () => {
    registerVariant(fakeManifest('classic', 'Classic', ['easy', 'medium']));
    registerVariant(fakeManifest('parity', 'Parity', ['hard']));
    render(<StatsModal open={true} onClose={() => {}} />);
    expect(screen.getByTestId('stats-row-classic-easy')).toBeTruthy();
    expect(screen.getByTestId('stats-row-classic-medium')).toBeTruthy();
    expect(screen.getByTestId('stats-row-parity-hard')).toBeTruthy();
    // No extra rows.
    expect(
      screen.getByTestId('stats-table').querySelectorAll('tbody tr').length,
    ).toBe(3);
  });

  it('shows en-dash for PB when there is no recorded best time', () => {
    registerVariant(fakeManifest('classic', 'Classic', ['easy']));
    render(<StatsModal open={true} onClose={() => {}} />);
    const pbCell = screen.getByTestId('stats-pb-classic-easy');
    expect(pbCell.textContent).toBe('–');
  });

  it('shows formatted time when a PB exists', () => {
    registerVariant(fakeManifest('classic', 'Classic', ['easy']));
    act(() => {
      useStore.getState().recordCompletion({
        variantId: 'classic',
        difficulty: 'easy',
        timeMs: 75_000,
        mistakes: 1,
      });
    });
    render(<StatsModal open={true} onClose={() => {}} />);
    const pbCell = screen.getByTestId('stats-pb-classic-easy');
    expect(pbCell.textContent).toBe('01:15');
  });

  it('clear button resets stats when confirmed', async () => {
    const user = userEvent.setup();
    registerVariant(fakeManifest('classic', 'Classic', ['easy']));
    act(() => {
      useStore.getState().recordCompletion({
        variantId: 'classic',
        difficulty: 'easy',
        timeMs: 60_000,
        mistakes: 0,
      });
    });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<StatsModal open={true} onClose={() => {}} />);
    const btn = screen.getByTestId('stats-clear');
    await user.click(btn);
    expect(confirmSpy).toHaveBeenCalled();
    expect(useStore.getState().byVariant).toEqual({});
    expect(useStore.getState().records).toEqual([]);
    confirmSpy.mockRestore();
  });

  it('clear button does not reset stats when cancelled', async () => {
    const user = userEvent.setup();
    registerVariant(fakeManifest('classic', 'Classic', ['easy']));
    act(() => {
      useStore.getState().recordCompletion({
        variantId: 'classic',
        difficulty: 'easy',
        timeMs: 60_000,
        mistakes: 0,
      });
    });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<StatsModal open={true} onClose={() => {}} />);
    const btn = screen.getByTestId('stats-clear');
    await user.click(btn);
    expect(confirmSpy).toHaveBeenCalled();
    expect(useStore.getState().records.length).toBe(1);
    confirmSpy.mockRestore();
  });
});
