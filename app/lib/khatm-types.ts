// ═══════════════════════════════════════════
// FURQAN — Khatm Planner: types
//
// Builds entirely on the verified Tanzil dataset already shipped for
// the Quran Reader (public/quran/meta.json via app/lib/reader-data.ts)
// — no second Quran dataset, no invented Mushaf page numbers. Every
// reading portion this module produces is an ayah range, derived from
// the real per-surah ayah counts.
//
// QuranIndex/SurahAyahRef/AyahRange now live in app/lib/quran-index.ts,
// shared with the Nazera module — re-exported here so existing imports
// of these three names from './khatm-types' keep working unchanged.
// ═══════════════════════════════════════════

export type { QuranIndex, SurahAyahRef, AyahRange } from './quran-index';

export type PlanMode = 'targetDate' | 'duration';
export type ScheduleStyle = 'fivePrayers' | 'single';
export type PlanStatus = 'active' | 'paused' | 'completed';

export const PRAYER_SLOTS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerSlot = (typeof PRAYER_SLOTS)[number];

export interface DailyLogEntry {
  date: string; // YYYY-MM-DD
  ayahsRead: number;
  event?: 'restarted';
}

export type RescheduleReason = 'user-adjusted' | 'fell-behind' | 'resumed-after-pause';

export interface RescheduleEntry {
  date: string; // YYYY-MM-DD
  previousTargetDate: string;
  newTargetDate: string;
  reason: RescheduleReason;
}

/** A stable snapshot of "today's" target, computed once when the local
 *  date rolls over, so the day's prayer-slot split doesn't shift under
 *  the user as they complete slots within the same day. */
export interface DayAnchor {
  date: string; // YYYY-MM-DD this snapshot belongs to
  startCompletedAyahs: number;
  target: number; // today's fixed target ayah count
  slotsCompleted: number; // 0..PRAYER_SLOTS.length (or 0..1 for 'single')
}

export interface KhatmPlan {
  id: string;
  createdAt: string; // ISO timestamp
  mode: PlanMode;
  startDate: string; // YYYY-MM-DD
  targetDate: string; // YYYY-MM-DD — always concrete, even in duration mode
  scheduleStyle: ScheduleStyle;
  status: PlanStatus;
  completedAyahs: number; // 0..totalAyahs, global progress pointer
  pausedAt?: string; // YYYY-MM-DD
  completedAt?: string; // ISO timestamp
  history: DailyLogEntry[];
  rescheduleLog: RescheduleEntry[];
  dayAnchor: DayAnchor | null;
}

export interface CreatePlanParams {
  mode: PlanMode;
  targetDate?: string; // required if mode === 'targetDate'
  durationDays?: number; // required if mode === 'duration'
  scheduleStyle: ScheduleStyle;
}

export interface PlanValidationError {
  code: 'target-date-not-future' | 'duration-not-positive' | 'missing-field';
  message: string;
}
