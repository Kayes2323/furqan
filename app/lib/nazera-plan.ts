// ═══════════════════════════════════════════
// FURQAN — Nazera: pure reading-practice engine
//
// Every function here is pure (state in, state out), mirroring
// app/lib/khatm-plan.ts and app/lib/zikr-progress.ts. Unlike Khatm,
// there is no deadline or total-completion pacing formula — Nazera's
// whole point is a sustainable daily habit, so its target is whatever
// the user set and stays fixed until they change it; what the engine
// computes fresh each day is only the day's starting snapshot and the
// resulting streak/consistency record.
// ═══════════════════════════════════════════

import type { QuranIndex, AyahRange, SurahAyahRef } from './quran-index';
import { buildQuranIndex, globalToRef, rangeFromGlobal, clampRef, refToGlobal } from './quran-index.ts';
import { todayKey, daysBetween, addDays } from './date-utils.ts';
import type {
  NazeraProfile,
  CreateNazeraParams,
  NazeraValidationError,
  NazeraDayAnchor,
  NazeraConsistency,
  NazeraTargetMode,
} from './nazera-types';

export { todayKey, daysBetween, addDays, buildQuranIndex };

const DEFAULT_AYAHS_PER_SESSION = 10;

export function validateCreateParams(params: CreateNazeraParams): NazeraValidationError | null {
  if (params.targetMode === 'ayahs') {
    if (params.dailyAyahTarget == null || params.dailyAyahTarget <= 0) {
      return { code: 'target-not-positive', message: 'দৈনিক আয়াতের লক্ষ্য ১ বা তার বেশি হতে হবে' };
    }
  } else {
    if (params.dailySessionTarget == null || params.dailySessionTarget <= 0) {
      return { code: 'target-not-positive', message: 'দৈনিক সেশনের লক্ষ্য ১ বা তার বেশি হতে হবে' };
    }
  }
  if (params.ayahsPerSession != null && params.ayahsPerSession <= 0) {
    return { code: 'session-length-not-positive', message: 'প্রতি সেশনে আয়াতের সংখ্যা ১ বা তার বেশি হতে হবে' };
  }
  return null;
}

let profileIdCounter = 0;
function newProfileId(): string {
  profileIdCounter += 1;
  return `nazera-${Date.now()}-${profileIdCounter}`;
}

/** Creates a fresh profile. `startRef`, if given, is clamped against
 *  the real dataset (app/lib/quran-index.ts's clampRef) so an invalid
 *  or stale reference can never produce a broken starting position. */
export function createProfile(params: CreateNazeraParams, index: QuranIndex, today: string): NazeraProfile {
  const err = validateCreateParams(params);
  if (err) throw new Error(err.message);

  const startRef = params.startRef ? clampRef(index, params.startRef) : { surah: 1, ayah: 1 };
  const position = Math.max(0, refToGlobal(index, startRef) - 1);

  const fresh: NazeraProfile = {
    id: newProfileId(),
    createdAt: new Date().toISOString(),
    targetMode: params.targetMode,
    dailyAyahTarget: params.dailyAyahTarget ?? 10,
    dailySessionTarget: params.dailySessionTarget ?? 1,
    ayahsPerSession: params.ayahsPerSession ?? DEFAULT_AYAHS_PER_SESSION,
    position,
    history: [],
    dayAnchor: null,
  };
  return ensureDayAnchor(fresh, today);
}

function targetFor(profile: NazeraProfile): number {
  return profile.targetMode === 'ayahs' ? profile.dailyAyahTarget : profile.dailySessionTarget;
}

/** Returns the profile with a fresh DayAnchor for `today`, logging the
 *  previous anchor's actual progress into history first (including
 *  whether that day met its own target) if the date rolled over. A
 *  no-op if the anchor already matches `today`. */
export function ensureDayAnchor(profile: NazeraProfile, today: string): NazeraProfile {
  if (profile.dayAnchor && profile.dayAnchor.date === today) return profile;

  const history = [...profile.history];
  if (profile.dayAnchor) {
    const a = profile.dayAnchor;
    history.push({ date: a.date, progress: a.progressToday, target: a.target, metTarget: a.progressToday >= a.target });
  }

  const dayAnchor: NazeraDayAnchor = {
    date: today,
    startPosition: profile.position,
    target: targetFor(profile),
    progressToday: 0,
  };
  return { ...profile, history, dayAnchor };
}

/** Today's next unread portion. In 'ayahs' mode this is the whole
 *  remaining daily target as one range; in 'sessions' mode it is just
 *  the next single session's chunk (sessions are logged one at a
 *  time, not pre-split like Khatm's prayer slots). Null once the
 *  Quran itself is fully read, or (ayahs mode only) once today's
 *  target is met. */
export function todaysPortion(index: QuranIndex, profile: NazeraProfile): AyahRange | null {
  if (!profile.dayAnchor) return null;
  if (profile.position >= index.totalAyahs) return null;

  if (profile.targetMode === 'ayahs') {
    const remainingToday = profile.dayAnchor.target - profile.dayAnchor.progressToday;
    if (remainingToday <= 0) return null;
    const endGlobal = Math.min(index.totalAyahs, profile.position + remainingToday);
    if (endGlobal <= profile.position) return null;
    return rangeFromGlobal(index, profile.position + 1, endGlobal);
  }

  // sessions mode
  if (profile.dayAnchor.progressToday >= profile.dayAnchor.target) return null;
  const endGlobal = Math.min(index.totalAyahs, profile.position + profile.ayahsPerSession);
  if (endGlobal <= profile.position) return null;
  return rangeFromGlobal(index, profile.position + 1, endGlobal);
}

