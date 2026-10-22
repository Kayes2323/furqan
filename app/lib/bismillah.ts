// ═══════════════════════════════════════════
// FURQAN — Reader: opening-Bismillah display splitting
//
// Tanzil's txt-2 convention embeds the opening Bismillah as a literal
// prefix inside ayah 1's own text for every surah except Al-Fatiha
// (whose ayah 1 IS exactly and only the Bismillah, canonically counted
// as ayah 1) and At-Tawbah (surah 9, which has no Bismillah at all).
// This is correct, verbatim source data — not a defect — but the
// Reader previously rendered each ayah's text as one undivided block,
// so the Bismillah appeared glued to ayah 1's actual content (e.g.
// Al-Ma'idah 5:1). This module only changes how that embedded prefix
// is *displayed*; it never touches the stored canonical ayah text,
// never renumbers ayahs, and only ever looks at ayah number 1 of a
// surah, so it can never affect the Bismillah occurring mid-ayah in
// An-Naml 27:30 (Prophet Sulaiman's letter — genuine Quranic content,
// not a header).
//
// Both constants below were extracted programmatically from the
// verified bundled dataset (public/quran/surah/001.json and
// 095.json), never hand-retyped, to avoid introducing a transcription
// error into Arabic Unicode text.
// ═══════════════════════════════════════════

/** The canonical opening Bismillah, exactly as it appears as Al-Fatiha's
 *  ayah 1 and as the literal prefix of ayah 1 in most other surahs. */
export const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";

/** A second, textually distinct variant that appears as the ayah-1
 *  prefix only in Surah 95 (At-Tin) and Surah 97 (Al-Qadr): the same
 *  Bismillah with an added shadda on its first letter (ب), a genuine
 *  feature of the Uthmani Mushaf orthography reflecting the idgham
 *  (assimilation) with the final letter of the preceding surah in
 *  continuous recitation. Confirmed by direct, exhaustive inspection
 *  of all 114 surahs' ayah-1 text in the bundled dataset: no other
 *  variant exists anywhere in the dataset. */
export const BISMILLAH_SHADDA_VARIANT = "بِّسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";

/** Checked longest-first so the (longer) shadda variant is never
 *  mistaken for a partial match of the canonical form. */
const BISMILLAH_PREFIXES = [BISMILLAH_SHADDA_VARIANT, BISMILLAH];

export interface BismillahSplit {
  /** The opening Bismillah exactly as it appears in the source text. */
  bismillah: string;
  /** The rest of ayah 1's text, source-exact apart from a trimmed
   *  leading separator space — a display-only split, never a rewrite. */
  body: string;
}

/** Returns how to display ayah 1 of a surah: a separate Bismillah
 *  header above the ayah body, or null when no header should be shown.
 *
 *  Only ever inspects ayah number 1 (never any other ayah — this is
 *  what inherently protects An-Naml 27:30's mid-ayah Bismillah from
 *  ever being touched), and only ever reads from the given text; it
 *  never mutates stored data, never fabricates an ayah, and never
 *  changes verse numbering.
 *
 *  - Al-Fatiha (ayah 1 text equals BISMILLAH exactly): null — the
 *    canonical ayah 1 *is* the Bismillah, so showing both an
 *    extracted header and the (now-empty) remainder would either
 *    duplicate it or display nothing; the ayah card itself already
 *    shows it correctly.
 *  - At-Tawbah and any other surah whose ayah 1 does not start with
 *    either verified Bismillah form: null — never invent one.
 *  - Every other surah: the matched prefix as `bismillah`, and the
 *    remainder (leading separator space trimmed) as `body`. */
export function splitOpeningBismillah(ayahNumber: number, text: string): BismillahSplit | null {
  if (ayahNumber !== 1) return null;
  if (text === BISMILLAH) return null;

  for (const prefix of BISMILLAH_PREFIXES) {
    if (text.startsWith(prefix)) {
      const rest = text.slice(prefix.length).replace(/^\s+/, '');
      if (rest.length === 0) return null;
      return { bismillah: prefix, body: rest };
    }
  }

  return null;
}
