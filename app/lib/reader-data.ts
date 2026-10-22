// ═══════════════════════════════════════════
// FURQAN — Quran Reader: local dataset access
//
// All text is served from same-origin static files under /public/quran
// (built from the verbatim Tanzil Uthmani dataset — see reader-types.ts),
// never from a live third-party API. In-memory caches avoid re-fetching
// a surah/the index/the search index more than once per session; the
// existing service worker additionally caches successful GETs, so a
// previously-opened surah stays readable offline.
// ═══════════════════════════════════════════

import type { SurahMeta, SurahDoc, SearchIndexEntry } from './reader-types';

let metaCache: SurahMeta[] | null = null;
let metaPromise: Promise<SurahMeta[]> | null = null;

const surahCache = new Map<number, SurahDoc>();
const surahPromises = new Map<number, Promise<SurahDoc>>();

let searchIndexCache: SearchIndexEntry[] | null = null;
let searchIndexPromise: Promise<SearchIndexEntry[]> | null = null;

export class ReaderDataError extends Error {}

export async function loadSurahMeta(): Promise<SurahMeta[]> {
  if (metaCache) return metaCache;
  if (!metaPromise) {
    metaPromise = fetch('/quran/meta.json')
      .then((res) => {
        if (!res.ok) throw new ReaderDataError(`meta.json: HTTP ${res.status}`);
        return res.json();
      })
      .then((data: SurahMeta[]) => {
        metaCache = data;
        return data;
      })
      .catch((err) => {
        metaPromise = null; // allow retry on next call
        throw err;
      });
  }
  return metaPromise;
}

export async function loadSurah(number: number): Promise<SurahDoc> {
  const cached = surahCache.get(number);
  if (cached) return cached;
  let p = surahPromises.get(number);
  if (!p) {
    const padded = String(number).padStart(3, '0');
    p = fetch(`/quran/surah/${padded}.json`)
      .then((res) => {
        if (!res.ok) throw new ReaderDataError(`surah ${number}: HTTP ${res.status}`);
        return res.json();
      })
      .then((data: SurahDoc) => {
        surahCache.set(number, data);
        return data;
      })
      .catch((err) => {
        surahPromises.delete(number); // allow retry
        throw err;
      });
    surahPromises.set(number, p);
  }
  return p;
}

export async function loadSearchIndex(): Promise<SearchIndexEntry[]> {
  if (searchIndexCache) return searchIndexCache;
  if (!searchIndexPromise) {
    searchIndexPromise = fetch('/quran/search-index.json')
      .then((res) => {
        if (!res.ok) throw new ReaderDataError(`search-index.json: HTTP ${res.status}`);
        return res.json();
      })
      .then((data: SearchIndexEntry[]) => {
        searchIndexCache = data;
        return data;
      })
      .catch((err) => {
        searchIndexPromise = null;
        throw err;
      });
  }
  return searchIndexPromise;
}

// Mirrors the normalization used to build the bundled search index
// (public/quran/search-index.json), so a typed query matches it the
// same way: strips diacritics/tatweel, and folds alef/teh-marbuta/
// alef-maksura letter variants to the form most people actually type
// on a standard Arabic keyboard (e.g. ٱ or أ -> ا). This only affects
// search matching — the verbatim Tanzil text shown when reading is
// never altered.
export function normalizeArabic(input: string): string {
  return input
    .replace(/[ؐ-ًؚ-ٟۖ-ۜ۟-۪ۨ-ٰۭـ]/g, '')
    .replace(/[آأإٱ]/g, 'ا') // آ أ إ ٱ -> ا
    .replace(/ة/g, 'ه') // ة -> ه
    .replace(/ى/g, 'ي'); // ى -> ي
}
