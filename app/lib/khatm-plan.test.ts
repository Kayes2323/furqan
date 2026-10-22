import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildQuranIndex,
  globalToRef,
  refToGlobal,
  computeDailyTarget,
  ensureDayAnchor,
  todaysPortion,
  slotRanges,
  markSlotComplete,
  markTodayComplete,
  createPlan,
  validateCreateParams,
  pausePlan,
  resumePlan,
  reschedulePlan,
  restartPlan,
  overdueAyahs,
  daysBetween,
  addDays,
  summarize,
} from './khatm-plan.ts';
import type { SurahMeta } from './reader-types.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const META: SurahMeta[] = JSON.parse(readFileSync(join(__dirname, '..', '..', 'public', 'quran', 'meta.json'), 'utf-8'));
const INDEX = buildQuranIndex(META);

// ── Quran index: built from the real, shipped dataset ─────────────────

test('buildQuranIndex totals exactly 6236 ayahs from the real meta.json', () => {
  assert.equal(INDEX.totalAyahs, 6236);
  assert.equal(INDEX.surahCount, 114);
});

test('globalToRef/refToGlobal: first ayah of the Quran is 1:1, last is 114:6', () => {
  assert.deepEqual(globalToRef(INDEX, 1), { surah: 1, ayah: 1 });
  assert.deepEqual(globalToRef(INDEX, INDEX.totalAyahs), { surah: 114, ayah: 6 });
  assert.equal(refToGlobal(INDEX, { surah: 1, ayah: 1 }), 1);
  assert.equal(refToGlobal(INDEX, { surah: 114, ayah: 6 }), INDEX.totalAyahs);
});

test('globalToRef/refToGlobal round-trip for every surah boundary (first and last ayah of all 114 surahs)', () => {
  for (const s of META) {
    const firstGlobal = refToGlobal(INDEX, { surah: s.number, ayah: 1 });
    const lastGlobal = refToGlobal(INDEX, { surah: s.number, ayah: s.ayahCount });
    assert.deepEqual(globalToRef(INDEX, firstGlobal), { surah: s.number, ayah: 1 });
    assert.deepEqual(globalToRef(INDEX, lastGlobal), { surah: s.number, ayah: s.ayahCount });
    assert.equal(lastGlobal - firstGlobal + 1, s.ayahCount);
  }
});

test('the Quran index has no gaps or duplicates: walking every global index 1..6236 sequentially never skips or repeats a surah:ayah', () => {
  let prevSurah = 0;
  let prevAyah = 0;
  for (let g = 1; g <= INDEX.totalAyahs; g++) {
    const ref = globalToRef(INDEX, g);
    if (g === 1) {
      assert.deepEqual(ref, { surah: 1, ayah: 1 });
    } else if (ref.surah === prevSurah) {
      assert.equal(ref.ayah, prevAyah + 1, `surah ${ref.surah}: ayah ${ref.ayah} does not follow ${prevAyah}`);
    } else {
      assert.equal(ref.surah, prevSurah + 1, `expected surah ${prevSurah + 1} after surah ${prevSurah}, got ${ref.surah}`);
      assert.equal(ref.ayah, 1, `first ayah of surah ${ref.surah} should be 1, got ${ref.ayah}`);
    }
    prevSurah = ref.surah;
    prevAyah = ref.ayah;
  }
  assert.deepEqual({ surah: prevSurah, ayah: prevAyah }, { surah: 114, ayah: 6 });
});

test('globalToRef rejects out-of-range indices instead of silently clamping', () => {
  assert.throws(() => globalToRef(INDEX, 0));
  assert.throws(() => globalToRef(INDEX, INDEX.totalAyahs + 1));
});

// ── plan creation / validation ─────────────────────────────────────────

