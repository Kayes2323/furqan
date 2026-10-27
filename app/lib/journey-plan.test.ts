import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildQuranIndex } from './quran-index.ts';
import type { SurahMeta } from './reader-types.ts';
import { AYAH_LETTER_COUNTS } from './quran-ayah-weights.ts';
import {
  lettersInRange, estimateMinutes, ayahsForMinutes, evaluateKhatm, buildProposal, splitMinutes,
  completionDate, effectiveDaysBetween, weekdayOf, calibratedLpm, slotsToStyle, formatDateBn,
  DEFAULT_LPM, type PlanInputs,
} from './journey-plan.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const META: SurahMeta[] = JSON.parse(readFileSync(join(__dirname, '..', '..', 'public', 'quran', 'meta.json'), 'utf-8'));
const INDEX = buildQuranIndex(META);
const TODAY = '2026-10-27'; // a Tuesday

function inputs(over: Partial<PlanInputs> = {}): PlanInputs {
  return {
    goal: 'khatm', sharedReading: false, pace: 'sustainable', requestedDate: null,
    dailyMinutes: 30, lpm: 160, speedSource: 'user', slots: 'single', lightDays: [],
    khatmCompleted: 0, nazeraPosition: 0, today: TODAY, ...over,
  };
}

test('ayah letter weights cover exactly the 6236 canonical ayahs and match the dataset surah-by-surah', () => {
  assert.equal(AYAH_LETTER_COUNTS.length, INDEX.totalAyahs);
  // Recount from the real Tanzil files: the generated table must agree.
  const LETTER = /[ء-يٱ-ۓ]/g;
  let g = 0;
  for (let s = 1; s <= 114; s++) {
    const doc = JSON.parse(readFileSync(join(__dirname, '..', '..', 'public', 'quran', 'surah', `${String(s).padStart(3, '0')}.json`), 'utf-8'));
    for (const a of doc.ayahs) {
      assert.equal(AYAH_LETTER_COUNTS[g], (a.text.match(LETTER) ?? []).length, `${s}:${a.number}`);
      g++;
    }
  }
  assert.equal(g, 6236);
});

test('time estimate is weighted by real ayah length, not by ayah count', () => {
  // 2:282 (the longest ayah) vs 114:6 (the last, very short ayah)
  const longAyah = 7 + 282; // global index of 2:282
  assert.ok(AYAH_LETTER_COUNTS[longAyah - 1] > 400);
  assert.ok(estimateMinutes(longAyah, longAyah, 160) > 5 * estimateMinutes(6236, 6236, 160));
});

test('whole-Quran estimate is consistent with the dataset total', () => {
  assert.equal(lettersInRange(1, 6236), AYAH_LETTER_COUNTS.reduce((a, b) => a + b, 0));
  assert.equal(lettersInRange(5, 4), 0);
  assert.equal(lettersInRange(-5, 3), lettersInRange(1, 3)); // clamped, never throws
});

test('ayahsForMinutes: always at least one ayah, never exceeds the end of the Quran', () => {
  assert.equal(ayahsForMinutes(INDEX, 1, 0.01, 160), 1);
  assert.equal(ayahsForMinutes(INDEX, 6236, 60, 160), 1);
  assert.equal(ayahsForMinutes(INDEX, 6237, 60, 160), 0);
  const n = ayahsForMinutes(INDEX, 1, 20, 160);
  assert.ok(estimateMinutes(1, n, 160) <= 20 + 2);
});

test('light days count half; weekday helper is timezone-free', () => {
  assert.equal(weekdayOf('2026-10-27'), 2); // Tuesday
  assert.equal(effectiveDaysBetween('2026-10-27', '2026-11-02', []), 7);
  assert.equal(effectiveDaysBetween('2026-10-27', '2026-11-02', [5]), 6.5); // one Friday
  assert.equal(effectiveDaysBetween('2026-10-27', '2026-10-26', []), 0);
});

