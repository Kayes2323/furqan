// ═══════════════════════════════════════════
// FURQAN — Quran Journey: applying a confirmed proposal to the existing
// Khatm / Nazera records, plus the shared-reading helpers.
//
// Pure (records in → records out). The caller persists the results and
// is responsible for having asked the user to confirm first.
//
// Rules that protect existing progress:
//  • An existing active/paused Khatm plan is RESCHEDULED (completedAyahs
//    and history untouched), never restarted.
//  • An existing Nazera profile only has its targets updated (position
//    and history untouched).
//  • A record is created only if none exists (or the Khatm plan is
//    already completed and the user is starting a new one).
// ═══════════════════════════════════════════

import type { QuranIndex } from './quran-index';
import type { KhatmPlan } from './khatm-types';
import type { NazeraProfile } from './nazera-types';
import type { JourneyPlan, SessionLogEntry } from './journey-types';
import type { Proposal } from './journey-plan';
import { createPlan, reschedulePlan, ensureDayAnchor as ensureKhatmAnchor, computeDailyTarget, markTodayComplete as markKhatmToday, todaysPortion as khatmPortion } from './khatm-plan.ts';
import { createProfile, updateTargets, ensureDayAnchor as ensureNazeraAnchor, advanceAyahs } from './nazera-plan.ts';
import { globalToRef } from './quran-index.ts';

export interface ApplyResult {
  khatm: KhatmPlan | null;
  nazera: NazeraProfile | null;
  journey: JourneyPlan;
}

let idCounter = 0;
function newId(): string {
  idCounter += 1;
  return `journey-${Date.now()}-${idCounter}`;
}

export function applyProposal(args: {
  proposal: Proposal;
  index: QuranIndex;
  today: string;
  existingKhatm: KhatmPlan | null;
  existingNazera: NazeraProfile | null;
  existingJourney: JourneyPlan | null;
  note?: string;
}): ApplyResult {
  const { proposal, index, today, existingKhatm, existingNazera, existingJourney } = args;
  const inputs = proposal.inputs;
  const shared = inputs.goal === 'both' && inputs.sharedReading;

  let khatm: KhatmPlan | null = existingKhatm;
  if (proposal.khatm) {
    const k = proposal.khatm;
    if (existingKhatm && existingKhatm.status !== 'completed') {
      khatm = reschedulePlan(
        existingKhatm,
        { mode: 'targetDate', targetDate: k.targetDate, scheduleStyle: k.scheduleStyle, prayerSlots: k.prayerSlots ?? [] },
        today,
      );
    } else {
      khatm = createPlan({ mode: 'targetDate', targetDate: k.targetDate, scheduleStyle: k.scheduleStyle, prayerSlots: k.prayerSlots }, today);
    }
    if (khatm.status === 'active') khatm = ensureKhatmAnchor(index, khatm, today);
  }

  let nazera: NazeraProfile | null = existingNazera;
  if (proposal.nazera) {
    const n = proposal.nazera;
    if (existingNazera) {
      nazera = updateTargets(existingNazera, { targetMode: 'ayahs', dailyAyahTarget: n.dailyAyahs });
    } else {
      const startRef = n.startPosition >= 1 && n.startPosition < index.totalAyahs
        ? globalToRef(index, n.startPosition + 1)
        : { surah: 1, ayah: 1 };
      nazera = createProfile({ targetMode: 'ayahs', dailyAyahTarget: n.dailyAyahs, startRef }, index, today);
    }
    nazera = ensureNazeraAnchor(nazera, today);
  }

  const now = new Date().toISOString();
  const a = proposal.khatm;
  const journey: JourneyPlan = {
    schemaVersion: 1,
    id: existingJourney?.id ?? newId(),
    createdAt: existingJourney?.createdAt ?? now,
    updatedAt: now,
    goal: inputs.goal,
    sharedReading: shared,
    pace: inputs.pace,
    targetDate: inputs.pace === 'deadline' ? inputs.requestedDate : null,
    dailyMinutes: inputs.dailyMinutes,
    lettersPerMinute: inputs.lpm,
    speedSource: inputs.speedSource,
    slots: inputs.slots,
    lightDays: inputs.lightDays,
    assumptions: {
      khatmDailyAyahs: a?.dailyAyahs ?? null,
      khatmDailyMinutes: a ? Math.round(a.dailyMinutes) : null,
      nazeraDailyAyahs: proposal.nazera?.dailyAyahs ?? null,
      nazeraDailyMinutes: proposal.nazera ? Math.round(proposal.nazera.dailyMinutes) : null,
      estimatedKhatmCompletion: a?.targetDate ?? null,
      requestedTargetDate: inputs.requestedDate,
    },
    sessionLog: existingJourney?.sessionLog ?? [],
    adjustments: [...(existingJourney?.adjustments ?? []), ...(args.note ? [{ date: today, note: args.note }] : [])].slice(-30),
  };
  return { khatm, nazera, journey };
}

