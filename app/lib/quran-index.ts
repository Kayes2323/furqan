// ═══════════════════════════════════════════
// FURQAN — shared Quran position index
//
// Converts between a 1-based global ayah position (1..6236, in actual
// Quran reading order) and a surah:ayah reference, built from the real
// SurahMeta[] (public/quran/meta.json via app/lib/reader-data.ts) —
// never hardcoded. Used by both the Khatm Planner and Nazera modules
// so the "no gaps, no duplicates, valid surah:ayah" guarantee is
// proven once (see app/lib/khatm-plan.test.ts) and shared, not
// reimplemented per feature.
// ═══════════════════════════════════════════

import type { SurahMeta } from './reader-types';

export interface QuranIndex {
  totalAyahs: number;
  /** cumulativeBefore[i] = ayahs in surahs 1..i-1 (1-based array, index 0 unused) */
  cumulativeBefore: number[];
  surahCount: number;
}

export interface SurahAyahRef {
  surah: number;
  ayah: number;
}

/** A contiguous ayah range, inclusive on both ends, in reading order. */
export interface AyahRange {
  startGlobal: number;
  endGlobal: number; // inclusive
  start: SurahAyahRef;
  end: SurahAyahRef;
  count: number;
}

export function buildQuranIndex(meta: SurahMeta[]): QuranIndex {
  const sorted = [...meta].sort((a, b) => a.number - b.number);
  const cumulativeBefore: number[] = [0]; // index 0 unused; cumulativeBefore[s] = ayahs in surahs 1..s-1
  let running = 0;
  for (const s of sorted) {
    cumulativeBefore[s.number] = running;
    running += s.ayahCount;
  }
  return { totalAyahs: running, cumulativeBefore, surahCount: sorted.length };
}

/** Converts a 1-based global ayah position (1..totalAyahs) to its
 *  surah:ayah reference. Throws on an out-of-range index rather than
 *  silently clamping, so a bug surfaces immediately instead of pointing
 *  at the wrong verse. */
export function globalToRef(index: QuranIndex, global: number): SurahAyahRef {
  if (global < 1 || global > index.totalAyahs) {
    throw new RangeError(`global ayah index ${global} out of range 1..${index.totalAyahs}`);
  }
  for (let surah = 1; surah <= index.surahCount; surah++) {
    const before = index.cumulativeBefore[surah];
    const nextBefore = surah < index.surahCount ? index.cumulativeBefore[surah + 1] : index.totalAyahs;
    if (global <= nextBefore && global > before) {
      return { surah, ayah: global - before };
    }
  }
  throw new RangeError(`global ayah index ${global} did not resolve to any surah`);
}

export function refToGlobal(index: QuranIndex, ref: SurahAyahRef): number {
  const before = index.cumulativeBefore[ref.surah];
  if (before == null) throw new RangeError(`unknown surah ${ref.surah}`);
  return before + ref.ayah;
}

export function rangeFromGlobal(index: QuranIndex, startGlobal: number, endGlobal: number): AyahRange {
  return {
    startGlobal,
    endGlobal,
    start: globalToRef(index, startGlobal),
    end: globalToRef(index, endGlobal),
    count: endGlobal - startGlobal + 1,
  };
}

/** Clamps a surah:ayah reference supplied by the user (e.g. a "start
 *  from here" picker) to a valid in-dataset reference, so a bad or
 *  stale value can never produce an invalid Reader link. Returns the
 *  nearest valid ayah rather than throwing, since this is meant for
 *  user-facing input, not internal invariants. */
export function clampRef(index: QuranIndex, ref: SurahAyahRef): SurahAyahRef {
  const before = index.cumulativeBefore[ref.surah];
  if (before == null) return { surah: 1, ayah: 1 };
  const nextBefore = ref.surah < index.surahCount ? index.cumulativeBefore[ref.surah + 1] : index.totalAyahs;
  const surahAyahCount = nextBefore - before;
  const ayah = Math.min(Math.max(1, ref.ayah), surahAyahCount);
  return { surah: ref.surah, ayah };
}
