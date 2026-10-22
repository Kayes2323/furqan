// ═══════════════════════════════════════════
// FURQAN — Quran Reader: types
//
// Arabic text data is sourced verbatim from the Tanzil Project
// (https://tanzil.net), Uthmani script, Creative Commons
// Attribution 3.0. See public/quran/TANZIL-LICENSE.txt for the
// full, required copyright notice.
// ═══════════════════════════════════════════

export interface SurahMeta {
  number: number;              // 1-114
  arabicName: string;          // e.g. "الفاتحة"
  transliteratedName: string;  // e.g. "Al-Faatiha" (Tanzil's own transliteration)
  englishName: string;         // e.g. "The Opening"
  banglaName: string;          // e.g. "আল-ফাতিহা" — a localization label, not Quran text
  ayahCount: number;
  revelationType: 'Meccan' | 'Medinan';
  revelationOrder: number;     // order in which the surah was revealed (Tanzil metadata)
}

export interface AyahText {
  number: number;              // ayah number within its surah, 1-based
  text: string;                // verbatim Uthmani Arabic text (Tanzil)
}

export interface SurahDoc {
  number: number;
  ayahs: AyahText[];
}

export interface ReaderLastRead {
  surah: number;
  ayah: number;
  updatedAt: string; // ISO date
}

export interface ReaderBookmark {
  surah: number;
  ayah: number;
  createdAt: string; // ISO date
}

export interface SearchIndexEntry {
  s: number; // surah
  a: number; // ayah
  n: string; // diacritic-stripped Arabic text, for lightweight substring search
}
