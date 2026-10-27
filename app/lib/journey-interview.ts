// ═══════════════════════════════════════════
// FURQAN — Quran Journey: NUR planning interview (state machine)
//
// WHAT to ask, in what order, and which questions to skip is decided
// here, deterministically, from the answers so far and the data the app
// already holds. NUR (the language model) is used only to (a) understand
// free-text replies and (b) phrase the explanation — never to decide the
// numbers. Every question has tappable options, so the flow works fully
// even when the model is unavailable.
// ═══════════════════════════════════════════

import type { QuranIndex } from './quran-index';
import type { KhatmPlan, PrayerSlot } from './khatm-types';
import type { NazeraProfile } from './nazera-types';
import type { JourneyGoal, JourneyPlan, JourneySlots, SpeedChoice } from './journey-types';
import { PRAYER_SLOTS } from './khatm-types.ts';
import { daysBetween } from './date-utils.ts';
import { DEFAULT_LPM, MAX_DAILY_MINUTES, MIN_DAILY_MINUTES, SPEED_LPM, normalizeMinutes, type PlanInputs } from './journey-plan.ts';
import { refToGlobal } from './quran-index.ts';

export type StepId =
  | 'goal' | 'deadline' | 'sharing' | 'start' | 'dailyMinutes'
  | 'slots' | 'slotsCustom' | 'lightDays' | 'speed';

export type SlotPreset = 'single' | 'fajr-isha' | 'five' | 'custom';
export type StartChoice = 'beginning' | 'reader' | { surah: number };
export type DeadlineChoice = { date: string } | 'sustainable';

export interface Answers {
  goal?: JourneyGoal;
  deadline?: DeadlineChoice;
  sharing?: boolean;
  start?: StartChoice;
  dailyMinutes?: number;
  slotsPreset?: SlotPreset;
  slotsCustom?: PrayerSlot[];
  lightDays?: number[];
  speed?: SpeedChoice;
  skipped: StepId[];
}

export interface InterviewContext {
  index: QuranIndex;
  today: string;
  khatm: KhatmPlan | null;
  nazera: NazeraProfile | null;
  existingJourney: JourneyPlan | null;
  readerLast: { surah: number; ayah: number } | null;
  /** Median-based speed from the user's own logged sessions, if reliable. */
  calibratedLpm: number | null;
}

const hasKhatm = (g?: JourneyGoal) => g === 'khatm' || g === 'both';
const hasNazera = (g?: JourneyGoal) => g === 'nazera' || g === 'both';

/** A running (active/paused) Khatm plan already tells us the position. */
function khatmKnown(ctx: InterviewContext): boolean {
  return !!ctx.khatm && ctx.khatm.status !== 'completed';
}

/** Shared reading can only be offered when one reading can honestly move
 *  both pointers: they must already match, or one of them must not exist
 *  yet (so it can start at the other's position). */
export function sharingPossible(ctx: InterviewContext): boolean {
  const k = ctx.khatm && ctx.khatm.status !== 'completed' ? ctx.khatm : null;
  if (!k || !ctx.nazera) return true;
  return k.completedAyahs === ctx.nazera.position;
}

function isSkipped(a: Answers, s: StepId): boolean {
  return a.skipped.includes(s);
}

function answered(a: Answers, s: StepId): boolean {
  switch (s) {
    case 'goal': return a.goal !== undefined;
    case 'deadline': return a.deadline !== undefined;
    case 'sharing': return a.sharing !== undefined;
    case 'start': return a.start !== undefined;
    case 'dailyMinutes': return a.dailyMinutes !== undefined;
    case 'slots': return a.slotsPreset !== undefined;
    case 'slotsCustom': return a.slotsCustom !== undefined;
    case 'lightDays': return a.lightDays !== undefined;
    case 'speed': return a.speed !== undefined;
  }
}

/** Effective goal for conditional logic: a skipped goal question falls
 *  back to what the user already has (or Khatm, the common starting point). */
export function effectiveGoal(ctx: InterviewContext, a: Answers): JourneyGoal {
  if (a.goal) return a.goal;
  if (ctx.existingJourney) return ctx.existingJourney.goal;
  if (ctx.nazera && !ctx.khatm) return 'nazera';
  return 'khatm';
}

function sharingEffective(ctx: InterviewContext, a: Answers): boolean {
  return effectiveGoal(ctx, a) === 'both' && a.sharing === true && sharingPossible(ctx);
}

function dailyMinutesEffective(a: Answers): number {
  return a.dailyMinutes !== undefined ? a.dailyMinutes : 20;
}

