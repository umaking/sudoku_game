import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createEmptyBoard } from '@core/board';
import { useStore } from '@state/store';
import { NumberPad } from './NumberPad';

const DOMAIN = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

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

describe('NumberPad', () => {
  beforeEach(() => {
    resetStore();
  });

  it('clicking digit "5" with a selected cell sets value to 5', async () => {
    const user = userEvent.setup();
    act(() => {
      useStore.getState().loadBoard(createEmptyBoard(9, DOMAIN, 'classic'));
      useStore.getState().selectCell(0);
    });
    render(<NumberPad />);
    const btn = screen.getByRole('button', { name: /숫자 5/ });
    await user.click(btn);
    expect(useStore.getState().board?.cells[0]?.value).toBe(5);
  });

  it('toggling Memo turns pencilMode on', async () => {
    const user = userEvent.setup();
    act(() => {
      useStore.getState().loadBoard(createEmptyBoard(9, DOMAIN, 'classic'));
    });
    render(<NumberPad />);
    expect(useStore.getState().pencilMode).toBe(false);
    const memo = screen.getByRole('button', { name: /메모 모드/ });
    await user.click(memo);
    expect(useStore.getState().pencilMode).toBe(true);
  });
});
