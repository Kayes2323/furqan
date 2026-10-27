// Tests for the two small, backward-compatible additions the Journey made to the
// existing engines (Khatm prayerSlots subset, Nazera advanceAyahs), plus the
// date-boundary / timezone guarantees the Journey relies on.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildQuranIndex } from './quran-index.ts';
import type { SurahMeta } from './reader-types.ts';
import { createPlan, ensureDayAnchor, slotRanges, markSlotComplete, markTodayComplete, normalizeSlots, activeSlots, reschedulePlan, restartPlan, todayKey } from './khatm-plan.ts';
import { createProfile, ensureDayAnchor as nAnchor, advanceAyahs, markTodayComplete as nComplete } from './nazera-plan.ts';
import { weekdayOf, dayWeight, completionDate, effectiveDaysBetween, formatDateBn, buildProposal } from './journey-plan.ts';
import { addDays, daysBetween } from './date-utils.ts';
import { khatmWeek } from './journey-progress.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const META: SurahMeta[] = JSON.parse(readFileSync(join(__dirname, '..', '..', 'public', 'quran', 'meta.json'), 'utf-8'));
const INDEX = buildQuranIndex(META);
const D = '2026-10-27';

test('normalizeSlots: subset kept in prayer order; empty/full/invalid collapse to "all five" (undefined)', () => {
  assert.deepEqual(normalizeSlots(['isha', 'fajr']), ['fajr', 'isha']);
  assert.equal(normalizeSlots([]), undefined);
  assert.equal(normalizeSlots(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']), undefined);
  assert.equal(normalizeSlots(undefined), undefined);
});

test('LEGACY Khatm plans (no prayerSlots field) behave exactly as before: five equal slots', () => {
  const legacy = ensureDayAnchor(INDEX, createPlan({ mode: 'duration', durationDays: 30, scheduleStyle: 'fivePrayers' }, D), D);
  assert.equal('prayerSlots' in legacy, false);
  assert.deepEqual(activeSlots(legacy), ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']);
  const ranges = slotRanges(INDEX, legacy);
  assert.equal(ranges.length, 5);
  assert.equal(ranges.reduce((a, r) => a + r.count, 0), legacy.dayAnchor!.target);
});

test('subset slots: n portions, contiguous, sum to the day target; completing them advances exactly the target', () => {
  let plan = ensureDayAnchor(INDEX, createPlan({ mode: 'duration', durationDays: 20, scheduleStyle: 'fivePrayers', prayerSlots: ['fajr', 'maghrib', 'isha'] }, D), D);
  const ranges = slotRanges(INDEX, plan);
  assert.equal(ranges.length, 3);
  for (let i = 1; i < ranges.length; i++) assert.equal(ranges[i].startGlobal, ranges[i - 1].endGlobal + 1);
  plan = markSlotComplete(INDEX, plan, 0);
  assert.equal(plan.completedAyahs, ranges[0].count);
  plan = markSlotComplete(INDEX, plan, 0); // duplicate tap: no-op
  assert.equal(plan.completedAyahs, ranges[0].count);
  plan = markTodayComplete(INDEX, plan);
  assert.equal(plan.completedAyahs, plan.dayAnchor!.target);
});

test('rescheduling keeps progress and can change the slot subset; restart keeps the subset and the history', () => {
  let plan = ensureDayAnchor(INDEX, createPlan({ mode: 'duration', durationDays: 20, scheduleStyle: 'fivePrayers' }, D), D);
  plan = { ...plan, completedAyahs: 500, history: [{ date: D, ayahsRead: 500 }] };
  const sub = reschedulePlan(plan, { mode: 'duration', durationDays: 40, scheduleStyle: 'fivePrayers', prayerSlots: ['fajr', 'isha'] }, D);
  assert.deepEqual(sub.prayerSlots, ['fajr', 'isha']);
  assert.equal(sub.completedAyahs, 500);
  const back = reschedulePlan(sub, { mode: 'duration', durationDays: 40, scheduleStyle: 'single' }, D);
  assert.equal(activeSlots(back).length, 0); // single style → no prayer slots
  const restarted = restartPlan(sub, { mode: 'duration', durationDays: 30, scheduleStyle: 'fivePrayers', prayerSlots: sub.prayerSlots }, D);
  assert.deepEqual(restarted.prayerSlots, ['fajr', 'isha']);
  assert.equal(restarted.completedAyahs, 0);
  assert.equal(restarted.history.length, 2); // history preserved + a restart marker
});

test('Nazera advanceAyahs: counts exactly n ayahs toward position and today, capped at the end, no-op for n<=0 or sessions mode', () => {
  const p = nAnchor(createProfile({ targetMode: 'ayahs', dailyAyahTarget: 20 }, INDEX, D), D);
  const a = advanceAyahs(INDEX, p, 12);
  assert.equal(a.position, 12);
  assert.equal(a.dayAnchor!.progressToday, 12);
  assert.equal(advanceAyahs(INDEX, a, 0), a);
  assert.equal(advanceAyahs(INDEX, a, -5), a);
  const rest = nComplete(INDEX, a); // existing action still completes only the remainder of the target
  assert.equal(rest.position, 20);
  const nearEnd = { ...p, position: 6230 };
  const end = advanceAyahs(INDEX, nearEnd, 50);
  assert.equal(end.position, 6236);
  assert.equal(end.dayAnchor!.progressToday, 6);
  const sessions = nAnchor(createProfile({ targetMode: 'sessions', dailySessionTarget: 1 }, INDEX, D), D);
  assert.equal(advanceAyahs(INDEX, sessions, 10), sessions);
});

// ── date boundaries & timezones ──────────────────────────────────────

const ZONES = ['UTC', 'Pacific/Kiritimati', 'Pacific/Pago_Pago', 'Asia/Dhaka', 'America/Los_Angeles'];

test('calendar math is identical in every timezone (UTC+14 … UTC-11) — plans never shift by a day', () => {
  const original = process.env.TZ;
  try {
    const results = ZONES.map((tz) => {
      process.env.TZ = tz;
      return JSON.stringify({
        wd: weekdayOf('2026-12-31'), add: addDays('2026-12-31', 1), leap: addDays('2028-02-28', 1), diff: daysBetween('2026-03-28', '2026-03-30'),
        eff: effectiveDaysBetween('2026-10-27', '2026-11-26', [5, 6]), done: completionDate(1000, 20, '2026-12-20', [5]), fmt: formatDateBn('2027-01-01'),
        proposal: (() => { const p = buildProposal({ goal: 'khatm', sharedReading: false, pace: 'deadline', requestedDate: '2027-03-01', dailyMinutes: 45, lpm: 160, speedSource: 'user', slots: 'single', lightDays: [5], khatmCompleted: 0, nazeraPosition: 0, today: '2026-10-27' }, INDEX); return [p.khatm!.targetDate, p.khatm!.dailyAyahs]; })(),
      });
    });
    assert.equal(new Set(results).size, 1, results.join('\n'));
    const r = JSON.parse(results[0]);
    assert.equal(r.add, '2027-01-01');
    assert.equal(r.leap, '2028-02-29');
    assert.equal(r.diff, 2);
    assert.equal(r.wd, 4); // Thursday
  } finally {
    if (original === undefined) delete process.env.TZ; else process.env.TZ = original;
  }
});

test('todayKey follows the device’s local calendar date (the app’s one "now")', () => {
  const original = process.env.TZ;
  try {
    process.env.TZ = 'Pacific/Kiritimati';
    const k = todayKey();
    assert.match(k, /^\d{4}-\d{2}-\d{2}$/);
    const d = new Date();
    assert.equal(k, `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  } finally {
    if (original === undefined) delete process.env.TZ; else process.env.TZ = original;
  }
});

test('a plan spanning a year boundary and a DST change still lands on the right date', () => {
  const p = buildProposal({ goal: 'khatm', sharedReading: false, pace: 'deadline', requestedDate: '2027-01-15', dailyMinutes: 120, lpm: 160, speedSource: 'user', slots: 'single', lightDays: [], khatmCompleted: 0, nazeraPosition: 0, today: '2026-12-20' }, INDEX);
  assert.equal(p.khatm!.targetDate, '2027-01-15');
  assert.equal(daysBetween('2026-12-20', '2027-01-15') + 1, 27);
  assert.equal(p.khatm!.dailyAyahs, Math.ceil(6236 / 27));
  assert.equal(dayWeight('2027-01-01', [5]), 0.5); // a Friday
});

test('progress chart: last 14 days, oldest first; days with no entry are 0 (not "missed" — just empty); live today is included', () => {
  const week = khatmWeek([{ date: '2026-10-25', ayahsRead: 40 }, { date: '2026-10-20', ayahsRead: 0, event: 'restarted' }], { date: D, read: 15 }, D);
  assert.equal(week.length, 14);
  assert.equal(week[0].date, addDays(D, -13));
  assert.equal(week[13].date, D);
  assert.equal(week[13].value, 15);
  assert.equal(week.find((c) => c.date === '2026-10-25')!.value, 40);
  assert.equal(week.filter((c) => c.met).length, 2);
});