test('validateCreateParams rejects a target date that is not in the future', () => {
  const today = '2026-01-10';
  assert.ok(validateCreateParams({ mode: 'targetDate', targetDate: '2026-01-09', scheduleStyle: 'single' }, today));
  assert.equal(validateCreateParams({ mode: 'targetDate', targetDate: '2026-01-10', scheduleStyle: 'single' }, today), null); // today itself is allowed ("finish today")
  assert.equal(validateCreateParams({ mode: 'targetDate', targetDate: '2026-02-10', scheduleStyle: 'single' }, today), null);
});

test('validateCreateParams rejects a zero or negative duration', () => {
  const today = '2026-01-10';
  assert.ok(validateCreateParams({ mode: 'duration', durationDays: 0, scheduleStyle: 'single' }, today));
  assert.ok(validateCreateParams({ mode: 'duration', durationDays: -5, scheduleStyle: 'single' }, today));
  assert.equal(validateCreateParams({ mode: 'duration', durationDays: 1, scheduleStyle: 'single' }, today), null);
});

test('createPlan in duration mode resolves to a concrete targetDate (1 day -> targetDate === startDate)', () => {
  const today = '2026-01-10';
  const plan = createPlan({ mode: 'duration', durationDays: 1, scheduleStyle: 'single' }, today);
  assert.equal(plan.startDate, today);
  assert.equal(plan.targetDate, today);
  assert.equal(plan.status, 'active');
  assert.equal(plan.completedAyahs, 0);
});

test('createPlan in duration mode: a 30-day plan targets startDate+29', () => {
  const today = '2026-01-01';
  const plan = createPlan({ mode: 'duration', durationDays: 30, scheduleStyle: 'fivePrayers' }, today);
  assert.equal(daysBetween(plan.startDate, plan.targetDate) + 1, 30);
});

// ── daily target math ───────────────────────────────────────────────────

test('computeDailyTarget: short plan (7 days) divides the whole Quran with ceil rounding', () => {
  const today = '2026-01-01';
  const plan = createPlan({ mode: 'duration', durationDays: 7, scheduleStyle: 'single' }, today);
  const target = computeDailyTarget(INDEX, plan, today);
  assert.equal(target, Math.ceil(INDEX.totalAyahs / 7));
});

test('computeDailyTarget: long plan (365 days) gives a small, sensible daily number', () => {
  const today = '2026-01-01';
  const plan = createPlan({ mode: 'duration', durationDays: 365, scheduleStyle: 'single' }, today);
  const target = computeDailyTarget(INDEX, plan, today);
  assert.equal(target, Math.ceil(INDEX.totalAyahs / 365));
  assert.ok(target > 0 && target < 50);
});

test('computeDailyTarget recalculates from whatever remains: completing a day shrinks the next day\'s target', () => {
  const today = '2026-01-01';
  let plan = createPlan({ mode: 'duration', durationDays: 10, scheduleStyle: 'single' }, today);
  const day1Target = computeDailyTarget(INDEX, plan, today);
  plan = ensureDayAnchor(INDEX, plan, today);
  plan = markTodayComplete(INDEX, plan);
  assert.equal(plan.completedAyahs, day1Target);

  const tomorrow = addDays(today, 1);
  const day2Target = computeDailyTarget(INDEX, plan, tomorrow);
  // 9 days left to cover 1 fewer day's worth of ayahs -> should not be larger than day1's pace
  assert.ok(day2Target <= day1Target);
});

test('computeDailyTarget on a past-due target date reads as "everything remaining", not a crash or negative number', () => {
  const start = '2026-01-01';
  const plan = createPlan({ mode: 'targetDate', targetDate: start, scheduleStyle: 'single' }, start);
  const wayLater = addDays(start, 30);
  const target = computeDailyTarget(INDEX, plan, wayLater);
  assert.equal(target, INDEX.totalAyahs); // nothing completed yet, days remaining clamped to 1
  assert.ok(Number.isFinite(target) && target >= 0);
});

