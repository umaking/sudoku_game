import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useStore } from '@state/store';
import {
  clearRegistry,
  registerVariant,
} from '@variants/registry';
import type { VariantManifest } from '@variants/types';
import { createEmptyBoard } from '@core/board';
import { VariantPicker } from './VariantPicker';

const DOMAIN = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function fakeManifest(id: string, displayName = id): VariantManifest {
  return {
    id,
    displayName,
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
    useStore.setState({
      board: null,
      selectedIdx: null,
      pencilMode: false,
    });
  });
}

describe('VariantPicker', () => {
  beforeEach(() => {
    clearRegistry();
    resetStore();
  });

  it('renders one option per registered variant', () => {
    registerVariant(fakeManifest('classic', 'Classic Sudoku'));
    registerVariant(fakeManifest('parity', 'Parity Sudoku'));
    render(<VariantPicker />);
    const select = screen.getByTestId('variant-picker') as HTMLSelectElement;
    expect(select.options).toHaveLength(2);
    const labels = Array.from(select.options).map((o) => o.textContent);
    expect(labels).toEqual(['Classic Sudoku', 'Parity Sudoku']);
  });

  it('is disabled when only one variant is registered', () => {
    registerVariant(fakeManifest('classic', 'Classic Sudoku'));
    render(<VariantPicker />);
    const select = screen.getByTestId('variant-picker') as HTMLSelectElement;
    expect(select.disabled).toBe(true);
  });

  it('shows current variantId from the store as the selected value', () => {
    registerVariant(fakeManifest('classic', 'Classic Sudoku'));
    registerVariant(fakeManifest('parity', 'Parity Sudoku'));
    act(() => {
      useStore.getState().startSession('parity', 'easy');
    });
    render(<VariantPicker />);
    const select = screen.getByTestId('variant-picker') as HTMLSelectElement;
    expect(select.value).toBe('parity');
  });

  it('falls back to "classic" display when variantId is null', () => {
    registerVariant(fakeManifest('classic', 'Classic Sudoku'));
    registerVariant(fakeManifest('parity', 'Parity Sudoku'));
    render(<VariantPicker />);
    const select = screen.getByTestId('variant-picker') as HTMLSelectElement;
    expect(select.value).toBe('classic');
  });

  it('change event triggers a new game and updates store.variantId', async () => {
    const user = userEvent.setup();
    registerVariant(fakeManifest('classic', 'Classic Sudoku'));
    registerVariant(fakeManifest('parity', 'Parity Sudoku'));
    act(() => {
      useStore.getState().startSession('classic', 'easy');
    });
    render(<VariantPicker />);
    const select = screen.getByTestId('variant-picker') as HTMLSelectElement;
    await user.selectOptions(select, 'parity');
    expect(useStore.getState().variantId).toBe('parity');
    expect(useStore.getState().difficulty).toBe('easy');
    expect(useStore.getState().board?.variantId).toBe('parity');
  });
});
