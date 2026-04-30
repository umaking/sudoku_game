import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStore } from '@state/store';
import { createEmptyBoard, cloneBoard } from '@core/board';
import type { Board } from '@core/types';
import { useSudokuFx } from './useSudokuFx';

vi.mock('@ui/audio/soundEngine', () => ({
  playPlaceTone: vi.fn(),
  playClearTone: vi.fn(),
  playMemoTone: vi.fn(),
  playRegionCompleteTone: vi.fn(),
  unlockAudio: vi.fn(),
  __resetSoundEngine: vi.fn(),
}));

import {
  playPlaceTone,
  playClearTone,
  playMemoTone,
  playRegionCompleteTone,
} from '@ui/audio/soundEngine';

const DOMAIN = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function freshBoard(): Board {
  return createEmptyBoard(9, DOMAIN, 'classic');
}

function setCellValue(board: Board, idx: number, value: number | null): Board {
  const next = cloneBoard(board);
  const cell = next.cells[idx];
  if (cell) cell.value = value;
  return next;
}

function resetStore(): void {
  act(() => {
    useStore.setState({
      board: null,
      selectedIdx: null,
      pencilMode: false,
      soundEnabled: true,
    });
  });
}

describe('useSudokuFx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initial render with no board: animatingRegionIds is empty, no sounds', () => {
    const { result } = renderHook(() => useSudokuFx());
    expect(result.current.animatingRegionIds.size).toBe(0);
    expect(playPlaceTone).not.toHaveBeenCalled();
  });

  it('loading a board does not fire sound (treated as fresh start)', () => {
    const { result } = renderHook(() => useSudokuFx());
    act(() => {
      useStore.getState().loadBoard(freshBoard());
    });
    expect(result.current.animatingRegionIds.size).toBe(0);
    expect(playPlaceTone).not.toHaveBeenCalled();
  });

  it('placing a digit in a non-completing cell fires playPlaceTone', () => {
    renderHook(() => useSudokuFx());
    act(() => {
      useStore.getState().loadBoard(freshBoard());
    });
    act(() => {
      const b = useStore.getState().board;
      if (b) useStore.setState({ board: setCellValue(b, 40, 5) });
    });
    expect(playPlaceTone).toHaveBeenCalledTimes(1);
    expect(playRegionCompleteTone).not.toHaveBeenCalled();
  });

  it('clearing a placed digit fires playClearTone', () => {
    renderHook(() => useSudokuFx());
    act(() => {
      useStore.getState().loadBoard(freshBoard());
    });
    act(() => {
      const b = useStore.getState().board;
      if (b) useStore.setState({ board: setCellValue(b, 40, 5) });
    });
    act(() => {
      const b = useStore.getState().board;
      if (b) useStore.setState({ board: setCellValue(b, 40, null) });
    });
    expect(playClearTone).toHaveBeenCalledTimes(1);
  });

  it('toggling a candidate fires playMemoTone', () => {
    renderHook(() => useSudokuFx());
    act(() => {
      useStore.getState().loadBoard(freshBoard());
    });
    act(() => {
      const b = useStore.getState().board;
      if (!b) return;
      const next = cloneBoard(b);
      const cell = next.cells[10];
      if (cell) cell.candidates = cell.candidates ^ 0b100;
      useStore.setState({ board: next });
    });
    expect(playMemoTone).toHaveBeenCalledTimes(1);
  });

  it('completing a row adds its id to animatingRegionIds and fires region chime', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSudokuFx());
    act(() => {
      useStore.getState().loadBoard(freshBoard());
    });
    // Fill row 0 incrementally; only the last placement should trigger
    // region completion.
    for (let c = 0; c < 8; c++) {
      const v = c + 1;
      act(() => {
        const b = useStore.getState().board;
        if (b) useStore.setState({ board: setCellValue(b, c, v) });
      });
    }
    // Region not yet complete; place tone fired but not chime.
    expect(playRegionCompleteTone).not.toHaveBeenCalled();
    expect(result.current.animatingRegionIds.size).toBe(0);

    // Final placement completes the row.
    act(() => {
      const b = useStore.getState().board;
      if (b) useStore.setState({ board: setCellValue(b, 8, 9) });
    });

    expect(playRegionCompleteTone).toHaveBeenCalledTimes(1);
    expect(result.current.animatingRegionIds.has('row-0')).toBe(true);

    // After the 800ms timeout the animation entry should clear.
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(result.current.animatingRegionIds.has('row-0')).toBe(false);
  });

  it('soundEnabled=false suppresses tones but animation still runs', () => {
    vi.useFakeTimers();
    act(() => {
      useStore.setState({ soundEnabled: false });
    });
    const { result } = renderHook(() => useSudokuFx());
    act(() => {
      useStore.getState().loadBoard(freshBoard());
    });
    // Fill row 0 fully
    act(() => {
      const b0 = useStore.getState().board;
      if (!b0) return;
      const next = cloneBoard(b0);
      for (let c = 0; c < 9; c++) {
        const cell = next.cells[c];
        if (cell) cell.value = c + 1;
      }
      useStore.setState({ board: next });
    });
    expect(playRegionCompleteTone).not.toHaveBeenCalled();
    expect(playPlaceTone).not.toHaveBeenCalled();
    expect(result.current.animatingRegionIds.has('row-0')).toBe(true);
  });
});
