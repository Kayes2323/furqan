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

/** A countable recitation: has an explicit source-given repetition target. */
export interface RecitationItem {
  kind: 'recitation';
  id: string;
  order: number;
  title: string;
  /** Arabic script, only when the source PDF actually provides it. */
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
  /** Quran surah numbers (alquran.cloud convention) this item corresponds to,
   *  when the user should be pointed at the app's existing Quran reader
   *  instead of us re-typing canonical ayat ourselves. */
  linkedSurahs?: number[];
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
