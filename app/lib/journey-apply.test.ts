import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildQuranIndex } from './quran-index.ts';
import type { SurahMeta } from './reader-types.ts';
import { buildProposal, type PlanInputs } from './journey-plan.ts';
import { applyProposal, completeSharedToday, mirrorKhatmAdvance, pointersAligned, syncSharedNazera, logSession } from './journey-apply.ts';
import { createPlan, ensureDayAnchor as khatmAnchor, markTodayComplete, pausePlan, computeDailyTarget } from './khatm-plan.ts';
import { createProfile, ensureDayAnchor as nazeraAnchor, markTodayComplete as nazeraComplete } from './nazera-plan.ts';
import { todayItems, startPoint, isShared, overallStatus } from './journey-today.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const META: SurahMeta[] = JSON.parse(readFileSync(join(__dirname, '..', '..', 'public', 'quran', 'meta.json'), 'utf-8'));
const INDEX = buildQuranIndex(META);
const TODAY = '2026-10-27';

function inputs(over: Partial<PlanInputs> = {}): PlanInputs {
  return {
    goal: 'khatm', sharedReading: false, pace: 'sustainable', requestedDate: null,
    dailyMinutes: 30, lpm: 160, speedSource: 'user', slots: 'single', lightDays: [],
    khatmCompleted: 0, nazeraPosition: 0, today: TODAY, ...over,
  };
}
const apply = (over: Partial<PlanInputs>, existing: { khatm?: ReturnType<typeof createPlan> | null; nazera?: ReturnType<typeof createProfile> | null; journey?: ReturnType<typeof applyProposal>['journey'] | null } = {}) =>
  applyProposal({
    proposal: buildProposal(inputs(over), INDEX), index: INDEX, today: TODAY,
    existingKhatm: existing.khatm ?? null, existingNazera: existing.nazera ?? null, existingJourney: existing.journey ?? null,
  });

test('Khatm-only: creates a Khatm plan, leaves Nazera alone', () => {
  const r = apply({ goal: 'khatm' });
  assert.ok(r.khatm && r.khatm.status === 'active');
  assert.equal(r.nazera, null);
  assert.equal(r.journey.goal, 'khatm');
  assert.equal(r.khatm!.dayAnchor!.date, TODAY);
  assert.equal(r.khatm!.dayAnchor!.target, r.journey.assumptions.khatmDailyAyahs);
});

test('Nazera-only: creates a Nazera profile in ayahs mode at the chosen position, no Khatm', () => {
  const r = apply({ goal: 'nazera', nazeraPosition: 600 });
  assert.equal(r.khatm, null);
  assert.ok(r.nazera);
  assert.equal(r.nazera!.position, 600);
  assert.equal(r.nazera!.targetMode, 'ayahs');
  assert.equal(r.nazera!.dailyAyahTarget, r.journey.assumptions.nazeraDailyAyahs);
});

test('applying a new plan over an existing Khatm RESCHEDULES it: progress and history are preserved', () => {
  let existing = khatmAnchor(INDEX, createPlan({ mode: 'duration', durationDays: 30, scheduleStyle: 'single' }, '2026-10-20'), '2026-10-20');
  existing = { ...existing, completedAyahs: 800, history: [{ date: '2026-10-20', ayahsRead: 208 }, { date: '2026-10-21', ayahsRead: 0 }] };
  const r = apply({ goal: 'khatm', khatmCompleted: 800, dailyMinutes: 20 }, { khatm: existing });
  assert.equal(r.khatm!.completedAyahs, 800);
  assert.equal(r.khatm!.id, existing.id);
  assert.deepEqual(r.khatm!.history.slice(0, 2), existing.history);
  assert.equal(r.khatm!.rescheduleLog.length, existing.rescheduleLog.length + 1);
  assert.notEqual(r.khatm!.targetDate, existing.targetDate);
});

test('applying over an existing Nazera keeps position and history, only retargets', () => {
  let existing = nazeraAnchor(createProfile({ targetMode: 'sessions', dailySessionTarget: 2 }, INDEX, '2026-10-20'), '2026-10-20');
  existing = { ...existing, position: 420, history: [{ date: '2026-10-20', progress: 2, target: 2, metTarget: true }] };
  const r = apply({ goal: 'nazera', nazeraPosition: 420 }, { nazera: existing });
  assert.equal(r.nazera!.position, 420);
  assert.equal(r.nazera!.id, existing.id);
  assert.equal(r.nazera!.history[0].metTarget, true);
  assert.equal(r.nazera!.targetMode, 'ayahs');
});

