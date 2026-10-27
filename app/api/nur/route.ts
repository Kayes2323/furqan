import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, ThinkingLevel, type Content } from '@google/genai';
import { NUR_SYSTEM_PROMPT } from './prompt';
import { retrieveContext, type ExplicitContext } from './retrieval';
import { formatContextForPrompt, buildRefsOut, buildSourcesOut } from './context-format';

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Vercel Hobby caps serverless functions at 10s — Gemini responses during
// a demand spike can take several seconds, so keep this well under that
// cap instead of risking a hard platform timeout that skips the friendly
// fallback response below. Retrieval (local file + our own cached API
// routes) typically adds well under a second.
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

// A deliberately tiny, cheap extraction call — only reached when nothing
// deterministic (quran-reference-parser.ts) matched AND the question
// still looks Quran/tafsir-specific (see looksAyahSpecific). Uses the
// lightest model with minimal thinking and a tight JSON schema, so the
// added cost/latency stays small. Never asked to answer the question
// itself — only to name a surah/ayah number, which retrieval.ts then
// verifies against the real dataset before using.
async function extractReferenceViaLLM(message: string): Promise<ExplicitContext | null> {
  try {
    const res = await client.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      config: {
        maxOutputTokens: 64,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        responseMimeType: 'application/json',
        systemInstruction:
          'একজন ব্যবহারকারীর প্রশ্ন থেকে কুরআনের কোন সূরা ও আয়াতের কথা বলা হচ্ছে তা শনাক্ত করো। ' +
          'শুধু এই JSON ফরম্যাটে উত্তর দাও: {"surah": number|null, "ayah": number|null}। ' +
          'নিশ্চিত না হলে surah: null দাও। কখনো অনুমান করে সংখ্যা বানাবে না।',
      },
      contents: [{ role: 'user', parts: [{ text: message }] }],
    });
    const raw = (res.text ?? '').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw) as { surah: number | null; ayah: number | null };
    if (!parsed.surah || !Number.isInteger(parsed.surah) || parsed.surah < 1 || parsed.surah > 114) return null;
    return { surah: parsed.surah, ayah: parsed.ayah ?? undefined };
  } catch {
    return null; // extraction is best-effort; never block the main answer on it
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, history, context } = await req.json() as {
      message: string;
      history: { role: string; content: string }[];
      context?: { surah: number; ayah?: number };
    };

    const explicitContext: ExplicitContext | undefined =
      context && Number.isInteger(context.surah) ? { surah: context.surah, ayah: context.ayah } : undefined;

    const retrieved = await retrieveContext(message, undefined, {
      explicitContext,
      llmReferenceFallback: extractReferenceViaLLM,
    });

    const contextBlock = formatContextForPrompt(retrieved);
    const contextualizedMessage = contextBlock
      ? `প্রাসঙ্গিক তথ্য (FURQAN-এর যাচাইকৃত ডেটাবেজ থেকে):\n${contextBlock}\n\n---\n\nব্যবহারকারীর প্রশ্ন: ${message}`
      : `(এই প্রশ্নের জন্য আমাদের ডেটাবেজে নির্দিষ্ট আয়াত/তাফসির সূত্র পাওয়া যায়নি — প্রয়োজনে সাধারণ জ্ঞান থেকে সতর্কতার সাথে উত্তর দাও এবং তা স্পষ্ট করে বলো)\n\nব্যবহারকারীর প্রশ্ন: ${message}`;

    const contents: Content[] = [
      ...history.map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: m.content }],
      })),
      { role: 'user' as const, parts: [{ text: contextualizedMessage }] },
    ];

    const response = await generateWithFallback(contents);
    const reply = (response.text ?? '').trim() || 'দুঃখিত, একটু সমস্যা হয়েছে। আবার চেষ্টা করো।';

    return NextResponse.json({
      reply,
      refs: buildRefsOut(retrieved),
      sources: buildSourcesOut(retrieved),
      resolvedVia: retrieved.resolvedVia,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ reply: 'দুঃখিত, একটু সমস্যা হয়েছে। আবার চেষ্টা করো।', refs: [], sources: [] }, { status: 500 });
  }
}
