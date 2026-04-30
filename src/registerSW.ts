/**
 * Service Worker registration helper.
 *
 * Uses a dynamic import of `virtual:pwa-register` so that environments without
 * the vite-plugin-pwa virtual module (e.g. vitest) do not fail at import time.
 */
export async function registerSW(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  try {
    const mod = await import(
      /* @vite-ignore */ 'virtual:pwa-register'
    );
    const register = (mod as { registerSW?: (opts: unknown) => unknown })
      .registerSW;
    if (typeof register === 'function') {
      register({
        onNeedRefresh() {
          // autoUpdate strategy — next reload will pick up the new SW.
        },
        onOfflineReady() {
          // eslint-disable-next-line no-console
          console.info('[PWA] Offline ready');
        },
      });
    }
  } catch {
    // dev or test environment without PWA virtual module — no-op
  }
}
