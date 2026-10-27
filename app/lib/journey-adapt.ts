// ═══════════════════════════════════════════
// FURQAN — Quran Journey: adaptive suggestions
//
// Looks at what actually happened (the Khatm history the engine already
// records) and may SUGGEST a change — never applies one. Every suggestion
// carries concrete, deterministic numbers and needs the user's explicit
// confirmation. Wording is encouraging; there is no guilt, no streak
// loss, no "behind" shaming.
//
// Missed days are never turned into a pile of debt: the Khatm engine
// already spreads whatever remains evenly over the remaining days, and
// when even that would exceed what the user can do, the suggestion is
// to move the date, not to cram.
// ═══════════════════════════════════════════

import type { QuranIndex } from './quran-index';
import type { KhatmPlan } from './khatm-types';
import type { JourneyPlan } from './journey-types';
import { addDays, daysBetween } from './date-utils.ts';
import { computeDailyTarget } from './khatm-plan.ts';
import { COMFORT_FACTOR, completionDate, estimateMinutes, ayahsForMinutes, normalizeMinutes, formatDateBn } from './journey-plan.ts';

export type SuggestionKind = 'lighten' | 'ease-timeline' | 'raise';

export interface Suggestion {
  kind: SuggestionKind;
  title: string;
  body: string;
  /** Concrete change if the user accepts. */
  proposal: { targetDate: string; dailyMinutes: number };
}

const WINDOW = 7;
const OVERSHOOT_TOLERANCE = 1.5;
const MIN_DAYS_OF_DATA = 4;

export interface RecentActivity {
  daysCounted: number;
  daysRead: number;
  avgAyahsOnReadDays: number;
}

/** Looks at up to the last 7 full days (excluding today) that fall inside
 *  the plan. A day with no history entry counts as "not read". */
export function recentActivity(plan: KhatmPlan, today: string): RecentActivity {
  const byDate = new Map(plan.history.filter((h) => h.event !== 'restarted').map((h) => [h.date, h.ayahsRead]));
  let daysCounted = 0;
  let daysRead = 0;
  let sum = 0;
  for (let i = 1; i <= WINDOW; i++) {
    const d = addDays(today, -i);
    if (daysBetween(plan.startDate, d) < 0) break;
    daysCounted++;
    const read = byDate.get(d) ?? 0;
    if (read > 0) {
      daysRead++;
      sum += read;
    }
  }
  return { daysCounted, daysRead, avgAyahsOnReadDays: daysRead > 0 ? sum / daysRead : 0 };
}

export function suggestAdjustment(args: {
  index: QuranIndex;
  khatm: KhatmPlan | null;
  journey: JourneyPlan | null;
  today: string;
}): Suggestion | null {
  const { index, khatm, journey, today } = args;
  if (!khatm || !journey || khatm.status !== 'active') return null;
  if (journey.goal === 'nazera') return null;

  const act = recentActivity(khatm, today);
  if (act.daysCounted < MIN_DAYS_OF_DATA) return null; // too early to judge

  const lpm = journey.lettersPerMinute;
  const remainingMin = estimateMinutes(khatm.completedAyahs + 1, index.totalAyahs, lpm);
  const missed = act.daysCounted - act.daysRead;
  const dailyTarget = computeDailyTarget(index, khatm, today);
  const targetMinutes = dailyTarget > 0 ? estimateMinutes(khatm.completedAyahs + 1, khatm.completedAyahs + dailyTarget, lpm) : 0;

  // Reading often skipped → smaller sessions, longer timeline.
  if (missed >= Math.ceil(act.daysCounted * 0.55)) {
    const minutes = normalizeMinutes(Math.max(5, Math.round(journey.dailyMinutes * 0.6)));
    const date = completionDate(remainingMin, minutes * COMFORT_FACTOR, today, journey.lightDays);
    if (!date) return null;
    return {
      kind: 'lighten',
      title: 'একটু হালকা গতিতে এগোবে?',
      body: `সম্প্রতি পড়ার সময় পাওয়া কঠিন হচ্ছে বলে মনে হচ্ছে — সেটা স্বাভাবিক। দিনে ${minutes} মিনিটের ছোট লক্ষ্য ধরলে আনুমানিক ${formatDateBn(date)} নাগাদ খতম সম্ভব। ছোট কিন্তু নিয়মিত পড়াই সবচেয়ে টেকসই।`,
      proposal: { targetDate: date, dailyMinutes: minutes },
    };
  }

  // Today's even-spread target no longer fits the time the user has. Ayah
  // length varies a lot across the Quran (a day in al-Baqarah takes longer
  // than a day in Juz 'Amma), so only a clear overshoot is worth raising.
  if (targetMinutes > journey.dailyMinutes * OVERSHOOT_TOLERANCE) {
    const date = completionDate(remainingMin, journey.dailyMinutes * COMFORT_FACTOR, today, journey.lightDays);
    if (!date) return null;
    return {
      kind: 'ease-timeline',
      title: 'সময়সীমা একটু বাড়িয়ে নেবে?',
      body: `আজকের হিসাবে দিনে প্রায় ${Math.ceil(targetMinutes)} মিনিট লাগছে, যা তোমার ${journey.dailyMinutes} মিনিটের চেয়ে বেশি। হারানো দিনগুলো একসাথে পূরণ করার দরকার নেই — তারিখ বদলে ${formatDateBn(date)} করলে দৈনিক পড়া আবার স্বচ্ছন্দ হবে।`,
      proposal: { targetDate: date, dailyMinutes: journey.dailyMinutes },
    };
  }

  // Consistently well ahead → an optional, earlier date.
  const plannedDaily = journey.assumptions.khatmDailyAyahs ?? dailyTarget;
  if (act.daysRead >= act.daysCounted - 1 && plannedDaily > 0 && act.avgAyahsOnReadDays >= plannedDaily * 1.3) {
    const pace = Math.floor(act.avgAyahsOnReadDays * 0.9);
    const days = Math.ceil((index.totalAyahs - khatm.completedAyahs) / Math.max(1, pace));
    const date = addDays(today, Math.max(0, days - 1));
    if (daysBetween(date, khatm.targetDate) < 3) return null; // not worth bothering the user
    const minutes = normalizeMinutes(Math.ceil(estimateMinutes(khatm.completedAyahs + 1, khatm.completedAyahs + pace, lpm)));
    return {
      kind: 'raise',
      title: 'তুমি এগিয়ে আছো — চাইলে আগে শেষ করতে পারো',
      body: `সম্প্রতি তুমি নিয়মিত লক্ষ্যের চেয়ে বেশি পড়ছো। এই গতি ধরে রাখলে আনুমানিক ${formatDateBn(date)} নাগাদ খতম হতে পারে। এটি সম্পূর্ণ ঐচ্ছিক — বর্তমান পরিকল্পনাও ঠিকই আছে।`,
      proposal: { targetDate: date, dailyMinutes: minutes },
    };
  }
  return null;
}

/** A deliberately tiny optional session for a very busy stretch (about
 *  five minutes of reading from the current position), so the day still
 *  has a gentle foothold without touching the plan's target. */
export function lightSessionAyahs(index: QuranIndex, khatmCompleted: number, lpm: number): number {
  return ayahsForMinutes(index, khatmCompleted + 1, 5, lpm);
}
