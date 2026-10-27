import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  EXPLAIN_SYSTEM_PROMPT, INTERPRET_SYSTEM_PROMPT, MAX_FACTS_LENGTH, MAX_TEXT_LENGTH,
  coerceInterpretation, isInterpretStep, parseModelJson, sanitizeExplanation,
} from './llm';

// Same Gemini client, key (GEMINI_API_KEY) and model pool as app/api/nur/route.ts —
// no new credentials or services. Kept under Vercel Hobby's 10s function cap.
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
export const maxDuration = 10;

const MODELS = ['gemini-3.6-flash', 'gemini-3.1-flash-lite'];

async function generate(systemInstruction: string, userText: string, json: boolean) {
  const config = {
    systemInstruction,
    maxOutputTokens: json ? 128 : 400,
    thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
    ...(json ? { responseMimeType: 'application/json' } : {}),
  } as const;
  try {
    return await Promise.any(
      MODELS.map((model) => client.models.generateContent({ model, config, contents: [{ role: 'user', parts: [{ text: userText }] }] })),
    );
  } catch (err) {
    if (err instanceof AggregateError) throw err.errors[0];
    throw err;
  }
}

/** Every failure path answers 200 with a null result: the client has a
 *  complete deterministic fallback, so a model outage must never break
 *  the planning flow. */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }
  const b = body as { task?: unknown; step?: unknown; text?: unknown; facts?: unknown };

  try {
    if (b.task === 'interpret') {
      if (!isInterpretStep(b.step) || typeof b.text !== 'string' || b.text.trim().length === 0 || b.text.length > MAX_TEXT_LENGTH) {
        return NextResponse.json({ error: 'bad-request' }, { status: 400 });
      }
      const res = await generate(INTERPRET_SYSTEM_PROMPT, `প্রশ্নের ধরন: ${b.step}\nব্যবহারকারীর উত্তর: ${b.text}`, true);
      const parsed = coerceInterpretation(b.step, parseModelJson(res.text ?? ''));
      return NextResponse.json({ result: parsed });
    }

    if (b.task === 'explain') {
      const factsJson = typeof b.facts === 'object' && b.facts !== null ? JSON.stringify(b.facts) : '';
      if (!factsJson || factsJson.length > MAX_FACTS_LENGTH) {
        return NextResponse.json({ error: 'bad-request' }, { status: 400 });
      }
      const res = await generate(EXPLAIN_SYSTEM_PROMPT, `অ্যাপের হিসাব করা তথ্য:\n${factsJson}`, false);
      return NextResponse.json({ text: sanitizeExplanation(res.text ?? '', factsJson) });
    }

    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  } catch (err) {
    console.error('nur/journey', err);
    return NextResponse.json({ result: null, text: null });
  }
}