/** Ordered questions; `ask` says whether the step applies right now. */
const STEPS: { id: StepId; ask: (ctx: InterviewContext, a: Answers) => boolean }[] = [
  { id: 'goal', ask: () => true },
  // A deadline is meaningless for pure Nazera practice.
  { id: 'deadline', ask: (ctx, a) => hasKhatm(effectiveGoal(ctx, a)) },
  // Only when both goals AND one reading could genuinely count for both.
  { id: 'sharing', ask: (ctx, a) => effectiveGoal(ctx, a) === 'both' && sharingPossible(ctx) },
  // Nazera starting point: skip when we already know it, or when shared
  // reading ties it to the Khatm pointer.
  { id: 'start', ask: (ctx, a) => hasNazera(effectiveGoal(ctx, a)) && !ctx.nazera && !sharingEffective(ctx, a) },
  { id: 'dailyMinutes', ask: () => true },
  // With very little time, a single session is the only sensible shape.
  { id: 'slots', ask: (ctx, a) => hasKhatm(effectiveGoal(ctx, a)) && dailyMinutesEffective(a) >= 15 },
  { id: 'slotsCustom', ask: (_ctx, a) => a.slotsPreset === 'custom' },
  { id: 'lightDays', ask: () => true },
  // Don't ask what we've measured from the user's own sessions.
  { id: 'speed', ask: (ctx) => ctx.calibratedLpm === null },
];

export function nextStep(ctx: InterviewContext, a: Answers): StepId | null {
  for (const step of STEPS) {
    if (!step.ask(ctx, a)) continue;
    if (answered(a, step.id) || isSkipped(a, step.id)) continue;
    return step.id;
  }
  return null;
}

/** Steps that apply to this run (answered, skipped or pending), for progress display. */
export function applicableSteps(ctx: InterviewContext, a: Answers): StepId[] {
  return STEPS.filter((s) => s.ask(ctx, a)).map((s) => s.id);
}

export function applyAnswer(a: Answers, step: StepId, value: unknown): Answers {
  const next: Answers = { ...a, skipped: a.skipped.filter((s) => s !== step) };
  switch (step) {
    case 'goal': next.goal = value as JourneyGoal; if (next.goal !== 'both') next.sharing = undefined; break;
    case 'deadline': next.deadline = value as DeadlineChoice; break;
    case 'sharing': next.sharing = value as boolean; break;
    case 'start': next.start = value as StartChoice; break;
    case 'dailyMinutes': next.dailyMinutes = normalizeMinutes(value as number); break;
    case 'slots': next.slotsPreset = value as SlotPreset; if (next.slotsPreset !== 'custom') next.slotsCustom = undefined; break;
    case 'slotsCustom': next.slotsCustom = value as PrayerSlot[]; break;
    case 'lightDays': next.lightDays = value as number[]; break;
    case 'speed': next.speed = value as SpeedChoice; break;
  }
  return next;
}

export function skipStep(a: Answers, step: StepId): Answers {
  if (a.skipped.includes(step)) return a;
  return { ...a, skipped: [...a.skipped, step] };
}

/** Returns a Bengali error message if the value is unusable, else null. */
export function validateAnswer(step: StepId, value: unknown, ctx: InterviewContext): string | null {
  switch (step) {
    case 'deadline':
      if (value === 'sustainable') return null;
      if (!value || typeof value !== 'object' || typeof (value as { date?: unknown }).date !== 'string') return 'একটি তারিখ দাও';
      if (!/^\d{4}-\d{2}-\d{2}$/.test((value as { date: string }).date)) return 'তারিখটি সঠিক নয়';
      if (daysBetween(ctx.today, (value as { date: string }).date) < 0) return 'তারিখটি আজকের পরে হতে হবে';
      return null;
    case 'dailyMinutes':
      if (typeof value !== 'number' || !Number.isFinite(value)) return 'মিনিটের সংখ্যা লেখো';
      if (value < MIN_DAILY_MINUTES || value > MAX_DAILY_MINUTES) return `${MIN_DAILY_MINUTES} থেকে ${MAX_DAILY_MINUTES} মিনিটের মধ্যে দাও`;
      return null;
    case 'start':
      if (value && typeof value === 'object') {
        const s = (value as { surah?: unknown }).surah;
        if (typeof s !== 'number' || !Number.isInteger(s) || s < 1 || s > ctx.index.surahCount) return `সূরা নম্বর 1 থেকে ${ctx.index.surahCount}-এর মধ্যে দাও`;
      }
      return null;
    case 'slotsCustom':
      if (!Array.isArray(value) || value.length === 0 || !value.every((v) => (PRAYER_SLOTS as readonly string[]).includes(v))) return 'অন্তত একটি ওয়াক্ত বেছে নাও';
      return null;
    case 'lightDays':
      if (!Array.isArray(value) || !value.every((v) => Number.isInteger(v) && v >= 0 && v <= 6)) return 'দিনগুলো ঠিকমতো বেছে নাও';
      return null;
    default:
      return null;
  }
}

