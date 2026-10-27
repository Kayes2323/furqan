// ═══════════════════════════════════════════
// FURQAN — NUR for Quran Journey planning: prompts + output guards
//
// The model is only ever used to (1) understand a free-text reply to
// ONE planning question and (2) phrase an explanation of numbers the app
// has already computed. Both outputs are validated here before they
// reach the user — the model cannot introduce a step value outside the
// allowed set, nor a number that the app did not compute.
// ═══════════════════════════════════════════

export const INTERPRET_STEPS = ['goal', 'sharing', 'start', 'dailyMinutes', 'slots', 'lightDays', 'speed', 'deadline'] as const;
export type InterpretStep = (typeof INTERPRET_STEPS)[number];

export const MAX_TEXT_LENGTH = 400;
export const MAX_FACTS_LENGTH = 4000;

export function isInterpretStep(v: unknown): v is InterpretStep {
  return typeof v === 'string' && (INTERPRET_STEPS as readonly string[]).includes(v);
}

export const INTERPRET_SYSTEM_PROMPT = [
  'তুমি একটি কুরআন-পাঠ পরিকল্পনা অ্যাপের সহায়ক। ব্যবহারকারী একটি নির্দিষ্ট প্রশ্নের উত্তর নিজের ভাষায় লিখেছেন (বাংলা/ইংরেজি/বাংলিশ)।',
  'তোমার একমাত্র কাজ: উত্তরটিকে নিচের নির্দিষ্ট মানের একটিতে রূপান্তর করা। শুধু JSON দাও: {"value": <মান বা null>, "skip": <true|false>}।',
  'ব্যবহারকারী উত্তর দিতে চান না বা জানেন না বললে skip: true। নিশ্চিত না হলে value: null। কখনো অনুমান করে মান বানাবে না। কোনো ব্যাখ্যা লিখবে না।',
  'মানের ধরন:',
  '- goal: "khatm" | "nazera" | "both"',
  '- sharing: true (একই পড়া দুটোতেই গণনা) | false (আলাদা সেশন)',
  '- start: "beginning" | "reader" | {"surah": 1..114}',
  '- dailyMinutes: পূর্ণসংখ্যা মিনিট (যেমন "আধা ঘণ্টা" = 30, "ঘণ্টাখানেক" = 60)',
  '- slots: "single" | "fajr-isha" | "five" | "custom"',
  '- lightDays: সংখ্যার তালিকা, রবি=0 সোম=1 মঙ্গল=2 বুধ=3 বৃহস্পতি=4 শুক্র=5 শনি=6',
  '- speed: "slow" | "normal" | "fast"',
  '- deadline: শুধু "sustainable" (কোনো নির্দিষ্ট তারিখ নেই / নিজের গতিতে) অথবা null। তারিখ কখনো বানাবে না।',
].join('\n');

export const EXPLAIN_SYSTEM_PROMPT = [
  'তুমি NUR — কুরআন পাঠ পরিকল্পনার একজন উষ্ণ, শ্রদ্ধাশীল সহচর। নিচের JSON-এ অ্যাপের হিসাব করা তথ্য আছে।',
  'এই তথ্য দিয়ে বাংলায় ৩–৪ বাক্যে পরিকল্পনাটি সহজভাবে ব্যাখ্যা করো এবং একটি ছোট উৎসাহ দাও।',
  'কঠোর নিয়ম:',
  '- JSON-এ নেই এমন কোনো সংখ্যা, তারিখ, আয়াত-সংখ্যা বা হিসাব লিখবে না। নিজে কিছু গণনা করবে না।',
  '- সব সময়সীমা "আনুমানিক" বলো; কিছুর নিশ্চয়তা দিও না।',
  '- অপরাধবোধ, লজ্জা বা ধর্মীয় মর্যাদার মূল্যায়ন করবে না। কারও আমলের ওজন বা তিলাওয়াতের শুদ্ধতা যাচাই করার দাবি করবে না।',
  '- কোনো শিরোনাম, তালিকা বা markdown নয় — শুধু সাধারণ অনুচ্ছেদ।',
].join('\n');

// ── interpretation guard ──────────────────────────────────────────────

const SLOT_PRESETS = ['single', 'fajr-isha', 'five', 'custom'];

export type Interpretation = { value: unknown } | { skip: true } | null;

export function coerceInterpretation(step: InterpretStep, raw: unknown): Interpretation {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as { value?: unknown; skip?: unknown };
  if (r.skip === true) return { skip: true };
  const v = r.value;
  if (v === null || v === undefined) return null;
  switch (step) {
    case 'goal':
      return v === 'khatm' || v === 'nazera' || v === 'both' ? { value: v } : null;
    case 'sharing':
      return typeof v === 'boolean' ? { value: v } : null;
    case 'start':
      if (v === 'beginning' || v === 'reader') return { value: v };
      if (typeof v === 'object' && v !== null && Number.isInteger((v as { surah?: unknown }).surah)) {
        const s = (v as { surah: number }).surah;
        return s >= 1 && s <= 114 ? { value: { surah: s } } : null;
      }
      return null;
    case 'dailyMinutes':
      return typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 1000 ? { value: Math.round(v) } : null;
    case 'slots':
      return typeof v === 'string' && SLOT_PRESETS.includes(v) ? { value: v } : null;
    case 'lightDays':
      return Array.isArray(v) && v.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) ? { value: [...new Set(v as number[])] } : null;
    case 'speed':
      return v === 'slow' || v === 'normal' || v === 'fast' ? { value: v } : null;
    case 'deadline':
      return v === 'sustainable' ? { value: v } : null; // the model may never produce a date
  }
}

export function parseModelJson(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ── explanation guard ─────────────────────────────────────────────────

const BN = '০১২৩৪৫৬৭৮৯';
function toAscii(s: string): string {
  return s.replace(/[০-৯]/g, (d) => String(BN.indexOf(d)));
}

/** All digit runs in a string, normalised to ASCII ("৩০" → "30"). */
export function numberTokens(s: string): string[] {
  return toAscii(s).match(/\d+/g) ?? [];
}

/** True only if every number the model wrote also appears in the facts
 *  the app supplied — i.e. the model invented no figure. */
export function explanationUsesOnlyGivenNumbers(text: string, factsJson: string): boolean {
  const allowed = new Set(numberTokens(factsJson));
  return numberTokens(text).every((t) => allowed.has(t) || allowed.has(String(Number(t))));
}

export function sanitizeExplanation(text: string, factsJson: string): string | null {
  const t = text.replace(/[#*_`>]/g, '').trim();
  if (t.length < 20 || t.length > 900) return null;
  if (!explanationUsesOnlyGivenNumbers(t, factsJson)) return null;
  return t;
}
