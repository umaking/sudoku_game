import type { StateCreator } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

export interface SettingsSlice {
  theme: Theme;
  colorBlind: boolean;
  fontScale: number;
  highlightSameDigit: boolean;
  autoCheck: boolean;
  soundEnabled: boolean;
  setTheme: (t: Theme) => void;
  setColorBlind: (v: boolean) => void;
  setFontScale: (v: number) => void;
  setHighlightSameDigit: (v: boolean) => void;
  setAutoCheck: (v: boolean) => void;
  setSoundEnabled: (v: boolean) => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice, [], [], SettingsSlice> = (
  set,
) => ({
  theme: 'system',
  colorBlind: false,
  fontScale: 1,
  highlightSameDigit: true,
  autoCheck: true,
  soundEnabled: true,

  setTheme: (t) => set({ theme: t }),
  setColorBlind: (v) => set({ colorBlind: v }),
  setFontScale: (v) => set({ fontScale: v }),
  setHighlightSameDigit: (v) => set({ highlightSameDigit: v }),
  setAutoCheck: (v) => set({ autoCheck: v }),
  setSoundEnabled: (v) => set({ soundEnabled: v }),
});
