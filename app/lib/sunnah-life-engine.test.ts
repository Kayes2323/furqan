import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  isPublishableAsVerified,
  validatePracticeMetadata,
  setPracticeStatus,
  findPracticeRecord,
  buildDayProgress,
  migrateTrackerData,
  emptyTrackerData,
  dedupeRecords,
} from './sunnah-life-engine.ts';
import { SUNNAH_PRACTICES, findPracticeById } from './sunnah-life-registry.ts';
import type { SunnahPractice, DailyPracticeRecord } from './sunnah-life-types.ts';

function makePractice(overrides: Partial<SunnahPractice> = {}): SunnahPractice {
  return {
    id: 'sp-test',
    contentVersion: 1,
    titleBn: 'টেস্ট আমল',
    instructionsBn: 'টেস্ট নির্দেশনা',
    sourceType: 'general_habit',
    sourceReference: { identifierConfirmed: false },
    classification: 'general_habit',
    evidencedCount: false,
    evidencedTime: false,
    evidencedVirtue: false,
    review: { status: 'pending_review', versionHistory: ['প্রাথমিক'] },
    licensing: { requiresPermission: false },
    lifeAreas: ['relationship-with-self'],
    ...overrides,
  };
}

// ─── Religious evidence gate ────────────────────────────────────────────

test('isPublishableAsVerified: pending_review is never publishable as verified', () => {
  const p = makePractice({ review: { status: 'pending_review', versionHistory: ['x'] } });
  assert.equal(isPublishableAsVerified(p), false);
});

test('isPublishableAsVerified: approved without reviewer identity is NOT publishable', () => {
  const p = makePractice({ review: { status: 'approved', versionHistory: ['x'] } });
  assert.equal(isPublishableAsVerified(p), false);
});

test('isPublishableAsVerified: approved WITH reviewer name + date is publishable', () => {
  const p = makePractice({
    review: {
      status: 'approved',
      versionHistory: ['x'],
      reviewerName: 'Test Reviewer',
      reviewDate: '2026-01-01',
    },
  });
  assert.equal(isPublishableAsVerified(p), true);
});

test('CRITICAL: no shipped registry entry is marked approved without a real reviewer — nothing in this registry is verified religious guidance yet', () => {
  for (const practice of SUNNAH_PRACTICES) {
    assert.equal(
      practice.review.status,
      'pending_review',
      `${practice.id} must stay pending_review until a qualified human reviewer actually approves it`,
    );
    assert.equal(isPublishableAsVerified(practice), false, `${practice.id} must not be publishable as verified`);
  }
});

// ─── Metadata completeness (the "quality gate" tests) ──────────────────

test('validatePracticeMetadata: a well-formed general-habit practice is valid', () => {
  const p = makePractice();
  const result = validatePracticeMetadata(p);
  assert.equal(result.valid, true, result.errors.join('; '));
});

test('validatePracticeMetadata: religious sourceType requires a collection reference', () => {
  const p = makePractice({ sourceType: 'hadith', classification: 'sunnah', sourceReference: { identifierConfirmed: false } });
  const result = validatePracticeMetadata(p);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('sourceReference.collection')));
});

test('validatePracticeMetadata: general_habit sourceType cannot carry a religious classification (no false Sunnah labeling)', () => {
  const p = makePractice({ sourceType: 'general_habit', classification: 'sunnah' });
  const result = validatePracticeMetadata(p);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('ভুলভাবে সুন্নাহ লেবেল')));
});

test('validatePracticeMetadata: evidencedVirtue true requires a virtue note (no bare unsupported virtue claim)', () => {
  const p = makePractice({ evidencedVirtue: true, virtueNoteBn: undefined });
  const result = validatePracticeMetadata(p);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('virtueNoteBn')));
});

test('validatePracticeMetadata: a count mentioned in instructions without evidencedCount is rejected', () => {
  const p = makePractice({ instructionsBn: 'এটি ১০ বার পড়ুন', evidencedCount: false });
  const result = validatePracticeMetadata(p);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('অনুমোদনহীন সংখ্যা')));
});

test('validatePracticeMetadata: status approved without reviewer attribution is rejected', () => {
  const p = makePractice({ review: { status: 'approved', versionHistory: ['x'] } });
  const result = validatePracticeMetadata(p);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('reviewerName')));
});

test('validatePracticeMetadata: a practice must belong to at least one routine slot or life area', () => {
  const p = makePractice({ lifeAreas: [] });
  const result = validatePracticeMetadata(p);
  assert.equal(result.valid, false);
});

test('every shipped registry entry passes metadata validation', () => {
  for (const practice of SUNNAH_PRACTICES) {
    const result = validatePracticeMetadata(practice);
    assert.equal(result.valid, true, `${practice.id}: ${result.errors.join('; ')}`);
  }
});

