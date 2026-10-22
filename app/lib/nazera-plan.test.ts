import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildQuranIndex } from './quran-index.ts';
import {
  createProfile, validateCreateParams, ensureDayAnchor, todaysPortion,
  markTodayComplete, markSessionComplete, jumpToPosition, updateTargets,
  currentRef, nextRef, consistency, todayKey, addDays,
} from './nazera-plan.ts';
import type { SurahMeta } from './reader-types.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const META: SurahMeta[] = JSON.parse(readFileSync(join(__dirname, '..', '..', 'public', 'quran', 'meta.json'), 'utf-8'));
const INDEX = buildQuranIndex(META);

// ── validation ───────────────────────────────────────────────────────

test('validateCreateParams rejects a zero/negative ayah target in ayahs mode', () => {
  assert.ok(validateCreateParams({ targetMode: 'ayahs', dailyAyahTarget: 0 }));
  assert.ok(validateCreateParams({ targetMode: 'ayahs', dailyAyahTarget: -5 }));
  assert.equal(validateCreateParams({ targetMode: 'ayahs', dailyAyahTarget: 10 }), null);
});

test('validateCreateParams rejects a zero/negative session target in sessions mode', () => {
  assert.ok(validateCreateParams({ targetMode: 'sessions', dailySessionTarget: 0 }));
  assert.equal(validateCreateParams({ targetMode: 'sessions', dailySessionTarget: 2 }), null);
});

test('validateCreateParams rejects a non-positive session length', () => {
  assert.ok(validateCreateParams({ targetMode: 'sessions', dailySessionTarget: 1, ayahsPerSession: 0 }));
});

// ── invalid / edge-case Quran references ────────────────────────────

test('createProfile clamps an invalid starting surah to a safe default', () => {
  const today = '2026-01-01';
  const profile = createProfile({ targetMode: 'ayahs', dailyAyahTarget: 10, startRef: { surah: 999, ayah: 1 } }, INDEX, today);
  assert.equal(profile.position, 0); // clamped to surah 1 -> position 0 (nothing read yet, next is 1:1)
});

test('createProfile clamps an out-of-range ayah number within a valid surah', () => {
  const today = '2026-01-01';
  // surah 1 (Al-Fatiha) has 7 ayahs; ayah 999 should clamp to 7 and
  // become the next ayah to read
  const profile = createProfile({ targetMode: 'ayahs', dailyAyahTarget: 10, startRef: { surah: 1, ayah: 999 } }, INDEX, today);
  assert.deepEqual(nextRef(INDEX, profile), { surah: 1, ayah: 7 });
});

test('createProfile with no startRef begins at 1:1 (position 0, next ayah is 1:1)', () => {
  const today = '2026-01-01';
  const profile = createProfile({ targetMode: 'ayahs', dailyAyahTarget: 10 }, INDEX, today);
  assert.equal(profile.position, 0);
  assert.equal(currentRef(INDEX, profile), null);
  assert.deepEqual(nextRef(INDEX, profile), { surah: 1, ayah: 1 });
});

test('createProfile with a valid mid-Quran startRef resumes from exactly that point', () => {
  // startRef means "begin reading here" — it becomes the *next* ayah,
  // not one already marked read.
  const today = '2026-01-01';
  const profile = createProfile({ targetMode: 'ayahs', dailyAyahTarget: 10, startRef: { surah: 18, ayah: 10 } }, INDEX, today);
  assert.deepEqual(nextRef(INDEX, profile), { surah: 18, ayah: 10 });
  assert.deepEqual(currentRef(INDEX, profile), { surah: 18, ayah: 9 });
});

// ── daily targets: ayahs mode ───────────────────────────────────────

test('ayahs mode: todaysPortion covers exactly dailyAyahTarget ayahs starting right after the current position', () => {
  const today = '2026-01-01';
  let profile = createProfile({ targetMode: 'ayahs', dailyAyahTarget: 15 }, INDEX, today);
  profile = ensureDayAnchor(profile, today);
  const portion = todaysPortion(INDEX, profile);
  assert.ok(portion);
  assert.equal(portion!.count, 15);
  assert.equal(portion!.startGlobal, 1);
  assert.deepEqual(portion!.start, { surah: 1, ayah: 1 });
});

test('ayahs mode: markTodayComplete advances position by exactly the daily target and is idempotent after', () => {
  const today = '2026-01-01';
  let profile = createProfile({ targetMode: 'ayahs', dailyAyahTarget: 20 }, INDEX, today);
  profile = ensureDayAnchor(profile, today);
  profile = markTodayComplete(INDEX, profile);
  assert.equal(profile.position, 20);
  assert.equal(todaysPortion(INDEX, profile), null); // today's target already met

  // repeat tap must not double-count
  const before = profile.position;
  profile = markTodayComplete(INDEX, profile);
  assert.equal(profile.position, before);
});