function finalizeAdvance(profile: NazeraProfile, index: QuranIndex, newPosition: number, progressDelta: number): NazeraProfile {
  if (!profile.dayAnchor) return profile;
  const cappedPosition = Math.min(index.totalAyahs, newPosition);
  return {
    ...profile,
    position: cappedPosition,
    dayAnchor: { ...profile.dayAnchor, progressToday: profile.dayAnchor.progressToday + progressDelta },
  };
}

/** 'ayahs' mode: marks the rest of today's target complete in one
 *  action. A no-op (never double-counts) once today's target is
 *  already met or the whole Quran is finished. */
export function markTodayComplete(index: QuranIndex, profile: NazeraProfile): NazeraProfile {
  if (profile.targetMode !== 'ayahs') return profile;
  const portion = todaysPortion(index, profile);
  if (!portion) return profile;
  return finalizeAdvance(profile, index, portion.endGlobal, portion.count);
}

/** 'ayahs' mode: advances the position by exactly `count` ayahs and
 *  counts them toward today's progress. Used when the same reading is
 *  deliberately shared with a Khatm plan (see journey-plan.ts). Capped at
 *  the end of the Quran; a no-op for non-positive counts. */
export function advanceAyahs(index: QuranIndex, profile: NazeraProfile, count: number): NazeraProfile {
  if (profile.targetMode !== 'ayahs' || !profile.dayAnchor || count <= 0) return profile;
  const newPosition = Math.min(index.totalAyahs, profile.position + count);
  const delta = newPosition - profile.position;
  if (delta <= 0) return profile;
  return finalizeAdvance(profile, index, newPosition, delta);
}

/** 'sessions' mode: logs exactly one session. A no-op once the day's
 *  session target is already met or the whole Quran is finished. */
export function markSessionComplete(index: QuranIndex, profile: NazeraProfile): NazeraProfile {
  if (profile.targetMode !== 'sessions') return profile;
  const portion = todaysPortion(index, profile);
  if (!portion) return profile;
  return finalizeAdvance(profile, index, portion.endGlobal, 1);
}

/** Lets the user jump their current reading position to a chosen
 *  surah:ayah (e.g. correcting drift, or picking up a passage they
 *  already read elsewhere) without resetting history/streak. The
 *  reference is clamped against the real dataset. */
export function jumpToPosition(index: QuranIndex, profile: NazeraProfile, ref: SurahAyahRef): NazeraProfile {
  const clamped = clampRef(index, ref);
  const position = Math.max(0, refToGlobal(index, clamped) - 1);
  return { ...profile, position };
}

/** Changes the daily target/mode/session length without touching
 *  position or history — forces a fresh day-anchor computation next
 *  time ensureDayAnchor runs. */
export function updateTargets(
  profile: NazeraProfile,
  params: { targetMode: NazeraTargetMode; dailyAyahTarget?: number; dailySessionTarget?: number; ayahsPerSession?: number },
): NazeraProfile {
  const err = validateCreateParams(params);
  if (err) throw new Error(err.message);
  return {
    ...profile,
    targetMode: params.targetMode,
    dailyAyahTarget: params.dailyAyahTarget ?? profile.dailyAyahTarget,
    dailySessionTarget: params.dailySessionTarget ?? profile.dailySessionTarget,
    ayahsPerSession: params.ayahsPerSession ?? profile.ayahsPerSession,
    dayAnchor: null,
  };
}

/** Current position as a surah:ayah ref (the last ayah actually
 *  completed), or null if nothing has been read yet. */
export function currentRef(index: QuranIndex, profile: NazeraProfile): SurahAyahRef | null {
  if (profile.position <= 0) return null;
  return globalToRef(index, profile.position);
}

/** The next unread ayah, or null once the whole Quran is finished. */
export function nextRef(index: QuranIndex, profile: NazeraProfile): SurahAyahRef | null {
  if (profile.position >= index.totalAyahs) return null;
  return globalToRef(index, profile.position + 1);
}

export function consistency(profile: NazeraProfile, today: string): NazeraConsistency {
  const byDate = new Map(profile.history.map((h) => [h.date, h]));
  // include today's live (not-yet-rolled-over) status if available
  if (profile.dayAnchor && profile.dayAnchor.date === today) {
    byDate.set(today, {
      date: today,
      progress: profile.dayAnchor.progressToday,
      target: profile.dayAnchor.target,
      metTarget: profile.dayAnchor.progressToday >= profile.dayAnchor.target,
    });
  }

  // An in-progress (not yet target-met) "today" shouldn't zero out an
  // otherwise-intact streak — the day isn't over yet. Start counting
  // from today only once today's own target is met; otherwise start
  // from yesterday and let today resolve by day's end.
  const todayEntry = byDate.get(today);
  let cursor = todayEntry?.metTarget ? today : addDays(today, -1);
  let currentStreak = 0;
  // a day with no entry at all (never visited) breaks the streak, same as a logged miss
  while (true) {
    const entry = byDate.get(cursor);
    if (!entry || !entry.metTarget) break;
    currentStreak++;
    cursor = addDays(cursor, -1);
  }

  let last7DaysMet = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, -i);
    const entry = byDate.get(d);
    if (entry?.metTarget) last7DaysMet++;
  }

  return { currentStreak, last7DaysMet };
}