test('every shipped registry entry has a unique id', () => {
  const ids = SUNNAH_PRACTICES.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

// ─── Classification distinctness — general habits are never Sunnah ────

test('classification distinguishes obligatory worship from adab from general habits', () => {
  const fajr = findPracticeById('sp-fajr-prayer')!;
  const dressing = findPracticeById('sp-dressing-bismillah')!;
  assert.equal(fajr.classification, 'obligatory');
  assert.equal(dressing.classification, 'adab');
  assert.notEqual(fajr.classification, dressing.classification);
});

// ─── Shared practice record across navigation paths ────────────────────

test('a practice reachable from Today\'s Routine (routineSlot) and Learn by Life Area (lifeAreas) is the exact same record', () => {
  const fajr = findPracticeById('sp-fajr-prayer')!;
  assert.equal(fajr.routineSlot, 'fajr-morning');
  assert.ok(fajr.lifeAreas.includes('relationship-with-allah'));
  // Same object identity regardless of which "list" a caller filtered from.
  const fromRoutine = SUNNAH_PRACTICES.find((p) => p.routineSlot === 'fajr-morning' && p.id === fajr.id);
  const fromArea = SUNNAH_PRACTICES.find((p) => p.lifeAreas.includes('relationship-with-allah') && p.id === fajr.id);
  assert.strictEqual(fromRoutine, fromArea);
});

// ─── Tracking: snapshot-on-interaction, same invariant as zikr-tracker ──

test('viewing a practice never creates a tracking record', () => {
  const records: DailyPracticeRecord[] = [];
  assert.equal(findPracticeRecord(records, 'sp-waking-dua', '2026-01-01'), undefined);
});

test('setPracticeStatus creates a record only on actual interaction, snapshotting title/classification/version', () => {
  const practice = makePractice({ titleBn: 'মূল শিরোনাম', classification: 'sunnah', contentVersion: 3 });
  const records = setPracticeStatus([], practice, '2026-01-01', 'completed', '2026-01-01T06:00:00.000Z');
  assert.equal(records.length, 1);
  assert.equal(records[0].titleSnapshot, 'মূল শিরোনাম');
  assert.equal(records[0].classificationSnapshot, 'sunnah');
  assert.equal(records[0].contentVersionSnapshot, 3);
});

test('a later registry edit never retroactively changes an existing day\'s snapshot', () => {
  const original = makePractice({ titleBn: 'পুরনো শিরোনাম', contentVersion: 1 });
  let records = setPracticeStatus([], original, '2026-01-01', 'completed', '2026-01-01T06:00:00.000Z');

  const edited = { ...original, titleBn: 'নতুন শিরোনাম', contentVersion: 2 };
  // Re-touching the SAME date with the edited practice updates status but
  // must not overwrite the already-taken snapshot.
  records = setPracticeStatus(records, edited, '2026-01-01', 'partial', '2026-01-01T07:00:00.000Z');

  assert.equal(records[0].titleSnapshot, 'পুরনো শিরোনাম');
  assert.equal(records[0].contentVersionSnapshot, 1);
  assert.equal(records[0].status, 'partial');
});

test('setPracticeStatus never produces two records for the same (practiceId, date)', () => {
  const practice = makePractice();
  let records = setPracticeStatus([], practice, '2026-01-01', 'completed', 't1');
  records = setPracticeStatus(records, practice, '2026-01-01', 'skipped', 't2');
  assert.equal(records.length, 1);
  assert.equal(records[0].status, 'skipped');
});

// ─── Progress: religious practices and general habits reported separately ─

test('buildDayProgress never combines religious and general-habit totals into one score', () => {
  const religiousPractice = makePractice({ id: 'r1', classification: 'sunnah', sourceType: 'hadith', sourceReference: { collection: 'x', identifierConfirmed: false } });
  const habitPractice = makePractice({ id: 'g1', classification: 'general_habit', sourceType: 'general_habit' });
  const records = setPracticeStatus([], religiousPractice, '2026-01-01', 'completed', 't1');
  const split = buildDayProgress([religiousPractice, habitPractice], records, '2026-01-01');
  assert.equal(split.religious.completed, 1);
  assert.equal(split.religious.total, 1);
  assert.equal(split.generalHabits.completed, 0);
  assert.equal(split.generalHabits.total, 1);
  assert.equal(split.generalHabits.remaining, 1);
});

test('buildDayProgress remaining counts only untouched practices', () => {
  const p1 = makePractice({ id: 'p1' });
  const p2 = makePractice({ id: 'p2' });
  const records = setPracticeStatus([], p1, '2026-01-01', 'completed', 't1');
  const split = buildDayProgress([p1, p2], records, '2026-01-01');
  assert.equal(split.generalHabits.remaining, 1);
  assert.equal(split.generalHabits.completed, 1);
});

// ─── Migration / sanitization ───────────────────────────────────────────

test('migrateTrackerData returns empty data for garbage input, never throws', () => {
  assert.deepEqual(migrateTrackerData(null), emptyTrackerData());
  assert.deepEqual(migrateTrackerData('not an object'), emptyTrackerData());
  assert.deepEqual(migrateTrackerData({ foo: 'bar' }), emptyTrackerData());
});

test('migrateTrackerData drops malformed records but keeps valid ones', () => {
  const raw = {
    version: 1,
    records: [
      { date: '2026-01-01', practiceId: 'sp-x', status: 'completed', titleSnapshot: 'ঠিক আছে', classificationSnapshot: 'adab', contentVersionSnapshot: 1, updatedAt: 't' },
      { date: 'not-a-date', practiceId: 'sp-y', status: 'completed' },
      { practiceId: 'sp-z' },
    ],
  };
  const result = migrateTrackerData(raw);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].practiceId, 'sp-x');
});

test('dedupeRecords keeps only the latest-updated entry per (practiceId, date)', () => {
  const records: DailyPracticeRecord[] = [
    { date: '2026-01-01', practiceId: 'sp-x', status: 'skipped', titleSnapshot: 't', classificationSnapshot: 'adab', contentVersionSnapshot: 1, updatedAt: '2026-01-01T01:00:00Z' },
    { date: '2026-01-01', practiceId: 'sp-x', status: 'completed', titleSnapshot: 't', classificationSnapshot: 'adab', contentVersionSnapshot: 1, updatedAt: '2026-01-01T02:00:00Z' },
  ];
  const result = dedupeRecords(records);
  assert.equal(result.length, 1);
  assert.equal(result[0].status, 'completed');
});
