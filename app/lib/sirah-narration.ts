// ═══════════════════════════════════════════
// FURQAN — Sirah Audio Reader: turning a chapter section into narration text.
//
// The Research narration path starts from Markdown (see markdown-narration.ts);
// Sirah chapters are structured ContentBlock[] instead, so they need their own
// small step to decide what is actually spoken before the shared chunker runs.
//
// What is deliberately left out:
//   - `image` blocks. Their `text` is a visible caption and `alt` is for screen
//     readers; read aloud mid-narration both are noise ("ছবি: ইসমাইল থেকে
//     আদনান…" in the middle of a sentence about Makkah).
// Headings and subheadings ARE spoken — in a 30-minute chapter they are the
// listener's only sense of where they are.
// ═══════════════════════════════════════════

import type { ContentBlock, SirahSection } from './sirah-types';
import { splitIntoNarrationChunks } from './markdown-narration.ts';

/** Blocks whose text is spoken, in order. */
export function narratableBlocks(blocks: ContentBlock[]): ContentBlock[] {
  return blocks.filter((b) => b.type !== 'image' && typeof b.text === 'string' && b.text.trim() !== '');
}

/** The spoken text of one section: its narratable blocks, blank-line separated. */
export function sectionNarrationText(section: SirahSection): string {
  return narratableBlocks(section.blocks)
    .map((b) => b.text.trim())
    .join('\n\n');
}

/**
 * The section's narration split into TTS-sized chunks. Returns [] for a
 * section with nothing speakable (e.g. images only), so callers can record
 * "no narration" honestly rather than generating silence.
 */
export function sectionNarrationChunks(section: SirahSection): string[] {
  const text = sectionNarrationText(section);
  if (text === '') return [];
  return splitIntoNarrationChunks(text);
}
