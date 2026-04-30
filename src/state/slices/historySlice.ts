import type { StateCreator } from 'zustand';
import type { Move } from '@core/types';
import { applyMoveInPlace, cloneBoard, revertMoveInPlace } from '@core/board';
import type { BoardSlice } from './boardSlice';

export interface HistorySlice {
  past: Move[];
  future: Move[];
  pushMove: (m: Move) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
}

export const createHistorySlice: StateCreator<
  HistorySlice & BoardSlice,
  [],
  [],
  HistorySlice
> = (set, get) => ({
  past: [],
  future: [],

  pushMove: (m) =>
    set((s) => ({
      past: [...s.past, m],
      future: [],
    })),

  undo: () => {
    const state = get();
    if (state.past.length === 0) return;
    const move = state.past[state.past.length - 1];
    if (!move) return;
    if (!state.board) return;

    const nextBoard = cloneBoard(state.board);
    revertMoveInPlace(nextBoard, move);

    set({
      board: nextBoard,
      past: state.past.slice(0, -1),
      future: [...state.future, move],
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;
    const move = state.future[state.future.length - 1];
    if (!move) return;
    if (!state.board) return;

    const nextBoard = cloneBoard(state.board);
    applyMoveInPlace(nextBoard, move);

    set({
      board: nextBoard,
      past: [...state.past, move],
      future: state.future.slice(0, -1),
    });
  },

  clearHistory: () => set({ past: [], future: [] }),
});
