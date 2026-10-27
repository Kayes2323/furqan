import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildQuranIndex } from './quran-index.ts';
import type { SurahMeta } from './reader-types.ts';
import { buildProposal } from './journey-plan.ts';
import { applyProposal } from './journey-apply.ts';
import { suggestAdjustment, recentActivity, lightSessionAyahs } from './journey-adapt.ts';
import { createPlan, computeDailyTarget, ensureDayAnchor, addDays, reschedulePlan, resumePlan, pausePlan, summarize } from './khatm-plan.ts';
import type { KhatmPlan } from './khatm-types.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const META: SurahMeta[] = JSON.parse(readFileSync(join(__dirname, '..', '..', 'public', 'quran', 'meta.json'), 'utf-8'));
const INDEX = buildQuranIndex(META);
const START = '2026-10-01';

function setup(minutes = 30, targetDate = '2026-10-31') {
  const proposal = buildProposal({
    goal: 'khatm', sharedReading: false, pace: 'deadline', requestedDate: targetDate, dailyMinutes: minutes, lpm: 160,
    speedSource: 'user', slots: 'single', lightDays: [], khatmCompleted: 0, nazeraPosition: 0, today: START,
  }, INDEX);
  return applyProposal({ proposal, index: INDEX, today: START, existingKhatm: null, existingNazera: null, existingJourney: null });
}

/** A Khatm plan at `today` with the given per-day reading (undefined = no entry = not read). */
function withHistory(base: KhatmPlan, today: string, reads: Record<string, number>): KhatmPlan {
  const history = Object.entries(reads).map(([date, ayahsRead]) => ({ date, ayahsRead }));
  const completed = history.reduce((a, h) => a + h.ayahsRead, 0);
  return { ...base, completedAyahs: completed, history, dayAnchor: { date: today, startCompletedAyahs: completed, target: 0, slotsCompleted: 0 } };
}

test('too little data: no suggestion in the first days (we do not judge early)', () => {
  const { khatm, journey } = setup();
  const s = suggestAdjustment({ index: INDEX, khatm: withHistory(khatm!, '2026-10-03', {}), journey, today: '2026-10-03' });
  assert.equal(s, null);
});

test('on track: nothing is suggested', () => {
  const { khatm, journey } = setup();
  const t = journey.assumptions.khatmDailyAyahs!;
  const reads: Record<string, number> = {};
  for (let d = 1; d <= 9; d++) reads[addDays(START, d - 1)] = t;
  assert.equal(suggestAdjustment({ index: INDEX, khatm: withHistory(khatm!, '2026-10-10', reads), journey, today: '2026-10-10' }), null);
});

test('repeatedly missed: suggests a SMALLER session and a LATER date — never a bigger one', () => {
  const { khatm, journey } = setup();
  const reads = { '2026-10-01': 208, '2026-10-02': 100 }; // then nothing for 5+ days
  const s = suggestAdjustment({ index: INDEX, khatm: withHistory(khatm!, '2026-10-09', reads), journey, today: '2026-10-09' });
  assert.ok(s);
  assert.equal(s!.kind, 'lighten');
  assert.ok(s!.proposal.dailyMinutes < journey.dailyMinutes);
  assert.ok(s!.proposal.targetDate > khatm!.targetDate);
  assert.ok(!/ব্যর্থ|অলস|লজ্জা|গুনাহ|পাপ/.test(s!.title + s!.body), 'no guilt language');
});

test('suggestion is advisory: it never mutates the plan it was computed from', () => {
  const { khatm, journey } = setup();
  const plan = withHistory(khatm!, '2026-10-09', { '2026-10-01': 100 });
  const snapshot = JSON.stringify(plan);
  suggestAdjustment({ index: INDEX, khatm: plan, journey, today: '2026-10-09' });
  assert.equal(JSON.stringify(plan), snapshot);
});

test('well ahead for a week: only an OPTIONAL earlier date is offered', () => {
  const { khatm, journey } = setup(60, '2026-12-31');
  const planned = journey.assumptions.khatmDailyAyahs!;
  const reads: Record<string, number> = {};
  for (let d = 0; d < 7; d++) reads[addDays(START, d)] = Math.ceil(planned * 1.8);
  const s = suggestAdjustment({ index: INDEX, khatm: withHistory(khatm!, '2026-10-08', reads), journey, today: '2026-10-08' });
  assert.ok(s);
  assert.equal(s!.kind, 'raise');
  assert.ok(s!.proposal.targetDate < khatm!.targetDate);
  assert.match(s!.body, /ঐচ্ছিক/);
});

