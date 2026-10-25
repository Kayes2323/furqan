'use client';

import { useEffect, useState } from 'react';

// Tracks whether the viewport is at least `breakpoint` CSS px wide, via
// matchMedia (so it also responds correctly to browser zoom, which changes
// the effective CSS px width). Defaults to false (the existing mobile-card
// layout) until the effect runs, matching the SSR-safe pattern used
// elsewhere in this app (e.g. app/lib/theme.tsx).
export function useIsDesktop(breakpoint = 1024): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading viewport size on mount (matches app/lib/theme.tsx and the Sirah screens)
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);

  return isDesktop;
}
