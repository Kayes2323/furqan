// ═══════════════════════════════════════════
// FURQAN — Bengali translation & tafsir: shared types
//
// See public/quran/TAFSIR-SOURCES.md for the source-verification report
// and the terms governing this content. Nothing here is static/bundled
// data — it all flows through our own /api/quran-translation and
// /api/quran-tafsir routes, which proxy the Quran Foundation Content API
// server-side.
// ═══════════════════════════════════════════

export interface AyahTranslation {
  ayah: number;
  text: string;          // may contain simple HTML (footnote markup etc.)
  resourceName: string;  // e.g. "Taisirul Quran" — shown as attribution
}

export type TafsirBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'footnote'; number: string; text: string };

export interface TafsirContent {
  surah: number;
  ayah: number;
  /** The verse key the source actually attributes this passage to — may
   *  be a range like "2:1-5" when the source groups several ayat under
   *  one commentary. Always display this, never a re-derived single-ayah
   *  key, so a grouped passage is never shown as if it were ayah-specific. */
  verseKey: string;
  resourceName: string;   // e.g. "তাফসীরে ইবনে কাসীর"
  blocks: TafsirBlock[];
}

export type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'not_configured' }
  | { status: 'not_found' }
  | { status: 'offline' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T };
