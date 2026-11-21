import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { extractNarrationText, splitIntoNarrationChunks } from '../../lib/markdown-narration';
import { getChapter } from '../../lib/sirah-data';
import { sectionNarrationChunks } from '../../lib/sirah-narration';

// TEMPORARY, PILOT-ONLY route (second use, after the Sirah ch-11 pilot —
// see docs/audio-reader-pilot.md). Generates Bengali TTS audio for
// Research (গবেষণা) articles, one chunk at a time, server-side (where
// GEMINI_API_KEY already lives). Deliberately narrow:
// - Only accepts a whitelisted categoryId: the six Research categories,
//   or 'sirah' for Ar-Raheeq Al-Makhtum chapters. Never arbitrary text —
//   cannot be abused as a general TTS proxy.
// - Research: fetches the article's canonical Markdown straight from
//   Firestore (the same source ResearchScreen.tsx reads) and extracts
//   narration-safe text (Arabic ayahs stripped — see markdown-narration.ts).
//   Sirah: reads the chapter from the in-repo sirah-data and narrates ONE
//   section at a time (sectionId required), matching the section-shaped
//   SIRAH_AUDIO manifest the player reads.
// - Always requires an explicit chunkIndex so each call is reproducible.
// - Gated behind TTS_PILOT_SECRET.
// - Removed once this batch of articles is fully narrated.
export const maxDuration = 60;

// Uses a dedicated key (GEMINI_API_KEY_TTS), separate from the
// GEMINI_API_KEY the NUR feature depends on, so this pilot's TTS calls
// draw against their own Gemini Cloud project's free-tier quota rather
// than competing with NUR's chat quota — and so NUR is unaffected if
// this key's quota runs out. Falls back to GEMINI_API_KEY only if the
// dedicated key isn't set.
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY_TTS || process.env.GEMINI_API_KEY });

const RESEARCH_CATEGORY_IDS = ['economy', 'politics', 'science', 'psychology', 'sociology', 'philosophy'];
const SIRAH_CATEGORY_ID = 'sirah';
const ALLOWED_CATEGORY_IDS = [...RESEARCH_CATEGORY_IDS, SIRAH_CATEGORY_ID];
const TTS_MODEL = 'gemini-3.8-flash-tts';
const DEFAULT_VOICE = 'Charon';

function pcmToWav(pcmBase64: string, sampleRate: number): Buffer {
  const pcm = Buffer.from(pcmBase64, 'base64');
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') !== process.env.TTS_PILOT_SECRET || !process.env.TTS_PILOT_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const categoryId = searchParams.get('categoryId');
  const articleId = searchParams.get('articleId');
  const chunkIndexRaw = searchParams.get('chunkIndex');
  const voice = searchParams.get('voice') || DEFAULT_VOICE;

  if (!categoryId || !ALLOWED_CATEGORY_IDS.includes(categoryId)) {
    return NextResponse.json({ error: 'category not allowed for this pilot route' }, { status: 400 });
  }
  if (!articleId || chunkIndexRaw === null) {
    return NextResponse.json({ error: 'articleId and chunkIndex are required' }, { status: 400 });
  }
  const chunkIndex = parseInt(chunkIndexRaw, 10);
  const sectionId = searchParams.get('sectionId');

  let narrationChunks: string[];
  let totalSections: number | undefined;

  if (categoryId === SIRAH_CATEGORY_ID) {
    // articleId is the chapter id (e.g. 'ch-12'); sectionId picks the
    // section within it, so generated chunks map 1:1 onto SIRAH_AUDIO.
    const chapter = getChapter(articleId);
    if (!chapter) {
      return NextResponse.json({ error: `sirah chapter not found: ${articleId}` }, { status: 404 });
    }
    totalSections = chapter.sections.length;
    if (!sectionId) {
      return NextResponse.json({
        error: 'sectionId is required for sirah',
        sections: chapter.sections.map((s) => ({ sectionId: s.id, title: s.title })),
      }, { status: 400 });
    }
    const section = chapter.sections.find((s) => s.id === sectionId);
    if (!section) {
      return NextResponse.json({
        error: `section not found in ${articleId}: ${sectionId}`,
        sections: chapter.sections.map((s) => s.id),
      }, { status: 404 });
    }
    narrationChunks = sectionNarrationChunks(section);
  } else {
    try {
      const docSnap = await getDoc(doc(db, 'research', categoryId, 'articles', articleId));
      if (!docSnap.exists()) {
        return NextResponse.json({ error: 'article not found in Firestore' }, { status: 404 });
      }
      const content = (docSnap.data().content as string) || '';
      narrationChunks = splitIntoNarrationChunks(extractNarrationText(content));
    } catch (err) {
      return NextResponse.json({ error: `firestore fetch failed: ${String(err instanceof Error ? err.message : err)}` }, { status: 502 });
    }
  }

  const text = narrationChunks[chunkIndex];
  if (text === undefined) {
    return NextResponse.json({ error: `chunkIndex ${chunkIndex} out of range (article has ${narrationChunks.length} chunks)` }, { status: 400 });
  }

  try {
    const result = await client.models.generateContent({
      model: TTS_MODEL,
      contents: [{ role: 'user', parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
      },
    });

    const part = result.candidates?.[0]?.content?.parts?.[0];
    const inline = part?.inlineData;
    if (!inline?.data) {
      return NextResponse.json({ error: 'no audio returned', raw: result.text ?? null }, { status: 502 });
    }

    const rateMatch = /rate=(\d+)/.exec(inline.mimeType ?? '');
    const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
    const wav = pcmToWav(inline.data, sampleRate);

    return NextResponse.json({
      categoryId,
      articleId,
      sectionId: sectionId ?? undefined,
      totalSections,
      chunkIndex,
      totalChunks: narrationChunks.length,
      voice,
      model: TTS_MODEL,
      sampleRate,
      charCount: text.length,
      audioBase64: wav.toString('base64'),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err instanceof Error ? err.message : err) }, { status: 500 });
  }
}