test('completionDate crosses month/year boundaries by plain calendar math', () => {
  assert.equal(completionDate(0, 10, '2026-12-30', []), '2026-12-30');
  assert.equal(completionDate(30, 10, '2026-12-30', []), '2027-01-01');
  assert.equal(completionDate(10, 0, TODAY, []), null);
  assert.equal(completionDate(1e9, 1, TODAY, []), null); // beyond 10 years
});

test('sustainable Khatm: date uses only 80% of the stated time and is a plan, not a promise', () => {
  const p = buildProposal(inputs({ dailyMinutes: 30 }), INDEX);
  assert.ok(p.khatm);
  const ev = p.khatm!.evaluation;
  assert.equal(ev.verdict, 'ok');
  assert.ok(ev.comfortableDate! > ev.fastestDate!);
  assert.equal(p.khatm!.targetDate, ev.comfortableDate);
  // daily ayahs reproduces the engine's formula: ceil(remaining / calendar days)
  const days = Math.round((Date.parse(p.khatm!.targetDate) - Date.parse(TODAY)) / 86400000) + 1;
  assert.equal(p.khatm!.dailyAyahs, Math.ceil(6236 / days));
  assert.ok(p.assumptions.some((a) => a.includes('আনুমানিক') || a.includes('অনুমান')));
});

test('feasible deadline is kept as requested', () => {
  const p = buildProposal(inputs({ pace: 'deadline', requestedDate: '2027-06-01', dailyMinutes: 45 }), INDEX);
  assert.equal(p.khatm!.evaluation.adjusted, false);
  assert.equal(p.khatm!.targetDate, '2027-06-01');
  assert.ok(['ok', 'tight'].includes(p.khatm!.evaluation.verdict));
});

test('unrealistic deadline is NOT promised: a realistic date is proposed and the reason explained', () => {
  const p = buildProposal(inputs({ pace: 'deadline', requestedDate: '2026-11-10', dailyMinutes: 20 }), INDEX);
  const ev = p.khatm!.evaluation;
  assert.equal(ev.verdict, 'unrealistic');
  assert.equal(ev.adjusted, true);
  assert.notEqual(p.khatm!.targetDate, '2026-11-10');
  assert.ok(p.khatm!.targetDate > '2026-11-10');
  assert.ok(p.warnings.length >= 1);
  assert.ok(ev.requiredMinutesPerDay! > 20);
  // the realistic date really fits the stated time
  const eff = effectiveDaysBetween(TODAY, p.khatm!.targetDate, []);
  assert.ok(ev.remainingMinutes / eff <= 20);
});

test('a past or same-day deadline can never be feasible with remaining work', () => {
  const p = buildProposal(inputs({ pace: 'deadline', requestedDate: TODAY, dailyMinutes: 60 }), INDEX);
  assert.equal(p.khatm!.evaluation.verdict, 'unrealistic');
});

test('tight (but possible) deadline warns without changing the date', () => {
  // find minutes where required is between 80% and 100% of capacity
  const base = evaluateKhatm({ index: INDEX, completedAyahs: 0, dailyMinutes: 60, lpm: 160, lightDays: [], today: TODAY, pace: 'deadline', requestedDate: '2027-01-01' });
  const req = base.requiredMinutesPerDay!;
  const minutes = Math.ceil(req / 0.9);
  const p = buildProposal(inputs({ pace: 'deadline', requestedDate: '2027-01-01', dailyMinutes: minutes }), INDEX);
  assert.equal(p.khatm!.evaluation.verdict, 'tight');
  assert.equal(p.khatm!.targetDate, '2027-01-01');
  assert.equal(p.warnings.length, 1);
});

test('existing progress shortens the plan; a finished Khatm needs no plan', () => {
  const fresh = buildProposal(inputs(), INDEX).khatm!;
  const half = buildProposal(inputs({ khatmCompleted: 3100 }), INDEX).khatm!;
  assert.ok(half.targetDate < fresh.targetDate);
  const done = buildProposal(inputs({ khatmCompleted: 6236 }), INDEX).khatm!;
  assert.equal(done.evaluation.verdict, 'done');
  assert.equal(done.dailyAyahs, 0);
});

