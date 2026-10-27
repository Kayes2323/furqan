// ═══════════════════════════════════════════
// FURQAN — deterministic Quran reference extraction for NUR's retrieval
//
// Pure, dependency-free functions that try to resolve "which ayah(s) is
// this question about" from plain text, without calling any AI model.
// This runs first in NUR's retrieval pipeline (app/api/nur/retrieval.ts)
// — only when nothing here matches does retrieval fall back to a cheap
// LLM extraction call. Keeping this deterministic and testable means the
// common, explicit cases (a surah:ayah number, a named surah, a famous
// ayah like Ayat al-Kursi) never depend on model behavior at all.
// ═══════════════════════════════════════════

import type { SurahMeta } from '../reader-types';
import type { Topic, ImportantSurah } from '../topics-types';

export interface SurahAyahRef {
  surah: number;
  /** undefined means "about the surah generally", not a specific ayah. */
  ayah?: number;
  /** inclusive end of a range; equals `ayah` for a single-ayah reference. */
  ayahEnd?: number;
}

const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯';

export function convertBanglaDigits(input: string): string {
  return input.replace(/[০-৯]/g, (d) => String(BANGLA_DIGITS.indexOf(d)));
}

function normalizeSurahNameToken(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^সূরা\s+/u, '')
    .replace(/^আল[-\s]/u, '')
    .replace(/^(al|an|as|at|ar)[-\s]/u, '')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

/** Builds a lookup from every normalized name variant of every surah to
 *  its number, so a mention of "বাকারা", "আল-বাকারা", "baqarah", or
 *  "Al-Baqara" all resolve to surah 2. */
function buildSurahNameIndex(meta: SurahMeta[]): Map<string, number> {
  const index = new Map<string, number>();
  for (const s of meta) {
    const variants = [s.banglaName, s.transliteratedName, s.englishName];
    for (const v of variants) {
      const key = normalizeSurahNameToken(v);
      if (key.length >= 3 && !index.has(key)) index.set(key, s.number);
    }
  }
  return index;
}

function isValidSurah(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= 114;
}

/**
 * Extracts explicit surah/ayah references from free text. Tries, in
 * order: numeric "surah:ayah[-end]" (e.g. "2:255", "২:২৫৫-২৫৭"),
 * "সূরা <name-or-number> আয়াত <n>[-<m>]", then a bare mention of a
 * known surah name with no ayah number (surah-level reference). Returns
 * references in the order found; callers typically want the first one.
 */
export function extractSurahAyahRefs(text: string, meta: SurahMeta[]): SurahAyahRef[] {
  const normalized = convertBanglaDigits(text);
  const refs: SurahAyahRef[] = [];
  const seen = new Set<string>();

  function push(ref: SurahAyahRef) {
    const key = `${ref.surah}:${ref.ayah ?? ''}:${ref.ayahEnd ?? ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      refs.push(ref);
    }
  }

  // Pattern A: "N:M" or "N:M-K" (also tolerates surrounding punctuation).
  const colonPattern = /(\d{1,3})\s*[:৷]\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?/g;
  for (const m of normalized.matchAll(colonPattern)) {
    const surah = Number(m[1]);
    const ayah = Number(m[2]);
    const ayahEnd = m[3] ? Number(m[3]) : undefined;
    if (isValidSurah(surah) && ayah >= 1) {
      push({ surah, ayah, ayahEnd: ayahEnd && ayahEnd >= ayah ? ayahEnd : undefined });
    }
  }

  // Pattern B: "সূরা <name-or-number>[,] আয়াত <n>[-<m>]"
  const nameIndex = buildSurahNameIndex(meta);
  const surahAyahWordPattern = /সূরা\s+([^\d,।\s][^\d,।]{0,30}?)\s*,?\s*আয়াত\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?/gu;
  for (const m of normalized.matchAll(surahAyahWordPattern)) {
    const nameKey = normalizeSurahNameToken(m[1]);
    const surah = nameIndex.get(nameKey);
    if (surah != null) {
      const ayah = Number(m[2]);
      const ayahEnd = m[3] ? Number(m[3]) : undefined;
      push({ surah, ayah, ayahEnd: ayahEnd && ayahEnd >= ayah ? ayahEnd : undefined });
    }
  }
  const surahNumAyahWordPattern = /সূরা\s*(\d{1,3})\s*,?\s*আয়াত\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?/g;
  for (const m of normalized.matchAll(surahNumAyahWordPattern)) {
    const surah = Number(m[1]);
    const ayah = Number(m[2]);
    const ayahEnd = m[3] ? Number(m[3]) : undefined;
    if (isValidSurah(surah)) push({ surah, ayah, ayahEnd: ayahEnd && ayahEnd >= ayah ? ayahEnd : undefined });
  }

  // Pattern C: a bare, unambiguous mention of a known surah name with no
  // number nearby — treated as a surah-level (not ayah-level) reference.
  // Only applied when nothing more specific already matched, to avoid a
  // surah name appearing inside a longer "সূরা X আয়াত Y" phrase being
  // double-counted as a vague surah-level hit too.
  if (refs.length === 0) {
    const tokens = Array.from(nameIndex.keys()).sort((a, b) => b.length - a.length);
    const haystack = normalizeSurahNameToken(normalized);
    for (const token of tokens) {
      if (haystack.includes(token)) {
        push({ surah: nameIndex.get(token)! });
        break; // first (most specific, due to sort) match only
      }
    }
  }

  return refs;
}

/** Strips a trailing parenthetical gloss (e.g. "সবর (ধৈর্য)" -> "সবর")
 *  before normalizing, so matching looks for the primary name only —
 *  otherwise squashing "সবর (ধৈর্য)" into one run-on token would never
 *  match a question that mentions "সবর" without "ধৈর্য" right after it. */
function primaryNameKey(raw: string): string {
  return normalizeSurahNameToken(raw.replace(/\([^)]*\)/g, ''));
}

/** Matches a question against a known "important surah/ayah" (e.g. Ayat
 *  al-Kursi, Surah Al-Mulk) by name, so "আয়াতুল কুরসির অর্থ কী" resolves
 *  to surah 2 ayah 255 without needing the user to type the number. */
export function matchImportantSurah(text: string, items: ImportantSurah[]): ImportantSurah | null {
  const haystack = normalizeSurahNameToken(text);
  for (const item of items) {
    const key = primaryNameKey(item.nameBn);
    if (key.length >= 3 && haystack.includes(key)) return item;
  }
  return null;
}

/** Matches a question against a known topic (e.g. সবর, দোয়া, তাওয়াক্কুল)
 *  by name, for "এই বিষয়ে কুরআনে আর কী আয়াত আছে"-style questions. */
export function matchTopic(text: string, topics: Topic[]): Topic | null {
  const haystack = normalizeSurahNameToken(text);
  for (const topic of topics) {
    const key = primaryNameKey(topic.nameBn);
    if (key.length >= 2 && haystack.includes(key)) return topic;
  }
  return null;
}

/** Cheap gate used before paying for an LLM-based reference-extraction
 *  fallback call: only worth it if the question plausibly concerns a
 *  specific Quran passage at all. */
export function looksAyahSpecific(text: string): boolean {
  return /আয়াত|সূরা|তাফসির|তাফসীর|নাজিল|কুরআন|ayah|surah|verse|tafsir|quran/iu.test(text);
}
