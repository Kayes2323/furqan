import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildQuranIndex } from './quran-index.ts';
import type { SurahMeta } from './reader-types.ts';
import {
  nextStep, applyAnswer, skipStep, validateAnswer, questionFor, toPlanInputs, parseFreeText, sharingPossible,
  effectiveGoal, resolveSlots, normalizeDigits, applicableSteps, type Answers, type InterviewContext,
} from './journey-interview.ts';
import { buildProposal } from './journey-plan.ts';
import { createPlan, ensureDayAnchor } from './khatm-plan.ts';
import { createProfile, ensureDayAnchor as nAnchor } from './nazera-plan.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const META: SurahMeta[] = JSON.parse(readFileSync(join(__dirname, '..', '..', 'public', 'quran', 'meta.json'), 'utf-8'));
const INDEX = buildQuranIndex(META);
const TODAY = '2026-10-27';

const ctx = (over: Partial<InterviewContext> = {}): InterviewContext => ({
  index: INDEX, today: TODAY, khatm: null, nazera: null, existingJourney: null, readerLast: null, calibratedLpm: null, ...over,
});
const fresh = (): Answers => ({ skipped: [] });
function walk(c: InterviewContext, script: [string, unknown][]) {
  let a = fresh();
  const asked: string[] = [];
  for (const [step, value] of script) {
    const s = nextStep(c, a);
    assert.equal(s, step, `expected to be asked "${step}" but got "${s}"`);
    asked.push(s!);
    a = value === 'SKIP' ? skipStep(a, s!) : applyAnswer(a, s!, value);
  }
  return { a, asked, next: nextStep(c, a) };
}

test('flow always begins with the goal, one question at a time', () => {
  assert.equal(nextStep(ctx(), fresh()), 'goal');
});

test('Khatm-only: asks deadline, never asks Nazera start or sharing', () => {
  const r = walk(ctx(), [
    ['goal', 'khatm'], ['deadline', 'sustainable'], ['dailyMinutes', 30], ['slots', 'five'], ['lightDays', []], ['speed', 'normal'],
  ]);
  assert.equal(r.next, null);
  assert.ok(!r.asked.includes('start') && !r.asked.includes('sharing'));
});

test('Nazera-only: no deadline and no prayer-slot questions; asks where to start', () => {
  const r = walk(ctx(), [
    ['goal', 'nazera'], ['start', 'beginning'], ['dailyMinutes', 15], ['lightDays', [5]], ['speed', 'slow'],
  ]);
  assert.equal(r.next, null);
  assert.ok(!r.asked.includes('deadline') && !r.asked.includes('slots'));
});

test('both goals: asks the sharing question, and skips Nazera start when reading is shared', () => {
  const r = walk(ctx(), [
    ['goal', 'both'], ['deadline', 'sustainable'], ['sharing', true], ['dailyMinutes', 30], ['slots', 'single'], ['lightDays', []], ['speed', 'normal'],
  ]);
  assert.equal(r.next, null);
  assert.ok(!r.asked.includes('start'));
});

test('both goals, separate sessions: Nazera start IS asked', () => {
  const r = walk(ctx(), [
    ['goal', 'both'], ['deadline', 'sustainable'], ['sharing', false], ['start', 'beginning'], ['dailyMinutes', 30], ['slots', 'single'], ['lightDays', []], ['speed', 'normal'],
  ]);
  assert.ok(r.asked.includes('start'));
});

test('very short daily time skips the prayer-slot question (single session assumed)', () => {
  const r = walk(ctx(), [['goal', 'khatm'], ['deadline', 'sustainable'], ['dailyMinutes', 10], ['lightDays', []], ['speed', 'normal']]);
  assert.ok(!r.asked.includes('slots'));
  assert.equal(r.next, null);
  assert.equal(resolveSlots(r.a), 'single');
});

test('custom slot choice adds a follow-up question; presets do not', () => {
  const a = applyAnswer(applyAnswer(applyAnswer(applyAnswer(fresh(), 'goal', 'khatm'), 'deadline', 'sustainable'), 'dailyMinutes', 30), 'slots', 'custom');
  assert.equal(nextStep(ctx(), a), 'slotsCustom');
  const b = applyAnswer(a, 'slotsCustom', ['fajr', 'maghrib']);
  assert.deepEqual(resolveSlots(b), ['fajr', 'maghrib']);
  assert.equal(nextStep(ctx(), b), 'lightDays');
});

