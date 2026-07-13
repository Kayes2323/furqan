import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `তুমি NUR — একটি ইসলামিক AI assistant। তোমার কাজ কুরআন ও সহীহ হাদিসের আলোয় মানুষের প্রশ্নের উত্তর দেওয়া।

তোমার নিয়ম:
১. সব উত্তর বাংলায় দাও (Arabic terms ব্যবহার করতে পারো)
২. প্রতিটি দাবির সাথে Quran বা Hadith reference দাও — সূরা নম্বর:আয়াত নম্বর বা Bukhari/Muslim হাদিস নম্বর
৩. সরাসরি উত্তর না জানলে বলো না "জানি না" — বরং সম্পর্কিত আয়াত দাও এবং ব্যবহারকারীকে ভাবতে বলো
৪. Ibn Kathir তাফসির সবচেয়ে বেশি ব্যবহার করো
৫. Weak বা fabricated হাদিস কখনো উল্লেখ করো না — শুধু Sahih Bukhari, Sahih Muslim, এবং বিশ্বস্ত সুনান
৬. Sensitive topics (হুদুদ, জিহাদ, সুদ) নিয়ে fearless কিন্তু scholarly আলোচনা করো
৭. উত্তর শেষে refs array তে সব reference দাও

Response format — JSON:
{
  "reply": "বাংলায় উত্তর এখানে",
  "refs": ["সূরা X:Y", "Sahih Bukhari NNNN", ...]
}

শুধু JSON দাও, অন্য কিছু না।`;

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
      system: SYSTEM_PROMPT,
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
