import { createJSONStorage, type StateStorage } from 'zustand/middleware';

export const STORAGE_KEY_SETTINGS = 'study-app:settings:v1';
export const STORAGE_KEY_STATS = 'study-app:stats:v1';
export const STORAGE_KEY_APP = 'study-app:state:v2';

function memoryStorage(): StateStorage {
  const map = new Map<string, string>();
  return {
    getItem: (name) => (map.has(name) ? (map.get(name) as string) : null),
    setItem: (name, value) => {
      map.set(name, value);
    },
    removeItem: (name) => {
      map.delete(name);
    },
  };
}

function getStorage(): StateStorage {
  if (
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as { localStorage?: Storage }).localStorage !== 'undefined'
  ) {
    const ls = (globalThis as { localStorage?: Storage }).localStorage;
    if (ls && typeof ls.setItem === 'function') {
      return ls as unknown as StateStorage;
    }
  }
  return memoryStorage();
}

export const settingsStorage = createJSONStorage(getStorage);
