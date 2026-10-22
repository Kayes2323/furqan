// ═══════════════════════════════════════════
// FURQAN — Khatm Planner: pure scheduling engine
//
// Every function here is pure (state in, state out) and independent of
// localStorage/React, mirroring app/lib/qibla.ts and
// app/lib/zikr-progress.ts — the one pattern in this codebase that has
// already caught real bugs through unit testing. All reading portions
// are derived from the real SurahMeta[] (public/quran/meta.json via
// app/lib/reader-data.ts), never hardcoded or invented.
// ═══════════════════════════════════════════

import type { SurahMeta } from './reader-types';
import type {
  QuranIndex,
  SurahAyahRef,
  AyahRange,
  KhatmPlan,
  CreatePlanParams,
  PlanValidationError,
  ScheduleStyle,
  DayAnchor,
  RescheduleReason,
} from './khatm-types';
import { PRAYER_SLOTS } from './khatm-types.ts';

// ── date helpers (date-only, timezone-safe) ──────────────────────────

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDateKey(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split('-').map(Number);
  return { y, m, d };
}

function toUtcMs(key: string): number {
  const { y, m, d } = parseDateKey(key);
  return Date.UTC(y, m - 1, d);
}

/** b - a, in whole calendar days. Can be negative. Timezone-safe: both
 *  sides are parsed as plain calendar dates, not instants. */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtcMs(b) - toUtcMs(a)) / 86400000);
}

