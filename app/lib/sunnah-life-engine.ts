// ═══════════════════════════════════════════
// FURQAN — Sunnah Life: pure engine
//
// No DOM, no localStorage — fully unit-testable (see
// sunnah-life-engine.test.ts). Only sunnah-life-storage.ts touches
// localStorage, mirroring the zikr-tracker-engine.ts / zikr-tracker-storage.ts
// split this module is deliberately modeled on.
// ═══════════════════════════════════════════

import { dateKey, todayKey, isValidDateKey, compareDateKeys } from './zikr-tracker-engine.ts';
import type {
  SunnahPractice,
  PracticeClassification,
  DailyPracticeRecord,
  PracticeTrackingStatus,
  SunnahLifeTrackerData,
  DayProgress,
} from './sunnah-life-types.ts';
import { SUNNAH_LIFE_TRACKER_VERSION } from './sunnah-life-types.ts';

export { dateKey, todayKey };

// ─── Religious evidence gate ───────────────────────────────────────────

/** A practice can only ever be treated as verified, published religious
 *  guidance when it is explicitly approved AND carries the reviewer
 *  identity/date that approval requires. This is the single choke point
 *  the rest of the app (and its tests) must go through — never check
 *  `review.status === 'approved'` directly elsewhere. */
export function isPublishableAsVerified(practice: SunnahPractice): boolean {
  return (
    practice.review.status === 'approved' &&
    !!practice.review.reviewerName &&
    !!practice.review.reviewDate
  );
}

export interface MetadataValidationResult {
  valid: boolean;
  errors: string[];
}

/** Checks the mandatory-field completeness the task's "quality gates"
 *  section requires of every published practice. This does NOT check
 *  whether the content is *true* (that's what a human reviewer is for) —
 *  only that the record is structurally complete and internally honest
 *  (e.g. a count claim can't be marked evidenced with no supporting note,
 *  an approved status can't exist without reviewer attribution). */
export function validatePracticeMetadata(practice: SunnahPractice): MetadataValidationResult {
  const errors: string[] = [];

  if (!practice.id) errors.push('id আবশ্যক');
  if (!practice.titleBn?.trim()) errors.push('titleBn আবশ্যক');
  if (!practice.instructionsBn?.trim()) errors.push('instructionsBn আবশ্যক');
  if (!practice.sourceReference) {
    errors.push('sourceReference আবশ্যক');
  } else if (practice.sourceReference.identifier && practice.sourceReference.identifierConfirmed === undefined) {
    errors.push('sourceReference.identifierConfirmed আবশ্যক যখন identifier আছে');
  }
  if (practice.sourceType !== 'general_habit' && !practice.sourceReference?.collection) {
    errors.push('ধর্মীয় উৎসের জন্য sourceReference.collection আবশ্যক');
  }
  if (practice.sourceType === 'general_habit' && practice.classification !== 'general_habit') {
    errors.push('sourceType general_habit হলে classification অবশ্যই general_habit হতে হবে — একে ভুলভাবে সুন্নাহ লেবেল করা যাবে না');
  }
  if (practice.evidencedVirtue && !practice.virtueNoteBn?.trim()) {
    errors.push('evidencedVirtue true হলে virtueNoteBn আবশ্যক');
  }
  if (!practice.evidencedCount && practice.instructionsBn?.match(/[\d০-৯]+\s*(বার|times)/i)) {
    errors.push('গণনা-সংখ্যা উল্লেখ আছে কিন্তু evidencedCount false — অনুমোদনহীন সংখ্যা দাবি করা যাবে না');
  }
  if (practice.review.status === 'approved' && !isPublishableAsVerified(practice)) {
    errors.push('status approved কিন্তু reviewerName/reviewDate অনুপস্থিত — অননুমোদিত content কে verified হিসেবে প্রকাশ করা যাবে না');
  }
  if (practice.review.versionHistory.length === 0) errors.push('versionHistory খালি রাখা যাবে না — অন্তত সৃষ্টির এন্ট্রি থাকা আবশ্যক');
  if (practice.lifeAreas.length === 0 && !practice.routineSlot) {
    errors.push('একটি practice অন্তত একটি routineSlot অথবা lifeArea-তে যুক্ত থাকতে হবে');
  }

  return { valid: errors.length === 0, errors };
}

export const CLASSIFICATION_LABEL_BN: Record<PracticeClassification, string> = {
  obligatory: 'ফরজ (আবশ্যক ইবাদত)',
  wajib: 'ওয়াজিব',
  emphasized_sunnah: 'সুন্নাতে মুয়াক্কাদাহ',
  sunnah: 'সুন্নাত',
  nafl: 'নফল',
  adab: 'আদব (শিষ্টাচার)',
  general_habit: 'সাধারণ উপকারী অভ্যাস',
};

// ─── Tracking records (snapshot-on-interaction, same invariant as
// zikr-tracker-engine's upsertRecord: a record is created only on actual
// user interaction, and its title/classification/content-version
// snapshot is taken once and never silently rewritten by a later edit
// to the registry — see "preserve past records when routines/targets/
// content change" in the task spec). ────────────────────────────────────

export function findPracticeRecord(
  records: DailyPracticeRecord[],
  practiceId: string,
  date: string,
): DailyPracticeRecord | undefined {
  return records.find((r) => r.practiceId === practiceId && r.date === date);
}