test('ayahs mode: the next day gets a fresh portion continuing exactly where the previous day left off', () => {
  const start = '2026-01-01';
  let profile = createProfile({ targetMode: 'ayahs', dailyAyahTarget: 20 }, INDEX, start);
  profile = ensureDayAnchor(profile, start);
  profile = markTodayComplete(INDEX, profile);

  const tomorrow = addDays(start, 1);
  profile = ensureDayAnchor(profile, tomorrow);
  const portion = todaysPortion(INDEX, profile);
  assert.ok(portion);
  assert.equal(portion!.startGlobal, 21); // continues right after yesterday's 20
});

// ── daily targets: sessions mode ────────────────────────────────────

test('sessions mode: todaysPortion covers exactly one ayahsPerSession-sized chunk at a time', () => {
  const today = '2026-01-01';
  let profile = createProfile({ targetMode: 'sessions', dailySessionTarget: 3, ayahsPerSession: 5 }, INDEX, today);
  profile = ensureDayAnchor(profile, today);
  const portion = todaysPortion(INDEX, profile);
  assert.ok(portion);
  assert.equal(portion!.count, 5);
});

test('sessions mode: markSessionComplete logs one session, advances position by ayahsPerSession, caps at the daily session target', () => {
  const today = '2026-01-01';
  let profile = createProfile({ targetMode: 'sessions', dailySessionTarget: 2, ayahsPerSession: 5 }, INDEX, today);
  profile = ensureDayAnchor(profile, today);

  profile = markSessionComplete(INDEX, profile);
  assert.equal(profile.position, 5);
  assert.equal(profile.dayAnchor!.progressToday, 1);
  assert.ok(todaysPortion(INDEX, profile)); // one more session due today

  profile = markSessionComplete(INDEX, profile);
  assert.equal(profile.position, 10);
  assert.equal(profile.dayAnchor!.progressToday, 2);
  assert.equal(todaysPortion(INDEX, profile), null); // day's session target met

  // a third tap must not log a third session
  profile = markSessionComplete(INDEX, profile);
  assert.equal(profile.position, 10);
  assert.equal(profile.dayAnchor!.progressToday, 2);
});

test('ayahs-mode actions are a no-op in sessions mode and vice versa', () => {
  const today = '2026-01-01';
  let ayahsProfile = createProfile({ targetMode: 'ayahs', dailyAyahTarget: 10 }, INDEX, today);
  ayahsProfile = ensureDayAnchor(ayahsProfile, today);
  const afterWrongAction = markSessionComplete(INDEX, ayahsProfile);
  assert.equal(afterWrongAction.position, ayahsProfile.position); // untouched

  let sessionsProfile = createProfile({ targetMode: 'sessions', dailySessionTarget: 1 }, INDEX, today);
  sessionsProfile = ensureDayAnchor(sessionsProfile, today);
  const afterWrongAction2 = markTodayComplete(INDEX, sessionsProfile);
  assert.equal(afterWrongAction2.position, sessionsProfile.position); // untouched
});

// ── never exceeding the end of the Quran ────────────────────────────

test('position never exceeds totalAyahs even near the very end of the Quran', () => {
  const today = '2026-01-01';
  let profile = createProfile({ targetMode: 'ayahs', dailyAyahTarget: 50, startRef: { surah: 114, ayah: 1 } }, INDEX, today);
  profile = ensureDayAnchor(profile, today);
  profile = markTodayComplete(INDEX, profile);
  assert.equal(profile.position, INDEX.totalAyahs);
  assert.equal(todaysPortion(INDEX, profile), null);
  // marking again must not throw or overflow
  profile = markTodayComplete(INDEX, profile);
  assert.equal(profile.position, INDEX.totalAyahs);
});

// ── resuming from the saved location ────────────────────────────────

test('jumpToPosition moves the pointer to a chosen ayah without touching history', () => {
  const today = '2026-01-01';
  let profile = createProfile({ targetMode: 'ayahs', dailyAyahTarget: 10 }, INDEX, today);
  profile = ensureDayAnchor(profile, today);
  profile = markTodayComplete(INDEX, profile);
  const historyBefore = profile.history.length;

  profile = jumpToPosition(INDEX, profile, { surah: 36, ayah: 1 });
  assert.deepEqual(nextRef(INDEX, profile), { surah: 36, ayah: 1 });
  assert.equal(profile.history.length, historyBefore);
});

test('jumpToPosition clamps an invalid reference instead of producing a broken position', () => {
  const today = '2026-01-01';
  let profile = createProfile({ targetMode: 'ayahs', dailyAyahTarget: 10 }, INDEX, today);
  profile = jumpToPosition(INDEX, profile, { surah: 2, ayah: 99999 });
  // clamped to Al-Baqara's real last ayah (286), which becomes the *next* ayah to read
  assert.deepEqual(nextRef(INDEX, profile), { surah: 2, ayah: 286 });
});

// ── updating targets without losing progress ────────────────────────