// ── shared reading ────────────────────────────────────────────────────

/** Shared reading only makes sense while both pointers are on the same
 *  ayah; otherwise one reading could not honestly count for both. */
export function pointersAligned(khatm: KhatmPlan | null, nazera: NazeraProfile | null): boolean {
  if (!khatm || !nazera) return true;
  return khatm.completedAyahs === nazera.position;
}

/** Day-start sync: in shared mode, Nazera's target for the day equals the
 *  Khatm target. Only changes Nazera when its day anchor is not already
 *  today's, so progress logged earlier today is never reset. */
export function syncSharedNazera(index: QuranIndex, khatm: KhatmPlan | null, nazera: NazeraProfile | null, today: string): NazeraProfile | null {
  if (!khatm || !nazera) return nazera;
  if (nazera.dayAnchor?.date === today) return nazera;
  const target = khatm.status === 'active' ? computeDailyTarget(index, khatm, today) : nazera.dailyAyahTarget;
  let next = target > 0 && target !== nazera.dailyAyahTarget
    ? updateTargets(nazera, { targetMode: 'ayahs', dailyAyahTarget: target })
    : nazera;
  next = ensureNazeraAnchor(next, today);
  return next;
}

/** Completes today's Khatm portion and, in shared mode with aligned
 *  pointers, advances Nazera by exactly the same ayahs. */
export function completeSharedToday(index: QuranIndex, khatm: KhatmPlan, nazera: NazeraProfile | null, shared: boolean): { khatm: KhatmPlan; nazera: NazeraProfile | null; ayahs: number } {
  const nextKhatm = markKhatmToday(index, khatm);
  const ayahs = nextKhatm.completedAyahs - khatm.completedAyahs;
  let nextNazera = nazera;
  if (shared && nazera && ayahs > 0 && nazera.position === khatm.completedAyahs) {
    nextNazera = advanceAyahs(index, nazera, ayahs);
  }
  return { khatm: nextKhatm, nazera: nextNazera, ayahs };
}

/** Mirrors a Khatm pointer move onto a shared Nazera profile. */
export function mirrorKhatmAdvance(index: QuranIndex, nazera: NazeraProfile | null, prevCompleted: number, nextCompleted: number): NazeraProfile | null {
  if (!nazera) return nazera;
  const delta = nextCompleted - prevCompleted;
  if (delta <= 0 || nazera.position !== prevCompleted) return nazera;
  return advanceAyahs(index, nazera, delta);
}

export function todaysKhatmPortionCount(index: QuranIndex, khatm: KhatmPlan | null): number {
  if (!khatm || khatm.status !== 'active') return 0;
  return khatmPortion(index, khatm)?.count ?? 0;
}

// ── session logging (optional calibration) ────────────────────────────

export function logSession(plan: JourneyPlan, entry: SessionLogEntry): JourneyPlan {
  return { ...plan, updatedAt: new Date().toISOString(), sessionLog: [...plan.sessionLog, entry].slice(-30) };
}
