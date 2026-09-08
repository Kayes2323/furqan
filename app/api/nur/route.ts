import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { NUR_SYSTEM_PROMPT } from './prompt';

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

    const response = await client.models.generateContent({
      model: 'gemini-3.6-flash',
      config: {
        systemInstruction: NUR_SYSTEM_PROMPT,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      },
      contents,
    });

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
