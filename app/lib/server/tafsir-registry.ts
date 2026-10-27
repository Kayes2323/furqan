// ═══════════════════════════════════════════
// FURQAN — Central Quran text / translation / tafsir source registry
//
// The single machine-readable source of truth for every Quran-related
// content source this app can retrieve from — used by NUR's retrieval
// layer (app/api/nur/retrieval.ts) and by the Reader's own tafsir UI.
// Nothing here is invented: every field is either independently
// verified (see public/quran/TAFSIR-SOURCES.md for the full narrative
// audit) or explicitly marked 'unknown'/'unavailable'. Extending this
// registry with a new tafsir/translation never requires redesigning
// NUR — it only needs a new entry here (and, if the new source uses a
// different API shape, a new adapter alongside the existing
// QuranFoundationAdapter in quran-foundation.ts).
// ═══════════════════════════════════════════

export type SourceKind = 'quran-text' | 'translation' | 'tafsir';

export type SourceAvailability =
  | 'verified-live'   // confirmed working against the real provider this session
  | 'unverified'      // candidate only, never confirmed against a live API
  | 'unavailable';    // confirmed NOT present in this account's current catalog

export interface TafsirSourceEntry {
  /** Stable, human-readable internal id — never reused for a different source. */
  id: string;
  kind: SourceKind;
  /** The API/provider that serves this content, or 'local-static' for the
   *  bundled Tanzil dataset. */
  provider: string;
  title: string;
  /** The scholar/author this content is attributed to, or 'unknown' if
   *  not independently verified. Never guessed. */
  authorAttribution: string;
  /** Translator/editor/publisher, where distinct from the author, or
   *  'unknown'. */
  translatorEditorPublisher: string;
  /** BCP-47-ish simple language tag used elsewhere in this app: 'ar' | 'bn'. */
  language: 'ar' | 'bn';
  /** The provider's own numeric resource id, or null when not applicable
   *  (e.g. the local static Arabic text has no such id). */
  resourceId: number | null;
  /** Canonical reference URL — the provider's docs/catalog page, or the
   *  license file for local static content. */
  referenceUrl: string;
  /** Plain-language description of what's actually retrievable and at
   *  what granularity (e.g. "full Quran, per-ayah" vs "not available"). */
  coverage: string;
  attributionRequirements: string;
  retrievalMethod: 'local-static' | 'live-api';
  availability: SourceAvailability;
  /** ISO date this entry's live status was last confirmed, if ever. */
  verifiedAt: string | null;
  notes: string;
}

