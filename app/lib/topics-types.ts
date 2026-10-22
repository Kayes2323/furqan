// ═══════════════════════════════════════════
// FURQAN — Phase 8: Quran by Topic + Important Surahs & Ayahs
//
// This is curated app content (not Quran text itself): which verses
// are grouped under which theme, and which hadith evidence supports a
// surah's inclusion in "Important Surahs & Ayahs". The canonical
// Arabic is never stored here — every ayah reference below is loaded
// live from the verified Tanzil dataset (app/lib/reader-data.ts) by
// surah+ayah number, so this file can never drift from or duplicate
// the canonical text.
//
// Translation note: this app has no licensed, verified translation
// text to embed (the bundled Tanzil dataset is Arabic-only, and this
// phase could not verify exact wording of any named published
// translation through the tools available — see
// app/lib/recitation-RESEARCH.md's sibling note in the Phase 8 final
// report). Every `glossBn` below is this project's own concise,
// plain-language explanatory gist, not a claimed translation by any
// named translator — never presented as such in the UI.
// ═══════════════════════════════════════════

export interface TopicAyahRef {
  surah: number;
  ayahStart: number;
  ayahEnd: number; // inclusive; equals ayahStart for a single verse
  /** This project's own concise Bangla explanatory gist — not a
   *  formal/named translation. */
  glossBn: string;
}

export interface Topic {
  id: string;
  nameBn: string;
  nameAr: string;
  /** lucide-react icon export name, resolved by the screen component */
  icon: string;
  summaryBn: string;
  ayahs: TopicAyahRef[];
}

export type EvidenceKind =
  | 'quran' // an explicit statement within the Quran itself
  | 'hadith-authentic' // sahih grading, effectively undisputed
  | 'hadith-hasan' // hasan grading (sound but not the highest tier)
  | 'hadith-disputed' // weak/da'if, or scholars disagree on grading
  | 'scholarly' // a classical/contemporary scholar's interpretation, not a direct text
  | 'popular-unverified'; // a widely repeated claim this project could not verify — included only to explicitly flag it as unverified, never as a basis for a virtue claim

export interface EvidenceItem {
  kind: EvidenceKind;
  /** A summary of the evidence's content, in this project's own words.
   *  Never a claimed direct quotation of the hadith's Arabic/English
   *  wording (this project could not verify exact wording character-
   *  for-character through the tools available this phase). */
  summaryBn: string;
  sourceLabel: string; // e.g. "জামি' আত-তিরমিযী, হাদিস ২৮৯১"
  narrator?: string;
  gradingNoteBn: string;
  sourceUrl?: string; // sunnah.com or equivalent, for the user to verify primarily
}

export interface ImportantSurah {
  id: string;
  surahNumber: number;
  nameBn: string;
  /** Specific ayah to highlight, if the virtue centers on one ayah
   *  rather than the whole surah (e.g. Ayat al-Kursi within Al-Baqarah). */
  highlightAyah?: { ayahStart: number; ayahEnd: number };
  whySelectedBn: string;
  evidence: EvidenceItem[];
}