test('even-spread target no longer fits the time available → move the date, do not cram', () => {
  const { khatm, journey } = setup(20, '2026-10-31'); // an already-unrealistic deadline was auto-adjusted, force a tight plan:
  const tight = { ...khatm!, targetDate: '2026-10-12' }; // user (or engine) left a near date
  const reads: Record<string, number> = { '2026-10-01': 150, '2026-10-02': 150, '2026-10-03': 150, '2026-10-04': 150, '2026-10-05': 150 };
  const s = suggestAdjustment({ index: INDEX, khatm: withHistory(tight, '2026-10-09', reads), journey, today: '2026-10-09' });
  assert.ok(s);
  assert.ok(['ease-timeline', 'lighten'].includes(s!.kind));
  assert.ok(s!.proposal.targetDate > tight.targetDate);
});

test('paused plans and Nazera-only journeys get no suggestions', () => {
  const { khatm, journey } = setup();
  const paused = pausePlan(withHistory(khatm!, '2026-10-09', {}), '2026-10-09');
  assert.equal(suggestAdjustment({ index: INDEX, khatm: paused, journey, today: '2026-10-09' }), null);
  assert.equal(suggestAdjustment({ index: INDEX, khatm: withHistory(khatm!, '2026-10-09', {}), journey: { ...journey, goal: 'nazera' }, today: '2026-10-09' }), null);
  assert.equal(suggestAdjustment({ index: INDEX, khatm: null, journey, today: '2026-10-09' }), null);
});

test('recentActivity ignores days before the plan began and counts unlogged days as not read', () => {
  const { khatm } = setup();
  const act = recentActivity(withHistory(khatm!, '2026-10-05', { '2026-10-02': 50 }), '2026-10-05');
  assert.equal(act.daysCounted, 4); // Oct 1..4 only
  assert.equal(act.daysRead, 1);
  assert.equal(act.avgAyahsOnReadDays, 50);
});

// ── missed days never pile up as debt ────────────────────────────────

test('missing 5 days raises tomorrow’s target gently (even re-spread), not by 5 days of reading', () => {
  const plan = ensureDayAnchor(INDEX, createPlan({ mode: 'targetDate', targetDate: '2026-10-30', scheduleStyle: 'single' }, START), START);
  const originalDaily = computeDailyTarget(INDEX, plan, START); // 6236/30 → 208
  const dayAfterMiss = addDays(START, 5); // five whole days unread
  const nextTarget = computeDailyTarget(INDEX, plan, dayAfterMiss);
  assert.ok(nextTarget > originalDaily);
  assert.ok(nextTarget <= Math.ceil(originalDaily * 1.25), `${nextTarget} should stay within +25% of ${originalDaily}`);
  assert.ok(nextTarget < originalDaily * 2, 'nowhere near the next-day double (or 6×) catch-up');
  const sum = summarize(INDEX, plan, dayAfterMiss);
  assert.equal(sum.dailyTarget, nextTarget);
});

test('resuming after a pause shifts the date by the pause length — no catch-up spike', () => {
  const plan = ensureDayAnchor(INDEX, createPlan({ mode: 'targetDate', targetDate: '2026-10-30', scheduleStyle: 'single' }, START), START);
  const before = computeDailyTarget(INDEX, plan, START);
  const paused = pausePlan(plan, '2026-10-03');
  const resumed = resumePlan(paused, '2026-10-10');
  assert.equal(resumed.targetDate, addDays('2026-10-30', 7));
  const after = computeDailyTarget(INDEX, resumed, '2026-10-10');
  assert.ok(after <= Math.ceil(before * 1.1));
});

test('recalculating after a changed completion date re-spreads only what remains', () => {
  let plan = ensureDayAnchor(INDEX, createPlan({ mode: 'targetDate', targetDate: '2026-10-30', scheduleStyle: 'single' }, START), START);
  plan = { ...plan, completedAyahs: 1000 };
  const moved = reschedulePlan(plan, { mode: 'targetDate', targetDate: '2026-11-29' }, '2026-10-05');
  assert.equal(moved.completedAyahs, 1000);
  assert.equal(computeDailyTarget(INDEX, moved, '2026-10-05'), Math.ceil(5236 / 56));
});

test('light session is about five minutes of reading and always at least one ayah', () => {
  const n = lightSessionAyahs(INDEX, 0, 160);
  assert.ok(n >= 1 && n < 40);
  assert.equal(lightSessionAyahs(INDEX, 6235, 160), 1);
});
