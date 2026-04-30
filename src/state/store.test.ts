import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import type { Board } from '@core/types';
import { createEmptyBoard } from '@core/board';
import { useStore } from './store';

const DOMAIN = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function makeBoard(): Board {
  return createEmptyBoard(9, DOMAIN, 'classic');
}

function makeBoardWithGiven(givenIdx: number, givenDigit: number): Board {
  const b = createEmptyBoard(9, DOMAIN, 'classic');
  const cell = b.cells[givenIdx]!;
  cell.value = givenDigit;
  cell.given = true;
  cell.candidates = 0;
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

describe('store - boardSlice', () => {
  beforeEach(() => {
    resetStore();
  });

  it('loadBoard then selectCell sets selectedIdx', () => {
    act(() => {
      useStore.getState().loadBoard(makeBoard());
      useStore.getState().selectCell(40);
    });
    expect(useStore.getState().selectedIdx).toBe(40);
    expect(useStore.getState().board).not.toBeNull();
  });

  it('setDigit updates board cell and pushes history', () => {
    act(() => {
      useStore.getState().loadBoard(makeBoard());
      useStore.getState().setDigit(40, 5);
    });
    const s = useStore.getState();
    expect(s.board?.cells[40]?.value).toBe(5);
    expect(s.past.length).toBe(1);
    expect(s.future.length).toBe(0);
  });

  it('setDigit then undo reverts the cell and moves entry to future', () => {
    act(() => {
      useStore.getState().loadBoard(makeBoard());
      useStore.getState().setDigit(40, 5);
    });
    expect(useStore.getState().past.length).toBe(1);

    act(() => {
      useStore.getState().undo();
    });

    const s = useStore.getState();
    expect(s.board?.cells[40]?.value).toBeNull();
    expect(s.past.length).toBe(0);
    expect(s.future.length).toBe(1);
  });

  it('undo then redo restores the cell value', () => {
    act(() => {
      useStore.getState().loadBoard(makeBoard());
      useStore.getState().setDigit(40, 5);
      useStore.getState().undo();
      useStore.getState().redo();
    });

    const s = useStore.getState();
    expect(s.board?.cells[40]?.value).toBe(5);
    expect(s.past.length).toBe(1);
    expect(s.future.length).toBe(0);
  });

  it('togglePencilMode twice returns to original state', () => {
    const initial = useStore.getState().pencilMode;
    act(() => {
      useStore.getState().togglePencilMode();
    });
    expect(useStore.getState().pencilMode).toBe(!initial);
    act(() => {
      useStore.getState().togglePencilMode();
    });
    expect(useStore.getState().pencilMode).toBe(initial);
  });

  it('setDigit on a given cell is a no-op', () => {
    act(() => {
      useStore.getState().loadBoard(makeBoardWithGiven(10, 7));
    });
    const before = useStore.getState();
    expect(before.board?.cells[10]?.value).toBe(7);
    expect(before.past.length).toBe(0);

    act(() => {
      useStore.getState().setDigit(10, 3);
    });

    const after = useStore.getState();
    expect(after.board?.cells[10]?.value).toBe(7);
    expect(after.past.length).toBe(0);
  });
});

describe('store - gameSessionSlice', () => {
  beforeEach(() => {
    resetStore();
  });

  it('startSession sets variantId and startedAt', () => {
    act(() => {
      useStore.getState().startSession('classic', 'easy');
    });
    const s = useStore.getState();
    expect(s.variantId).toBe('classic');
    expect(s.difficulty).toBe('easy');
    expect(s.startedAt).not.toBeNull();
  });

  it('tick increments elapsedMs', () => {
    act(() => {
      useStore.getState().startSession('classic', 'easy');
      useStore.getState().tick(1000);
    });
    expect(useStore.getState().elapsedMs).toBe(1000);
  });

  it('pauseSession causes tick to be ignored', () => {
    act(() => {
      useStore.getState().startSession('classic', 'easy');
      useStore.getState().pauseSession();
      useStore.getState().tick(1000);
    });
    expect(useStore.getState().elapsedMs).toBe(0);

    act(() => {
      useStore.getState().resumeSession();
      useStore.getState().tick(500);
    });
    expect(useStore.getState().elapsedMs).toBe(500);
  });

  it('finishSession blocks tick', () => {
    act(() => {
      useStore.getState().startSession('classic', 'easy');
      useStore.getState().finishSession();
      useStore.getState().tick(1000);
    });
    expect(useStore.getState().elapsedMs).toBe(0);
    expect(useStore.getState().finished).toBe(true);
  });
});

describe('store - settingsSlice', () => {
  beforeEach(() => {
    resetStore();
  });

  it('default values are correct', () => {
    const s = useStore.getState();
    expect(s.theme).toBe('system');
    expect(s.colorBlind).toBe(false);
    expect(s.fontScale).toBe(1);
    expect(s.highlightSameDigit).toBe(true);
    expect(s.autoCheck).toBe(true);
    expect(s.soundEnabled).toBe(true);
  });

  it('setters update settings', () => {
    act(() => {
      useStore.getState().setTheme('dark');
      useStore.getState().setColorBlind(true);
      useStore.getState().setFontScale(1.3);
      useStore.getState().setHighlightSameDigit(false);
      useStore.getState().setAutoCheck(false);
      useStore.getState().setSoundEnabled(false);
    });

    const s = useStore.getState();
    expect(s.theme).toBe('dark');
    expect(s.colorBlind).toBe(true);
    expect(s.fontScale).toBe(1.3);
    expect(s.highlightSameDigit).toBe(false);
    expect(s.autoCheck).toBe(false);
    expect(s.soundEnabled).toBe(false);
  });
});

describe('store - candidate toggle', () => {
  beforeEach(() => {
    resetStore();
  });

  it('toggleCandidate updates candidates and pushes history', () => {
    act(() => {
      useStore.getState().loadBoard(makeBoard());
    });
    const before = useStore.getState().board?.cells[20]?.candidates ?? 0;

    act(() => {
      useStore.getState().toggleCandidate(20, 3);
    });

    const after = useStore.getState().board?.cells[20]?.candidates ?? 0;
    expect(after).not.toBe(before);
    expect(useStore.getState().past.length).toBe(1);
  });
});
