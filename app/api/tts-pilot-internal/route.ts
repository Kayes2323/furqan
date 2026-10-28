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

function sectionToPlainText(
  section: { title: string; blocks: { type: string; text: string }[] },
  blockRange?: [number, number],
): string {
  const parts: string[] = [];
  if (!blockRange || blockRange[0] === 0) parts.push(section.title);
  const blocks = blockRange ? section.blocks.slice(blockRange[0], blockRange[1] + 1) : section.blocks;
  for (const block of blocks) {
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

  const blockRangeRaw = searchParams.get('blockRange');
  const blockRange = blockRangeRaw
    ? (blockRangeRaw.split('-').map((n) => parseInt(n, 10)) as [number, number])
    : undefined;
  const text = sectionToPlainText(section, blockRange);

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

    // Content-integrity check: feed the just-generated audio back to a
    // text model and ask for a Bengali transcription, so a gross failure
    // (wrong language, silence, garbled output) is caught automatically
    // rather than assumed away.
    let transcription: string | null = null;
    try {
      const transcribeResult = await client.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [{
          role: 'user',
          parts: [
            { text: 'এই অডিওতে যা বলা হয়েছে তা হুবহু বাংলা লিপিতে লিখুন। শুধু ট্রান্সক্রিপশন দিন, অন্য কিছু নয়।' },
            { inlineData: { mimeType: 'audio/wav', data: wav.toString('base64') } },
          ],
        }],
      });
      transcription = transcribeResult.text ?? null;
    } catch {
      transcription = null; // best-effort only — never fails the main generation
    }

    // Returned as base64 inside JSON (pure ASCII) rather than raw binary —
    // a raw-binary response fetched through a text-oriented HTTP tool can
    // get corrupted by lossy UTF-8 decoding; base64 round-trips exactly.
    return NextResponse.json({
      sectionId,
      blockRange: blockRange ?? null,
      voice,
      model: TTS_MODEL,
      sampleRate,
      charCount: text.length,
      sourceText: text,
      transcription,
      audioBase64: wav.toString('base64'),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err instanceof Error ? err.message : err) }, { status: 500 });
  }
}
