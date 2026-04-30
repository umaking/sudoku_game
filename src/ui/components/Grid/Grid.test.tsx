import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createEmptyBoard } from '@core/board';
import { useStore } from '@state/store';
import type { Board } from '@core/types';
import { Grid } from './Grid';

const DOMAIN = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function makeBoardWithEdges(): Board {
  const b = createEmptyBoard(9, DOMAIN, 'sum-diff');
  // Horizontal pair (0,1): sum 11
  b.edgeDecorations.push({ kind: 'sum', a: 0, b: 1, value: 11 });
  // Horizontal pair (3,4): diff 3
  b.edgeDecorations.push({ kind: 'diff', a: 3, b: 4, value: 3 });
  return b;
}

function resetStore() {
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

describe('Grid', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders 81 cell buttons after a board is loaded', () => {
    act(() => {
      useStore.getState().loadBoard(createEmptyBoard(9, DOMAIN, 'classic'));
    });
    render(<Grid />);
    const buttons = screen.getAllByRole('gridcell');
    expect(buttons).toHaveLength(81);
  });

  it('clicking a cell updates selectedIdx in the store', async () => {
    const user = userEvent.setup();
    act(() => {
      useStore.getState().loadBoard(createEmptyBoard(9, DOMAIN, 'classic'));
    });
    render(<Grid />);
    const buttons = screen.getAllByRole('gridcell');
    const target = buttons[40];
    expect(target).toBeDefined();
    if (target) {
      await user.click(target);
    }
    expect(useStore.getState().selectedIdx).toBe(40);
  });

  it('renders sum/diff edge labels with text and kind data attribute', () => {
    act(() => {
      useStore.getState().loadBoard(makeBoardWithEdges());
    });
    const { container } = render(<Grid />);
    // Sum label uses '+', diff uses '−' (U+2212).
    expect(screen.getByText('+11')).toBeTruthy();
    expect(screen.getByText('−3')).toBeTruthy();
    const sumGroups = container.querySelectorAll('[data-edge-kind="sum"]');
    const diffGroups = container.querySelectorAll('[data-edge-kind="diff"]');
    expect(sumGroups.length).toBe(1);
    expect(diffGroups.length).toBe(1);
  });

  it('marks edge as not violated when at least one endpoint is empty', () => {
    act(() => {
      useStore.getState().loadBoard(makeBoardWithEdges());
    });
    const { container } = render(<Grid />);
    const sumGroup = container.querySelector('[data-edge-kind="sum"]');
    expect(sumGroup?.getAttribute('data-edge-violated')).toBe('false');
  });

  it('flags edge violation when filled values disagree with sum constraint', () => {
    const board = makeBoardWithEdges();
    // a=0, b=1, sum should be 11. Set 1+2=3, which violates.
    board.cells[0]!.value = 1;
    board.cells[1]!.value = 2;
    act(() => {
      useStore.getState().loadBoard(board);
    });
    const { container } = render(<Grid />);
    const sumGroup = container.querySelector('[data-edge-kind="sum"]');
    expect(sumGroup?.getAttribute('data-edge-violated')).toBe('true');
  });

  it('does not flag violation when sum constraint is satisfied', () => {
    const board = makeBoardWithEdges();
    // a=0, b=1, sum=11. Set 5+6=11, which satisfies.
    board.cells[0]!.value = 5;
    board.cells[1]!.value = 6;
    act(() => {
      useStore.getState().loadBoard(board);
    });
    const { container } = render(<Grid />);
    const sumGroup = container.querySelector('[data-edge-kind="sum"]');
    expect(sumGroup?.getAttribute('data-edge-violated')).toBe('false');
  });

  it('flags edge violation when diff is wrong (and uses absolute value)', () => {
    const board = makeBoardWithEdges();
    // a=3, b=4, diff=3. Set 7 and 6 -> |7-6|=1 -> violates.
    board.cells[3]!.value = 7;
    board.cells[4]!.value = 6;
    act(() => {
      useStore.getState().loadBoard(board);
    });
    const { container } = render(<Grid />);
    const diffGroup = container.querySelector('[data-edge-kind="diff"]');
    expect(diffGroup?.getAttribute('data-edge-violated')).toBe('true');
  });

  it('does not flag violation when diff is satisfied symmetrically', () => {
    const board = makeBoardWithEdges();
    // a=3, b=4, diff=3. |2-5|=3 satisfies.
    board.cells[3]!.value = 2;
    board.cells[4]!.value = 5;
    act(() => {
      useStore.getState().loadBoard(board);
    });
    const { container } = render(<Grid />);
    const diffGroup = container.querySelector('[data-edge-kind="diff"]');
    expect(diffGroup?.getAttribute('data-edge-violated')).toBe('false');
  });
});
