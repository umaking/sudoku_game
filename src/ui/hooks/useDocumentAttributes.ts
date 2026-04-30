import { useEffect } from 'react';
import { useStore } from '@state/store';

/**
 * Synchronizes settings slice values with `<html>` data-* attributes and
 * CSS variables so that themed CSS can react to user preferences.
 *
 * - `theme` → `<html data-theme="light|dark">`. When `system`, the attribute
 *   is removed and we observe `prefers-color-scheme` to track the OS choice.
 * - `colorBlind` → `<html data-cb="1">` when enabled (Dev D's CSS reacts).
 * - `fontScale` → `--font-scale` CSS variable on `<html>`.
 */
export function useDocumentAttributes(): void {
  const theme = useStore((s) => s.theme);
  const colorBlind = useStore((s) => s.colorBlind);
  const fontScale = useStore((s) => s.fontScale);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    function applyTheme(t: 'light' | 'dark' | 'system'): void {
      if (t === 'system') {
        if (
          typeof window !== 'undefined' &&
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches
        ) {
          root.setAttribute('data-theme', 'dark');
        } else {
          root.setAttribute('data-theme', 'light');
        }
      } else {
        root.setAttribute('data-theme', t);
      }
    }

    applyTheme(theme);

    if (theme !== 'system') return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (): void => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (colorBlind) {
      root.setAttribute('data-cb', '1');
    } else {
      root.removeAttribute('data-cb');
    }
  }, [colorBlind]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--font-scale', String(fontScale));
  }, [fontScale]);
}

export default useDocumentAttributes;
