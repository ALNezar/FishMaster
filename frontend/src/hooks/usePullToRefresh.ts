import { useEffect, useRef } from 'react';

type Options = {
  threshold?: number;
  onRefresh: () => void;
};

// Minimal pull-to-refresh hook for mobile UIs. Listens on the document body and
// triggers `onRefresh` when user pulls down from top past the threshold.
export default function usePullToRefresh({ threshold = 72, onRefresh }: Options) {
  const startY = useRef<number | null>(null);
  const tracking = useRef(false);

  useEffect(() => {
    const touchStart = (e: TouchEvent) => {
      if (document.scrollingElement?.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        tracking.current = true;
      } else {
        startY.current = null;
        tracking.current = false;
      }
    };

    const touchMove = (e: TouchEvent) => {
      if (!tracking.current || startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > threshold) {
        // Prevent multiple firings until touchend
        tracking.current = false;
        startY.current = null;
        try {
          onRefresh();
        } catch (err) {
          console.error('pull-to-refresh handler error', err);
        }
      }
    };

    const touchEnd = () => {
      startY.current = null;
      tracking.current = false;
    };

    window.addEventListener('touchstart', touchStart, { passive: true });
    window.addEventListener('touchmove', touchMove, { passive: true });
    window.addEventListener('touchend', touchEnd);

    return () => {
      window.removeEventListener('touchstart', touchStart);
      window.removeEventListener('touchmove', touchMove);
      window.removeEventListener('touchend', touchEnd);
    };
  }, [threshold, onRefresh]);
}
