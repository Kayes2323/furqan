// ═══════════════════════════════════════════
// FURQAN — Personal Custom Zikr Tracker: data model
//
// A deliberately separate system from app/lib/zikr-data.ts /
// zikr-progress.ts (the fixed "আত্মরক্ষার আমল" content + its
// tap-to-count/auto-advance flow). This is the user's OWN zikr list —
// freely created, edited, paused, archived — with a durable daily
// history, not a daily/nightly checklist reset.
//
// Core design choice: a DailyZikrRecord exists for a (zikr, date) pair
// ONLY when the user actually interacted with it that day (increment,
// decrement, or an explicit correction). Viewing a day never creates a
// record. This is what lets the calendar/stats distinguish "no
// recitations recorded" (no record) from "recorded, and it was zero"
// (a record with count 0, e.g. after an explicit correction).
// ═══════════════════════════════════════════

export type ZikrStatus = 'active' | 'paused' | 'archived';

export interface CustomZikr {
  id: string;
  name: string;
  arabic?: string;
  transliteration?: string;
  notes?: string;
  /** A positive integer, safely within Number.isSafeInteger and capped
   *  at ZIKR_TARGET_MAX (see zikr-tracker-engine.ts) so neither the math
   *  nor the UI ever has to handle an unsafe/absurd value. */
  dailyTarget: number;
  category?: string;
  /** Preserved verbatim if the user supplies one; never fabricated. */
  sourceRef?: string;
  status: ZikrStatus;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface DailyZikrRecord {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  zikrId: string;
  /** Snapshot of the zikr's name/target taken the moment this record was
   *  first created (first interaction that day) — never re-snapshotted
   *  on later same-day updates, and never touched by a later edit to the
   *  zikr itself, so historical completion percentages stay stable. */
  nameSnapshot: string;
  targetSnapshot: number;
  count: number;
  updatedAt: string; // ISO timestamp
}

export const ZIKR_TRACKER_VERSION = 1 as const;

export interface ZikrTrackerData {
  version: typeof ZIKR_TRACKER_VERSION;
  zikrs: CustomZikr[];
  records: DailyZikrRecord[];
}

/** Input shape for creating/editing a zikr — everything but name/target
 *  is optional, matching the product spec. */
export interface ZikrInput {
  name: string;
  arabic?: string;
  transliteration?: string;
  notes?: string;
  dailyTarget: number;
  category?: string;
  sourceRef?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof ZikrInput, string>>;
}

/** Per-date completion state for the calendar: 'no-data' means no
 *  eligible zikr had any record that day (nothing to show, not a
 *  verified zero); 'zero' means at least one eligible zikr existed that
 *  day but the combined count was literally 0; 'partial'/'complete'
 *  are the ordinary in-progress/done states. */
export type DayState = 'no-data' | 'zero' | 'partial' | 'complete';

export interface DayZikrDetail {
  zikrId: string;
  name: string;
  arabic?: string;
  target: number;
  count: number;
  remaining: number;
  /** Capped at 100 — see completionPercent() in the engine. The raw
   *  count/target relationship (including any excess) is still fully
   *  available via `count`/`target`/`excess`. */
  percent: number;
  excess: number;
  /** Whether this date's entry is a real stored record (so the caller
   *  can show "আজ এখনও গণনা করা হয়নি" rather than implying a 0 was
   *  deliberately recorded). */
  hasRecord: boolean;
  status: 'complete' | 'partial' | 'not-started';
}

export interface DaySummary {
  date: string;
  state: DayState;
  totalCount: number;
  totalTarget: number;
  percent: number; // capped 0..100
  zikrs: DayZikrDetail[]; // only the eligible ones for this date
}

export interface PeriodStats {
  totalCount: number;
  totalTarget: number;
  percent: number; // capped 0..100
}

export interface PerZikrPeriodStats extends PeriodStats {
  zikrId: string;
  name: string;
  status: ZikrStatus;
}
