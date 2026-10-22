import type { Screen } from '../types';

export interface AppRoute {
  screen: Screen;
  surah?: number;
  chapter?: string;
  part?: string;
  zikrSection?: string;
  zikrItem?: string;
  readerSurah?: number;
  readerAyah?: number;
  topicId?: string;
  importantId?: string;
}

const VALID_SCREENS: Screen[] = [
  'home', 'tafsir', 'nur', 'knowledge', 'research', 'sirah', 'sirah-part', 'sirah-read', 'qibla',
  'zikr', 'zikr-section', 'zikr-read', 'reader', 'reader-surah', 'reader-search', 'reader-bookmarks',
  'khatm', 'khatm-setup', 'nazera', 'nazera-setup', 'recite',
  'quran-hub', 'quran-topics', 'topic-detail', 'important-detail', 'profile',
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
  if (route.zikrSection) params.set('zsec', route.zikrSection);
  if (route.zikrItem) params.set('zitem', route.zikrItem);
  if (route.readerSurah != null) params.set('rsurah', String(route.readerSurah));
  if (route.readerAyah != null) params.set('rayah', String(route.readerAyah));
  if (route.topicId) params.set('topic', route.topicId);
  if (route.importantId) params.set('imp', route.importantId);
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
  const zikrSection = params.get('zsec') ?? undefined;
  const zikrItem = params.get('zitem') ?? undefined;
  const readerSurahRaw = params.get('rsurah');
  const readerSurah = readerSurahRaw ? Number(readerSurahRaw) : undefined;
  const readerAyahRaw = params.get('rayah');
  const readerAyah = readerAyahRaw ? Number(readerAyahRaw) : undefined;
  const topicId = params.get('topic') ?? undefined;
  const importantId = params.get('imp') ?? undefined;

  if (screen === 'topic-detail') {
    return { screen, topicId: topicId ?? 'sabr' };
  }

  if (screen === 'important-detail') {
    return { screen, importantId: importantId ?? 'al-mulk' };
  }

  if (screen === 'reader-surah') {
    return { screen, readerSurah: readerSurah && !Number.isNaN(readerSurah) ? readerSurah : 1, readerAyah };
  }

  if (screen === 'sirah-read') {
    return { screen, chapter: chapter ?? 'ch-01' };
  }

  if (screen === 'sirah-part') {
    return { screen, part: part ?? 'part-1' };
  }

  if (screen === 'zikr-section' || screen === 'zikr-read') {
    return { screen, zikrSection: zikrSection ?? 'morning-evening', zikrItem };
  }

  if (screen === 'tafsir' && surah != null && !Number.isNaN(surah)) {
    return { screen, surah };
  }

  return { screen };
}

export function routesEqual(a: AppRoute, b: AppRoute): boolean {
  return (
    a.screen === b.screen &&
    a.surah === b.surah &&
    a.chapter === b.chapter &&
    a.part === b.part &&
    a.zikrSection === b.zikrSection &&
    a.zikrItem === b.zikrItem &&
    a.readerSurah === b.readerSurah &&
    a.readerAyah === b.readerAyah &&
    a.topicId === b.topicId &&
    a.importantId === b.importantId
  );
}