test('computeDailyTarget is 0 once the plan is fully complete', () => {
  const today = '2026-01-01';
  let plan = createPlan({ mode: 'duration', durationDays: 10, scheduleStyle: 'single' }, today);
  plan = { ...plan, completedAyahs: INDEX.totalAyahs };
  assert.equal(computeDailyTarget(INDEX, plan, today), 0);
});

// ── dividing the Quran across days: no gaps, no duplicates, no overflow ──

test('walking a short plan day by day covers the Quran exactly once, in order, ending precisely at 114:6', () => {
  const start = '2026-01-01';
  let plan = createPlan({ mode: 'duration', durationDays: 5, scheduleStyle: 'single' }, start);
  const seenRanges: { startGlobal: number; endGlobal: number }[] = [];
  let date = start;

  for (let day = 0; day < 5; day++) {
    plan = ensureDayAnchor(INDEX, plan, date);
    const portion = todaysPortion(INDEX, plan);
    if (portion) seenRanges.push({ startGlobal: portion.startGlobal, endGlobal: portion.endGlobal });
    plan = markTodayComplete(INDEX, plan);
    date = addDays(date, 1);
  }

  // contiguous, no gaps or overlaps between consecutive days' ranges
  for (let i = 1; i < seenRanges.length; i++) {
    assert.equal(seenRanges[i].startGlobal, seenRanges[i - 1].endGlobal + 1, `gap/overlap between day ${i - 1} and day ${i}`);
  }
  assert.equal(seenRanges[0].startGlobal, 1);
  assert.equal(seenRanges[seenRanges.length - 1].endGlobal, INDEX.totalAyahs);
  assert.equal(plan.completedAyahs, INDEX.totalAyahs);
  assert.equal(plan.status, 'completed');
  assert.ok(plan.completedAt);
});

test('completedAyahs never exceeds totalAyahs even if marked complete repeatedly past the end', () => {
  const start = '2026-01-01';
  let plan = createPlan({ mode: 'duration', durationDays: 1, scheduleStyle: 'single' }, start);
  plan = ensureDayAnchor(INDEX, plan, start);
  plan = markTodayComplete(INDEX, plan);
  assert.equal(plan.completedAyahs, INDEX.totalAyahs);
  // marking again (e.g. a duplicate tap/event) must not overflow
  plan = markTodayComplete(INDEX, plan);
  assert.equal(plan.completedAyahs, INDEX.totalAyahs);
});

// ── prayer-slot division ────────────────────────────────────────────────

test('fivePrayers schedule splits today\'s target into exactly 5 contiguous slots summing to the day\'s target', () => {
  const today = '2026-01-01';
  let plan = createPlan({ mode: 'duration', durationDays: 10, scheduleStyle: 'fivePrayers' }, today);
  plan = ensureDayAnchor(INDEX, plan, today);
  const ranges = slotRanges(INDEX, plan);
  assert.equal(ranges.length, 5);
  const sum = ranges.reduce((acc, r) => acc + r.count, 0);
  assert.equal(sum, plan.dayAnchor!.target);
  for (let i = 1; i < ranges.length; i++) {
    assert.equal(ranges[i].startGlobal, ranges[i - 1].endGlobal + 1);
  }
});

test('markSlotComplete advances completedAyahs by exactly that slot\'s count and is idempotent on repeat taps', () => {
  const today = '2026-01-01';
  let plan = createPlan({ mode: 'duration', durationDays: 10, scheduleStyle: 'fivePrayers' }, today);
  plan = ensureDayAnchor(INDEX, plan, today);
  const ranges = slotRanges(INDEX, plan);

  const before = plan.completedAyahs;
  plan = markSlotComplete(INDEX, plan, 0);
  assert.equal(plan.completedAyahs, before + ranges[0].count);
  assert.equal(plan.dayAnchor!.slotsCompleted, 1);

  // tapping the same (now-completed) slot again must not double-count
  const afterFirst = plan.completedAyahs;
  plan = markSlotComplete(INDEX, plan, 0);
  assert.equal(plan.completedAyahs, afterFirst);
  assert.equal(plan.dayAnchor!.slotsCompleted, 1);
});

