// ═══════════════════════════════════════════
// FURQAN — Audio Reader: Markdown → narration-safe plain text
//
// Research articles (app/components/ResearchScreen.tsx) are stored as
// Markdown in Firestore and frequently quote Quranic ayahs in Arabic
// script directly in the body. Per the Audio Reader task's explicit
// rule — "never synthesize Quranic Arabic as ordinary Bengali speech" —
// this module strips every Arabic-script run before the text ever
// reaches a TTS call, not just whole lines that are "mostly Arabic".
// The Bengali translation that follows each Arabic quote in these
// articles already carries the meaning aloud; nothing is lost except
// the literal Arabic recitation, which this app does not attempt to
// speak in a human voice (the Reader's own Arabic text stays untouched
// and unaffected — this module only touches the TTS-input copy).
//
// Markdown syntax (**, *, >, #, [...], emoji) is also stripped, since
// none of it should be read aloud literally.
// ═══════════════════════════════════════════

// Arabic script + Quranic annotation marks + presentation forms. Covers
// the Arabic, Arabic Supplement, Arabic Extended-A/B, Arabic
// Presentation Forms A/B Unicode blocks — i.e. every block Quranic
// Arabic or its diacritics/stop-marks could appear in.
const ARABIC_RUN = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+/g;

// Common emoji ranges — stripped so TTS never tries to vocalize them.
const EMOJI_RUN = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

function stripMarkdownSyntax(line: string): string {
  let out = line;
  out = out.replace(/^#+\s*/, ''); // headers
  out = out.replace(/^>\s*/, ''); // blockquote marker
  out = out.replace(/\*\*(.*?)\*\*/g, '$1'); // bold
  out = out.replace(/(?<!\w)\*(.+?)\*(?!\w)/g, '$1'); // italic
  out = out.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // markdown links -> link text
  out = out.replace(/[[\]]/g, ''); // leftover bracket chars (plain [ref] citations)
  return out;
}

/** Converts one Research article's raw Markdown `content` field into
 *  narration-safe plain text: no Markdown syntax, no Arabic script, no
 *  emoji, blank-line-separated paragraphs for natural TTS pacing. */
export function extractNarrationText(markdown: string): string {
  const lines = markdown.split('\n');
  const cleaned: string[] = [];

  for (const rawLine of lines) {
    let line = stripMarkdownSyntax(rawLine);
    line = line.replace(ARABIC_RUN, '');
    line = line.replace(EMOJI_RUN, '');
    // Clean up punctuation/dash fragments left behind once an Arabic
    // run is removed (e.g. "**الرِّبَا — আর-রিবা।**" -> " — আর-রিবা।").
    line = line.replace(/^[\s—\-:।,]+/, '').trim();
    line = line.replace(/\s{2,}/g, ' ');
    if (line.length > 0) cleaned.push(line);
  }

  return cleaned.join('\n\n');
}

export const NARRATION_CHUNK_MAX_CHARS = 1800;

/** Splits narration-safe text into chunks that stay under a safe TTS
 *  input length, breaking only at paragraph boundaries (never mid-
 *  sentence) — long sections generated for the Sirah pilot showed the
 *  TTS model becomes unreliable (returns no audio) above roughly
 *  2,000-2,200 characters in one call, so this stays comfortably under
 *  that observed ceiling to avoid burning scarce daily quota on retries. */
export function splitIntoNarrationChunks(text: string, maxChars: number = NARRATION_CHUNK_MAX_CHARS): string[] {
  const paragraphs = text.split('\n\n').filter((p) => p.trim().length > 0);
  const chunks: string[] = [];
  let current: string[] = [];
  let currentLen = 0;

  for (const para of paragraphs) {
    const addedLen = para.length + (current.length > 0 ? 2 : 0);
    if (currentLen + addedLen > maxChars && current.length > 0) {
      chunks.push(current.join('\n\n'));
      current = [];
      currentLen = 0;
    }
    current.push(para);
    currentLen += para.length + (current.length > 1 ? 2 : 0);
  }
  if (current.length > 0) chunks.push(current.join('\n\n'));
  return chunks;
}