test('a plan for a different goal never deletes the other record', () => {
  const nazera = nazeraAnchor(createProfile({ targetMode: 'ayahs', dailyAyahTarget: 10 }, INDEX, TODAY), TODAY);
  const r = apply({ goal: 'khatm' }, { nazera });
  assert.equal(r.nazera, nazera); // untouched (same reference)
});

test('a completed Khatm is not resurrected: a new plan starts a fresh run', () => {
  const done = { ...createPlan({ mode: 'duration', durationDays: 5, scheduleStyle: 'single' }, '2026-01-01'), completedAyahs: 6236, status: 'completed' as const };
  const r = apply({ goal: 'khatm' }, { khatm: done });
  assert.equal(r.khatm!.completedAyahs, 0);
  assert.equal(r.khatm!.status, 'active');
});

test('prayer-slot subset (fajr + isha) splits the day into exactly two portions', async () => {
  const { slotRanges } = await import('./khatm-plan.ts');
  const r = apply({ goal: 'khatm', slots: ['fajr', 'isha'], dailyMinutes: 40 });
  assert.deepEqual(r.khatm!.prayerSlots, ['fajr', 'isha']);
  const ranges = slotRanges(INDEX, r.khatm!);
  assert.equal(ranges.length, 2);
  assert.equal(ranges.reduce((a, x) => a + x.count, 0), r.khatm!.dayAnchor!.target);
  assert.equal(ranges[1].startGlobal, ranges[0].endGlobal + 1);
});

// ── shared vs separate ───────────────────────────────────────────────

test('SHARED: completing today advances both pointers by the same ayahs — never double', () => {
  const r = apply({ goal: 'both', sharedReading: true, khatmCompleted: 0, nazeraPosition: 0 });
  assert.equal(r.journey.sharedReading, true);
  assert.equal(pointersAligned(r.khatm, r.nazera), true);
  const out = completeSharedToday(INDEX, r.khatm!, r.nazera, true);
  assert.equal(out.khatm.completedAyahs, r.khatm!.dayAnchor!.target);
  assert.equal(out.nazera!.position, out.khatm.completedAyahs);
  assert.equal(out.nazera!.dayAnchor!.progressToday, out.ayahs);
  // a second tap is a no-op (never doubles)
  const again = completeSharedToday(INDEX, out.khatm, out.nazera, true);
  assert.equal(again.khatm.completedAyahs, out.khatm.completedAyahs);
  assert.equal(again.nazera!.position, out.nazera!.position);
  assert.equal(again.ayahs, 0);
});

test('SHARED: Nazera counts today as met only when it matches the Khatm target', () => {
  const r = apply({ goal: 'both', sharedReading: true });
  const out = completeSharedToday(INDEX, r.khatm!, r.nazera, true);
  assert.ok(out.nazera!.dayAnchor!.progressToday >= out.nazera!.dayAnchor!.target);
});

test('SEPARATE: Khatm completion leaves Nazera untouched and vice-versa', () => {
  const r = apply({ goal: 'both', sharedReading: false, nazeraPosition: 100 });
  const k = completeSharedToday(INDEX, r.khatm!, r.nazera, false);
  assert.equal(k.nazera!.position, 100);
  assert.ok(k.khatm.completedAyahs > 0);
  const n = nazeraComplete(INDEX, r.nazera!);
  assert.ok(n.position > 100);
  assert.equal(r.khatm!.completedAyahs, 0); // Khatm record unchanged by Nazera progress
});

test('SHARED is refused for drifted pointers: it reports not-shared and does not move Nazera', () => {
  const r = apply({ goal: 'both', sharedReading: true });
  const drifted = { ...r.nazera!, position: 9 };
  assert.equal(isShared(r.journey, r.khatm, drifted), false);
  const out = completeSharedToday(INDEX, r.khatm!, drifted, true);
  assert.equal(out.nazera!.position, 9);
});

