// ═══════════════════════════════════════════
// FURQAN — Zikr content model
//
// Source of truth: "আত্মরক্ষার আমল" PDF (uploaded by the user, 2 pages,
// Word-exported, not scanned). Content below is transcribed from that PDF;
// nothing here is invented. Where the source names a recitation without
// giving its Arabic/phonetic text, the item is marked `needsReview` and
// left without fabricated Arabic — see ZIKR_CONTENT_INVENTORY.md-equivalent
// notes in zikr-data.ts for the full accounting.
// ═══════════════════════════════════════════

/** A precise reference into the canonical Tanzil dataset (surah + an
 *  inclusive ayah range). Never carries Arabic text itself — every
 *  screen that uses this loads the actual text live from
 *  app/lib/reader-data.ts's loadSurah, so the canonical dataset is
 *  never duplicated or re-typed for this feature. */
export interface QuranRef {
  surah: number;
  ayahStart: number;
  ayahEnd: number; // inclusive
}

/** A countable recitation: has an explicit source-given repetition target. */
export interface RecitationItem {
  kind: 'recitation';
  id: string;
  order: number;
  title: string;
  /** Arabic script, only when the source PDF actually provides it AND
   *  the text is not a Quranic ayah (e.g. a hadith-based dua like
   *  Sayyidul Istighfar). An item whose recitation genuinely is Quran
   *  text uses `quranRefs` instead, never this field — see
   *  Phase 8.2's audit notes in zikr-data.ts. */
  arabic?: string;
  /** Bengali phonetic transliteration, only when the source provides it. */
  phonetic?: string;
  /** Repetition target exactly as given by the source (never invented). */
  targetCount: number;
  /** Source section + item number, for traceability back to the PDF. */
  sourceRef: string;
  /** True when the source names this recitation but doesn't give its full text. */
  needsReview?: boolean;
  reviewNote?: string;
  /** Set only when this recitation's text has been verified (Phase 8.2
   *  audit) to be an actual Quranic ayah or ayah range. The screen
   *  loads and displays the canonical Arabic for each ref live, and
   *  links to the existing Reader for the exact verse — never
   *  hand-typed here. */
  quranRefs?: QuranRef[];
  /** A cautionary note shown alongside `quranRefs`, for the rare case
   *  where the recited text is confirmed Quranic but the *practice*
   *  around it (e.g. "recite N times morning and evening") rests on a
   *  hadith whose authenticity is disputed among scholars — the two
   *  facts must not be conflated into one confident claim. */
  quranCaveatBn?: string;
}

/** A non-recitation practice: an action, habit, or situational dua. */
export interface PracticeItem {
  kind: 'action' | 'habit';
  id: string;
  order: number;
  title: string;
  /** Full instruction text from the source. */
  instruction: string;
  /** Situational dua text, when the source gives one (reference only — not
   *  part of the counted recitation flow, since these are said once per
   *  occurrence rather than repeated N times in a sitting). */
  phonetic?: string;
  sourceRef: string;
  /** Points at a RecitationItem elsewhere that this item duplicates, so we
   *  cross-reference instead of creating a second counter for the same dhikr. */
  duplicatesItemId?: string;
  /** Surah numbers this habit names by name (e.g. "recite Al-Baqarah,
   *  Ya-Sin, ..."), for a quick-link list into the existing Reader —
   *  surah-level only (no specific ayah range), since the practice
   *  recommends recitation generally rather than one verse. */
  quranSurahLinks?: number[];
}

export type ZikrItem = RecitationItem | PracticeItem;

export interface ZikrSection {
  id: string;
  /** Exact section heading from the source PDF. */
  title: string;
  description?: string;
  items: ZikrItem[];
}

export interface ZikrCollection {
  id: string;
  title: string;
  subtitle: string;
  sections: ZikrSection[];
}

export function isRecitation(item: ZikrItem): item is RecitationItem {
  return item.kind === 'recitation';
}

/** The ordered recitation-only sequence for a section, used by the
 *  tap-to-count / auto-advance reading flow. Practice items are excluded —
 *  they're shown as a checklist instead. */
export function recitationSequence(section: ZikrSection): RecitationItem[] {
  return section.items.filter(isRecitation).sort((a, b) => a.order - b.order);
}
