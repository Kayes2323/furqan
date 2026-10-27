import type { Screen } from '../types';
import { JOURNEY_TABS, type JourneyTab } from './journey-types.ts';

export interface AppRoute {
  screen: Screen;
  chapter?: string;
  part?: string;
  zikrSection?: string;
  zikrItem?: string;
  readerSurah?: number;
  readerAyah?: number;
  topicId?: string;
  importantId?: string;
  lifeAreaId?: string;
  practiceId?: string;
  journeyTab?: JourneyTab;
}

const VALID_SCREENS: Screen[] = [
  'home', 'nur', 'knowledge', 'research', 'sirah', 'sirah-part', 'sirah-read', 'qibla',
  'zikr', 'zikr-section', 'zikr-read', 'zikr-tracker', 'reader', 'reader-surah', 'reader-search', 'reader-bookmarks',
  'quran-journey', 'khatm-setup', 'nazera-setup', 'recite',
  'quran-hub', 'quran-topics', 'topic-detail', 'important-detail',
  'sunnah-life', 'sunnah-life-areas', 'sunnah-life-area-detail', 'sunnah-practice-detail',
  'profile',
];

// Old standalone entry points (bookmarks, installed-PWA shortcuts, shared
// links) still resolve — into the matching section of Quran Journey.
const LEGACY_JOURNEY_SCREENS: Record<string, JourneyTab> = { khatm: 'khatm', nazera: 'nazera' };

export function isLegacyJourneyScreen(value: string | null): boolean {
  return value !== null && Object.prototype.hasOwnProperty.call(LEGACY_JOURNEY_SCREENS, value);
}

export function isJourneyTab(value: string | null): value is JourneyTab {
  return JOURNEY_TABS.includes(value as JourneyTab);
}

export function isValidScreen(value: string | null): value is Screen {
  return VALID_SCREENS.includes(value as Screen);
}

export function routeToParams(route: AppRoute): URLSearchParams {
  const params = new URLSearchParams();
  params.set('s', route.screen);
  if (route.chapter) params.set('chapter', route.chapter);
  if (route.part) params.set('part', route.part);
  if (route.zikrSection) params.set('zsec', route.zikrSection);
  if (route.zikrItem) params.set('zitem', route.zikrItem);
  if (route.readerSurah != null) params.set('rsurah', String(route.readerSurah));
  if (route.readerAyah != null) params.set('rayah', String(route.readerAyah));
  if (route.topicId) params.set('topic', route.topicId);
  if (route.importantId) params.set('imp', route.importantId);
  if (route.lifeAreaId) params.set('area', route.lifeAreaId);
  if (route.practiceId) params.set('practice', route.practiceId);
  if (route.screen === 'quran-journey' && route.journeyTab) params.set('jt', route.journeyTab);
  return params;
}

export function routeToUrl(route: AppRoute): string {
  return `/?${routeToParams(route).toString()}`;
}

export function paramsToRoute(params: URLSearchParams): AppRoute {
  const raw = params.get('s');
  if (isLegacyJourneyScreen(raw)) {
    return { screen: 'quran-journey', journeyTab: LEGACY_JOURNEY_SCREENS[raw as string] };
  }
  const screen: Screen = isValidScreen(raw) ? raw : 'home';
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
  const lifeAreaId = params.get('area') ?? undefined;
  const practiceId = params.get('practice') ?? undefined;

  if (screen === 'quran-journey') {
    const tab = params.get('jt');
    return { screen, journeyTab: isJourneyTab(tab) ? tab : 'plan' };
  }

  if (screen === 'sunnah-life-area-detail') {
    return { screen, lifeAreaId: lifeAreaId ?? 'relationship-with-allah' };
  }

  if (screen === 'sunnah-practice-detail') {
    return { screen, practiceId: practiceId ?? 'sp-fajr-prayer' };
  }

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

  return { screen };
}

export function routesEqual(a: AppRoute, b: AppRoute): boolean {
  return (
    a.screen === b.screen &&
    a.chapter === b.chapter &&
    a.part === b.part &&
    a.zikrSection === b.zikrSection &&
    a.zikrItem === b.zikrItem &&
    a.readerSurah === b.readerSurah &&
    a.readerAyah === b.readerAyah &&
    a.topicId === b.topicId &&
    a.importantId === b.importantId &&
    a.lifeAreaId === b.lifeAreaId &&
    a.practiceId === b.practiceId &&
    a.journeyTab === b.journeyTab
  );
}
