import { useCallback, useRef } from 'react';
import type { CellIdx } from '@core/types';

export interface UseLongPressOptions {
  onLongPress: (idx: CellIdx) => void;
  delayMs?: number;
}

export interface UseLongPressApi {
  /**
   * Returns pointer event handlers to spread on a per-cell button.
   * Triggers `onLongPress(idx)` after `delayMs` of continuous press.
   */
  pointerHandlers: (idx: CellIdx) => {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp: () => void;
    onPointerLeave: () => void;
    onPointerCancel: () => void;
    onPointerMove: (e: React.PointerEvent) => void;
  };
  /**
   * Returns true if the most recent press fired the long-press timer.
   * Read-only check (does not consume).
   */
  wasLongPress: () => boolean;
  /**
   * Returns whether the most recent press fired, AND resets the flag
   * so subsequent calls return false. Use this in onClick to decide
   * whether to suppress the regular click action.
   */
  consumeLongPress: () => boolean;
}

const MOVE_TOLERANCE_PX = 8;

/**
 * useLongPress — hook for long-press gestures on touch + mouse devices.
 *
 * Usage:
 *   const { pointerHandlers, consumeLongPress } = useLongPress({
 *     onLongPress: (idx) => togglePencilMode(),
 *   });
 *   <button
 *     onClick={() => { if (consumeLongPress()) return; selectCell(idx); }}
 *     {...pointerHandlers(idx)}
 *   />
 *
 * Implementation notes:
 * - Uses Pointer Events for unified mouse/touch/pen handling.
 * - Cancels the timer if the pointer moves more than MOVE_TOLERANCE_PX,
 *   leaves the element, or is cancelled by the OS.
 * - Sets a `firedRef` flag when the timer fires; consumers check this
 *   in their onClick to suppress click after a long-press.
 * - Optionally fires `navigator.vibrate(10)` for haptic feedback when
 *   available (mobile only).
 */
export function useLongPress({
  onLongPress,
  delayMs = 500,
}: UseLongPressOptions): UseLongPressApi {
  const firedRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
  }, []);

  const start = useCallback(
    (idx: CellIdx, x: number, y: number) => {
      // reset and (re)arm
      firedRef.current = false;
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      startPosRef.current = { x, y };
      timerRef.current = window.setTimeout(() => {
        firedRef.current = true;
        timerRef.current = null;
        // best-effort haptic feedback on mobile
        try {
          if (
            typeof navigator !== 'undefined' &&
            typeof navigator.vibrate === 'function'
          ) {
            navigator.vibrate(10);
          }
        } catch {
          // ignore — vibrate may throw in some browsers
        }
        onLongPress(idx);
      }, delayMs);
    },
    [onLongPress, delayMs],
  );

  const wasLongPress = useCallback(() => firedRef.current, []);

  const consumeLongPress = useCallback(() => {
    const v = firedRef.current;
    firedRef.current = false;
    return v;
  }, []);

  const pointerHandlers = useCallback(
    (idx: CellIdx) => ({
      onPointerDown: (e: React.PointerEvent) => {
        // ignore non-primary mouse buttons
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        start(idx, e.clientX, e.clientY);
      },
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      onPointerMove: (e: React.PointerEvent) => {
        const start0 = startPosRef.current;
        if (start0 === null) return;
        const dx = e.clientX - start0.x;
        const dy = e.clientY - start0.y;
        if (dx * dx + dy * dy > MOVE_TOLERANCE_PX * MOVE_TOLERANCE_PX) {
          cancel();
        }
      },
    }),
    [start, cancel],
  );

  return { pointerHandlers, wasLongPress, consumeLongPress };
}

export default useLongPress;