test('updateTargets changes the mode/target without touching position or history', () => {
  const today = '2026-01-01';
  let profile = createProfile({ targetMode: 'ayahs', dailyAyahTarget: 10 }, INDEX, today);
  profile = ensureDayAnchor(profile, today);
  profile = markTodayComplete(INDEX, profile);
  const positionBefore = profile.position;

  profile = updateTargets(profile, { targetMode: 'sessions', dailySessionTarget: 2, ayahsPerSession: 8 });
  assert.equal(profile.position, positionBefore);
  assert.equal(profile.targetMode, 'sessions');
  assert.equal(profile.dayAnchor, null); // forces a fresh anchor next time
});

test('updateTargets rejects an invalid new target', () => {
  const today = '2026-01-01';
  const profile = createProfile({ targetMode: 'ayahs', dailyAyahTarget: 10 }, INDEX, today);
  assert.throws(() => updateTargets(profile, { targetMode: 'ayahs', dailyAyahTarget: 0 }));
});

// ── consistency / streak ────────────────────────────────────────────

test('consistency is a 0-streak for a brand-new profile that has not read yet today', () => {
  const today = '2026-01-01';
  let profile = createProfile({ targetMode: 'ayahs', dailyAyahTarget: 10 }, INDEX, today);
  profile = ensureDayAnchor(profile, today);
  const c = consistency(profile, today);
  assert.equal(c.currentStreak, 0);
  assert.equal(c.last7DaysMet, 0);
});

test('consistency counts today if its target is already met', () => {
  const today = '2026-01-01';
  let profile = createProfile({ targetMode: 'ayahs', dailyAyahTarget: 10 }, INDEX, today);
  profile = ensureDayAnchor(profile, today);
  profile = markTodayComplete(INDEX, profile);
  const c = consistency(profile, today);
  assert.equal(c.currentStreak, 1);
  assert.equal(c.last7DaysMet, 1);
});

test('consistency streak survives an in-progress (not-yet-met) today without zeroing out', () => {
  let profile = createProfile({ targetMode: 'ayahs', dailyAyahTarget: 10 }, INDEX, '2026-01-01');
  let date = '2026-01-01';
  for (let i = 0; i < 3; i++) {
    profile = ensureDayAnchor(profile, date);
    profile = markTodayComplete(INDEX, profile);
    date = addDays(date, 1);
  }
  // day 4: anchor created, but nothing read yet today
  profile = ensureDayAnchor(profile, date);
  const c = consistency(profile, date);
  assert.equal(c.currentStreak, 3); // the 3 completed days still count
});

test('consistency streak breaks on a missed day', () => {
  let profile = createProfile({ targetMode: 'ayahs', dailyAyahTarget: 10 }, INDEX, '2026-01-01');
  let date = '2026-01-01';
  for (let i = 0; i < 2; i++) {
    profile = ensureDayAnchor(profile, date);
    profile = markTodayComplete(INDEX, profile);
    date = addDays(date, 1);
  }
  // skip a day entirely — never call ensureDayAnchor/markTodayComplete
  // for it, then jump straight to the day after
  date = addDays(date, 1);
  profile = ensureDayAnchor(profile, date);
  const c = consistency(profile, date);
  // no entry exists for the skipped day (ensureDayAnchor only logs the
  // single anchor it's rolling over, it doesn't backfill every gap
  // day — same as app/lib/khatm-plan.ts), so "no entry" correctly
  // breaks the streak the same way a logged miss would.
  assert.equal(c.currentStreak, 0);
});

// ── links to the Reader: every produced ref must be valid ───────────

test('every ref produced by todaysPortion/currentRef/nextRef across a long walk-through is a valid, in-range surah:ayah', () => {
  let profile = createProfile({ targetMode: 'sessions', dailySessionTarget: 2, ayahsPerSession: 7 }, INDEX, '2026-01-01');
  let date = '2026-01-01';
  const metaByNumber = new Map(META.map((s) => [s.number, s]));

  function assertValid(ref: { surah: number; ayah: number } | null) {
    if (!ref) return;
    const m = metaByNumber.get(ref.surah);
    assert.ok(m, `surah ${ref.surah} does not exist`);
    assert.ok(ref.ayah >= 1 && ref.ayah <= m!.ayahCount, `surah ${ref.surah} ayah ${ref.ayah} out of range`);
  }

  for (let day = 0; day < 15; day++) {
    profile = ensureDayAnchor(profile, date);
    const portion = todaysPortion(INDEX, profile);
    if (portion) {
      assertValid(portion.start);
      assertValid(portion.end);
    }
    profile = markSessionComplete(INDEX, profile);
    profile = markSessionComplete(INDEX, profile);
    assertValid(currentRef(INDEX, profile));
    assertValid(nextRef(INDEX, profile));
    date = addDays(date, 1);
  }
});

test('todayKey returns a stable YYYY-MM-DD string (re-exported date helper works)', () => {
  assert.match(todayKey(), /^\d{4}-\d{2}-\d{2}$/);
});
