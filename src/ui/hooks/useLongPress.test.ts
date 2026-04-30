import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLongPress } from './useLongPress';

function makePointerEvent(
  overrides: Partial<{
    pointerType: string;
    button: number;
    clientX: number;
    clientY: number;
  }> = {},
): React.PointerEvent {
  return {
    pointerType: overrides.pointerType ?? 'touch',
    button: overrides.button ?? 0,
    clientX: overrides.clientX ?? 0,
    clientY: overrides.clientY ?? 0,
  } as unknown as React.PointerEvent;
}

describe('useLongPress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires onLongPress after the configured delay', () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() =>
      useLongPress({ onLongPress, delayMs: 500 }),
    );

    const handlers = result.current.pointerHandlers(42);
    act(() => {
      handlers.onPointerDown(makePointerEvent());
    });
    expect(onLongPress).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onLongPress).toHaveBeenCalledWith(42);
    expect(result.current.wasLongPress()).toBe(true);
  });

  it('does not fire onLongPress if pointer is released early', () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() =>
      useLongPress({ onLongPress, delayMs: 500 }),
    );

    const handlers = result.current.pointerHandlers(7);
    act(() => {
      handlers.onPointerDown(makePointerEvent());
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => {
      handlers.onPointerUp();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onLongPress).not.toHaveBeenCalled();
    expect(result.current.wasLongPress()).toBe(false);
  });

  it('cancels when pointer moves beyond tolerance', () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() =>
      useLongPress({ onLongPress, delayMs: 500 }),
    );

    const handlers = result.current.pointerHandlers(3);
    act(() => {
      handlers.onPointerDown(makePointerEvent({ clientX: 0, clientY: 0 }));
    });
    act(() => {
      handlers.onPointerMove(makePointerEvent({ clientX: 50, clientY: 0 }));
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('consumeLongPress returns true once then false (latch reset)', () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() =>
      useLongPress({ onLongPress, delayMs: 100 }),
    );

    const handlers = result.current.pointerHandlers(0);
    act(() => {
      handlers.onPointerDown(makePointerEvent());
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.consumeLongPress()).toBe(true);
    expect(result.current.consumeLongPress()).toBe(false);
    expect(result.current.wasLongPress()).toBe(false);
  });

  it('ignores secondary mouse buttons (right-click)', () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() =>
      useLongPress({ onLongPress, delayMs: 100 }),
    );

    const handlers = result.current.pointerHandlers(5);
    act(() => {
      handlers.onPointerDown(
        makePointerEvent({ pointerType: 'mouse', button: 2 }),
      );
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });
});
