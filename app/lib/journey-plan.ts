// ═══════════════════════════════════════════
// FURQAN — Quran Journey: deterministic planning engine
//
// All arithmetic (remaining ayahs, daily targets, time estimates,
// completion dates, feasibility) happens HERE, in pure functions over
// the real Quran index and the per-ayah letter counts derived from the
// Tanzil dataset. NUR (the language model) never produces these numbers
// — it only converses and explains numbers computed here.
//
// Time estimates are weighted by the actual length (Arabic letters) of
// the ayahs in range, so a stretch of long ayahs is estimated to take
// longer than the same count of short ones. They are ESTIMATES built on
// an assumed reading speed — never guarantees.
// ═══════════════════════════════════════════

import type { QuranIndex, SurahAyahRef } from './quran-index';
import type { PrayerSlot } from './khatm-types';
import type { JourneyGoal, JourneyPace, JourneySlots, SpeedChoice, SpeedSource } from './journey-types';
import { AYAH_LETTER_COUNTS } from './quran-ayah-weights.ts';
import { addDays, daysBetween } from './date-utils.ts';
import { globalToRef } from './quran-index.ts';
import { PRAYER_SLOTS } from './khatm-types.ts';

// ── reading speed ─────────────────────────────────────────────────────

/** Arabic letters read per minute. These are modest, round assumptions
 *  (roughly 1.5 / 2 / 3 / 4.8 average-length ayahs per minute), not
 *  measurements; real pace is refined from the user's own logged sessions. */
export const SPEED_LPM: Record<SpeedChoice, number> = { slow: 80, unknown: 110, normal: 160, fast: 260 };
export const DEFAULT_LPM = SPEED_LPM.unknown;
export const MIN_DAILY_MINUTES = 5;
export const MAX_DAILY_MINUTES = 240;
/** Share of the stated daily time a "sustainable" plan actually uses, so
 *  there is room for slower days. */
export const COMFORT_FACTOR = 0.8;

// ── letter-weighted time estimates ────────────────────────────────────

let prefix: number[] | null = null;
function letterPrefix(): number[] {
  if (!prefix) {
    prefix = new Array(AYAH_LETTER_COUNTS.length + 1).fill(0);
    for (let i = 0; i < AYAH_LETTER_COUNTS.length; i++) prefix[i + 1] = prefix[i] + AYAH_LETTER_COUNTS[i];
  }
  return prefix;
}

/** Arabic letters in the inclusive global-ayah range [startGlobal, endGlobal]. */
export function lettersInRange(startGlobal: number, endGlobal: number): number {
  const p = letterPrefix();
  const s = Math.max(1, startGlobal);
  const e = Math.min(AYAH_LETTER_COUNTS.length, endGlobal);
  if (e < s) return 0;
  return p[e] - p[s - 1];
}

export function estimateMinutes(startGlobal: number, endGlobal: number, lpm: number): number {
  if (lpm <= 0) return 0;
  return lettersInRange(startGlobal, endGlobal) / lpm;
}

/** How many ayahs, reading forward from `startGlobal`, fit in `minutes`
 *  at `lpm`. Always at least 1 (while any ayah remains) so a plan never
 *  asks for zero. */
export function ayahsForMinutes(index: QuranIndex, startGlobal: number, minutes: number, lpm: number): number {
  if (startGlobal > index.totalAyahs) return 0;
  const budget = minutes * lpm;
  let used = 0;
  let n = 0;
  for (let g = Math.max(1, startGlobal); g <= index.totalAyahs; g++) {
    const l = AYAH_LETTER_COUNTS[g - 1];
    if (used + l > budget && n > 0) break;
    used += l;
    n++;
    if (used >= budget) break;
  }
  return Math.max(1, n);
}

// ── calendar helpers (light days) ─────────────────────────────────────

