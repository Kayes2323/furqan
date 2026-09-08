import type { Screen } from '../types';

export interface AppRoute {
  screen: Screen;
  surah?: number;
  chapter?: string;
  part?: string;
}

const VALID_SCREENS: Screen[] = [
  'home', 'tafsir', 'nur', 'knowledge', 'research', 'sirah', 'sirah-part', 'sirah-read', 'profile',
];

export function isValidScreen(value: string | null): value is Screen {
  return VALID_SCREENS.includes(value as Screen);
}

export function routeToParams(route: AppRoute): URLSearchParams {
  const params = new URLSearchParams();
  params.set('s', route.screen);
  if (route.surah != null) params.set('surah', String(route.surah));
  if (route.chapter) params.set('chapter', route.chapter);
  if (route.part) params.set('part', route.part);
  return params;
}

export function routeToUrl(route: AppRoute): string {
  return `/?${routeToParams(route).toString()}`;
}

export function paramsToRoute(params: URLSearchParams): AppRoute {
  const raw = params.get('s');
  const screen: Screen = isValidScreen(raw) ? raw : 'home';
  const surahRaw = params.get('surah');
  const surah = surahRaw ? Number(surahRaw) : undefined;
  const chapter = params.get('chapter') ?? undefined;
  const part = params.get('part') ?? undefined;

  if (screen === 'sirah-read') {
    return { screen, chapter: chapter ?? 'ch-01' };
  }

  if (screen === 'sirah-part') {
    return { screen, part: part ?? 'part-1' };
  }

  if (screen === 'tafsir' && surah != null && !Number.isNaN(surah)) {
    return { screen, surah };
  }

  return { screen };
}

export function routesEqual(a: AppRoute, b: AppRoute): boolean {
  return a.screen === b.screen && a.surah === b.surah && a.chapter === b.chapter && a.part === b.part;
}