test('single schedule style has exactly one slot covering the whole day\'s target', () => {
  const today = '2026-01-01';
  let plan = createPlan({ mode: 'duration', durationDays: 10, scheduleStyle: 'single' }, today);
  plan = ensureDayAnchor(INDEX, plan, today);
  const ranges = slotRanges(INDEX, plan);
  assert.equal(ranges.length, 1);
  assert.equal(ranges[0].count, plan.dayAnchor!.target);
});

// ── missed days, overdue, and rescheduling ──────────────────────────────

test('missing days raises the daily target to catch up, without altering history already logged', () => {
  const start = '2026-01-01';
  let plan = createPlan({ mode: 'duration', durationDays: 10, scheduleStyle: 'single' }, start);
  plan = ensureDayAnchor(INDEX, plan, start);
  const day1Target = plan.dayAnchor!.target;
  // user does nothing for 3 days (does not mark anything complete)
  const day4 = addDays(start, 3);
  plan = ensureDayAnchor(INDEX, plan, day4);
  const day4Target = plan.dayAnchor!.target;
  assert.ok(day4Target > day1Target, 'missing 3 days should raise the catch-up target');
  // the skipped days were logged with 0 ayahsRead, not silently dropped
  assert.equal(plan.history.length, 1); // only day1's anchor rolled over once (ensureDayAnchor collapses the gap into one new anchor)
  assert.equal(plan.history[0].date, start);
  assert.equal(plan.history[0].ayahsRead, 0);
});

test('overdueAyahs is 0 on the plan\'s first day and 0 while on pace, positive once behind', () => {
  const start = '2026-01-01';
  let plan = createPlan({ mode: 'duration', durationDays: 10, scheduleStyle: 'single' }, start);
  assert.equal(overdueAyahs(INDEX, plan, start), 0);

  // behind: no progress logged, several days have passed
  const laterDate = addDays(start, 5);
  assert.ok(overdueAyahs(INDEX, plan, laterDate) > 0);

  // on pace: completedAyahs matches (or exceeds) the expected curve
  plan = { ...plan, completedAyahs: INDEX.totalAyahs }; // fully done
  assert.equal(overdueAyahs(INDEX, plan, laterDate), 0);
});

test('reschedulePlan changes the target date without touching completedAyahs, and logs the change', () => {
  const start = '2026-01-01';
  let plan = createPlan({ mode: 'duration', durationDays: 30, scheduleStyle: 'single' }, start);
  plan = ensureDayAnchor(INDEX, plan, start);
  plan = markSlotComplete(INDEX, plan, 0);
  const completedBefore = plan.completedAyahs;

  const newTarget = addDays(start, 59);
  plan = reschedulePlan(plan, { mode: 'targetDate', targetDate: newTarget }, start);

  assert.equal(plan.targetDate, newTarget);
  assert.equal(plan.completedAyahs, completedBefore); // never erased
  assert.equal(plan.rescheduleLog.length, 1);
  assert.equal(plan.rescheduleLog[0].reason, 'user-adjusted');
  assert.equal(plan.dayAnchor, null); // forces a fresh target computation against the new date
});

test('reschedulePlan rejects an invalid new target date', () => {
  const start = '2026-01-01';
  const plan = createPlan({ mode: 'duration', durationDays: 30, scheduleStyle: 'single' }, start);
  assert.throws(() => reschedulePlan(plan, { mode: 'targetDate', targetDate: addDays(start, -1) }, start));
});

// ── pause / resume ──────────────────────────────────────────────────────

