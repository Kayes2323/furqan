// ═══════════════════════════════════════════
// FURQAN — Sirah Audio Reader: static audio manifest
//
// Bengali male voice narration generated via the Gemini API's TTS model
// (see docs/audio-reader-pilot.md for the full generation method, voice
// choice, verification, and licensing notes). Chapters are narrated one
// at a time as the daily free-tier quota allows — isChapterAudioAvailable()
// / anyAudioAvailable() are the single source of truth other components
// check before showing a listen option, so this never claims audio for a
// chapter that does not actually have it.
//
// A chapter's narration is stored as one or more small MP3 chunks per
// section (not one giant file) — this lets a long chapter split across
// several TTS generation calls while the PLAYER still presents it as one
// continuous, gapless listen, in the article's original paragraph order.
//
// Honesty note: a partly-narrated section is recorded with the chunks it
// actually has (and a section with none as `chunks: []`) — never silently
// skipped — so the player can tell the listener which parts aren't
// narrated yet instead of jumping over them unannounced.
// Status: ch-01, ch-02 and ch-11 complete; ch-03 in progress
// (s-02 partial, s-03 not started).
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
  'ch-02': {
    chapterId: 'ch-02',
    voiceLabel: 'Charon (Gemini TTS, বাংলা পুরুষ কণ্ঠ)',
    model: 'gemini-3.8-flash-tts',
    generatedAt: '2026-11-23',
    sections: [
      {
        sectionId: 'ch-02-s-01',
        chunks: [
          { id: 'ch-02-s-01-0', sectionId: 'ch-02-s-01', path: '/audio/sirah/ch-02/ch-02-s-01-0.mp3', durationSec: 122.064 },
          { id: 'ch-02-s-01-1', sectionId: 'ch-02-s-01', path: '/audio/sirah/ch-02/ch-02-s-01-1.mp3', durationSec: 75.216 },
        ],
      },
      {
        sectionId: 'ch-02-s-02',
        chunks: [
          { id: 'ch-02-s-02-0', sectionId: 'ch-02-s-02', path: '/audio/sirah/ch-02/ch-02-s-02-0.mp3', durationSec: 133.344 },
          { id: 'ch-02-s-02-1', sectionId: 'ch-02-s-02', path: '/audio/sirah/ch-02/ch-02-s-02-1.mp3', durationSec: 88.872 },
          { id: 'ch-02-s-02-2', sectionId: 'ch-02-s-02', path: '/audio/sirah/ch-02/ch-02-s-02-2.mp3', durationSec: 65.976 },
          { id: 'ch-02-s-02-3', sectionId: 'ch-02-s-02', path: '/audio/sirah/ch-02/ch-02-s-02-3.mp3', durationSec: 126.864 },
          { id: 'ch-02-s-02-4', sectionId: 'ch-02-s-02', path: '/audio/sirah/ch-02/ch-02-s-02-4.mp3', durationSec: 21.312 },
        ],
      },
      {
        sectionId: 'ch-02-s-03',
        chunks: [
          { id: 'ch-02-s-03-0', sectionId: 'ch-02-s-03', path: '/audio/sirah/ch-02/ch-02-s-03-0.mp3', durationSec: 78.552 },
          { id: 'ch-02-s-03-1', sectionId: 'ch-02-s-03', path: '/audio/sirah/ch-02/ch-02-s-03-1.mp3', durationSec: 110.112 },
        ],
      },
      {
        sectionId: 'ch-02-s-04',
        chunks: [
          { id: 'ch-02-s-04-0', sectionId: 'ch-02-s-04', path: '/audio/sirah/ch-02/ch-02-s-04-0.mp3', durationSec: 7.824 },
          { id: 'ch-02-s-04-1', sectionId: 'ch-02-s-04', path: '/audio/sirah/ch-02/ch-02-s-04-1.mp3', durationSec: 170.376 },
          { id: 'ch-02-s-04-2', sectionId: 'ch-02-s-04', path: '/audio/sirah/ch-02/ch-02-s-04-2.mp3', durationSec: 135.936 },
          { id: 'ch-02-s-04-3', sectionId: 'ch-02-s-04', path: '/audio/sirah/ch-02/ch-02-s-04-3.mp3', durationSec: 88.2 },
        ],
      },
      {
        sectionId: 'ch-02-s-05',
        chunks: [
          { id: 'ch-02-s-05-0', sectionId: 'ch-02-s-05', path: '/audio/sirah/ch-02/ch-02-s-05-0.mp3', durationSec: 132.888 },
          { id: 'ch-02-s-05-1', sectionId: 'ch-02-s-05', path: '/audio/sirah/ch-02/ch-02-s-05-1.mp3', durationSec: 66.432 },
          { id: 'ch-02-s-05-2', sectionId: 'ch-02-s-05', path: '/audio/sirah/ch-02/ch-02-s-05-2.mp3', durationSec: 122.88 },
          { id: 'ch-02-s-05-3', sectionId: 'ch-02-s-05', path: '/audio/sirah/ch-02/ch-02-s-05-3.mp3', durationSec: 58.584 },
          { id: 'ch-02-s-05-4', sectionId: 'ch-02-s-05', path: '/audio/sirah/ch-02/ch-02-s-05-4.mp3', durationSec: 170.664 },
          { id: 'ch-02-s-05-5', sectionId: 'ch-02-s-05', path: '/audio/sirah/ch-02/ch-02-s-05-5.mp3', durationSec: 99.384 },
          { id: 'ch-02-s-05-6', sectionId: 'ch-02-s-05', path: '/audio/sirah/ch-02/ch-02-s-05-6.mp3', durationSec: 114.432 },
        ],
      },
      {
        sectionId: 'ch-02-s-06',
        chunks: [
          { id: 'ch-02-s-06-0', sectionId: 'ch-02-s-06', path: '/audio/sirah/ch-02/ch-02-s-06-0.mp3', durationSec: 108.48 },
          { id: 'ch-02-s-06-1', sectionId: 'ch-02-s-06', path: '/audio/sirah/ch-02/ch-02-s-06-1.mp3', durationSec: 46.488 },
        ],
      },
      {
        sectionId: 'ch-02-s-07',
        chunks: [
          { id: 'ch-02-s-07-0', sectionId: 'ch-02-s-07', path: '/audio/sirah/ch-02/ch-02-s-07-0.mp3', durationSec: 109.896 },
          { id: 'ch-02-s-07-1', sectionId: 'ch-02-s-07', path: '/audio/sirah/ch-02/ch-02-s-07-1.mp3', durationSec: 64.104 },
        ],
      },
    ],
  },
  'ch-03': {
    chapterId: 'ch-03',
    voiceLabel: 'Charon (Gemini TTS, বাংলা পুরুষ কণ্ঠ)',
    model: 'gemini-3.8-flash-tts',
    generatedAt: '2026-11-26',
    sections: [
      {
        sectionId: 'ch-03-s-01',
        chunks: [
          { id: 'ch-03-s-01-0', sectionId: 'ch-03-s-01', path: '/audio/sirah/ch-03/ch-03-s-01-0.mp3', durationSec: 85.08 },
          { id: 'ch-03-s-01-1', sectionId: 'ch-03-s-01', path: '/audio/sirah/ch-03/ch-03-s-01-1.mp3', durationSec: 122.616 },
          { id: 'ch-03-s-01-2', sectionId: 'ch-03-s-01', path: '/audio/sirah/ch-03/ch-03-s-01-2.mp3', durationSec: 85.68 },
          { id: 'ch-03-s-01-3', sectionId: 'ch-03-s-01', path: '/audio/sirah/ch-03/ch-03-s-01-3.mp3', durationSec: 108.36 },
          { id: 'ch-03-s-01-4', sectionId: 'ch-03-s-01', path: '/audio/sirah/ch-03/ch-03-s-01-4.mp3', durationSec: 60.12 },
          { id: 'ch-03-s-01-5', sectionId: 'ch-03-s-01', path: '/audio/sirah/ch-03/ch-03-s-01-5.mp3', durationSec: 150.792 },
          { id: 'ch-03-s-01-6', sectionId: 'ch-03-s-01', path: '/audio/sirah/ch-03/ch-03-s-01-6.mp3', durationSec: 212.688 },
        ],
      },
      {
        // 2 of this section's 3 chunks so far — the rest follows as the
        // daily free-tier quota allows. Tracked, never silently skipped.
        sectionId: 'ch-03-s-02',
        chunks: [
          { id: 'ch-03-s-02-0', sectionId: 'ch-03-s-02', path: '/audio/sirah/ch-03/ch-03-s-02-0.mp3', durationSec: 197.256 },
          { id: 'ch-03-s-02-1', sectionId: 'ch-03-s-02', path: '/audio/sirah/ch-03/ch-03-s-02-1.mp3', durationSec: 151.872 },
        ],
      },
    ],
  },
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
        sectionId: 'ch-11-s-02',
        chunks: [{ id: 'ch-11-s-02', sectionId: 'ch-11-s-02', path: '/audio/sirah/ch-11/ch-11-s-02.mp3', durationSec: 116.352 }],
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
        sectionId: 'ch-11-s-06',
        chunks: [
          { id: 'ch-11-s-06a', sectionId: 'ch-11-s-06', path: '/audio/sirah/ch-11/ch-11-s-06a.mp3', durationSec: 83.376 },
          { id: 'ch-11-s-06b', sectionId: 'ch-11-s-06', path: '/audio/sirah/ch-11/ch-11-s-06b.mp3', durationSec: 72.384 },
        ],
      },
    ],
  },
  'ch-01': {
    chapterId: 'ch-01',
    voiceLabel: 'Charon (Gemini TTS, বাংলা পুরুষ কণ্ঠ)',
    model: 'gemini-3.8-flash-tts',
    generatedAt: '2026-11-21',
    sections: [
      {
        sectionId: 'ch-01-s-01',
        chunks: [
          { id: 'ch-01-s-01-0', sectionId: 'ch-01-s-01', path: '/audio/sirah/ch-01/ch-01-s-01-0.mp3', durationSec: 123.504 },
          { id: 'ch-01-s-01-1', sectionId: 'ch-01-s-01', path: '/audio/sirah/ch-01/ch-01-s-01-1.mp3', durationSec: 50.304 },
        ],
      },
      {
        sectionId: 'ch-01-s-02',
        chunks: [
          { id: 'ch-01-s-02-0', sectionId: 'ch-01-s-02', path: '/audio/sirah/ch-01/ch-01-s-02-0.mp3', durationSec: 148.584 },
          { id: 'ch-01-s-02-1', sectionId: 'ch-01-s-02', path: '/audio/sirah/ch-01/ch-01-s-02-1.mp3', durationSec: 87.336 },
          { id: 'ch-01-s-02-2', sectionId: 'ch-01-s-02', path: '/audio/sirah/ch-01/ch-01-s-02-2.mp3', durationSec: 95.952 },
          { id: 'ch-01-s-02-3', sectionId: 'ch-01-s-02', path: '/audio/sirah/ch-01/ch-01-s-02-3.mp3', durationSec: 145.416 },
          { id: 'ch-01-s-02-4', sectionId: 'ch-01-s-02', path: '/audio/sirah/ch-01/ch-01-s-02-4.mp3', durationSec: 119.952 },
          { id: 'ch-01-s-02-5', sectionId: 'ch-01-s-02', path: '/audio/sirah/ch-01/ch-01-s-02-5.mp3', durationSec: 40.464 },
          { id: 'ch-01-s-02-6', sectionId: 'ch-01-s-02', path: '/audio/sirah/ch-01/ch-01-s-02-6.mp3', durationSec: 96.264 },
          { id: 'ch-01-s-02-7', sectionId: 'ch-01-s-02', path: '/audio/sirah/ch-01/ch-01-s-02-7.mp3', durationSec: 107.112 },
          { id: 'ch-01-s-02-8', sectionId: 'ch-01-s-02', path: '/audio/sirah/ch-01/ch-01-s-02-8.mp3', durationSec: 126.624 },
          { id: 'ch-01-s-02-9', sectionId: 'ch-01-s-02', path: '/audio/sirah/ch-01/ch-01-s-02-9.mp3', durationSec: 131.376 },
          { id: 'ch-01-s-02-10', sectionId: 'ch-01-s-02', path: '/audio/sirah/ch-01/ch-01-s-02-10.mp3', durationSec: 132.096 },
        ],
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
