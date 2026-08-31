'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Screen } from '../types';
import {
  type AppRoute,
  paramsToRoute,
  routeToUrl,
  routesEqual,
} from '../lib/navigation';

export function useAppNavigation(scrollContainerRef?: RefObject<HTMLElement | null>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const route = paramsToRoute(searchParams);
  const scrollPositions = useRef(new Map<string, number>());
  const prevUrlRef = useRef<string | null>(null);

  const currentUrl = routeToUrl(route);

  useEffect(() => {
    if (!searchParams.get('s')) {
      router.replace('/?s=home', { scroll: false });
    }
  }, [router, searchParams]);

  useEffect(() => {
    const el = scrollContainerRef?.current;
    const prevUrl = prevUrlRef.current;

    if (prevUrl && el) {
      scrollPositions.current.set(prevUrl, el.scrollTop);
    }

    if (el && scrollPositions.current.has(currentUrl)) {
      const saved = scrollPositions.current.get(currentUrl) ?? 0;
      requestAnimationFrame(() => {
        if (scrollContainerRef?.current) {
          scrollContainerRef.current.scrollTop = saved;
        }
      });
    } else if (el) {
      requestAnimationFrame(() => {
        if (scrollContainerRef?.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      });
    }

    prevUrlRef.current = currentUrl;
  }, [currentUrl, scrollContainerRef]);

  const navigate = useCallback(
    (next: AppRoute, options?: { replace?: boolean }) => {
      const url = routeToUrl(next);
      if (!options?.replace && url === currentUrl) return;
      if (options?.replace) {
        router.replace(url, { scroll: false });
      } else {
        router.push(url, { scroll: false });
      }
    },
    [router, currentUrl],
  );

  const navigateScreen = useCallback(
    (screen: Screen) => {
      const next: AppRoute = { screen };
      if (routesEqual(route, next)) return;
      navigate(next);
    },
    [navigate, route],
  );

  const back = useCallback(() => {
    router.back();
  }, [router]);

  const openSurah = useCallback(
    (surah: number) => {
      navigate({ screen: 'tafsir', surah });
    },
    [navigate],
  );

  const openChapter = useCallback(
    (chapterId: string) => {
      navigate({ screen: 'sirah-read', chapter: chapterId });
    },
    [navigate],
  );

  return {
    route,
    screen: route.screen,
    surahNumber: route.surah,
    chapterId: route.chapter ?? 'ch-01',
    navigate,
    navigateScreen,
    back,
    openSurah,
    openChapter,
  };
}
