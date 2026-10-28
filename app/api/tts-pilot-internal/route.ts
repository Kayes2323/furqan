import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getChapter } from '../../lib/sirah-data';

// TEMPORARY, PILOT-ONLY route. Generates Bengali TTS audio for one
// Sirah chapter's sections server-side (where GEMINI_API_KEY already
// lives, same as /api/nur) and streams back a WAV file, so the audio
// never has to pass through as base64/JSON. Deliberately narrow:
// - Only accepts a whitelisted chapterId ('ch-11'), never arbitrary text,
//   so this cannot be abused as a general-purpose TTS proxy.
// - Gated behind TTS_PILOT_SECRET (a one-off secret created solely for
//   this pilot, unrelated to any other credential).
// - This file and its secret are removed once ch-11's audio is
//   generated and committed as static assets — see docs/audio-reader-pilot.md.
export const maxDuration = 60;

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ALLOWED_CHAPTER_ID = 'ch-11';
const TTS_MODEL = 'gemini-3.8-flash-tts';
const DEFAULT_VOICE = 'Charon';

function sectionToPlainText(section: { title: string; blocks: { type: string; text: string }[] }): string {
  const parts = [section.title];
  for (const block of section.blocks) {
    if (block.type === 'image') continue;
    parts.push(block.text);
  }
  return parts.join('\n\n');
}

function pcmToWav(pcmBase64: string, sampleRate: number): Buffer {
  const pcm = Buffer.from(pcmBase64, 'base64');
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate (16-bit mono)
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') !== process.env.TTS_PILOT_SECRET || !process.env.TTS_PILOT_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const chapterId = searchParams.get('chapterId');
  const sectionId = searchParams.get('sectionId');
  const voice = searchParams.get('voice') || DEFAULT_VOICE;

  if (chapterId !== ALLOWED_CHAPTER_ID) {
    return NextResponse.json({ error: 'chapter not allowed for this pilot route' }, { status: 400 });
  }
  const chapter = getChapter(chapterId);
  const section = chapter?.sections.find((s) => s.id === sectionId);
  if (!chapter || !section) {
    return NextResponse.json({ error: 'section not found' }, { status: 404 });
  }

  const text = sectionToPlainText(section);

  try {
    const result = await client.models.generateContent({
      model: TTS_MODEL,
      contents: [{ role: 'user', parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
        },
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

    return new NextResponse(new Uint8Array(wav), {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Disposition': `attachment; filename="${sectionId}.wav"`,
        'X-TTS-Voice': voice,
        'X-TTS-Model': TTS_MODEL,
        'X-TTS-Sample-Rate': String(sampleRate),
        'X-TTS-Char-Count': String(text.length),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err instanceof Error ? err.message : err) }, { status: 500 });
  }
}
