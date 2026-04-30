import type { StateCreator } from 'zustand';
import type { Board, CellIdx, Digit, Move } from '@core/types';
import { applyMoveInPlace, cloneBoard, getCell } from '@core/board';
import type { HistorySlice } from './historySlice';

export interface BoardSlice {
  board: Board | null;
  selectedIdx: CellIdx | null;
  pencilMode: boolean;
  loadBoard: (b: Board) => void;
  selectCell: (idx: CellIdx | null) => void;
  setDigit: (idx: CellIdx, digit: Digit) => void;
  clearCell: (idx: CellIdx) => void;
  toggleCandidate: (idx: CellIdx, digit: Digit) => void;
  togglePencilMode: () => void;
}

let moveCounter = 0;
function newMoveId(): string {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }
  moveCounter += 1;
  return `move-${Date.now()}-${moveCounter}`;
}

export const createBoardSlice: StateCreator<
  BoardSlice & HistorySlice,
  [],
  [],
  BoardSlice
> = (set, get) => ({
  board: null,
  selectedIdx: null,
  pencilMode: false,

  loadBoard: (b) =>
    set({
      board: b,
      selectedIdx: null,
      past: [],
      future: [],
    }),

  selectCell: (idx) => set({ selectedIdx: idx }),

  setDigit: (idx, digit) => {
    const state = get();
    const board = state.board;
    if (!board) return;
    const cell = getCell(board, idx);
    if (cell.given) return;

    const move: Move = {
      id: newMoveId(),
      kind: 'set',
      idx,
      digit,
      prev: { value: cell.value, candidates: cell.candidates },
    };

    const nextBoard = cloneBoard(board);
    applyMoveInPlace(nextBoard, move);

    set({ board: nextBoard });
    get().pushMove(move);
  },

  clearCell: (idx) => {
    const state = get();
    const board = state.board;
    if (!board) return;
    const cell = getCell(board, idx);
    if (cell.given) return;
    if (cell.value === null) return;

    const move: Move = {
      id: newMoveId(),
      kind: 'clear',
      idx,
      prev: { value: cell.value, candidates: cell.candidates },
    };

    const nextBoard = cloneBoard(board);
    applyMoveInPlace(nextBoard, move);

    set({ board: nextBoard });
    get().pushMove(move);
  },

  toggleCandidate: (idx, digit) => {
    const state = get();
    const board = state.board;
    if (!board) return;
    const cell = getCell(board, idx);
    if (cell.given) return;
    if (cell.value !== null) return;

    const move: Move = {
      id: newMoveId(),
      kind: 'candidate-toggle',
      idx,
      digit,
      prev: { value: cell.value, candidates: cell.candidates },
    };

    const nextBoard = cloneBoard(board);
    applyMoveInPlace(nextBoard, move);

    set({ board: nextBoard });
    get().pushMove(move);
  },

  togglePencilMode: () => set((s) => ({ pencilMode: !s.pencilMode })),
});