test('Nazera-only plan: no Khatm, daily ayahs fit ~80% of the time, starts where chosen', () => {
  const p = buildProposal(inputs({ goal: 'nazera', dailyMinutes: 20, nazeraPosition: 100 }), INDEX);
  assert.equal(p.khatm, null);
  assert.ok(p.nazera);
  assert.equal(p.nazera!.startPosition, 100);
  assert.ok(p.nazera!.dailyAyahs >= 1);
  assert.ok(p.nazera!.dailyMinutes <= 20);
});

test('both goals, SEPARATE sessions: time is split, targets are independent', () => {
  const sep = buildProposal(inputs({ goal: 'both', sharedReading: false, dailyMinutes: 30, nazeraPosition: 500 }), INDEX);
  const { khatm, nazera } = splitMinutes(30);
  assert.equal(khatm + nazera, 30);
  assert.equal(sep.khatm!.minutesBudget, khatm);
  assert.equal(sep.nazera!.minutesBudget, nazera);
  assert.equal(sep.nazera!.startPosition, 500);
  assert.ok(sep.nazera!.dailyMinutes <= nazera);
});

test('both goals, SHARED reading: one stream — Nazera mirrors Khatm and the target is NOT doubled', () => {
  const shared = buildProposal(inputs({ goal: 'both', sharedReading: true, dailyMinutes: 30, khatmCompleted: 250 }), INDEX);
  const khatmOnly = buildProposal(inputs({ goal: 'khatm', dailyMinutes: 30, khatmCompleted: 250 }), INDEX);
  assert.equal(shared.khatm!.dailyAyahs, khatmOnly.khatm!.dailyAyahs);
  assert.equal(shared.khatm!.targetDate, khatmOnly.khatm!.targetDate);
  assert.equal(shared.nazera!.dailyAyahs, shared.khatm!.dailyAyahs);
  assert.equal(shared.nazera!.startPosition, 250);
  // time budget is the user's whole daily time, not split or doubled
  assert.equal(shared.khatm!.minutesBudget, 30);
});

test('light days push the estimated finish later than the same plan without them', () => {
  const none = buildProposal(inputs({ lightDays: [] }), INDEX).khatm!;
  const some = buildProposal(inputs({ lightDays: [5, 6] }), INDEX).khatm!;
  assert.ok(some.targetDate > none.targetDate);
});

test('slot presets map to engine schedule styles; full set collapses to five prayers', () => {
  assert.deepEqual(slotsToStyle('single'), { scheduleStyle: 'single' });
  assert.deepEqual(slotsToStyle(['isha', 'fajr']), { scheduleStyle: 'fivePrayers', prayerSlots: ['fajr', 'isha'] });
  assert.deepEqual(slotsToStyle(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']), { scheduleStyle: 'fivePrayers' });
});

test('calibration uses the median of plausible samples and needs at least 3', () => {
  assert.equal(calibratedLpm([{ letters: 500, minutes: 5 }, { letters: 500, minutes: 5 }]), null);
  const v = calibratedLpm([
    { letters: 500, minutes: 5 }, { letters: 800, minutes: 5 }, { letters: 600, minutes: 5 }, { letters: 100, minutes: 100 },
  ]);
  assert.equal(v, 120); // plausible rates 100, 120, 160 (the 1 letter/min outlier is dropped) -> median 120
});

test('dates format without timezone drift', () => {
  assert.equal(formatDateBn('2026-12-31'), '31 ডিসেম্বর 2026');
  assert.equal(formatDateBn('2027-01-01'), '1 জানুয়ারি 2027');
  assert.ok(DEFAULT_LPM < 160); // default is deliberately on the modest side
});