export function weekdayOf(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** A "light day" counts as half a reading day in estimates: the plan
 *  assumes a shorter session there, not zero reading. */
export function dayWeight(dateKey: string, lightDays: number[]): number {
  return lightDays.includes(weekdayOf(dateKey)) ? 0.5 : 1;
}

export function effectiveDaysBetween(from: string, to: string, lightDays: number[]): number {
  const n = daysBetween(from, to) + 1;
  if (n <= 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += dayWeight(addDays(from, i), lightDays);
  return sum;
}

const MAX_HORIZON_DAYS = 3650;

/** First date by which `remainingMinutes` of reading fits at
 *  `minutesPerDay` on regular days (half on light days). Null if it
 *  would take longer than ten years. */
export function completionDate(remainingMinutes: number, minutesPerDay: number, today: string, lightDays: number[]): string | null {
  if (remainingMinutes <= 0) return today;
  if (minutesPerDay <= 0) return null;
  let acc = 0;
  for (let i = 0; i < MAX_HORIZON_DAYS; i++) {
    const day = addDays(today, i);
    acc += minutesPerDay * dayWeight(day, lightDays);
    if (acc >= remainingMinutes) return day;
  }
  return null;
}

// ── feasibility of a Khatm goal ───────────────────────────────────────

export type Verdict = 'done' | 'ok' | 'tight' | 'unrealistic';

export interface KhatmEvaluation {
  remainingAyahs: number;
  remainingMinutes: number;
  verdict: Verdict;
  /** Minutes per regular day needed to meet `requestedDate` (Infinity if the date is past). */
  requiredMinutesPerDay: number | null;
  /** Finish date at the stated daily time (best case). */
  fastestDate: string | null;
  /** Finish date using only COMFORT_FACTOR of the daily time. */
  comfortableDate: string | null;
  requestedDate: string | null;
  /** The date the plan will actually use. */
  planDate: string | null;
  adjusted: boolean; // planDate differs from requestedDate because the request was unrealistic
}

export interface EvaluateKhatmInput {
  index: QuranIndex;
  completedAyahs: number;
  dailyMinutes: number;
  lpm: number;
  lightDays: number[];
  today: string;
  pace: JourneyPace;
  requestedDate?: string | null;
}

export function evaluateKhatm(input: EvaluateKhatmInput): KhatmEvaluation {
  const { index, completedAyahs, dailyMinutes, lpm, lightDays, today, pace } = input;
  const remainingAyahs = Math.max(0, index.totalAyahs - completedAyahs);
  const remainingMinutes = estimateMinutes(completedAyahs + 1, index.totalAyahs, lpm);
  const fastestDate = completionDate(remainingMinutes, dailyMinutes, today, lightDays);
  const comfortableDate = completionDate(remainingMinutes, dailyMinutes * COMFORT_FACTOR, today, lightDays);

  if (remainingAyahs === 0) {
    return { remainingAyahs, remainingMinutes: 0, verdict: 'done', requiredMinutesPerDay: 0, fastestDate: today, comfortableDate: today, requestedDate: null, planDate: today, adjusted: false };
  }

  if (pace === 'sustainable' || !input.requestedDate) {
    return { remainingAyahs, remainingMinutes, verdict: comfortableDate ? 'ok' : 'unrealistic', requiredMinutesPerDay: null, fastestDate, comfortableDate, requestedDate: null, planDate: comfortableDate, adjusted: false };
  }

  const requestedDate = input.requestedDate;
  const eff = effectiveDaysBetween(today, requestedDate, lightDays);
  const required = eff > 0 ? remainingMinutes / eff : Infinity;
  let verdict: Verdict;
  if (required <= dailyMinutes * COMFORT_FACTOR) verdict = 'ok';
  else if (required <= dailyMinutes) verdict = 'tight';
  else verdict = 'unrealistic';

  // Unrealistic → never promise it; use the comfortable date instead.
  const planDate = verdict === 'unrealistic' ? comfortableDate : requestedDate;
  return { remainingAyahs, remainingMinutes, verdict, requiredMinutesPerDay: required, fastestDate, comfortableDate, requestedDate, planDate, adjusted: verdict === 'unrealistic' };
}

// ── proposal: the full set of numbers behind a plan ───────────────────

export interface PlanInputs {
  goal: JourneyGoal;
  sharedReading: boolean;
  pace: JourneyPace;
  requestedDate: string | null;
  dailyMinutes: number;
  lpm: number;
  speedSource: SpeedSource;
  slots: JourneySlots;
  lightDays: number[];
  khatmCompleted: number; // existing Khatm pointer (0 for a new plan)
  nazeraPosition: number; // existing / chosen Nazera pointer
  today: string;
}

export interface Proposal {
  inputs: PlanInputs;
  khatm: null | {
    targetDate: string;
    scheduleStyle: 'fivePrayers' | 'single';
    prayerSlots?: PrayerSlot[];
    dailyAyahs: number;
    dailyMinutes: number;
    minutesBudget: number;
    evaluation: KhatmEvaluation;
  };
  nazera: null | {
    startPosition: number;
    dailyAyahs: number;
    dailyMinutes: number;
    minutesBudget: number;
  };
  warnings: string[];
  assumptions: string[];
}

export function slotsToStyle(slots: JourneySlots): { scheduleStyle: 'fivePrayers' | 'single'; prayerSlots?: PrayerSlot[] } {
  if (slots === 'single' || slots.length === 0) return { scheduleStyle: 'single' };
  const kept = PRAYER_SLOTS.filter((s) => slots.includes(s));
  if (kept.length === PRAYER_SLOTS.length) return { scheduleStyle: 'fivePrayers' };
  return { scheduleStyle: 'fivePrayers', prayerSlots: [...kept] };
}

export function normalizeMinutes(m: number): number {
  if (!Number.isFinite(m)) return 20;
  return Math.min(MAX_DAILY_MINUTES, Math.max(MIN_DAILY_MINUTES, Math.round(m)));
}

/** Splits the daily time when Khatm and Nazera are read in separate
 *  sessions: Nazera is a lighter habit, so it gets about a third. */
export function splitMinutes(total: number): { khatm: number; nazera: number } {
  let nazera = Math.max(MIN_DAILY_MINUTES, Math.round(total / 3));
  if (nazera >= total) nazera = Math.floor(total / 2);
  return { khatm: total - nazera, nazera };
}

export function buildProposal(raw: PlanInputs, index: QuranIndex): Proposal {
  const inputs: PlanInputs = { ...raw, dailyMinutes: normalizeMinutes(raw.dailyMinutes), lightDays: [...new Set(raw.lightDays)].sort() };
  const { goal, today, lpm } = inputs;
  const warnings: string[] = [];
  const assumptions: string[] = [];

  const hasKhatm = goal === 'khatm' || goal === 'both';
  const hasNazera = goal === 'nazera' || goal === 'both';
  const shared = goal === 'both' && inputs.sharedReading;

  let khatmMinutes = inputs.dailyMinutes;
  let nazeraMinutes = inputs.dailyMinutes;
  if (goal === 'both' && !shared) {
    const split = splitMinutes(inputs.dailyMinutes);
    khatmMinutes = split.khatm;
    nazeraMinutes = split.nazera;
    assumptions.push(`আলাদা সেশনে পড়লে দৈনিক সময়ের প্রায় এক-তৃতীয়াংশ (${nazeraMinutes} মিনিট) নাযেরার জন্য ধরা হয়েছে।`);
  }

  let khatm: Proposal['khatm'] = null;
  if (hasKhatm) {
    const evaluation = evaluateKhatm({
      index, completedAyahs: inputs.khatmCompleted, dailyMinutes: khatmMinutes, lpm,
      lightDays: inputs.lightDays, today, pace: inputs.pace, requestedDate: inputs.requestedDate,
    });
    const targetDate = evaluation.planDate ?? addDays(today, MAX_HORIZON_DAYS);
    const days = Math.max(1, daysBetween(today, targetDate) + 1);
    const dailyAyahs = evaluation.remainingAyahs === 0 ? 0 : Math.ceil(evaluation.remainingAyahs / days);
    const dailyMins = dailyAyahs === 0 ? 0 : estimateMinutes(inputs.khatmCompleted + 1, inputs.khatmCompleted + dailyAyahs, lpm);
    const style = slotsToStyle(inputs.slots);
    khatm = { targetDate, scheduleStyle: style.scheduleStyle, prayerSlots: style.prayerSlots, dailyAyahs, dailyMinutes: dailyMins, minutesBudget: khatmMinutes, evaluation };

    if (evaluation.adjusted) {
      warnings.push(
        `${formatDateBn(evaluation.requestedDate!)} তারিখের মধ্যে খতম করতে দিনে প্রায় ${Math.ceil(evaluation.requiredMinutesPerDay!)} মিনিট লাগত, কিন্তু তুমি ${khatmMinutes} মিনিট দিতে পারো। তাই বাস্তবসম্মত তারিখ ${formatDateBn(targetDate)} প্রস্তাব করা হয়েছে — অথবা দৈনিক সময় বাড়াতে পারো।`,
      );
    } else if (evaluation.verdict === 'tight') {
      warnings.push(`লক্ষ্য তারিখটি সম্ভব, তবে বেশ চাপের — দিনে প্রায় ${Math.ceil(evaluation.requiredMinutesPerDay!)} মিনিট লাগবে। ব্যস্ত দিনে পিছিয়ে পড়লে তারিখ বাড়ানো যাবে।`);
    }
    if (!evaluation.planDate) warnings.push('এই গতিতে 10 বছরেও খতম হয় না — দৈনিক সময় বাড়ানো দরকার।');
  }

  let nazera: Proposal['nazera'] = null;
  if (hasNazera) {
    const start = shared ? inputs.khatmCompleted : inputs.nazeraPosition;
    const dailyAyahs = shared && khatm
      ? khatm.dailyAyahs
      : ayahsForMinutes(index, start + 1, nazeraMinutes * COMFORT_FACTOR, lpm);
    const dailyMins = dailyAyahs === 0 ? 0 : estimateMinutes(start + 1, start + dailyAyahs, lpm);
    nazera = { startPosition: start, dailyAyahs: Math.max(1, dailyAyahs), dailyMinutes: dailyMins, minutesBudget: nazeraMinutes };
    if (!shared) assumptions.push(`নাযেরার দৈনিক লক্ষ্য আনুমানিক ${Math.round(nazeraMinutes * COMFORT_FACTOR)} মিনিটের পড়ার সমান ধরা হয়েছে, যাতে ধীর দিনেও সম্ভব হয়।`);
  }

  if (shared) assumptions.push('একই পড়া খতম ও নাযেরা — দুটোতেই গণনা হবে। দুটির অগ্রগতি আলাদা রেকর্ডে থাকবে, কিন্তু একই জায়গা থেকে এগোবে।');
  if (goal === 'both' && !shared) assumptions.push('খতম ও নাযেরা আলাদা সেশনে পড়া হবে এবং দুটির অগ্রগতি আলাদাভাবে চলবে।');

  const perMin = Math.round((lpm / (AYAH_LETTER_COUNTS.reduce((a, b) => a + b, 0) / AYAH_LETTER_COUNTS.length)) * 10) / 10;
  assumptions.push(
    inputs.speedSource === 'calibrated'
      ? `তোমার নিজের লগ করা পড়া থেকে গড়ে প্রতি মিনিটে প্রায় ${perMin}টি আয়াত ধরা হয়েছে।`
      : inputs.speedSource === 'user'
        ? `তোমার দেওয়া ধারণা অনুযায়ী প্রতি মিনিটে গড়ে প্রায় ${perMin}টি আয়াত ধরা হয়েছে — এটি একটি প্রাথমিক অনুমান।`
        : `পড়ার গতির কোনো তথ্য না থাকায় একটি পরিমিত অনুমান (প্রতি মিনিটে গড়ে প্রায় ${perMin}টি আয়াত) ধরা হয়েছে। পড়ার সময় লগ করলে এটি আরও নির্ভুল হবে।`,
  );
  assumptions.push('আয়াতের দৈর্ঘ্য ভিন্ন, তাই সময় প্রতিটি আয়াতের আসল অক্ষর-সংখ্যা ধরে হিসাব করা হয়েছে। লম্বা আয়াতের অংশে কোনো দিন সময় বেশি, ছোট সূরার অংশে কম লাগতে পারে। এগুলো আনুমানিক — নিশ্চিত প্রতিশ্রুতি নয়।');
  if (inputs.lightDays.length > 0) assumptions.push(`${inputs.lightDays.map((d) => WEEKDAYS_BN[d]).join(', ')} — এই দিনগুলোতে অর্ধেক পড়া ধরা হয়েছে।`);

  return { inputs, khatm, nazera, warnings, assumptions };
}

// ── session calibration ───────────────────────────────────────────────

/** Median letters/minute of the most recent logged sessions; null until
 *  there are at least 3 plausible samples. Median, so one distracted
 *  session doesn't swing the estimate. */
export function calibratedLpm(samples: { letters: number; minutes: number }[]): number | null {
  const rates = samples
    .filter((s) => s.minutes >= 1 && s.letters > 0)
    .slice(-10)
    .map((s) => s.letters / s.minutes)
    .filter((r) => r >= 20 && r <= 800)
    .sort((a, b) => a - b);
  if (rates.length < 3) return null;
  const mid = Math.floor(rates.length / 2);
  return Math.round(rates.length % 2 ? rates[mid] : (rates[mid - 1] + rates[mid]) / 2);
}

// ── formatting ────────────────────────────────────────────────────────

export const WEEKDAYS_BN = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const MONTHS_BN = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

export function formatDateBn(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return `${d} ${MONTHS_BN[m - 1]} ${y}`;
}

export function formatRefBn(ref: SurahAyahRef, surahNames: Record<number, string>): string {
  return `${surahNames[ref.surah] ?? ref.surah} ${ref.ayah}`;
}

export function refAtGlobal(index: QuranIndex, global: number): SurahAyahRef | null {
  if (global < 1 || global > index.totalAyahs) return null;
  return globalToRef(index, global);
}
