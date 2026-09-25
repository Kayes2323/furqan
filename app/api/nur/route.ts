import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, ThinkingLevel, type Content } from '@google/genai';
import { NUR_SYSTEM_PROMPT } from './prompt';

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Vercel Hobby caps serverless functions at 10s — Gemini responses during
// a demand spike can take several seconds, so keep this well under that
// cap instead of risking a hard platform timeout that skips the friendly
// fallback response below.
export const maxDuration = 10;

// gemini-3.6-flash is the normal model. During free-tier demand spikes,
// per-model latency is unpredictable (observed 3-10s on the very same
// model back to back) and a whole quota pool can 503 for minutes at a
// time, so racing it against flash-lite — a separate, lighter-traffic
// pool — beats retrying sequentially: total wait is bounded by whichever
// finishes first instead of stacking both attempts' latency.
const MODELS = ['gemini-3.6-flash', 'gemini-3.1-flash-lite'];

async function generateWithFallback(contents: Content[]) {
  const config = {
    systemInstruction: NUR_SYSTEM_PROMPT,
    maxOutputTokens: 2048,
    responseMimeType: 'application/json',
    thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
  } as const;

  try {
    return await Promise.any(
      MODELS.map(model => client.models.generateContent({ model, config, contents }))
    );
  } catch (err) {
    if (err instanceof AggregateError) throw err.errors[0];
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    const contents = [
      ...history
        .filter((m: { role: string }) => m.role !== 'nur' || history.indexOf(m) !== 0)
        .map((m: { role: string; content: string }) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{
            text: m.role === 'nur'
              ? JSON.stringify({ reply: m.content, refs: [] })
              : m.content,
          }],
        })),
      { role: 'user' as const, parts: [{ text: message }] },
    ];

    const response = await generateWithFallback(contents);

    const raw = response.text ?? '';

    let parsed;
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = { reply: raw, refs: [] };
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ reply: 'দুঃখিত, একটু সমস্যা হয়েছে। আবার চেষ্টা করো।', refs: [] }, { status: 500 });
  }
}
