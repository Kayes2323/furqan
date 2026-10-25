import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateZikrId,
  dateKey,
  todayKey,
  isValidDateKey,
  isoToLocalDateKey,
  addDaysToKey,
  compareDateKeys,
  validateZikrInput,
  createCustomZikr,
  addZikr,
  updateZikr,
  setZikrStatus,
  findZikr,
  findRecord,
  incrementRecordCount,
  correctRecordCount,
  dedupeRecords,
  completionPercent,
  remainingCount,
  excessCount,
  isZikrEligibleOnDate,
  buildDayZikrDetail,
  classifyDay,
  buildDaySummary,
  buildCalendarWindow,
  CALENDAR_WINDOW_SIZE,
  periodStatsForZikr,
  periodStatsForAllZikr,
  countFullyCompletedDays,
  firstOfMonthKey,
  migrateTrackerData,
  emptyTrackerData,
  ZIKR_TARGET_MAX,
} from './zikr-tracker-engine.ts';
import type { CustomZikr, DailyZikrRecord } from './zikr-tracker-types.ts';

const NOW = '2026-10-25T12:00:00.000Z';

function makeZikr(overrides: Partial<CustomZikr> = {}): CustomZikr {
  return {
    id: 'cz_1',
    name: 'Astaghfirullah',
    dailyTarget: 100,
    status: 'active',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

// ─── Date-key helpers ────────────────────────────────────────────────

test('dateKey/todayKey use local getters, not UTC slicing', () => {
  // A date deliberately near a UTC day boundary: 2026-01-01 00:30 local.
  // If this were UTC-sliced it could read back as 2025-12-31.
  const d = new Date(2026, 0, 1, 0, 30);
  assert.equal(dateKey(d), '2026-01-01');
  assert.equal(todayKey(d), '2026-01-01');
});

test('isValidDateKey accepts real calendar dates and rejects nonsense', () => {
  assert.equal(isValidDateKey('2026-10-25'), true);
  assert.equal(isValidDateKey('2026-02-29'), false); // 2026 is not a leap year
  assert.equal(isValidDateKey('2024-02-29'), true); // 2024 is
  assert.equal(isValidDateKey('2026-13-01'), false);
  assert.equal(isValidDateKey('not-a-date'), false);
  assert.equal(isValidDateKey(42), false);
});

test('isoToLocalDateKey extracts the local calendar day from an ISO timestamp', () => {
  const key = isoToLocalDateKey('2026-10-01T00:00:00.000Z');
  assert.ok(isValidDateKey(key));
});

test('addDaysToKey rolls over month and year boundaries correctly', () => {
  assert.equal(addDaysToKey('2026-01-31', 1), '2026-02-01');
  assert.equal(addDaysToKey('2026-12-31', 1), '2027-01-01');
  assert.equal(addDaysToKey('2026-03-01', -1), '2026-02-28');
  assert.equal(addDaysToKey('2026-10-25', 0), '2026-10-25');
  assert.equal(addDaysToKey('2026-10-25', -29), '2026-09-26');
});

test('compareDateKeys orders lexicographic YYYY-MM-DD keys correctly', () => {
  assert.ok(compareDateKeys('2026-01-02', '2026-01-01') > 0);
  assert.ok(compareDateKeys('2026-01-01', '2026-02-01') < 0);
  assert.equal(compareDateKeys('2026-01-01', '2026-01-01'), 0);
});

test('generateZikrId produces unique, non-empty ids', () => {
  const ids = new Set(Array.from({ length: 50 }, () => generateZikrId()));
  assert.equal(ids.size, 50);
  for (const id of ids) assert.ok(id.length > 0);
});

// ─── Validation ──────────────────────────────────────────────────────

test('validateZikrInput requires a non-empty name', () => {
  const result = validateZikrInput({ name: '   ', dailyTarget: 10 });
  assert.equal(result.valid, false);
  assert.ok(result.errors.name);
});

test('validateZikrInput requires a positive integer target', () => {
  for (const bad of [0, -1, 1.5, NaN, Infinity]) {
    const result = validateZikrInput({ name: 'Zikr', dailyTarget: bad });
    assert.equal(result.valid, false, `expected ${bad} to be invalid`);
    assert.ok(result.errors.dailyTarget);
  }
});

test('validateZikrInput rejects a target above the safe maximum', () => {
  const result = validateZikrInput({ name: 'Zikr', dailyTarget: ZIKR_TARGET_MAX + 1 });
  assert.equal(result.valid, false);
  assert.ok(result.errors.dailyTarget);
});

test('validateZikrInput accepts a minimal valid input', () => {
  const result = validateZikrInput({ name: 'Subhanallah', dailyTarget: 33 });
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
});

// ─── CustomZikr CRUD ─────────────────────────────────────────────────

test('createCustomZikr trims text fields and defaults to active status', () => {
  const z = createCustomZikr({ name: '  Ayatul Kursi  ', dailyTarget: 1, notes: '  ' }, NOW, 'cz_x');
  assert.equal(z.id, 'cz_x');
  assert.equal(z.name, 'Ayatul Kursi');
  assert.equal(z.notes, undefined); // whitespace-only -> cleared
  assert.equal(z.status, 'active');
  assert.equal(z.createdAt, NOW);
});

test('addZikr appends without mutating the input array', () => {
  const list = [makeZikr()];
  const next = addZikr(list, makeZikr({ id: 'cz_2', name: 'Salawat' }));
  assert.equal(list.length, 1);
  assert.equal(next.length, 2);
});

test('updateZikr only changes the targeted zikr, only the given fields', () => {
  const list = [makeZikr({ id: 'cz_1' }), makeZikr({ id: 'cz_2', name: 'Other' })];
  const next = updateZikr(list, 'cz_1', { dailyTarget: 200 }, '2026-10-26T00:00:00.000Z');
  assert.equal(next[0].dailyTarget, 200);
  assert.equal(next[0].name, 'Astaghfirullah'); // unchanged
  assert.equal(next[1].dailyTarget, 100); // untouched sibling
});

test('setZikrStatus pause/resume/archive transitions work and touch only the target zikr', () => {
  const list = [makeZikr({ id: 'cz_1' }), makeZikr({ id: 'cz_2' })];
  const paused = setZikrStatus(list, 'cz_1', 'paused', NOW);
  assert.equal(findZikr(paused, 'cz_1')!.status, 'paused');
  assert.equal(findZikr(paused, 'cz_2')!.status, 'active');
  const resumed = setZikrStatus(paused, 'cz_1', 'active', NOW);
  assert.equal(findZikr(resumed, 'cz_1')!.status, 'active');
  const archived = setZikrStatus(resumed, 'cz_1', 'archived', NOW);
  assert.equal(findZikr(archived, 'cz_1')!.status, 'archived');
});

// ─── Count increment / decrement / correction ───────────────────────

test('incrementRecordCount creates a record on first +1 and increments thereafter', () => {
  const zikr = makeZikr();
  let records: DailyZikrRecord[] = [];
  records = incrementRecordCount(records, zikr, '2026-10-25', 1, NOW);
  assert.equal(records.length, 1);
  assert.equal(records[0].count, 1);
  assert.equal(records[0].targetSnapshot, 100);
  records = incrementRecordCount(records, zikr, '2026-10-25', 1, NOW);
  assert.equal(records.length, 1); // same record updated, not duplicated
  assert.equal(records[0].count, 2);
});

test('incrementRecordCount with a negative delta decrements but never below 0', () => {
  const zikr = makeZikr();
  let records: DailyZikrRecord[] = [];
  records = incrementRecordCount(records, zikr, '2026-10-25', 1, NOW);
  records = incrementRecordCount(records, zikr, '2026-10-25', -1, NOW);
  assert.equal(records[0].count, 0);
  const before = records;
  records = incrementRecordCount(records, zikr, '2026-10-25', -1, NOW);
  assert.equal(records[0].count, 0); // clamped, not negative
  assert.equal(records, before); // true no-op: same array reference
});

test('decrementing on a day with no record at all is a no-op (does not fabricate a record)', () => {
  const zikr = makeZikr();
  const records: DailyZikrRecord[] = [];
  const next = incrementRecordCount(records, zikr, '2026-10-25', -1, NOW);
  assert.equal(next.length, 0);
  assert.equal(next, records);
});

test('exceeding the daily target preserves the actual count beyond 100%', () => {
  const zikr = makeZikr({ dailyTarget: 5 });
  let records: DailyZikrRecord[] = [];
  for (let i = 0; i < 8; i++) records = incrementRecordCount(records, zikr, '2026-10-25', 1, NOW);
  const rec = findRecord(records, zikr.id, '2026-10-25')!;
  assert.equal(rec.count, 8); // real count preserved, not clamped to target
  assert.equal(completionPercent(rec.count, rec.targetSnapshot), 100); // percent capped
  assert.equal(excessCount(rec.count, rec.targetSnapshot), 3);
  assert.equal(remainingCount(rec.count, rec.targetSnapshot), 0);
});

test('correctRecordCount always materializes a record, including an explicit 0', () => {
  const zikr = makeZikr();
  const records = correctRecordCount([], zikr, '2026-10-25', 0, NOW);
  assert.equal(records.length, 1);
  assert.equal(records[0].count, 0);
});

test('correctRecordCount clamps negative/non-finite input to a safe 0', () => {
  const zikr = makeZikr();
  const records = correctRecordCount([], zikr, '2026-10-25', -5, NOW);
  assert.equal(records[0].count, 0);
});

test('a later edit to the zikr does not change an already-recorded day\'s snapshot', () => {
  const zikr = makeZikr({ dailyTarget: 10, name: 'Original Name' });
  let records = incrementRecordCount([], zikr, '2026-10-25', 3, NOW);
  // The zikr's live settings change after the fact...
  const editedZikr = { ...zikr, dailyTarget: 999, name: 'Renamed' };
  // ...but a same-day update only touches count, never re-snapshots:
  records = incrementRecordCount(records, editedZikr, '2026-10-25', 1, NOW);
  const rec = findRecord(records, zikr.id, '2026-10-25')!;
  assert.equal(rec.targetSnapshot, 10, 'historical target snapshot must stay stable');
  assert.equal(rec.nameSnapshot, 'Original Name');
  assert.equal(rec.count, 4);
});

test('a target change takes effect as a NEW snapshot starting the next day a record is created', () => {
  const zikr = makeZikr({ dailyTarget: 10 });
  let records = incrementRecordCount([], zikr, '2026-10-25', 5, NOW);
  const editedZikr = { ...zikr, dailyTarget: 50 };
  records = incrementRecordCount(records, editedZikr, '2026-10-26', 5, NOW);
  assert.equal(findRecord(records, zikr.id, '2026-10-25')!.targetSnapshot, 10);
  assert.equal(findRecord(records, zikr.id, '2026-10-26')!.targetSnapshot, 50);
});

test('dedupeRecords collapses duplicate (zikrId,date) entries keeping the latest updatedAt', () => {
  const dup: DailyZikrRecord[] = [
    { date: '2026-10-25', zikrId: 'cz_1', nameSnapshot: 'A', targetSnapshot: 10, count: 1, updatedAt: '2026-10-25T01:00:00.000Z' },
    { date: '2026-10-25', zikrId: 'cz_1', nameSnapshot: 'A', targetSnapshot: 10, count: 5, updatedAt: '2026-10-25T02:00:00.000Z' },
  ];
  const result = dedupeRecords(dup);
  assert.equal(result.length, 1);
  assert.equal(result[0].count, 5);
});

// ─── Eligibility & day classification ────────────────────────────────

test('a date before the zikr was created is never eligible', () => {
  const zikr = makeZikr({ createdAt: '2026-10-20T00:00:00.000Z' });
  assert.equal(isZikrEligibleOnDate(zikr, '2026-10-19', '2026-10-25', false), false);
  assert.equal(isZikrEligibleOnDate(zikr, '2026-10-20', '2026-10-25', false), false); // active, not today, no record
  assert.equal(isZikrEligibleOnDate(zikr, '2026-10-25', '2026-10-25', false), true); // today, active, untouched
});

test('a future date is never eligible even with a (hypothetical) record', () => {
  const zikr = makeZikr();
  assert.equal(isZikrEligibleOnDate(zikr, '2026-11-01', '2026-10-25', true), false);
});

test('a past day WITH a real record stays eligible regardless of current status (history preserved)', () => {
  const zikr = makeZikr({ status: 'archived' });
  assert.equal(isZikrEligibleOnDate(zikr, '2026-10-20', '2026-10-25', true), true);
});

test('a paused zikr contributes no phantom "missed" entry for today', () => {
  const zikr = makeZikr({ status: 'paused' });
  assert.equal(isZikrEligibleOnDate(zikr, '2026-10-25', '2026-10-25', false), false);
});

test('an archived zikr likewise contributes nothing new for today', () => {
  const zikr = makeZikr({ status: 'archived' });
  assert.equal(isZikrEligibleOnDate(zikr, '2026-10-25', '2026-10-25', false), false);
});

test('buildDayZikrDetail returns null for an ineligible (zikr,date) pair', () => {
  const zikr = makeZikr({ createdAt: '2026-10-20T00:00:00.000Z' });
  assert.equal(buildDayZikrDetail(zikr, '2026-10-19', '2026-10-25', undefined), null);
});

test('buildDayZikrDetail for today-untouched-active uses the live target with count 0', () => {
  const zikr = makeZikr({ dailyTarget: 33 });
  const detail = buildDayZikrDetail(zikr, '2026-10-25', '2026-10-25', undefined)!;
  assert.equal(detail.count, 0);
  assert.equal(detail.target, 33);
  assert.equal(detail.hasRecord, false);
  assert.equal(detail.status, 'not-started');
});

test('classifyDay distinguishes no-data, zero, partial, and complete', () => {
  assert.equal(classifyDay(0, 0, false), 'no-data');
  assert.equal(classifyDay(0, 100, true), 'zero');
  assert.equal(classifyDay(40, 100, true), 'partial');
  assert.equal(classifyDay(100, 100, true), 'complete');
  assert.equal(classifyDay(150, 100, true), 'complete'); // exceeding still reads as complete
});

test('buildDaySummary: a day with no eligible zikr at all is no-data, not a verified zero', () => {
  const zikr = makeZikr({ createdAt: '2026-10-26T00:00:00.000Z' }); // created AFTER this date
  const summary = buildDaySummary([zikr], [], '2026-10-25', '2026-10-26');
  assert.equal(summary.state, 'no-data');
  assert.equal(summary.zikrs.length, 0);
});

test('buildDaySummary: an explicit correction to 0 on an otherwise-untouched day reads as zero, not no-data', () => {
  const zikr = makeZikr();
  const records = correctRecordCount([], zikr, '2026-10-25', 0, NOW);
  const summary = buildDaySummary([zikr], records, '2026-10-25', '2026-10-25');
  assert.equal(summary.state, 'zero');
  assert.equal(summary.zikrs.length, 1);
  assert.equal(summary.zikrs[0].hasRecord, true);
});

test('buildDaySummary: mixed zikr targets aggregate into one overall percent', () => {
  const zikrA = makeZikr({ id: 'cz_a', dailyTarget: 10 });
  const zikrB = makeZikr({ id: 'cz_b', dailyTarget: 10, name: 'B' });
  let records: DailyZikrRecord[] = [];
  records = incrementRecordCount(records, zikrA, '2026-10-25', 10, NOW); // complete
  records = incrementRecordCount(records, zikrB, '2026-10-25', 5, NOW); // half
  const summary = buildDaySummary([zikrA, zikrB], records, '2026-10-25', '2026-10-25');
  assert.equal(summary.totalCount, 15);
  assert.equal(summary.totalTarget, 20);
  assert.equal(summary.percent, 75);
  assert.equal(summary.state, 'partial');
});

// ─── Calendar window ─────────────────────────────────────────────────

test('buildCalendarWindow(offset=0) returns exactly 30 dates ending today, oldest first', () => {
  const window = buildCalendarWindow('2026-10-25', 0);
  assert.equal(window.length, CALENDAR_WINDOW_SIZE);
  assert.equal(window[window.length - 1], '2026-10-25');
  assert.equal(window[0], addDaysToKey('2026-10-25', -29));
  // strictly increasing, one day apart
  for (let i = 1; i < window.length; i++) {
    assert.equal(addDaysToKey(window[i - 1], 1), window[i]);
  }
});

test('buildCalendarWindow(offset=1) is the 30 days immediately before window 0, with no overlap', () => {
  const w0 = buildCalendarWindow('2026-10-25', 0);
  const w1 = buildCalendarWindow('2026-10-25', 1);
  assert.equal(addDaysToKey(w1[w1.length - 1], 1), w0[0]);
  const overlap = w0.filter((d) => w1.includes(d));
  assert.equal(overlap.length, 0);
});

test('calendar window navigation never mutates the records/zikrs passed around it', () => {
  const zikr = makeZikr();
  const records = incrementRecordCount([], zikr, '2026-10-25', 1, NOW);
  const before = JSON.stringify(records);
  buildCalendarWindow('2026-10-25', 0);
  buildCalendarWindow('2026-10-25', 3);
  assert.equal(JSON.stringify(records), before);
});

// ─── Period stats & denominators ────────────────────────────────────

test('periodStatsForZikr: a brand-new zikr only contributes from its creation date onward', () => {
  const zikr = makeZikr({ createdAt: '2026-10-24T00:00:00.000Z', dailyTarget: 10 });
  const records = incrementRecordCount([], zikr, '2026-10-24', 10, NOW);
  // Asking for a 30-day window that starts well before creation:
  const stats = periodStatsForZikr(zikr, records, '2026-09-25', '2026-10-25');
  // today (10-25) untouched+active adds 10 to target; 10-24 contributes 10/10.
  assert.equal(stats.totalCount, 10);
  assert.equal(stats.totalTarget, 20);
});

test('periodStatsForZikr: a paused zikr keeps its past record but does not add an untouched-today target', () => {
  const zikr = makeZikr({ status: 'paused', dailyTarget: 10, createdAt: '2026-10-01T00:00:00.000Z' });
  const records = incrementRecordCount([], { ...zikr, status: 'active' }, '2026-10-20', 10, NOW);
  const stats = periodStatsForZikr(zikr, records, '2026-10-01', '2026-10-25');
  assert.equal(stats.totalCount, 10);
  assert.equal(stats.totalTarget, 10); // only the real past record, nothing added for today
});

test('periodStatsForZikr: an archived zikr behaves the same way — history kept, no phantom today entry', () => {
  const zikr = makeZikr({ status: 'archived', dailyTarget: 10, createdAt: '2026-10-01T00:00:00.000Z' });
  const records = incrementRecordCount([], { ...zikr, status: 'active' }, '2026-10-20', 4, NOW);
  const stats = periodStatsForZikr(zikr, records, '2026-10-01', '2026-10-25');
  assert.equal(stats.totalCount, 4);
  assert.equal(stats.totalTarget, 10);
});

test('periodStatsForAllZikr: overall totals are the sum of per-zikr totals, not a separate calculation', () => {
  const zikrA = makeZikr({ id: 'cz_a', dailyTarget: 10, createdAt: '2026-10-01T00:00:00.000Z' });
  const zikrB = makeZikr({ id: 'cz_b', dailyTarget: 20, name: 'B', createdAt: '2026-10-01T00:00:00.000Z' });
  let records: DailyZikrRecord[] = [];
  records = incrementRecordCount(records, zikrA, '2026-10-25', 10, NOW);
  records = incrementRecordCount(records, zikrB, '2026-10-25', 10, NOW);
  const { overall, perZikr } = periodStatsForAllZikr([zikrA, zikrB], records, '2026-10-25', '2026-10-25');
  const sumCount = perZikr.reduce((s, p) => s + p.totalCount, 0);
  const sumTarget = perZikr.reduce((s, p) => s + p.totalTarget, 0);
  assert.equal(overall.totalCount, sumCount);
  assert.equal(overall.totalTarget, sumTarget);
  assert.equal(overall.totalCount, 20);
  assert.equal(overall.totalTarget, 30);
});

test('periodStatsForAllZikr never double counts and never includes a zikr not yet created in range', () => {
  const oldZikr = makeZikr({ id: 'cz_old', createdAt: '2026-01-01T00:00:00.000Z', dailyTarget: 1 });
  const newZikr = makeZikr({ id: 'cz_new', createdAt: '2026-10-25T00:00:00.000Z', dailyTarget: 1, name: 'New' });
  const { perZikr } = periodStatsForAllZikr([oldZikr, newZikr], [], '2026-10-01', '2026-10-25');
  const newStats = perZikr.find((p) => p.zikrId === 'cz_new')!;
  // new zikr: only today (its creation day) is in range, so target=1, not 25 days worth.
  assert.equal(newStats.totalTarget, 1);
});

test('countFullyCompletedDays counts only days where every eligible zikr met its target', () => {
  const zikr = makeZikr({ dailyTarget: 5, createdAt: '2026-10-20T00:00:00.000Z' });
  let records: DailyZikrRecord[] = [];
  records = incrementRecordCount(records, zikr, '2026-10-20', 5, NOW); // complete
  records = incrementRecordCount(records, zikr, '2026-10-21', 2, NOW); // partial
  // 10-22, 10-23, 10-24 untouched and not today -> no-data, excluded
  records = incrementRecordCount(records, zikr, '2026-10-25', 5, NOW); // complete (today)
  const n = countFullyCompletedDays([zikr], records, '2026-10-20', '2026-10-25');
  assert.equal(n, 2);
});

test('firstOfMonthKey derives the first calendar day of the given date\'s month', () => {
  assert.equal(firstOfMonthKey('2026-10-25'), '2026-10-01');
  assert.equal(firstOfMonthKey('2026-01-05'), '2026-01-01');
});

// ─── Migration / malformed storage recovery ─────────────────────────

test('migrateTrackerData returns an empty structure for completely absent/foreign data', () => {
  assert.deepEqual(migrateTrackerData(undefined), emptyTrackerData());
  assert.deepEqual(migrateTrackerData(null), emptyTrackerData());
  assert.deepEqual(migrateTrackerData('garbage string'), emptyTrackerData());
  assert.deepEqual(migrateTrackerData({ totallyUnrelated: true }), emptyTrackerData());
});

test('migrateTrackerData keeps every valid entry and drops only malformed ones', () => {
  const raw = {
    version: 1,
    zikrs: [
      { id: 'cz_1', name: 'Good', dailyTarget: 10, status: 'active', createdAt: NOW, updatedAt: NOW },
      { id: 'cz_2', name: '', dailyTarget: 10 }, // bad: empty name
      { id: 'cz_3', name: 'BadTarget', dailyTarget: -5 }, // bad: invalid target
      null,
      'not an object',
    ],
    records: [
      { date: '2026-10-25', zikrId: 'cz_1', nameSnapshot: 'Good', targetSnapshot: 10, count: 3, updatedAt: NOW },
      { date: 'not-a-date', zikrId: 'cz_1', nameSnapshot: 'Good', targetSnapshot: 10, count: 1, updatedAt: NOW }, // bad date
      { date: '2026-10-24', zikrId: 'cz_missing', nameSnapshot: 'Ghost', targetSnapshot: 10, count: 1, updatedAt: NOW }, // orphan zikr
    ],
  };
  const result = migrateTrackerData(raw);
  assert.equal(result.zikrs.length, 1);
  assert.equal(result.zikrs[0].id, 'cz_1');
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].zikrId, 'cz_1');
});

test('migrateTrackerData deduplicates records that somehow ended up duplicated on disk', () => {
  const raw = {
    version: 1,
    zikrs: [{ id: 'cz_1', name: 'Good', dailyTarget: 10, status: 'active', createdAt: NOW, updatedAt: NOW }],
    records: [
      { date: '2026-10-25', zikrId: 'cz_1', nameSnapshot: 'Good', targetSnapshot: 10, count: 1, updatedAt: '2026-10-25T01:00:00.000Z' },
      { date: '2026-10-25', zikrId: 'cz_1', nameSnapshot: 'Good', targetSnapshot: 10, count: 9, updatedAt: '2026-10-25T02:00:00.000Z' },
    ],
  };
  const result = migrateTrackerData(raw);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].count, 9);
});

test('migrateTrackerData never throws on deeply malformed input', () => {
  const inputs: unknown[] = [42, [], true, { version: 1, zikrs: 'nope', records: 123 }];
  for (const input of inputs) {
    assert.doesNotThrow(() => migrateTrackerData(input));
  }
});