// ── questions (Bengali, conversational) ───────────────────────────────

export interface Option { value: string; label: string; hint?: string }
export interface Question {
  step: StepId;
  text: string;
  kind: 'single' | 'multi' | 'number' | 'date' | 'surah';
  options: Option[];
  skippable: boolean;
  skipLabel?: string;
}

const SLOT_LABEL: Record<PrayerSlot, string> = { fajr: 'ফজর', dhuhr: 'যোহর', asr: 'আসর', maghrib: 'মাগরিব', isha: 'এশা' };
export const slotLabel = (s: PrayerSlot) => SLOT_LABEL[s];

export function questionFor(step: StepId, ctx: InterviewContext): Question {
  const k = khatmKnown(ctx) ? ctx.khatm! : null;
  switch (step) {
    case 'goal': {
      const have = [k ? 'খতম' : null, ctx.nazera ? 'নাযেরা' : null].filter(Boolean).join(' ও ');
      return {
        step, kind: 'single', skippable: true, skipLabel: 'পরে ঠিক করব',
        text: have
          ? `আস-সালামু আলাইকুম! তোমার ${have} ইতিমধ্যে চালু আছে — আমি সেগুলোর অগ্রগতি অক্ষুণ্ণ রেখেই কাজ করব। এবার বলো, কুরআনের সঙ্গে তোমার লক্ষ্য কী?`
          : 'আস-সালামু আলাইকুম! তোমার সময় আর গতির সঙ্গে মানানসই একটি কুরআন পড়ার পরিকল্পনা বানাতে আমি সাহায্য করব। প্রথমে বলো, তোমার লক্ষ্য কী?',
        options: [
          { value: 'khatm', label: 'খতম', hint: 'পুরো কুরআন একবার শেষ করা' },
          { value: 'nazera', label: 'নাযেরা', hint: 'নিয়মিত দেখে দেখে তিলাওয়াতের অভ্যাস' },
          { value: 'both', label: 'দুটোই' },
        ],
      };
    }
    case 'deadline':
      return {
        step, kind: 'date', skippable: true, skipLabel: 'নিজের গতিতে',
        text: k
          ? `তোমার বর্তমান খতমের লক্ষ্য তারিখ ${k.targetDate}। এটি কি বদলাতে চাও, নাকি নিজের গতিতে টেকসই হারে এগোতে চাও?`
          : 'খতম কি কোনো নির্দিষ্ট তারিখের মধ্যে শেষ করতে চাও (যেমন রমজানের আগে)? না থাকলে "নিজের গতিতে" বেছে নাও — আমি টেকসই একটি তারিখ হিসাব করে দেব।',
        options: [{ value: 'sustainable', label: 'নিজের গতিতে', hint: 'কোনো নির্দিষ্ট তারিখ নেই' }],
      };
    case 'sharing':
      return {
        step, kind: 'single', skippable: true, skipLabel: 'আলাদা সেশনই থাক',
        text: 'খতম ও নাযেরা দুটোই চাইলে — একই পড়া কি দুটোতেই গণনা হবে, নাকি দুটো আলাদা সেশনে পড়বে? (একই পড়া ধরলে দৈনিক পড়া দ্বিগুণ হয় না।)',
        options: [
          { value: 'shared', label: 'একই পড়া দুটোতেই গণনা হোক' },
          { value: 'separate', label: 'আলাদা সেশনে পড়ব' },
        ],
      };
    case 'start':
      return {
        step, kind: 'single', skippable: true, skipLabel: 'শুরু থেকেই',
        text: 'নাযেরা কোথা থেকে শুরু করবে?',
        options: [
          { value: 'beginning', label: 'সূরা ফাতিহা থেকে' },
          ...(ctx.readerLast ? [{ value: 'reader', label: 'রিডারে যেখানে শেষ পড়েছি', hint: `${ctx.readerLast.surah}:${ctx.readerLast.ayah}` }] : []),
          { value: 'surah', label: 'একটি নির্দিষ্ট সূরা থেকে' },
        ],
      };
    case 'dailyMinutes':
      return {
        step, kind: 'number', skippable: true, skipLabel: 'ঠিক জানি না',
        text: 'প্রতিদিন বাস্তবে কত মিনিট কুরআনের জন্য দিতে পারবে? সাধ্যের একটু কম ধরাই ভালো — টেকসই হওয়াটাই আসল।',
        options: [10, 15, 20, 30, 45, 60].map((m) => ({ value: String(m), label: `${m} মিনিট` })),
      };
    case 'slots':
      return {
        step, kind: 'single', skippable: true, skipLabel: 'একবারেই পড়ব',
        text: 'দৈনিক পড়া কীভাবে ভাগ করতে চাও?',
        options: [
          { value: 'single', label: 'একবারে একটি সেশন' },
          { value: 'fajr-isha', label: 'ফজর ও এশার পর' },
          { value: 'five', label: 'পাঁচ ওয়াক্ত নামাজের পর' },
          { value: 'custom', label: 'আমি নিজে বেছে নেব' },
        ],
      };
    case 'slotsCustom':
      return {
        step, kind: 'multi', skippable: false,
        text: 'কোন কোন ওয়াক্তের পর পড়তে চাও? (একাধিক বেছে নিতে পারো)',
        options: PRAYER_SLOTS.map((s) => ({ value: s, label: SLOT_LABEL[s] })),
      };
    case 'lightDays':
      return {
        step, kind: 'multi', skippable: true, skipLabel: 'কোনো নির্দিষ্ট দিন নেই',
        text: 'সপ্তাহের কোন দিনগুলোয় পড়ার সময় পাওয়া কঠিন হয়? ওই দিনগুলোয় হালকা সেশন ধরব। (না থাকলে এড়িয়ে যাও)',
        options: [6, 0, 1, 2, 3, 4, 5].map((d) => ({ value: String(d), label: ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'][d] })),
      };
    case 'speed':
      return {
        step, kind: 'single', skippable: true, skipLabel: 'জানি না',
        text: 'আরবি দেখে পড়তে তুমি নিজেকে কেমন মনে করো? এটা শুধু শুরুর আনুমানিক হিসাবের জন্য — পরে তোমার আসল পড়া থেকে আমি নিজেই শুধরে নেব।',
        options: [
          { value: 'slow', label: 'ধীরে — এখনও শিখছি' },
          { value: 'normal', label: 'মাঝারি' },
          { value: 'fast', label: 'সাবলীল' },
        ],
      };
  }
}

// ── answers → plan inputs ─────────────────────────────────────────────

export function resolveSlots(a: Answers): JourneySlots {
  switch (a.slotsPreset) {
    case 'five': return [...PRAYER_SLOTS];
    case 'fajr-isha': return ['fajr', 'isha'];
    case 'custom': return a.slotsCustom && a.slotsCustom.length > 0 ? [...a.slotsCustom] : 'single';
    default: return 'single';
  }
}

/** Turns the interview answers (plus what the app already knows) into
 *  the exact inputs the deterministic planner needs. */
export function toPlanInputs(ctx: InterviewContext, a: Answers): PlanInputs {
  const goal = effectiveGoal(ctx, a);
  const kn = khatmKnown(ctx) ? ctx.khatm! : null;
  const khatmCompleted = kn ? kn.completedAyahs : 0;
  const shared = goal === 'both' && sharingEffective(ctx, a);

  let nazeraPosition = ctx.nazera ? ctx.nazera.position : 0;
  if (!ctx.nazera && hasNazera(goal)) {
    if (shared) nazeraPosition = khatmCompleted;
    else if (a.start === 'reader' && ctx.readerLast) nazeraPosition = Math.max(0, refToGlobal(ctx.index, ctx.readerLast) - 1);
    else if (a.start && typeof a.start === 'object') nazeraPosition = Math.max(0, refToGlobal(ctx.index, { surah: a.start.surah, ayah: 1 }) - 1);
  }

  const deadline = a.deadline;
  const useDate = deadline && deadline !== 'sustainable' ? deadline.date : null;
  // No answer about the deadline (skipped) keeps an existing deadline plan's date out of the way: sustainable.
  const pace = useDate ? 'deadline' : 'sustainable';

  const speed = a.speed && a.speed !== 'unknown' ? a.speed : null;
  const lpm = ctx.calibratedLpm ?? (speed ? SPEED_LPM[speed] : ctx.existingJourney?.speedSource === 'user' || ctx.existingJourney?.speedSource === 'calibrated' ? ctx.existingJourney.lettersPerMinute : DEFAULT_LPM);
  const speedSource = ctx.calibratedLpm !== null ? 'calibrated' : speed ? 'user' : ctx.existingJourney && ctx.existingJourney.speedSource !== 'default' ? ctx.existingJourney.speedSource : 'default';

  return {
    goal,
    sharedReading: shared,
    pace,
    requestedDate: useDate,
    dailyMinutes: a.dailyMinutes ?? ctx.existingJourney?.dailyMinutes ?? 20,
    lpm,
    speedSource,
    slots: a.slotsPreset !== undefined || !ctx.existingJourney ? resolveSlots(a) : ctx.existingJourney.slots,
    lightDays: a.lightDays ?? ctx.existingJourney?.lightDays ?? [],
    khatmCompleted,
    nazeraPosition,
    today: ctx.today,
  };
}

// ── free-text understanding (deterministic first; model second) ───────

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export function normalizeDigits(s: string): string {
  return s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

const SKIP_RE = /(জানি না|জানিনা|skip|স্কিপ|পরে|এড়িয়ে|নেই|না থাক)/i;

/** Best-effort local parse of a typed reply. Returns undefined when it
 *  cannot tell (the caller may then ask the model, or re-ask with options). */
export function parseFreeText(step: StepId, textRaw: string, ctx: InterviewContext): { value: unknown } | { skip: true } | undefined {
  const text = normalizeDigits(textRaw.trim());
  if (!text) return undefined;
  if (SKIP_RE.test(text) && step !== 'lightDays') return { skip: true };

  switch (step) {
    case 'goal': {
      const khatm = /খতম|khatm|khotom/i.test(text);
      const nazera = /নাযেরা|নাজেরা|নাজেরা|নাযেরা|nazera|nazira|দেখে দেখে/i.test(text);
      if ((khatm && nazera) || /দুটো|দুটোই|দুইটা|both/i.test(text)) return { value: 'both' };
      if (khatm) return { value: 'khatm' };
      if (nazera) return { value: 'nazera' };
      return undefined;
    }
    case 'deadline': {
      if (/নিজের গতি|কোনো তারিখ নেই|সময়সীমা নেই|sustainable/i.test(text)) return { value: 'sustainable' };
      const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (iso) return { value: { date: iso[0] } };
      const days = text.match(/(\d+)\s*(দিন|days?)/i);
      if (days) return { value: { date: addDaysSafe(ctx.today, Number(days[1]) - 1) } };
      const months = text.match(/(\d+)\s*(মাস|months?)/i);
      if (months) return { value: { date: addDaysSafe(ctx.today, Number(months[1]) * 30 - 1) } };
      return undefined;
    }
    case 'sharing':
      if (/আলাদা|separate/i.test(text)) return { value: false };
      if (/একই|shared|দুটোতেই|দুটোতে/i.test(text)) return { value: true };
      return undefined;
    case 'dailyMinutes': {
      if (/আধা\s*ঘ|আধ\s*ঘ|half an hour/i.test(text)) return { value: 30 };
      const hr = text.match(/(\d+(?:\.\d+)?)\s*(ঘণ্টা|ঘন্টা|hour|hr)/i);
      if (hr) return { value: Math.round(Number(hr[1]) * 60) };
      const m = text.match(/(\d+)/);
      if (m) return { value: Number(m[1]) };
      return undefined;
    }
    case 'slots':
      if (/পাঁচ|৫|five/i.test(text)) return { value: 'five' };
      if (/ফজর.*এশা|fajr.*isha/i.test(text)) return { value: 'fajr-isha' };
      if (/একবারে|একটি|single|একসাথে/i.test(text)) return { value: 'single' };
      return undefined;
    case 'speed':
      if (/ধীর|শিখছি|slow|beginner|নতুন/i.test(text)) return { value: 'slow' };
      if (/সাবলীল|দ্রুত|fast|fluent/i.test(text)) return { value: 'fast' };
      if (/মাঝারি|normal|medium/i.test(text)) return { value: 'normal' };
      return undefined;
    case 'start':
      if (/শুরু|ফাতিহা|beginning/i.test(text)) return { value: 'beginning' };
      if (/রিডার|শেষ পড়/i.test(text) && ctx.readerLast) return { value: 'reader' };
      return undefined;
    case 'lightDays': {
      if (SKIP_RE.test(text)) return { value: [] };
      const names: [RegExp, number][] = [[/রবি/, 0], [/সোম/, 1], [/মঙ্গল/, 2], [/বুধ/, 3], [/বৃহ/, 4], [/শুক্র/, 5], [/শনি/, 6]];
      const found = names.filter(([re]) => re.test(text)).map(([, d]) => d);
      return found.length ? { value: found } : undefined;
    }
    default:
      return undefined;
  }
}

function addDaysSafe(today: string, n: number): string {
  const [y, m, d] = today.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + Math.max(0, n)));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}
