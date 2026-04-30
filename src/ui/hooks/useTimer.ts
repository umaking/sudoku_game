import { useEffect } from 'react';
import { useStore } from '@state/store';

export function useTimer(): void {
  const tick = useStore((s) => s.tick);
  const paused = useStore((s) => s.paused);
  const finished = useStore((s) => s.finished);
  const variantId = useStore((s) => s.variantId);

  useEffect(() => {
    if (paused || finished || !variantId) return;
    const id = window.setInterval(() => tick(1000), 1000);
    return () => window.clearInterval(id);
  }, [paused, finished, variantId, tick]);
}