test('data the app already holds is NOT asked again', () => {
  // running Khatm + Nazera at the same spot, measured speed from the user's own sessions
  const khatm = ensureDayAnchor(INDEX, { ...createPlan({ mode: 'duration', durationDays: 60, scheduleStyle: 'single' }, TODAY), completedAyahs: 500 }, TODAY);
  const nazera = { ...nAnchor(createProfile({ targetMode: 'ayahs', dailyAyahTarget: 10 }, INDEX, TODAY), TODAY), position: 500 };
  const c = ctx({ khatm, nazera, calibratedLpm: 150 });
  const r = walk(c, [['goal', 'both'], ['deadline', 'sustainable'], ['sharing', true], ['dailyMinutes', 30], ['slots', 'single'], ['lightDays', []]]);
  assert.equal(r.next, null); // no 'start', no 'speed'
  const inputs = toPlanInputs(c, r.a);
  assert.equal(inputs.khatmCompleted, 500);
  assert.equal(inputs.nazeraPosition, 500);
  assert.equal(inputs.lpm, 150);
  assert.equal(inputs.speedSource, 'calibrated');
});

test('sharing is only offered when one reading can honestly move both pointers', () => {
  const khatm = ensureDayAnchor(INDEX, { ...createPlan({ mode: 'duration', durationDays: 60, scheduleStyle: 'single' }, TODAY), completedAyahs: 500 }, TODAY);
  const nazeraSame = { ...nAnchor(createProfile({ targetMode: 'ayahs', dailyAyahTarget: 10 }, INDEX, TODAY), TODAY), position: 500 };
  const nazeraElsewhere = { ...nazeraSame, position: 120 };
  assert.equal(sharingPossible(ctx({ khatm, nazera: nazeraSame })), true);
  assert.equal(sharingPossible(ctx({ khatm, nazera: nazeraElsewhere })), false);
  assert.equal(sharingPossible(ctx({ khatm })), true); // Nazera can start where Khatm is
  const c = ctx({ khatm, nazera: nazeraElsewhere });
  const a = applyAnswer(fresh(), 'goal', 'both');
  const seen: string[] = [];
  let cur = a;
  for (let i = 0; i < 12; i++) { const s = nextStep(c, cur); if (!s) break; seen.push(s); cur = skipStep(cur, s); }
  assert.ok(!seen.includes('sharing'));
  // even if a stale "true" slipped in, the plan treats it as separate
  assert.equal(toPlanInputs(c, { ...cur, sharing: true }).sharedReading, false);
});

test('new shared Nazera starts at the Khatm position; reader/surah start choices are honoured for separate sessions', () => {
  const khatm = ensureDayAnchor(INDEX, { ...createPlan({ mode: 'duration', durationDays: 60, scheduleStyle: 'single' }, TODAY), completedAyahs: 300 }, TODAY);
  const shared = toPlanInputs(ctx({ khatm }), { ...applyAnswer(applyAnswer(fresh(), 'goal', 'both'), 'sharing', true), skipped: [] });
  assert.equal(shared.nazeraPosition, 300);
  const reader = toPlanInputs(ctx({ readerLast: { surah: 2, ayah: 10 } }), applyAnswer(applyAnswer(applyAnswer(fresh(), 'goal', 'nazera'), 'start', 'reader'), 'dailyMinutes', 20));
  assert.equal(reader.nazeraPosition, 7 + 10 - 1); // ayah 2:10 is the next unread
  const surah = toPlanInputs(ctx(), applyAnswer(applyAnswer(fresh(), 'goal', 'nazera'), 'start', { surah: 36 }));
  assert.equal(surah.nazeraPosition, META.slice(0, 35).reduce((a, s) => a + s.ayahCount, 0));
});

test('every question is skippable-or-required as designed, and skipping never blocks the plan', () => {
  let a = fresh();
  for (let i = 0; i < 12; i++) {
    const s = nextStep(ctx(), a);
    if (!s) break;
    const q = questionFor(s, ctx());
    if (s === 'slotsCustom') { a = applyAnswer(a, s, ['fajr']); continue; }
    assert.equal(q.skippable, true, s);
    a = skipStep(a, s);
  }
  assert.equal(nextStep(ctx(), a), null);
  const inputs = toPlanInputs(ctx(), a);
  assert.equal(inputs.goal, 'khatm'); // sensible default when nothing was said
  assert.equal(inputs.dailyMinutes, 20);
  assert.equal(inputs.speedSource, 'default');
  const p = buildProposal(inputs, INDEX); // and a feasible plan still comes out
  assert.ok(p.khatm && p.khatm.evaluation.planDate);
});

test('skipped goal falls back to what the user already has', () => {
  const nazera = nAnchor(createProfile({ targetMode: 'ayahs', dailyAyahTarget: 10 }, INDEX, TODAY), TODAY);
  assert.equal(effectiveGoal(ctx({ nazera }), skipStep(fresh(), 'goal')), 'nazera');
});

