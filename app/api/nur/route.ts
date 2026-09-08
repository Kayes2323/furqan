import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { NUR_SYSTEM_PROMPT } from './prompt';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    const messages = [
      ...history
        .filter((m: { role: string }) => m.role !== 'nur' || history.indexOf(m) !== 0)
        .map((m: { role: string; content: string }) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.role === 'nur'
            ? JSON.stringify({ reply: m.content, refs: [] })
            : m.content,
        })),
      { role: 'user' as const, content: message },
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: NUR_SYSTEM_PROMPT,
      messages,
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';

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