export function addDays(key: string, days: number): string {
  const { y, m, d } = parseDateKey(key);
  const ms = Date.UTC(y, m - 1, d + days);
  const dt = new Date(ms);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

// ── Quran index (global ayah position <-> surah:ayah) ────────────────

export function buildQuranIndex(meta: SurahMeta[]): QuranIndex {
  const sorted = [...meta].sort((a, b) => a.number - b.number);
  const cumulativeBefore: number[] = [0]; // index 0 unused; cumulativeBefore[s] = ayahs in surahs 1..s-1
  let running = 0;
  for (const s of sorted) {
    cumulativeBefore[s.number] = running;
    running += s.ayahCount;
  }
  return { totalAyahs: running, cumulativeBefore, surahCount: sorted.length };
}

/** Converts a 1-based global ayah position (1..totalAyahs) to its
 *  surah:ayah reference. Throws on an out-of-range index rather than
 *  silently clamping, so a bug surfaces immediately instead of pointing
 *  at the wrong verse. */
export function globalToRef(index: QuranIndex, global: number): SurahAyahRef {
  if (global < 1 || global > index.totalAyahs) {
    throw new RangeError(`global ayah index ${global} out of range 1..${index.totalAyahs}`);
  }
  // cumulativeBefore is sorted ascending; find the surah whose range contains `global`.
  for (let surah = 1; surah <= index.surahCount; surah++) {
    const before = index.cumulativeBefore[surah];
    const nextBefore = surah < index.surahCount ? index.cumulativeBefore[surah + 1] : index.totalAyahs;
    if (global <= nextBefore && global > before) {
      return { surah, ayah: global - before };
    }
  }
  throw new RangeError(`global ayah index ${global} did not resolve to any surah`);
}

export function refToGlobal(index: QuranIndex, ref: SurahAyahRef): number {
  const before = index.cumulativeBefore[ref.surah];
  if (before == null) throw new RangeError(`unknown surah ${ref.surah}`);
  return before + ref.ayah;
}

export function rangeFromGlobal(index: QuranIndex, startGlobal: number, endGlobal: number): AyahRange {
  return {
    startGlobal,
    endGlobal,
    start: globalToRef(index, startGlobal),
    end: globalToRef(index, endGlobal),
    count: endGlobal - startGlobal + 1,
  };
}

// ── plan creation / validation ────────────────────────────────────────

export function validateCreateParams(params: CreatePlanParams, today: string): PlanValidationError | null {
  if (params.mode === 'targetDate') {
    if (!params.targetDate) return { code: 'missing-field', message: 'লক্ষ্য তারিখ দিন' };
    if (daysBetween(today, params.targetDate) < 0) {
      return { code: 'target-date-not-future', message: 'লক্ষ্য তারিখ আজকের পরে হতে হবে' };
    }
  } else {
    if (params.durationDays == null || params.durationDays <= 0) {
      return { code: 'duration-not-positive', message: 'দিনের সংখ্যা ১ বা তার বেশি হতে হবে' };
    }
  }
  return null;
}

let planIdCounter = 0;
function newPlanId(): string {
  planIdCounter += 1;
  return `khatm-${Date.now()}-${planIdCounter}`;
}

export function createPlan(params: CreatePlanParams, today: string): KhatmPlan {
  const err = validateCreateParams(params, today);
  if (err) throw new Error(err.message);

  const targetDate =
    params.mode === 'targetDate'
      ? params.targetDate!
      : addDays(today, Math.max(0, (params.durationDays as number) - 1)); // durationDays=1 -> targetDate=today

  return {
    id: newPlanId(),
    createdAt: new Date().toISOString(),
    mode: params.mode,
    startDate: today,
    targetDate,
    scheduleStyle: params.scheduleStyle,
    status: 'active',
    completedAyahs: 0,
    history: [],
    rescheduleLog: [],
    dayAnchor: null,
  };
}

// ── daily target / pacing ─────────────────────────────────────────────

/** ceil(remaining / daysRemaining), clamped so a past-due target date
 *  reads as "everything remaining, today" rather than dividing by zero
 *  or a negative number. */
export function computeDailyTarget(index: QuranIndex, plan: KhatmPlan, today: string): number {
  const remaining = index.totalAyahs - plan.completedAyahs;
  if (remaining <= 0) return 0;
  const daysRemaining = Math.max(1, daysBetween(today, plan.targetDate) + 1);
  return Math.ceil(remaining / daysRemaining);
}

/** Returns the plan with a fresh DayAnchor for `today`, logging the
 *  previous anchor's actual reading into `history` first if the date
 *  rolled over. A no-op if the anchor already matches `today`. */
export function ensureDayAnchor(index: QuranIndex, plan: KhatmPlan, today: string): KhatmPlan {
  if (plan.dayAnchor && plan.dayAnchor.date === today) return plan;

  const history = [...plan.history];
  if (plan.dayAnchor) {
    const ayahsRead = plan.completedAyahs - plan.dayAnchor.startCompletedAyahs;
    history.push({ date: plan.dayAnchor.date, ayahsRead: Math.max(0, ayahsRead) });
  }

  const target = computeDailyTarget(index, plan, today);
  const dayAnchor: DayAnchor = {
    date: today,
    startCompletedAyahs: plan.completedAyahs,
    target,
    slotsCompleted: 0,
  };
  return { ...plan, history, dayAnchor };
}

function slotCount(scheduleStyle: ScheduleStyle): number {
  return scheduleStyle === 'fivePrayers' ? PRAYER_SLOTS.length : 1;
}

/** Splits `total` ayahs into `n` contiguous, non-overlapping, roughly
 *  equal shares that sum to exactly `total` (remainder distributed to
 *  the first shares, so no ayah is ever double-counted or dropped). */
function splitEvenly(total: number, n: number): number[] {
  if (total <= 0) return new Array(n).fill(0);
  const base = Math.floor(total / n);
  let remainder = total - base * n;
  const shares: number[] = [];
  for (let i = 0; i < n; i++) {
    const extra = remainder > 0 ? 1 : 0;
    shares.push(base + extra);
    if (remainder > 0) remainder--;
  }
  return shares;
}

/** Today's remaining portion (from the day's fixed target minus
 *  whatever slots are already marked done), as a single contiguous
 *  ayah range. Null once the whole plan — or today's target — is done. */
export function todaysPortion(index: QuranIndex, plan: KhatmPlan): AyahRange | null {
  if (!plan.dayAnchor) return null;
  if (plan.completedAyahs >= index.totalAyahs) return null;
  const dayEndTarget = Math.min(index.totalAyahs, plan.dayAnchor.startCompletedAyahs + plan.dayAnchor.target);
  if (plan.completedAyahs >= dayEndTarget) return null;
  return rangeFromGlobal(index, plan.completedAyahs + 1, dayEndTarget);
}

/** Splits today's *fixed* target (not the shrinking remainder) into
 *  prayer-slot ranges, for stable display regardless of how many slots
 *  are already completed. Each slot's own completion state is tracked
 *  by index (0-based) against plan.dayAnchor.slotsCompleted. */
export function slotRanges(index: QuranIndex, plan: KhatmPlan): AyahRange[] {
  if (!plan.dayAnchor || plan.dayAnchor.target <= 0) return [];
  const n = slotCount(plan.scheduleStyle);
  const shares = splitEvenly(plan.dayAnchor.target, n);
  const ranges: AyahRange[] = [];
  let cursor = plan.dayAnchor.startCompletedAyahs;
  for (const share of shares) {
    if (share <= 0) continue;
    const endGlobal = Math.min(index.totalAyahs, cursor + share);
    if (endGlobal <= cursor) continue;
    ranges.push(rangeFromGlobal(index, cursor + 1, endGlobal));
    cursor = endGlobal;
  }
  return ranges;
}

/** Marks prayer-slot `slotIdx` (0-based) complete: advances
 *  completedAyahs by that slot's ayah count and bumps slotsCompleted.
 *  A no-op if the slot is already completed or out of range, so a
 *  duplicate tap never double-counts. */
export function markSlotComplete(index: QuranIndex, plan: KhatmPlan, slotIdx: number): KhatmPlan {
  if (!plan.dayAnchor) return plan;
  const ranges = slotRanges(index, plan);
  if (slotIdx < 0 || slotIdx >= ranges.length) return plan;
  if (slotIdx < plan.dayAnchor.slotsCompleted) return plan; // already done

  const range = ranges[slotIdx];
  const nextCompleted = Math.min(index.totalAyahs, plan.completedAyahs + range.count);
  const nextPlan: KhatmPlan = {
    ...plan,
    completedAyahs: nextCompleted,
    dayAnchor: { ...plan.dayAnchor, slotsCompleted: Math.max(plan.dayAnchor.slotsCompleted, slotIdx + 1) },
  };
  return finalizeIfComplete(nextPlan, index);
}

/** Marks the rest of today's portion complete in one action. */
export function markTodayComplete(index: QuranIndex, plan: KhatmPlan): KhatmPlan {
  if (!plan.dayAnchor) return plan;
  const ranges = slotRanges(index, plan);
  let next = plan;
  for (let i = 0; i < ranges.length; i++) {
    next = markSlotComplete(index, next, i);
  }
  return next;
}

function finalizeIfComplete(plan: KhatmPlan, index: QuranIndex): KhatmPlan {
  if (plan.status === 'active' && plan.completedAyahs >= index.totalAyahs) {
    return { ...plan, status: 'completed', completedAt: new Date().toISOString() };
  }
  return plan;
}

// ── overdue / progress curve (display-only; never drives the actual
//    daily target, which is always the direct ceil(remaining/days)
//    formula above) ────────────────────────────────────────────────

function expectedCumulativeByEndOfDay(index: QuranIndex, plan: KhatmPlan, date: string): number {
  const totalPlanDays = Math.max(1, daysBetween(plan.startDate, plan.targetDate) + 1);
  const dayNumber = Math.max(1, daysBetween(plan.startDate, date) + 1);
  const clampedDay = Math.min(dayNumber, totalPlanDays);
  return Math.min(index.totalAyahs, Math.ceil((index.totalAyahs * clampedDay) / totalPlanDays));
}

/** How many ayahs behind the plan's own even pace the user is, as of
 *  the end of yesterday. 0 on the plan's first day (no "yesterday" yet
 *  within the plan) and 0 whenever actual progress is at or ahead of
 *  the expected curve. */
export function overdueAyahs(index: QuranIndex, plan: KhatmPlan, today: string): number {
  if (daysBetween(plan.startDate, today) <= 0) return 0;
  const yesterday = addDays(today, -1);
  const expected = expectedCumulativeByEndOfDay(index, plan, yesterday);
  return Math.max(0, expected - plan.completedAyahs);
}

// ── pause / resume / restart / reschedule ─────────────────────────────

export function pausePlan(plan: KhatmPlan, today: string): KhatmPlan {
  if (plan.status !== 'active') return plan;
  return { ...plan, status: 'paused', pausedAt: today };
}

/** Resuming shifts targetDate forward by exactly the number of days
 *  the plan was paused, so the pause isn't silently punished with an
 *  unrealistic catch-up spike. Logged in rescheduleLog, never touches
 *  completedAyahs or history. */
export function resumePlan(plan: KhatmPlan, today: string): KhatmPlan {
  if (plan.status !== 'paused' || !plan.pausedAt) return { ...plan, status: 'active' };
  const pausedDays = Math.max(0, daysBetween(plan.pausedAt, today));
  const previousTargetDate = plan.targetDate;
  const newTargetDate = addDays(plan.targetDate, pausedDays);
  return {
    ...plan,
    status: 'active',
    pausedAt: undefined,
    targetDate: newTargetDate,
    dayAnchor: null, // force a fresh anchor/target computation on next ensureDayAnchor
    rescheduleLog: [
      ...plan.rescheduleLog,
      { date: today, previousTargetDate, newTargetDate, reason: 'resumed-after-pause' as const },
    ],
  };
}

/** Changes the target date/duration/schedule style of the *current*
 *  plan without touching completedAyahs or history — this is the
 *  "adjust the remaining schedule" action, logged for transparency. */
export function reschedulePlan(
  plan: KhatmPlan,
  params: { mode: KhatmPlan['mode']; targetDate?: string; durationDays?: number; scheduleStyle?: ScheduleStyle },
  today: string,
  reason: RescheduleReason = 'user-adjusted',
): KhatmPlan {
  const err = validateCreateParams(
    { mode: params.mode, targetDate: params.targetDate, durationDays: params.durationDays, scheduleStyle: params.scheduleStyle ?? plan.scheduleStyle },
    today,
  );
  if (err) throw new Error(err.message);

  const newTargetDate =
    params.mode === 'targetDate' ? params.targetDate! : addDays(today, Math.max(0, (params.durationDays as number) - 1));

  return {
    ...plan,
    mode: params.mode,
    targetDate: newTargetDate,
    scheduleStyle: params.scheduleStyle ?? plan.scheduleStyle,
    dayAnchor: null, // recompute today's target against the new date
    rescheduleLog: [
      ...plan.rescheduleLog,
      { date: today, previousTargetDate: plan.targetDate, newTargetDate, reason },
    ],
  };
}

/** Resets progress to zero with a fresh start/target date, WITHOUT
 *  deleting the history log of the attempt being restarted (so past
 *  activity isn't silently erased — only the live progress pointer
 *  resets). Requires the caller to have already confirmed with the
 *  user; this function itself does not ask. */
export function restartPlan(plan: KhatmPlan, params: CreatePlanParams, today: string): KhatmPlan {
  const fresh = createPlan(params, today);
  return {
    ...fresh,
    id: plan.id, // keep the same plan identity; this is a restart, not a new plan
    history: [...plan.history, { date: today, ayahsRead: 0, event: 'restarted' as const }],
  };
}

// ── summary for display ───────────────────────────────────────────────

export interface KhatmSummary {
  completedAyahs: number;
  totalAyahs: number;
  remainingAyahs: number;
  percent: number; // 0..100
  dailyTarget: number;
  daysRemaining: number;
  overdueAyahs: number;
}

export function summarize(index: QuranIndex, plan: KhatmPlan, today: string): KhatmSummary {
  const remaining = index.totalAyahs - plan.completedAyahs;
  const daysRemaining = Math.max(1, daysBetween(today, plan.targetDate) + 1);
  return {
    completedAyahs: plan.completedAyahs,
    totalAyahs: index.totalAyahs,
    remainingAyahs: remaining,
    percent: index.totalAyahs > 0 ? Math.floor((plan.completedAyahs / index.totalAyahs) * 100) : 0,
    dailyTarget: computeDailyTarget(index, plan, today),
    daysRemaining,
    overdueAyahs: overdueAyahs(index, plan, today),
  };
}