test('changing an answer back to a non-"both" goal drops a stale sharing choice', () => {
  const a = applyAnswer(applyAnswer(fresh(), 'goal', 'both'), 'sharing', true);
  assert.equal(applyAnswer(a, 'goal', 'khatm').sharing, undefined);
});

test('question text adapts to existing data', () => {
  const khatm = ensureDayAnchor(INDEX, createPlan({ mode: 'duration', durationDays: 60, scheduleStyle: 'single' }, TODAY), TODAY);
  assert.match(questionFor('goal', ctx({ khatm })).text, /খতম ইতিমধ্যে চালু/);
  assert.doesNotMatch(questionFor('goal', ctx()).text, /ইতিমধ্যে/);
  assert.match(questionFor('deadline', ctx({ khatm })).text, new RegExp(khatm.targetDate));
});

test('validation: dates must be today or later; minutes and surah within range', () => {
  const c = ctx();
  assert.equal(validateAnswer('deadline', { date: '2026-10-26' }, c) !== null, true);
  assert.equal(validateAnswer('deadline', { date: TODAY }, c), null);
  assert.equal(validateAnswer('deadline', { date: 'tomorrow' }, c) !== null, true);
  assert.equal(validateAnswer('deadline', 'sustainable', c), null);
  assert.equal(validateAnswer('dailyMinutes', 4, c) !== null, true);
  assert.equal(validateAnswer('dailyMinutes', 241, c) !== null, true);
  assert.equal(validateAnswer('dailyMinutes', 30, c), null);
  assert.equal(validateAnswer('start', { surah: 115 }, c) !== null, true);
  assert.equal(validateAnswer('start', { surah: 114 }, c), null);
  assert.equal(validateAnswer('slotsCustom', [], c) !== null, true);
  assert.equal(validateAnswer('lightDays', [7], c) !== null, true);
});

test('free text: Bangla digits, hours, skips and keywords are understood without a model', () => {
  const c = ctx();
  assert.equal(normalizeDigits('৩০ মিনিট'), '30 মিনিট');
  assert.deepEqual(parseFreeText('dailyMinutes', '৩০ মিনিট', c), { value: 30 });
  assert.deepEqual(parseFreeText('dailyMinutes', 'আধা ঘণ্টা', c), { value: 30 });
  assert.deepEqual(parseFreeText('dailyMinutes', '১ ঘণ্টা', c), { value: 60 });
  assert.deepEqual(parseFreeText('dailyMinutes', 'জানি না', c), { skip: true });
  assert.deepEqual(parseFreeText('goal', 'আমি খতম করতে চাই', c), { value: 'khatm' });
  assert.deepEqual(parseFreeText('goal', 'খতম আর নাযেরা দুটোই', c), { value: 'both' });
  assert.deepEqual(parseFreeText('goal', 'nazera', c), { value: 'nazera' });
  assert.deepEqual(parseFreeText('deadline', 'নিজের গতিতে', c), { value: 'sustainable' });
  assert.deepEqual(parseFreeText('deadline', '3 মাসে', c), { value: { date: '2027-01-24' } });
  assert.deepEqual(parseFreeText('deadline', '2027-03-01', c), { value: { date: '2027-03-01' } });
  assert.deepEqual(parseFreeText('lightDays', 'শুক্র আর শনি', c), { value: [5, 6] });
  assert.deepEqual(parseFreeText('lightDays', 'নেই', c), { value: [] });
  assert.deepEqual(parseFreeText('sharing', 'আলাদা সেশনে', c), { value: false });
  assert.equal(parseFreeText('goal', 'আজ আবহাওয়া কেমন', c), undefined);
  assert.equal(parseFreeText('goal', '   ', c), undefined);
});

test('applicable steps shrink with context (progress display)', () => {
  const all = applicableSteps(ctx(), applyAnswer(fresh(), 'goal', 'both'));
  const nazeraOnly = applicableSteps(ctx(), applyAnswer(fresh(), 'goal', 'nazera'));
  assert.ok(all.includes('deadline') && all.includes('sharing'));
  assert.ok(!nazeraOnly.includes('deadline') && !nazeraOnly.includes('sharing'));
});

test('the plan comes out feasible and editable when only some answers are given', () => {
  const a = applyAnswer(applyAnswer(applyAnswer(fresh(), 'goal', 'khatm'), 'deadline', { date: '2026-11-05' }), 'dailyMinutes', 15);
  const inputs = toPlanInputs(ctx(), a);
  assert.equal(inputs.pace, 'deadline');
  const p = buildProposal(inputs, INDEX);
  assert.equal(p.khatm!.evaluation.adjusted, true); // 9 days at 15 min can't finish the Quran
  assert.ok(p.warnings.length > 0);
});
