import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 72; // px of pull needed to trigger
const MAX_PULL = 120;

/**
 * Native-feeling pull-to-refresh for the iOS home-screen PWA, where Safari's own
 * reload UI is not available. Only engages when the page is scrolled to the top and
 * the gesture starts outside a modal / sheet / calendar grid.
 */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const active = useRef(false);
  const cb = useRef(onRefresh);
  cb.current = onRefresh;

  useEffect(() => {
    const isBlocked = (target: EventTarget | null) =>
      target instanceof Element &&
      !!target.closest('.sheet-overlay, [role="dialog"], .fc, .no-ptr, input, textarea, select');

    const onStart = (e: TouchEvent) => {
      if (refreshing || e.touches.length !== 1) return;
      if (window.scrollY > 0 || isBlocked(e.target)) return;
      startY.current = e.touches[0].clientY;
      active.current = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!active.current || startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0 || window.scrollY > 0) {
        setPull(0);
        return;
      }
      // rubber-band damping
      const damped = Math.min(MAX_PULL, dy * 0.55);
      setPull(damped);
    };

    const onEnd = async () => {
      if (!active.current) return;
      active.current = false;
      startY.current = null;
      if (pullRef.current >= THRESHOLD) {
        setRefreshing(true);
        setPull(THRESHOLD * 0.8);
        try {
          await cb.current();
        } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [refreshing]);

  // keep latest pull value readable inside the touchend closure
  const pullRef = useRef(0);
  pullRef.current = pull;

  return { pull, refreshing, ready: pull >= THRESHOLD };
}
