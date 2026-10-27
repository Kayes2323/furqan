// ═══════════════════════════════════════════
// FURQAN — Quran Journey (কুরআন যাত্রা): types
//
// The Journey layer sits ON TOP of the two existing engines and never
// replaces them: Khatm progress lives only in KhatmPlan
// (furqan_khatm_plan), Nazera progress only in NazeraProfile
// (furqan_nazera_profile). A JourneyPlan stores the user's *goals,
// assumptions and preferences* that were used to configure those
// records — never a second copy of progress.
// ═══════════════════════════════════════════

import type { PrayerSlot } from './khatm-types';

export type JourneyTab = 'plan' | 'khatm' | 'nazera' | 'progress';
export const JOURNEY_TABS: readonly JourneyTab[] = ['plan', 'khatm', 'nazera', 'progress'];

export type JourneyGoal = 'khatm' | 'nazera' | 'both';
export type JourneyPace = 'deadline' | 'sustainable';
export type SpeedSource = 'default' | 'user' | 'calibrated';
export type SpeedChoice = 'slow' | 'normal' | 'fast' | 'unknown';

/** Prayer slots to read at, or the single-session style. */
export type JourneySlots = PrayerSlot[] | 'single';

export interface SessionLogEntry {
  date: string; // YYYY-MM-DD
  ayahs: number;
  letters: number;
  minutes: number;
}

export interface AdjustmentLogEntry {
  date: string; // YYYY-MM-DD
  note: string;
}

/** Computed at save time so the plan screen can show the assumptions the
 *  plan was built on, even if the underlying records move on later. */
export interface JourneyAssumptions {
  khatmDailyAyahs: number | null;
  khatmDailyMinutes: number | null;
  nazeraDailyAyahs: number | null;
  nazeraDailyMinutes: number | null;
  estimatedKhatmCompletion: string | null; // YYYY-MM-DD, an estimate — not a guarantee
  requestedTargetDate: string | null; // what the user asked for (may differ if unrealistic)
}

export interface JourneyPlan {
  schemaVersion: 1;
  id: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  goal: JourneyGoal;
  /** true = one reading counts toward both Khatm and Nazera */
  sharedReading: boolean;
  pace: JourneyPace;
  targetDate: string | null; // YYYY-MM-DD, only when pace === 'deadline'
  dailyMinutes: number;
  lettersPerMinute: number;
  speedSource: SpeedSource;
  slots: JourneySlots;
  /** weekdays (0 = Sunday … 6 = Saturday) the user said are hard */
  lightDays: number[];
  assumptions: JourneyAssumptions;
  sessionLog: SessionLogEntry[]; // optional "how long did it take" calibration samples (last 30)
  adjustments: AdjustmentLogEntry[]; // transparent record of changes the user approved (last 30)
}