test('mirrorKhatmAdvance only mirrors from an aligned pointer', () => {
  const n = nazeraAnchor(createProfile({ targetMode: 'ayahs', dailyAyahTarget: 5 }, INDEX, TODAY), TODAY);
  assert.equal(mirrorKhatmAdvance(INDEX, n, 0, 12)!.position, 12);
  assert.equal(mirrorKhatmAdvance(INDEX, n, 3, 12)!.position, 0); // misaligned: untouched
  assert.equal(mirrorKhatmAdvance(INDEX, null, 0, 12), null);
  assert.equal(mirrorKhatmAdvance(INDEX, n, 5, 5)!.position, 0); // zero delta
});

test('syncSharedNazera retargets only at the start of a new day, never wiping today’s progress', () => {
  const r = apply({ goal: 'both', sharedReading: true });
  const done = completeSharedToday(INDEX, r.khatm!, r.nazera, true);
  // same day: untouched
  assert.equal(syncSharedNazera(INDEX, done.khatm, done.nazera, TODAY), done.nazera);
  // next day: target follows Khatm's recomputed daily target and a fresh anchor is made
  const next = '2026-10-28';
  const k2 = khatmAnchor(INDEX, done.khatm, next);
  const n2 = syncSharedNazera(INDEX, k2, done.nazera, next)!;
  assert.equal(n2.dayAnchor!.date, next);
  assert.equal(n2.dayAnchor!.target, computeDailyTarget(INDEX, k2, next));
  assert.equal(n2.position, done.nazera!.position); // position untouched
  assert.equal(n2.history.at(-1)!.metTarget, true); // yesterday logged honestly
});

// ── today view-model ─────────────────────────────────────────────────

test('today items: one combined row when shared, two separate rows otherwise', () => {
  const sh = apply({ goal: 'both', sharedReading: true });
  assert.equal(todayItems(INDEX, sh.khatm, sh.nazera, sh.journey).length, 1);
  assert.equal(todayItems(INDEX, sh.khatm, sh.nazera, sh.journey)[0].kind, 'shared');
  const sep = apply({ goal: 'both', sharedReading: false });
  assert.deepEqual(todayItems(INDEX, sep.khatm, sep.nazera, sep.journey).map((i) => i.kind), ['khatm', 'nazera']);
});

test('start point is the first unfinished, unpaused portion; null when all done today', () => {
  const sep = apply({ goal: 'both', sharedReading: false, nazeraPosition: 200 });
  const items = todayItems(INDEX, sep.khatm, sep.nazera, sep.journey);
  assert.equal(startPoint(items)!.startGlobal, 1);
  const khatmDone = markTodayComplete(INDEX, sep.khatm!);
  const nazeraDone = nazeraComplete(INDEX, sep.nazera!);
  assert.equal(startPoint(todayItems(INDEX, khatmDone, sep.nazera, sep.journey))!.startGlobal, 201);
  assert.equal(startPoint(todayItems(INDEX, khatmDone, nazeraDone, sep.journey)), null);
});

test('paused Khatm is shown as paused and offers no start point', () => {
  const r = apply({ goal: 'khatm' });
  const paused = pausePlan(r.khatm!, TODAY);
  const items = todayItems(INDEX, paused, null, r.journey);
  assert.equal(items[0].paused, true);
  assert.equal(startPoint(items), null);
  assert.equal(overallStatus(paused, null, INDEX), 'paused');
});

test('overall status: none / active / completed', () => {
  assert.equal(overallStatus(null, null, INDEX), 'none');
  const r = apply({ goal: 'khatm' });
  assert.equal(overallStatus(r.khatm, null, INDEX), 'active');
  assert.equal(overallStatus({ ...r.khatm!, status: 'completed', completedAyahs: 6236 }, null, INDEX), 'completed');
});

test('a finished Quran is reported as finished, not as a missed target', () => {
  const r = apply({ goal: 'khatm', khatmCompleted: 6236 });
  const item = todayItems(INDEX, { ...r.khatm!, completedAyahs: 6236, status: 'completed' }, null, r.journey)[0];
  assert.equal(item.finished, true);
  assert.equal(item.portion, null);
});

test('session log keeps the latest 30 samples', () => {
  const r = apply({ goal: 'khatm' });
  let j = r.journey;
  for (let i = 0; i < 40; i++) j = logSession(j, { date: TODAY, ayahs: 10, letters: 500, minutes: 4 });
  assert.equal(j.sessionLog.length, 30);
});
