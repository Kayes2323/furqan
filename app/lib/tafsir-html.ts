// ═══════════════════════════════════════════
// FURQAN — pure HTML → structured-blocks parser for tafsir/translation text
//
// Quran Foundation's API returns tafsir/translation text as simple HTML
// (paragraphs, headings, footnote markers, occasional lists). Rather than
// render that HTML directly — which would mean either a new sanitizer
// dependency or dangerouslySetInnerHTML — this module turns it into a
// small, inert data structure (TafsirBlock[]) that the UI renders with
// plain React elements. No tag from the source ever reaches the DOM.
//
// Deliberately conservative: anything not recognized as a known
// block/inline tag is stripped to its text content. Structure we don't
// recognize degrades to a plain paragraph rather than being dropped.
// ═══════════════════════════════════════════

import type { TafsirBlock } from './translation-tafsir-types';

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
};

function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, code: string) => {
    if (code[0] === '#') {
      const isHex = code[1] === 'x' || code[1] === 'X';
      const num = parseInt(isHex ? code.slice(2) : code.slice(1), isHex ? 16 : 10);
      return Number.isFinite(num) ? String.fromCodePoint(num) : match;
    }
    return ENTITIES[code] ?? match;
  });
}

function collapseWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

/** Strips any remaining tags, decodes entities, folds <sup> footnote
 *  markers into an inline "[n]" marker, and collapses whitespace.
 *  Exported as `stripToPlainText` for callers (e.g. translation display)
 *  that want a single clean line rather than a block structure. */
export function stripToPlainText(html: string): string {
  return cleanInlineText(html);
}

function cleanInlineText(html: string): string {
  const withFootnoteMarkers = html.replace(/<sup\b[^>]*>([\s\S]*?)<\/sup>/gi, (_m, inner: string) => {
    const n = collapseWhitespace(inner.replace(/<[^>]+>/g, ''));
    return n ? ` [${n}]` : '';
  });
  const withoutBreaks = withFootnoteMarkers.replace(/<br\s*\/?>/gi, ' ');
  const stripped = withoutBreaks.replace(/<[^>]+>/g, '');
  return collapseWhitespace(decodeEntities(stripped));
}

const FOOTNOTE_LIST_ITEM = /^(\d+)[.)]\s*(.+)$/;

/**
 * Parses tafsir/translation HTML into an ordered list of structured
 * blocks (headings, paragraphs, footnote list items). Pure and
 * side-effect-free — safe to unit test directly against fixture strings.
 */
export function parseTafsirHtml(html: string): TafsirBlock[] {
  if (!html || !html.trim()) return [];

  // Remove non-content tags entirely (their text is never meaningful here).
  const withoutNonContent = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '');

  const blockPattern = /<(p|h[1-6]|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const matches = Array.from(withoutNonContent.matchAll(blockPattern));

  if (matches.length === 0) {
    const text = cleanInlineText(withoutNonContent);
    return text ? [{ type: 'paragraph', text }] : [];
  }

  const blocks: TafsirBlock[] = [];
  for (const match of matches) {
    const tag = match[1].toLowerCase();
    const text = cleanInlineText(match[2]);
    if (!text) continue;

    if (tag.startsWith('h')) {
      blocks.push({ type: 'heading', text });
      continue;
    }
    if (tag === 'li') {
      const footnoteMatch = text.match(FOOTNOTE_LIST_ITEM);
      if (footnoteMatch) {
        blocks.push({ type: 'footnote', number: footnoteMatch[1], text: footnoteMatch[2] });
      } else {
        blocks.push({ type: 'paragraph', text: `• ${text}` });
      }
      continue;
    }
    blocks.push({ type: 'paragraph', text });
  }
  return blocks;
}
