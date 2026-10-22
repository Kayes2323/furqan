// ═══════════════════════════════════════════
// FURQAN — Nazera: types
//
// Nazera (نظرة) is reading the Quran while looking at the verified
// Arabic text — a regular reading-practice habit, not memorization
// (Hifz) and not a race to finish the whole Quran by a deadline
// (Khatm, app/lib/khatm-types.ts). Its progress pointer is therefore
// deliberately independent of both: a user may run Nazera practice,
// a Khatm plan, and casual Reader browsing at the same time, each
// tracking its own position, exactly as the existing Khatm module
// already keeps itself independent of the plain Reader's last-read.
//
// Builds entirely on the shared app/lib/quran-index.ts (itself built
// from the verified Tanzil dataset) — no second Quran dataset, no
// invented Mushaf page numbers.
// ═══════════════════════════════════════════

import type { SurahAyahRef } from './quran-index';

export type NazeraTargetMode = 'ayahs' | 'sessions';

export interface NazeraDailyLogEntry {
  date: string; // YYYY-MM-DD
  progress: number; // ayahs read (mode 'ayahs') or sessions completed (mode 'sessions') that day
  target: number; // that day's own target, in the same unit, for an honest historical record
  metTarget: boolean;
}

/** A stable snapshot of "today", computed once when the local date
 *  rolls over (mirrors app/lib/khatm-types.ts's DayAnchor and the
 *  Zikr module's daily-reset pattern), so today's target doesn't
 *  shift under the user mid-day. */
export interface NazeraDayAnchor {
  date: string;
  startPosition: number; // position value at the start of this day
  target: number; // today's fixed target, in targetMode's unit
  progressToday: number; // ayahs read (mode 'ayahs') or sessions completed (mode 'sessions') so far today
}

export interface NazeraProfile {
  id: string;
  createdAt: string;
  targetMode: NazeraTargetMode;
  dailyAyahTarget: number; // active when targetMode === 'ayahs'
  dailySessionTarget: number; // active when targetMode === 'sessions'
  ayahsPerSession: number; // how many ayahs one logged session advances position by
  /** Global ayah position already practiced (0 = nothing yet). The next
   *  unread ayah is position+1, converted to surah:ayah via quran-index.ts —
   *  the same scheme app/lib/khatm-plan.ts uses for completedAyahs. */
  position: number;
  history: NazeraDailyLogEntry[];
  dayAnchor: NazeraDayAnchor | null;
}

export interface CreateNazeraParams {
  targetMode: NazeraTargetMode;
  dailyAyahTarget?: number; // required if targetMode === 'ayahs'
  dailySessionTarget?: number; // required if targetMode === 'sessions'
  ayahsPerSession?: number; // defaults applied if omitted
  startRef?: SurahAyahRef; // optional chosen starting point; defaults to 1:1
}

export interface NazeraValidationError {
  code: 'target-not-positive' | 'session-length-not-positive';
  message: string;
}

export interface NazeraConsistency {
  currentStreak: number; // consecutive days (ending today or yesterday) that met target
  last7DaysMet: number; // 0..7
}
