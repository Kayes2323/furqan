// ═══════════════════════════════════════════
// FURQAN — server-side reader for the bundled canonical Arabic dataset
//
// Mirrors app/lib/reader-data.ts's in-memory-cached fetch pattern, but
// reads the same public/quran/*.json files directly off disk (Node fs)
// instead of over HTTP — the right approach from inside a server-only
// module like NUR's retrieval layer, which runs in the same process as
// the files it needs and shouldn't self-fetch over the network. Never
// imported by client code (see reader-data.ts for the client path).
// ═══════════════════════════════════════════

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { SurahMeta, SurahDoc, AyahText } from '../reader-types';

const QURAN_DIR = path.join(process.cwd(), 'public', 'quran');

let metaCache: SurahMeta[] | null = null;
let metaPromise: Promise<SurahMeta[]> | null = null;
const surahCache = new Map<number, SurahDoc>();
const surahPromises = new Map<number, Promise<SurahDoc>>();

export async function loadSurahMetaServer(): Promise<SurahMeta[]> {
  if (metaCache) return metaCache;
  if (!metaPromise) {
    metaPromise = readFile(path.join(QURAN_DIR, 'meta.json'), 'utf-8')
      .then((raw) => {
        const data = JSON.parse(raw) as SurahMeta[];
        metaCache = data;
        return data;
      })
      .catch((err) => {
        metaPromise = null;
        throw err;
      });
  }
  return metaPromise;
}

export async function loadSurahServer(number: number): Promise<SurahDoc> {
  const cached = surahCache.get(number);
  if (cached) return cached;
  let p = surahPromises.get(number);
  if (!p) {
    const padded = String(number).padStart(3, '0');
    p = readFile(path.join(QURAN_DIR, 'surah', `${padded}.json`), 'utf-8')
      .then((raw) => {
        const data = JSON.parse(raw) as SurahDoc;
        surahCache.set(number, data);
        return data;
      })
      .catch((err) => {
        surahPromises.delete(number);
        throw err;
      });
    surahPromises.set(number, p);
  }
  return p;
}

export async function loadAyahServer(surah: number, ayah: number): Promise<AyahText | null> {
  const doc = await loadSurahServer(surah);
  return doc.ayahs.find((a) => a.number === ayah) ?? null;
}
