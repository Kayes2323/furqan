// ═══════════════════════════════════════════
// FURQAN — Personal Custom Zikr Tracker: pure engine
//
// Every function here is pure (no DOM, no localStorage, no Date.now()
// side effects beyond taking the clock as an explicit argument) so the
// whole model is unit-testable without a browser — see
// zikr-tracker-engine.test.ts. Only zikr-tracker-storage.ts touches
// localStorage, mirroring the existing reader-progress.ts /
// zikr-progress.ts convention.
//
// ── Eligibility & denominator rule (documented, not just implemented) ──
// A (zikr, date) pair counts toward a completion percentage's
// numerator/denominator if and only if:
//   1. date is on/after the zikr's creation date, and on/before today
//      (no future dates, nothing predating the zikr's existence).
//   2. EITHER a DailyZikrRecord already exists for (zikr.id, date) —
//      meaning the user genuinely interacted with it that day, kept
//      regardless of the zikr's *current* status, so pausing or
//      archiving a zikr never retroactively deletes its real history —
//   3. OR date === today AND the zikr's current status is 'active' —
//      i.e. only *today* is ever counted as "scheduled but not yet
//      touched" for a currently-active zikr. A paused/archived zikr
//      contributes no such phantom "missed" entry for today or any
//      future day, since rule 3 requires status === 'active'.
// This keeps lifetime/period totals honest (old records never vanish)
// while never penalizing a zikr the user has deliberately paused.
// ═══════════════════════════════════════════

import type {
  CustomZikr,
  DailyZikrRecord,
  ZikrStatus,
  ZikrTrackerData,
  ZikrInput,
  ValidationResult,
  DayState,
  DayZikrDetail,
  DaySummary,
  PeriodStats,
  PerZikrPeriodStats,
} from './zikr-tracker-types';
import { ZIKR_TRACKER_VERSION } from './zikr-tracker-types.ts';

// ─── IDs ──────────────────────────────────────────────────────────────