test('pausing and resuming shifts targetDate forward by exactly the paused duration, preserving progress', () => {
  const start = '2026-01-01';
  let plan = createPlan({ mode: 'duration', durationDays: 30, scheduleStyle: 'single' }, start);
  plan = ensureDayAnchor(INDEX, plan, start);
  plan = markSlotComplete(INDEX, plan, 0);
  const completedBefore = plan.completedAyahs;
  const targetBefore = plan.targetDate;

  const pauseDate = addDays(start, 2);
  plan = pausePlan(plan, pauseDate);
  assert.equal(plan.status, 'paused');

  const resumeDate = addDays(pauseDate, 5); // paused for 5 days
  plan = resumePlan(plan, resumeDate);
  assert.equal(plan.status, 'active');
  assert.equal(plan.completedAyahs, completedBefore);
  assert.equal(daysBetween(targetBefore, plan.targetDate), 5);
  assert.equal(plan.rescheduleLog[plan.rescheduleLog.length - 1].reason, 'resumed-after-pause');
});

test('resuming a plan that was never paused is a harmless no-op status change', () => {
  const start = '2026-01-01';
  const plan = createPlan({ mode: 'duration', durationDays: 30, scheduleStyle: 'single' }, start);
  const resumed = resumePlan(plan, start);
  assert.equal(resumed.status, 'active');
  assert.equal(resumed.targetDate, plan.targetDate);
});

// ── restart ──────────────────────────────────────────────────────────────

test('restartPlan resets progress to zero but keeps the prior history log and plan id', () => {
  const start = '2026-01-01';
  let plan = createPlan({ mode: 'duration', durationDays: 30, scheduleStyle: 'single' }, start);
  plan = ensureDayAnchor(INDEX, plan, start);
  plan = markSlotComplete(INDEX, plan, 0);
  const oldId = plan.id;
  const priorHistoryLength = plan.history.length;

  const restartDate = addDays(start, 10);
  const restarted = restartPlan(plan, { mode: 'duration', durationDays: 90, scheduleStyle: 'fivePrayers' }, restartDate);

  assert.equal(restarted.id, oldId);
  assert.equal(restarted.completedAyahs, 0);
  assert.equal(restarted.startDate, restartDate);
  assert.equal(restarted.status, 'active');
  assert.ok(restarted.history.length > priorHistoryLength); // old history preserved, not erased
  assert.equal(restarted.history[restarted.history.length - 1].event, 'restarted');
});

// ── summary ──────────────────────────────────────────────────────────────

test('summarize reports consistent completed+remaining=total and a sane percent', () => {
  const start = '2026-01-01';
  let plan = createPlan({ mode: 'duration', durationDays: 60, scheduleStyle: 'single' }, start);
  plan = ensureDayAnchor(INDEX, plan, start);
  plan = markTodayComplete(INDEX, plan);
  const summary = summarize(INDEX, plan, start);
  assert.equal(summary.completedAyahs + summary.remainingAyahs, summary.totalAyahs);
  assert.ok(summary.percent >= 0 && summary.percent <= 100);
  assert.equal(summary.totalAyahs, INDEX.totalAyahs);
});

// ── links to the Reader: the ref this module hands to navigation must
//    be a real, valid surah:ayah the Reader can open ─────────────────────

test('every ayah reference produced by todaysPortion across a full walk-through is a valid, in-range surah:ayah', () => {
  const start = '2026-01-01';
  let plan = createPlan({ mode: 'duration', durationDays: 20, scheduleStyle: 'fivePrayers' }, start);
  let date = start;
  const metaByNumber = new Map(META.map((s) => [s.number, s]));

  for (let day = 0; day < 20; day++) {
    plan = ensureDayAnchor(INDEX, plan, date);
    const portion = todaysPortion(INDEX, plan);
    if (portion) {
      for (const ref of [portion.start, portion.end]) {
        const surahMeta = metaByNumber.get(ref.surah);
        assert.ok(surahMeta, `surah ${ref.surah} does not exist in the dataset`);
        assert.ok(ref.ayah >= 1 && ref.ayah <= surahMeta!.ayahCount, `surah ${ref.surah} ayah ${ref.ayah} out of range (max ${surahMeta!.ayahCount})`);
      }
    }
    plan = markTodayComplete(INDEX, plan);
    date = addDays(date, 1);
  }
});
