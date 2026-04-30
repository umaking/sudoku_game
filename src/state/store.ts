import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createBoardSlice,
  type BoardSlice,
} from './slices/boardSlice';
import {
  createHistorySlice,
  type HistorySlice,
} from './slices/historySlice';
import {
  createSettingsSlice,
  type SettingsSlice,
} from './slices/settingsSlice';
import {
  createGameSessionSlice,
  type GameSessionSlice,
} from './slices/gameSessionSlice';
import {
  createStatsSlice,
  type StatsSlice,
} from './slices/statsSlice';
import { STORAGE_KEY_SETTINGS, settingsStorage } from './persistence';

export type RootState =
  & BoardSlice
  & HistorySlice
  & SettingsSlice
  & GameSessionSlice
  & StatsSlice;

type PersistedShape = Pick<
  SettingsSlice,
  'theme' | 'colorBlind' | 'fontScale' | 'highlightSameDigit' | 'autoCheck' | 'soundEnabled'
> & Pick<StatsSlice, 'records' | 'byVariant'>;

export const useStore = create<RootState>()(
  persist(
    (...args) => ({
      ...createBoardSlice(...args),
      ...createHistorySlice(...args),
      ...createSettingsSlice(...args),
      ...createGameSessionSlice(...args),
      ...createStatsSlice(...args),
    }),
    {
      name: STORAGE_KEY_SETTINGS,
      storage: settingsStorage,
      version: 3,
      partialize: (s): PersistedShape => ({
        theme: s.theme,
        colorBlind: s.colorBlind,
        fontScale: s.fontScale,
        highlightSameDigit: s.highlightSameDigit,
        autoCheck: s.autoCheck,
        soundEnabled: s.soundEnabled,
        records: s.records,
        byVariant: s.byVariant,
      }),
      migrate: (persisted, version) => {
        if (persisted === null || typeof persisted !== 'object') {
          return persisted as PersistedShape;
        }
        let next = persisted as Record<string, unknown>;
        if (version < 2) {
          next = {
            ...next,
            records: [],
            byVariant: {},
          };
        }
        if (version < 3) {
          next = {
            ...next,
            soundEnabled: true,
          };
        }
        return next as unknown as PersistedShape;
      },
    },
  ),
);

export default useStore;