export function setPracticeStatus(
  records: DailyPracticeRecord[],
  practice: SunnahPractice,
  date: string,
  status: PracticeTrackingStatus,
  now: string,
): DailyPracticeRecord[] {
  const idx = records.findIndex((r) => r.practiceId === practice.id && r.date === date);
  if (idx === -1) {
    const created: DailyPracticeRecord = {
      date,
      practiceId: practice.id,
      status,
      titleSnapshot: practice.titleBn,
      classificationSnapshot: practice.classification,
      contentVersionSnapshot: practice.contentVersion,
      updatedAt: now,
    };
    return [...records, created];
  }
  const existing = records[idx];
  const next = [...records];
  // Only status/updatedAt change on an existing record — the snapshot
  // taken on first touch is never overwritten by a later registry edit.
  next[idx] = { ...existing, status, updatedAt: now };
  return next;
}

export function clearPracticeRecord(
  records: DailyPracticeRecord[],
  practiceId: string,
  date: string,
): DailyPracticeRecord[] {
  return records.filter((r) => !(r.practiceId === practiceId && r.date === date));
}

// ─── Progress / summary — religious practices and general habits are
// always reported as two separate totals, never combined into one score
// (per the task's explicit "no combined religious-worth score"). ───────

function emptyProgress(date: string): DayProgress {
  return { date, total: 0, completed: 0, partial: 0, skipped: 0, notApplicable: 0, remaining: 0 };
}

// `remaining` is intentionally left for buildDayProgress to compute
// afterward (total minus every settled bucket) rather than tracked here,
// so there is exactly one place that defines what "remaining" means.
function accumulate(progress: DayProgress, status: PracticeTrackingStatus | undefined): DayProgress {
  const next = { ...progress, total: progress.total + 1 };
  if (status === 'completed') next.completed += 1;
  else if (status === 'partial') next.partial += 1;
  else if (status === 'skipped') next.skipped += 1;
  else if (status === 'not_applicable') next.notApplicable += 1;
  return next;
}

export interface DayProgressSplit {
  religious: DayProgress;
  generalHabits: DayProgress;
}

export function buildDayProgress(
  practices: SunnahPractice[],
  records: DailyPracticeRecord[],
  date: string,
): DayProgressSplit {
  let religious = emptyProgress(date);
  let generalHabits = emptyProgress(date);

  for (const practice of practices) {
    const record = findPracticeRecord(records, practice.id, date);
    const bucket = practice.classification === 'general_habit' ? 'generalHabits' : 'religious';
    if (bucket === 'religious') {
      religious = accumulate(religious, record?.status);
    } else {
      generalHabits = accumulate(generalHabits, record?.status);
    }
  }

  // Recompute `remaining` cleanly: total minus every settled status
  // (completed/partial/skipped/not_applicable all count as "handled
  // today" — only a practice with no record yet is "remaining").
  religious.remaining = religious.total - religious.completed - religious.partial - religious.skipped - religious.notApplicable;
  generalHabits.remaining = generalHabits.total - generalHabits.completed - generalHabits.partial - generalHabits.skipped - generalHabits.notApplicable;

  return { religious, generalHabits };
}

// ─── Migration / sanitization (defensive, never throws) ────────────────

const VALID_STATUSES: PracticeTrackingStatus[] = ['completed', 'partial', 'skipped', 'not_applicable'];

function sanitizeRecord(raw: unknown): DailyPracticeRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.practiceId !== 'string' || !r.practiceId) return null;
  if (!isValidDateKey(r.date)) return null;
  if (!VALID_STATUSES.includes(r.status as PracticeTrackingStatus)) return null;
  if (typeof r.titleSnapshot !== 'string' || !r.titleSnapshot) return null;
  const contentVersionSnapshot = typeof r.contentVersionSnapshot === 'number' ? r.contentVersionSnapshot : 1;
  const classificationSnapshot = typeof r.classificationSnapshot === 'string'
    ? (r.classificationSnapshot as PracticeClassification)
    : 'general_habit';
  return {
    date: r.date as string,
    practiceId: r.practiceId,
    status: r.status as PracticeTrackingStatus,
    titleSnapshot: r.titleSnapshot,
    classificationSnapshot,
    contentVersionSnapshot,
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : new Date().toISOString(),
  };
}

/** Removes duplicate (practiceId, date) entries, keeping the latest. */
export function dedupeRecords(records: DailyPracticeRecord[]): DailyPracticeRecord[] {
  const byKey = new Map<string, DailyPracticeRecord>();
  for (const r of records) {
    const key = `${r.practiceId}|${r.date}`;
    const prior = byKey.get(key);
    if (!prior || r.updatedAt > prior.updatedAt) byKey.set(key, r);
  }
  return Array.from(byKey.values());
}

export function emptyTrackerData(): SunnahLifeTrackerData {
  return { version: SUNNAH_LIFE_TRACKER_VERSION, records: [] };
}

export function migrateTrackerData(raw: unknown): SunnahLifeTrackerData {
  if (!raw || typeof raw !== 'object') return emptyTrackerData();
  const obj = raw as Record<string, unknown>;
  if (typeof obj.version !== 'number') return emptyTrackerData();
  const records = Array.isArray(obj.records)
    ? dedupeRecords(obj.records.map(sanitizeRecord).filter((r): r is DailyPracticeRecord => r !== null))
    : [];
  return { version: SUNNAH_LIFE_TRACKER_VERSION, records };
}

export { compareDateKeys };
export function todayOrEarlier(date: string, today: string = todayKey()): boolean {
  return compareDateKeys(date, today) <= 0;
}