export function generateZikrId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `cz_${crypto.randomUUID()}`;
  }
  // Fallback for environments without crypto.randomUUID (older browsers).
  return `cz_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ─── Local date-key helpers ───────────────────────────────────────────
// Every helper here uses the Date object's LOCAL getters (getFullYear/
// getMonth/getDate), never UTC/ISO slicing, so a user whose system
// timezone is Asia/Dhaka (or anything else) gets the calendar day their
// own clock says it is — never shifted by a UTC conversion.

/** Local YYYY-MM-DD for the given Date (defaults to now). */
export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Same as dateKey(), named to match the call-sites that mean "today". */
export function todayKey(now: Date = new Date()): string {
  return dateKey(now);
}

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateKey(key: unknown): key is string {
  if (typeof key !== 'string' || !DATE_KEY_RE.test(key)) return false;
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

/** Parses a YYYY-MM-DD key into a local Date at local midnight. */
function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Extracts the local calendar date (YYYY-MM-DD) that an ISO timestamp
 *  falls on, in the *viewer's* local timezone — used to find which day
 *  a zikr was created on, from its createdAt ISO string. */
export function isoToLocalDateKey(iso: string): string {
  const d = new Date(iso);
  return dateKey(d);
}

/** key +/- delta days, as a new YYYY-MM-DD key. Pure local-date math
 *  (via setDate, which correctly rolls over month/year boundaries). */
export function addDaysToKey(key: string, delta: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + delta);
  return dateKey(d);
}

export function compareDateKeys(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

// ─── Validation ───────────────────────────────────────────────────────

export const ZIKR_NAME_MAX_LEN = 120;
export const ZIKR_TARGET_MAX = 1_000_000; // generous, but keeps math/UI safe

export function validateZikrInput(input: Partial<ZikrInput>): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) {
    errors.name = 'নাম আবশ্যক।';
  } else if (name.length > ZIKR_NAME_MAX_LEN) {
    errors.name = `নাম সর্বোচ্চ ${ZIKR_NAME_MAX_LEN} অক্ষরের মধ্যে রাখুন।`;
  }

  const target = input.dailyTarget;
  if (target === undefined || target === null || Number.isNaN(target as number)) {
    errors.dailyTarget = 'দৈনিক লক্ষ্য আবশ্যক।';
  } else if (!Number.isInteger(target) || !Number.isSafeInteger(target) || target <= 0) {
    errors.dailyTarget = 'দৈনিক লক্ষ্য একটি পজিটিভ পূর্ণসংখ্যা হতে হবে।';
  } else if (target > ZIKR_TARGET_MAX) {
    errors.dailyTarget = `দৈনিক লক্ষ্য সর্বোচ্চ ${ZIKR_TARGET_MAX.toLocaleString('en-US')} হতে পারে।`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

function cleanOptionalText(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

// ─── CustomZikr CRUD (pure — operate on arrays, return new arrays) ────

export function createCustomZikr(input: ZikrInput, now: string, id: string = generateZikrId()): CustomZikr {
  return {
    id,
    name: input.name.trim(),
    arabic: cleanOptionalText(input.arabic),
    transliteration: cleanOptionalText(input.transliteration),
    notes: cleanOptionalText(input.notes),
    dailyTarget: Math.round(input.dailyTarget),
    category: cleanOptionalText(input.category),
    sourceRef: cleanOptionalText(input.sourceRef),
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
}

export function addZikr(zikrs: CustomZikr[], zikr: CustomZikr): CustomZikr[] {
  return [...zikrs, zikr];
}

export function updateZikr(zikrs: CustomZikr[], id: string, patch: Partial<ZikrInput>, now: string): CustomZikr[] {
  return zikrs.map((z) => {
    if (z.id !== id) return z;
    return {
      ...z,
      name: patch.name !== undefined ? patch.name.trim() : z.name,
      arabic: patch.arabic !== undefined ? cleanOptionalText(patch.arabic) : z.arabic,
      transliteration: patch.transliteration !== undefined ? cleanOptionalText(patch.transliteration) : z.transliteration,
      notes: patch.notes !== undefined ? cleanOptionalText(patch.notes) : z.notes,
      dailyTarget: patch.dailyTarget !== undefined ? Math.round(patch.dailyTarget) : z.dailyTarget,
      category: patch.category !== undefined ? cleanOptionalText(patch.category) : z.category,
      sourceRef: patch.sourceRef !== undefined ? cleanOptionalText(patch.sourceRef) : z.sourceRef,
      updatedAt: now,
    };
  });
}

export function setZikrStatus(zikrs: CustomZikr[], id: string, status: ZikrStatus, now: string): CustomZikr[] {
  return zikrs.map((z) => (z.id === id ? { ...z, status, updatedAt: now } : z));
}

export function findZikr(zikrs: CustomZikr[], id: string): CustomZikr | undefined {
  return zikrs.find((z) => z.id === id);
}

// ─── Record CRUD (pure) ────────────────────────────────────────────────

export function findRecord(records: DailyZikrRecord[], zikrId: string, date: string): DailyZikrRecord | undefined {
  return records.find((r) => r.zikrId === zikrId && r.date === date);
}

/** Replaces or appends a record for (zikr.id, date), never producing a
 *  second record for the same key (the dedup invariant this whole
 *  module maintains). Internal helper shared by the three public
 *  mutators below. */
function upsertRecord(
  records: DailyZikrRecord[],
  zikr: CustomZikr,
  date: string,
  count: number,
  now: string,
): DailyZikrRecord[] {
  const idx = records.findIndex((r) => r.zikrId === zikr.id && r.date === date);
  if (idx === -1) {
    const created: DailyZikrRecord = {
      date,
      zikrId: zikr.id,
      nameSnapshot: zikr.name,
      targetSnapshot: zikr.dailyTarget,
      count,
      updatedAt: now,
    };
    return [...records, created];
  }
  const existing = records[idx];
  const next = [...records];
  // Only `count`/`updatedAt` change on an existing record — the
  // name/target snapshot taken on first touch is never overwritten by a
  // later edit to the zikr, by design (see module doc comment).
  next[idx] = { ...existing, count, updatedAt: now };
  return next;
}

/** +1 / -1 (or any delta). Never goes below 0. A no-op decrement on an
 *  untouched day (no existing record, delta < 0) is intentionally a
 *  no-op rather than materializing a meaningless zero record — compare
 *  correctRecordCount(), which *does* always materialize a record,
 *  since that's a deliberate "record this as N" action. */
export function incrementRecordCount(
  records: DailyZikrRecord[],
  zikr: CustomZikr,
  date: string,
  delta: number,
  now: string,
): DailyZikrRecord[] {
  const existing = findRecord(records, zikr.id, date);
  const current = existing?.count ?? 0;
  const next = Math.max(0, current + delta);
  if (next === current) return records; // true no-op, including the "-1 at 0" case
  return upsertRecord(records, zikr, date, next, now);
}

/** Deliberate manual correction to an exact count (always materializes
 *  a record, even to set an explicit 0 — see DayState's 'zero' vs
 *  'no-data' distinction). */
export function correctRecordCount(
  records: DailyZikrRecord[],
  zikr: CustomZikr,
  date: string,
  newCount: number,
  now: string,
): DailyZikrRecord[] {
  const safe = Number.isFinite(newCount) ? Math.max(0, Math.round(newCount)) : 0;
  return upsertRecord(records, zikr, date, safe, now);
}

/** Removes duplicate (zikrId, date) entries, keeping the one with the
 *  latest updatedAt — a defensive guard used during migration/load in
 *  case storage was ever corrupted or hand-edited. */
export function dedupeRecords(records: DailyZikrRecord[]): DailyZikrRecord[] {
  const byKey = new Map<string, DailyZikrRecord>();
  for (const r of records) {
    const key = `${r.zikrId}|${r.date}`;
    const prior = byKey.get(key);
    if (!prior || r.updatedAt > prior.updatedAt) byKey.set(key, r);
  }
  return Array.from(byKey.values());
}

// ─── Derived numbers ────────────────────────────────────────────────────

/** Capped at 100 — "Show target completion as 100% while preserving the
 *  actual count" means the *percentage* never exceeds 100, even though
 *  count can. Guards target<=0 (shouldn't happen past validation). */
export function completionPercent(count: number, target: number): number {
  if (target <= 0) return count > 0 ? 100 : 0;
  return Math.min(100, Math.round((count / target) * 100));
}

export function remainingCount(count: number, target: number): number {
  return Math.max(0, target - count);
}

export function excessCount(count: number, target: number): number {
  return Math.max(0, count - target);
}

// ─── Eligibility ────────────────────────────────────────────────────────

export function isZikrEligibleOnDate(
  zikr: CustomZikr,
  date: string,
  todayKeyStr: string,
  hasRecord: boolean,
): boolean {
  const createdKey = isoToLocalDateKey(zikr.createdAt);
  if (compareDateKeys(date, createdKey) < 0) return false; // before creation
  if (compareDateKeys(date, todayKeyStr) > 0) return false; // future date
  if (hasRecord) return true; // genuine past interaction, regardless of current status
  return date === todayKeyStr && zikr.status === 'active';
}

// ─── Day detail / summary ──────────────────────────────────────────────

export function buildDayZikrDetail(
  zikr: CustomZikr,
  date: string,
  todayKeyStr: string,
  record: DailyZikrRecord | undefined,
): DayZikrDetail | null {
  const hasRecord = record !== undefined;
  if (!isZikrEligibleOnDate(zikr, date, todayKeyStr, hasRecord)) return null;

  const target = record?.targetSnapshot ?? zikr.dailyTarget;
  const count = record?.count ?? 0;
  const name = record?.nameSnapshot ?? zikr.name;

  return {
    zikrId: zikr.id,
    name,
    arabic: zikr.arabic,
    target,
    count,
    remaining: remainingCount(count, target),
    percent: completionPercent(count, target),
    excess: excessCount(count, target),
    hasRecord,
    status: count >= target ? 'complete' : count > 0 ? 'partial' : 'not-started',
  };
}

export function classifyDay(totalCount: number, totalTarget: number, hasEligibleZikr: boolean): DayState {
  if (!hasEligibleZikr) return 'no-data';
  if (totalCount <= 0) return 'zero';
  if (totalCount >= totalTarget) return 'complete';
  return 'partial';
}

export function buildDaySummary(
  allZikrs: CustomZikr[],
  records: DailyZikrRecord[],
  date: string,
  todayKeyStr: string,
): DaySummary {
  const details: DayZikrDetail[] = [];
  for (const zikr of allZikrs) {
    const record = findRecord(records, zikr.id, date);
    const detail = buildDayZikrDetail(zikr, date, todayKeyStr, record);
    if (detail) details.push(detail);
  }
  const totalCount = details.reduce((s, d) => s + d.count, 0);
  const totalTarget = details.reduce((s, d) => s + d.target, 0);
  return {
    date,
    state: classifyDay(totalCount, totalTarget, details.length > 0),
    totalCount,
    totalTarget,
    percent: completionPercent(totalCount, totalTarget),
    zikrs: details,
  };
}

// ─── Calendar window ────────────────────────────────────────────────────

export const CALENDAR_WINDOW_SIZE = 30;

/** The `offset`-th 30-day window counting back from today: offset 0 is
 *  the most recent 30 days (including today); offset 1 is the 30 days
 *  before that; etc. Returned oldest-first. Window navigation never
 *  mutates any stored data — it's pure date arithmetic. */
export function buildCalendarWindow(
  todayKeyStr: string,
  offset: number,
  size: number = CALENDAR_WINDOW_SIZE,
): string[] {
  const endKey = addDaysToKey(todayKeyStr, -offset * size);
  const keys: string[] = [];
  for (let i = size - 1; i >= 0; i--) {
    keys.push(addDaysToKey(endKey, -i));
  }
  return keys;
}

// ─── Period / stats aggregation ─────────────────────────────────────────

/** Stats for one zikr across [startKey, todayKeyStr], clamped so the
 *  range never starts before the zikr's own creation date — "do not
 *  count dates before a zikr was created". See module doc comment for
 *  the full eligibility/denominator rule this implements. */
export function periodStatsForZikr(
  zikr: CustomZikr,
  records: DailyZikrRecord[],
  startKey: string,
  todayKeyStr: string,
): PeriodStats {
  const createdKey = isoToLocalDateKey(zikr.createdAt);
  const effectiveStart = compareDateKeys(startKey, createdKey) > 0 ? startKey : createdKey;

  const relevant = records.filter(
    (r) => r.zikrId === zikr.id && compareDateKeys(r.date, effectiveStart) >= 0 && compareDateKeys(r.date, todayKeyStr) <= 0,
  );

  const totalCount = relevant.reduce((s, r) => s + r.count, 0);
  let totalTarget = relevant.reduce((s, r) => s + r.targetSnapshot, 0);

  const hasTodayRecord = relevant.some((r) => r.date === todayKeyStr);
  const todayInRange = compareDateKeys(todayKeyStr, effectiveStart) >= 0;
  if (!hasTodayRecord && zikr.status === 'active' && todayInRange) {
    totalTarget += zikr.dailyTarget;
  }

  return { totalCount, totalTarget, percent: completionPercent(totalCount, totalTarget) };
}

export function periodStatsForAllZikr(
  zikrs: CustomZikr[],
  records: DailyZikrRecord[],
  startKey: string,
  todayKeyStr: string,
): { overall: PeriodStats; perZikr: PerZikrPeriodStats[] } {
  const perZikr: PerZikrPeriodStats[] = zikrs.map((z) => {
    const stats = periodStatsForZikr(z, records, startKey, todayKeyStr);
    return { ...stats, zikrId: z.id, name: z.name, status: z.status };
  });
  const totalCount = perZikr.reduce((s, p) => s + p.totalCount, 0);
  const totalTarget = perZikr.reduce((s, p) => s + p.totalTarget, 0);
  return {
    overall: { totalCount, totalTarget, percent: completionPercent(totalCount, totalTarget) },
    perZikr,
  };
}

/** Counts how many days in [startKey, todayKeyStr] had state === 'complete'
 *  (i.e. every eligible zikr that day met its target) — "number of days
 *  with all tracked targets completed". */
export function countFullyCompletedDays(
  zikrs: CustomZikr[],
  records: DailyZikrRecord[],
  startKey: string,
  todayKeyStr: string,
): number {
  let count = 0;
  let cursor = startKey;
  while (compareDateKeys(cursor, todayKeyStr) <= 0) {
    const summary = buildDaySummary(zikrs, records, cursor, todayKeyStr);
    if (summary.state === 'complete') count++;
    if (cursor === todayKeyStr) break;
    cursor = addDaysToKey(cursor, 1);
  }
  return count;
}

export function firstOfMonthKey(todayKeyStr: string): string {
  const [y, m] = todayKeyStr.split('-');
  return `${y}-${m}-01`;
}

// ─── Migration / sanitization (defensive, never throws) ────────────────

const VALID_STATUSES: ZikrStatus[] = ['active', 'paused', 'archived'];

function sanitizeZikr(raw: unknown): CustomZikr | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id) return null;
  if (typeof r.name !== 'string' || !r.name.trim()) return null;
  const target = typeof r.dailyTarget === 'number' ? r.dailyTarget : NaN;
  if (!Number.isInteger(target) || target <= 0) return null;
  const now = new Date().toISOString();
  return {
    id: r.id,
    name: r.name.trim().slice(0, ZIKR_NAME_MAX_LEN),
    arabic: cleanOptionalText(r.arabic),
    transliteration: cleanOptionalText(r.transliteration),
    notes: cleanOptionalText(r.notes),
    dailyTarget: Math.min(ZIKR_TARGET_MAX, Math.round(target)),
    category: cleanOptionalText(r.category),
    sourceRef: cleanOptionalText(r.sourceRef),
    status: VALID_STATUSES.includes(r.status as ZikrStatus) ? (r.status as ZikrStatus) : 'active',
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : now,
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : now,
  };
}

function sanitizeRecord(raw: unknown): DailyZikrRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.zikrId !== 'string' || !r.zikrId) return null;
  if (!isValidDateKey(r.date)) return null;
  const count = typeof r.count === 'number' && Number.isFinite(r.count) ? Math.max(0, Math.round(r.count)) : null;
  const target = typeof r.targetSnapshot === 'number' && Number.isFinite(r.targetSnapshot) ? Math.max(1, Math.round(r.targetSnapshot)) : null;
  if (count === null || target === null) return null;
  return {
    date: r.date as string,
    zikrId: r.zikrId,
    nameSnapshot: typeof r.nameSnapshot === 'string' && r.nameSnapshot ? r.nameSnapshot : '(নামহীন)',
    targetSnapshot: target,
    count,
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : new Date().toISOString(),
  };
}

export function emptyTrackerData(): ZikrTrackerData {
  return { version: ZIKR_TRACKER_VERSION, zikrs: [], records: [] };
}

/** Best-effort recovery, never throws, never wipes data that validates.
 *  - Completely absent/unrecognized input (first run, or truly foreign
 *    data with no version marker) -> start empty; there is nothing
 *    structured to salvage.
 *  - A recognizable blob with some malformed entries -> keep every
 *    entry that passes sanitization and drop only the bad ones, so a
 *    partially-corrupted store never loses everything. */
export function migrateTrackerData(raw: unknown): ZikrTrackerData {
  if (!raw || typeof raw !== 'object') return emptyTrackerData();
  const obj = raw as Record<string, unknown>;
  if (typeof obj.version !== 'number') return emptyTrackerData();

  const zikrs = Array.isArray(obj.zikrs)
    ? (obj.zikrs.map(sanitizeZikr).filter((z): z is CustomZikr => z !== null))
    : [];
  const validZikrIds = new Set(zikrs.map((z) => z.id));
  const records = Array.isArray(obj.records)
    ? dedupeRecords(
        obj.records
          .map(sanitizeRecord)
          .filter((r): r is DailyZikrRecord => r !== null)
          .filter((r) => validZikrIds.has(r.zikrId)),
      )
    : [];

  return { version: ZIKR_TRACKER_VERSION, zikrs, records };
}
