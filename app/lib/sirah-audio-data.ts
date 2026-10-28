// ═══════════════════════════════════════════
// FURQAN — Sirah Audio Reader: static audio manifest
//
// Pilot scope: ONE chapter (ch-11, "হেরা গুহা ও প্রথম ওহী"), Bengali male
// voice narration generated via the Gemini API's TTS model (see
// docs/audio-reader-pilot.md for the full generation method, voice
// choice, verification, and licensing notes). No other chapter has
// audio — isChapterAudioAvailable() / anyAudioAvailable() are the single
// source of truth other components check before showing a listen option,
// so this never silently expands to chapters that don't actually have audio.
//
// A chapter's narration is stored as one or more small MP3 chunks per
// section (not one giant file) — this lets a long chapter split across
// several TTS generation calls while the PLAYER still presents it as one
// continuous, gapless listen, in the article's original paragraph order.
//
// Honesty note: due to a hard daily quota on the free TTS tier used for
// this pilot (see docs/audio-reader-pilot.md), ch-11 is narrated for 5
// of its 6 sections as of this commit. The missing section is tracked
// explicitly below (sectionId present, chunks: []) — never silently
// skipped — so the player can tell the listener honestly that one part
// isn't narrated yet instead of jumping over it unannounced.
// ═══════════════════════════════════════════

export interface SirahAudioChunk {
  /** Unique within the chapter; stable across re-generations of the
   *  same audio so a saved playback position keeps meaning. */
  id: string;
  sectionId: string;
  path: string;
  durationSec: number;
}

export interface SirahSectionAudio {
  sectionId: string;
  /** Empty when this section has no narration yet — see module doc. */
  chunks: SirahAudioChunk[];
}

export interface SirahChapterAudio {
  chapterId: string;
  /** Human-readable voice + provider, shown in the player and in
   *  docs/audio-reader-pilot.md — never asserted as "natural" beyond
   *  what was actually verified there. */
  voiceLabel: string;
  model: string;
  generatedAt: string; // ISO date
  sections: SirahSectionAudio[];
}

export const SIRAH_AUDIO: Record<string, SirahChapterAudio> = {
  'ch-11': {
    chapterId: 'ch-11',
    voiceLabel: 'Charon (Gemini TTS, বাংলা পুরুষ কণ্ঠ)',
    model: 'gemini-3.8-flash-tts',
    generatedAt: '2026-10-28',
    sections: [
      {
        sectionId: 'ch-11-s-01',
        chunks: [{ id: 'ch-11-s-01', sectionId: 'ch-11-s-01', path: '/audio/sirah/ch-11/ch-11-s-01.mp3', durationSec: 132.456 }],
      },
      {
        // Free-tier daily TTS quota (10 requests/day) was exhausted before
        // this section could be generated — see docs/audio-reader-pilot.md.
        sectionId: 'ch-11-s-02',
        chunks: [],
      },
      {
        sectionId: 'ch-11-s-03',
        chunks: [{ id: 'ch-11-s-03', sectionId: 'ch-11-s-03', path: '/audio/sirah/ch-11/ch-11-s-03.mp3', durationSec: 72.096 }],
      },
      {
        sectionId: 'ch-11-s-04',
        chunks: [{ id: 'ch-11-s-04', sectionId: 'ch-11-s-04', path: '/audio/sirah/ch-11/ch-11-s-04.mp3', durationSec: 84.264 }],
      },
      {
        sectionId: 'ch-11-s-05',
        chunks: [{ id: 'ch-11-s-05', sectionId: 'ch-11-s-05', path: '/audio/sirah/ch-11/ch-11-s-05.mp3', durationSec: 148.224 }],
      },
      {
        // Only the first half of this (longer) section was generated
        // before the quota ran out — the second half is tracked as a gap,
        // not silently dropped.
        sectionId: 'ch-11-s-06',
        chunks: [{ id: 'ch-11-s-06a', sectionId: 'ch-11-s-06', path: '/audio/sirah/ch-11/ch-11-s-06a.mp3', durationSec: 83.376 }],
      },
    ],
  },
};

export function getChapterAudio(chapterId: string): SirahChapterAudio | undefined {
  return SIRAH_AUDIO[chapterId];
}

export function isChapterAudioAvailable(chapterId: string): boolean {
  const audio = SIRAH_AUDIO[chapterId];
  return !!audio && audio.sections.some((s) => s.chunks.length > 0);
}

/** Flat, ordered list of every chunk across the chapter's sections, in
 *  article order — what the player actually plays through, gaplessly. */
export function getAllChunks(chapterId: string): SirahAudioChunk[] {
  const audio = SIRAH_AUDIO[chapterId];
  if (!audio) return [];
  return audio.sections.flatMap((s) => s.chunks);
}

/** Section ids in this chapter that have no narration at all yet — used
 *  to show an honest "not narrated yet" notice rather than pretending
 *  the chapter's audio is complete. */
export function getMissingSectionIds(chapterId: string): string[] {
  const audio = SIRAH_AUDIO[chapterId];
  if (!audio) return [];
  return audio.sections.filter((s) => s.chunks.length === 0).map((s) => s.sectionId);
}
