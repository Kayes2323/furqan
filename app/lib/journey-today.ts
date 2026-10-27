// ═══════════════════════════════════════════
// FURQAN — Quran Journey: "today" view-model (pure)
//
// Reads — never writes — the Khatm and Nazera records and describes
// what today's reading is and how far along it is. The two records stay
// separate; this only presents them side by side (or as one row when the
// user chose shared reading).
// ═══════════════════════════════════════════

import type { QuranIndex, AyahRange } from './quran-index';
import type { KhatmPlan } from './khatm-types';
import type { NazeraProfile } from './nazera-types';
import type { JourneyPlan } from './journey-types';
import { todaysPortion as khatmPortion } from './khatm-plan.ts';
import { todaysPortion as nazeraPortion } from './nazera-plan.ts';

export type TodayKind = 'khatm' | 'nazera' | 'shared';

export interface TodayItem {
  kind: TodayKind;
  /** ayahs read today vs today's target (or sessions, for session-mode Nazera) */
  done: number;
  target: number;
  unit: 'ayah' | 'session';
  portion: AyahRange | null; // what is still to read today
  complete: boolean;
  paused: boolean;
  finished: boolean; // the whole Quran is done for this record
}

/** Shared reading is in effect only while both pointers are on the same
 *  ayah — if they ever drift apart (e.g. one was edited by hand), one
 *  reading can no longer honestly count for both, so they run separately. */
export function isShared(journey: JourneyPlan | null, khatm: KhatmPlan | null, nazera: NazeraProfile | null): boolean {
  return !!journey?.sharedReading && !!khatm && !!nazera && journey.goal === 'both' && khatm.completedAyahs === nazera.position;
}

export function khatmToday(index: QuranIndex, khatm: KhatmPlan, kind: TodayKind = 'khatm'): TodayItem {
  const anchor = khatm.dayAnchor;
  const finished = khatm.status === 'completed' || khatm.completedAyahs >= index.totalAyahs;
  const target = anchor?.target ?? 0;
  const done = anchor ? Math.max(0, khatm.completedAyahs - anchor.startCompletedAyahs) : 0;
  const portion = khatm.status === 'active' ? khatmPortion(index, khatm) : null;
  return {
    kind, done, target, unit: 'ayah', portion,
    complete: !finished && khatm.status === 'active' && !portion, paused: khatm.status === 'paused', finished,
  };
}

export function nazeraToday(index: QuranIndex, nazera: NazeraProfile): TodayItem {
  const anchor = nazera.dayAnchor;
  const finished = nazera.position >= index.totalAyahs;
  const portion = nazeraPortion(index, nazera);
  return {
    kind: 'nazera',
    done: anchor?.progressToday ?? 0,
    target: anchor?.target ?? 0,
    unit: nazera.targetMode === 'sessions' ? 'session' : 'ayah',
    portion,
    complete: !finished && !portion,
    paused: false,
    finished,
  };
}

/** The rows to show for today: one combined row for shared reading,
 *  otherwise one per existing record. */
export function todayItems(index: QuranIndex, khatm: KhatmPlan | null, nazera: NazeraProfile | null, journey: JourneyPlan | null): TodayItem[] {
  const items: TodayItem[] = [];
  if (isShared(journey, khatm, nazera)) {
    items.push(khatmToday(index, khatm!, 'shared'));
    return items;
  }
  if (khatm) items.push(khatmToday(index, khatm));
  if (nazera) items.push(nazeraToday(index, nazera));
  return items;
}

/** Where "start today's reading" should open: the first unfinished,
 *  unpaused portion, or null if there is nothing left to read today. */
export function startPoint(items: TodayItem[]): AyahRange | null {
  for (const it of items) {
    if (!it.paused && !it.finished && it.portion) return it.portion;
  }
  return null;
}

export type OverallStatus = 'none' | 'active' | 'paused' | 'completed';

export function overallStatus(khatm: KhatmPlan | null, nazera: NazeraProfile | null, index: QuranIndex | null): OverallStatus {
  if (!khatm && !nazera) return 'none';
  const khatmDone = !!khatm && khatm.status === 'completed';
  const nazeraDone = !!nazera && !!index && nazera.position >= index.totalAyahs;
  const live = [khatm && khatm.status !== 'completed' ? khatm : null, nazera && !nazeraDone ? nazera : null].filter(Boolean);
  if (live.length === 0 && (khatmDone || nazeraDone)) return 'completed';
  if (khatm && khatm.status === 'paused' && (!nazera || nazeraDone)) return 'paused';
  return 'active';
}
