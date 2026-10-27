// ═══════════════════════════════════════════
// FURQAN — Bengali translation & tafsir: client-side fetch/cache
//
// Mirrors reader-data.ts's in-memory caching pattern. Calls only this
// app's own /api/quran-translation and /api/quran-tafsir routes — never
// a third-party host directly, and never holds any credential. See
// public/quran/TAFSIR-SOURCES.md for the terms this honors.
// ═══════════════════════════════════════════

import { parseTafsirHtml, stripToPlainText } from './tafsir-html';
import type { AyahTranslation, TafsirContent } from './translation-tafsir-types';

export type TranslationsResult =
  | { ok: true; data: Map<number, AyahTranslation> }
  | { ok: false; reason: 'not_configured' | 'offline' | 'error' };

export type TafsirResult =
  | { ok: true; data: TafsirContent }
  | { ok: false; reason: 'not_configured' | 'not_found' | 'offline' | 'error' };

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine;
}

const translationsCache = new Map<number, TranslationsResult>();
const translationsPromises = new Map<number, Promise<TranslationsResult>>();

export async function loadSurahTranslations(surah: number): Promise<TranslationsResult> {
  const cached = translationsCache.get(surah);
  if (cached && cached.ok) return cached; // only success is durable; retry on failure
  let p = translationsPromises.get(surah);
  if (!p) {
    p = (async (): Promise<TranslationsResult> => {
      try {
        const res = await fetch(`/api/quran-translation?surah=${surah}`);
        const body = await res.json();
        if (!body.ok) {
          return body.reason === 'not_configured'
            ? { ok: false, reason: 'not_configured' }
            : { ok: false, reason: 'error' };
        }
        const map = new Map<number, AyahTranslation>();
        for (const row of body.data as { ayah: number; translation: { text: string; resource_name: string } | null }[]) {
          if (!row.translation) continue;
          map.set(row.ayah, {
            ayah: row.ayah,
            text: stripToPlainText(row.translation.text),
            resourceName: row.translation.resource_name,
          });
        }
        const result: TranslationsResult = { ok: true, data: map };
        translationsCache.set(surah, result);
        return result;
      } catch {
        return { ok: false, reason: isOffline() ? 'offline' : 'error' };
      } finally {
        translationsPromises.delete(surah);
      }
    })();
    translationsPromises.set(surah, p);
  }
  return p;
}

const tafsirCache = new Map<string, TafsirResult>();
const tafsirPromises = new Map<string, Promise<TafsirResult>>();

export async function loadAyahTafsir(surah: number, ayah: number): Promise<TafsirResult> {
  const key = `${surah}:${ayah}`;
  const cached = tafsirCache.get(key);
  if (cached && cached.ok) return cached;
  let p = tafsirPromises.get(key);
  if (!p) {
    p = (async (): Promise<TafsirResult> => {
      try {
        const res = await fetch(`/api/quran-tafsir?surah=${surah}&ayah=${ayah}`);
        const body = await res.json();
        if (!body.ok) {
          if (body.reason === 'not_configured') return { ok: false, reason: 'not_configured' };
          if (body.reason === 'not_found') return { ok: false, reason: 'not_found' };
          return { ok: false, reason: 'error' };
        }
        const raw = body.data as { text: string; resource_name: string; verse_key?: string };
        const content: TafsirContent = {
          surah,
          ayah,
          verseKey: raw.verse_key ?? `${surah}:${ayah}`,
          resourceName: raw.resource_name,
          blocks: parseTafsirHtml(raw.text),
        };
        const result: TafsirResult = { ok: true, data: content };
        tafsirCache.set(key, result);
        return result;
      } catch {
        return { ok: false, reason: isOffline() ? 'offline' : 'error' };
      } finally {
        tafsirPromises.delete(key);
      }
    })();
    tafsirPromises.set(key, p);
  }
  return p;
}