export const TAFSIR_SOURCE_REGISTRY: TafsirSourceEntry[] = [
  {
    id: 'tanzil-ar-uthmani',
    kind: 'quran-text',
    provider: 'local-static',
    title: 'Tanzil Project — Uthmani Script (verbatim)',
    authorAttribution: 'Tanzil Project (tanzil.net)',
    translatorEditorPublisher: 'unknown',
    language: 'ar',
    resourceId: null,
    referenceUrl: 'https://tanzil.net — see public/quran/TANZIL-LICENSE.txt',
    coverage: 'Full Quran (114 surahs), per-ayah, bundled as static JSON in public/quran/.',
    attributionRequirements:
      'CC-BY-3.0 — Tanzil attribution notice required verbatim; text may not be altered (see TANZIL-LICENSE.txt).',
    retrievalMethod: 'local-static',
    availability: 'verified-live',
    verifiedAt: '2026-10-27',
    notes: 'The only Quran text source this app ever displays as the canonical Arabic. Never sourced from Quran Foundation.',
  },
  {
    id: 'qf-bn-taisirul-quran',
    kind: 'translation',
    provider: 'Quran Foundation Content API v4',
    title: 'Taisirul Quran',
    authorAttribution: 'Tawheed Publication',
    translatorEditorPublisher: 'Tawheed Publication',
    language: 'bn',
    resourceId: 161,
    referenceUrl: 'https://api-docs.quran.foundation/docs/api-reference/',
    coverage: 'Full Quran, per-ayah — confirmed live for Al-Fatiha (1:1–1:7); not yet exhaustively checked for every surah.',
    attributionRequirements:
      'Quran Foundation Developer Terms: display-only within the end-user app experience, no bulk redistribution (see TAFSIR-SOURCES.md §2).',
    retrievalMethod: 'live-api',
    availability: 'verified-live',
    verifiedAt: '2026-10-27',
    notes: 'The only Bengali translation resource present in this account\'s current (prelive) catalog.',
  },
  {
    id: 'qf-bn-fathul-majid',
    kind: 'tafsir',
    provider: 'Quran Foundation Content API v4',
    title: 'Tafsir Fathul Majid',
    authorAttribution: 'AbdulRahman Bin Hasan Al-Alshaikh',
    translatorEditorPublisher: 'unknown',
    language: 'bn',
    resourceId: 381,
    referenceUrl: 'https://api-docs.quran.foundation/docs/api-reference/',
    coverage: 'Per-ayah commentary (multi-ayah passages are grouped by the provider\'s own verse_key range, never split by us); confirmed live for Al-Fatiha/Al-Baqara opening ayahs.',
    attributionRequirements:
      'Quran Foundation Developer Terms: display-only within the end-user app experience, no bulk redistribution (see TAFSIR-SOURCES.md §2).',
    retrievalMethod: 'live-api',
    availability: 'verified-live',
    verifiedAt: '2026-10-27',
    notes:
      'IMPORTANT: this is NOT Tafsir Ibn Kathir. It is the only Bengali tafsir present in this account\'s current (prelive) catalog. ' +
      'The project owner explicitly chose to use it rather than leave tafsir unavailable (see TAFSIR-SOURCES.md §3). NUR and the UI ' +
      'must always attribute content from this source as "Tafsir Fathul Majid", never as Ibn Kathir.',
  },
  {
    id: 'qf-bn-ibn-kathir',
    kind: 'tafsir',
    provider: 'Quran Foundation Content API v4',
    title: 'Tafsir Ibn Kathir (Bengali)',
    authorAttribution: 'Ibn Kathir (candidate — unconfirmed)',
    translatorEditorPublisher: 'unknown',
    language: 'bn',
    resourceId: null,
    referenceUrl: 'https://api-docs.quran.foundation/docs/api-reference/',
    coverage: 'unknown — not present in this account\'s current catalog.',
    attributionRequirements: 'unknown — not independently verified.',
    retrievalMethod: 'live-api',
    availability: 'unavailable',
    verifiedAt: null,
    notes:
      'Early research surfaced a candidate resource (id "31", slug "bn-tafseer-ibn-e-kaseer") attributed to Tawheed Publication, ' +
      'but a live catalog check against this account\'s real credentials (prelive tier, 2026-10-27) found no Bengali Ibn Kathir ' +
      'resource at all — only 6 tafsir resources exist in this tier, none of them Ibn Kathir. This entry exists so the gap is ' +
      'tracked explicitly rather than silently absent. If/when the account is granted Quran Foundation production-tier access and ' +
      'a real Bengali Ibn Kathir resource appears in /resources/tafsirs, update this entry\'s resourceId/availability/verifiedAt — ' +
      'resolveBengaliTafsirId() in quran-foundation.ts will already prefer it automatically once present (name/slug match), but this ' +
      'registry entry should still be hand-confirmed against the live resource list before being marked verified-live.',
  },
];

export function getSourceById(id: string): TafsirSourceEntry | undefined {
  return TAFSIR_SOURCE_REGISTRY.find((s) => s.id === id);
}

export function getAvailableSources(kind?: SourceKind): TafsirSourceEntry[] {
  return TAFSIR_SOURCE_REGISTRY.filter(
    (s) => s.availability === 'verified-live' && (kind == null || s.kind === kind)
  );
}

/** The source this app's Bengali translation retrieval actually uses. */
export function getActiveBengaliTranslationSource(): TafsirSourceEntry | undefined {
  return getAvailableSources('translation').find((s) => s.language === 'bn');
}

/** The source this app's Bengali tafsir retrieval actually uses right now
 *  — may be Ibn Kathir in the future without any code change here, since
 *  this always reflects whichever entry is currently verified-live. */
export function getActiveBengaliTafsirSource(): TafsirSourceEntry | undefined {
  return getAvailableSources('tafsir').find((s) => s.language === 'bn');
}
