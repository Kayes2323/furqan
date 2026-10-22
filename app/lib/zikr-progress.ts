// ═══════════════════════════════════════════
// FURQAN — Zikr tap-to-count / auto-advance engine
//
// The counting/advancing rules are pure functions (no DOM, no React) so they
// can be unit tested directly — see zikr-progress.test.ts. Only the
// load/save functions at the bottom touch localStorage, mirroring the
// existing app/lib/sirah-progress.ts convention.
// ═══════════════════════════════════════════

import type { RecitationItem } from './zikr-types';

export interface SectionProgress {
  sectionId: string;
  /** itemId -> count so far (never exceeds that item's targetCount). */
  counts: Record<string, number>;
  /** itemIds that have reached their target. */
  completedIds: string[];
  /** The item currently in focus in the reading flow. */
  activeItemId: string | null;
  /** YYYY-MM-DD (local date) this progress was last touched — used to
   *  reset daily, since every item in this content is a daily/nightly
   *  practice by nature. */
  lastActiveDate: string;
}

export function emptyProgress(sectionId: string, items: RecitationItem[], today: string): SectionProgress {
  return {
    sectionId,
    counts: {},
    completedIds: [],
    activeItemId: items[0]?.id ?? null,
    lastActiveDate: today,
  };
}

/** If the stored progress is from a previous day, start fresh for today —
 *  these are daily/nightly adhkar, not a one-time checklist. Pure: takes
 *  `today` as an argument instead of reading the clock itself. */
export function withDailyReset(
  progress: SectionProgress,
  items: RecitationItem[],
  today: string,
): SectionProgress {
  if (progress.lastActiveDate === today) return progress;
  return emptyProgress(progress.sectionId, items, today);
}

export interface TapOutcome {
  progress: SectionProgress;
  /** Set to the item's id exactly on the tap that reached its target. */
  justCompletedItemId: string | null;
}

/**
 * Registers exactly one tap on `itemId`. Never increments past the item's
 * targetCount, never re-completes an already-completed item (so a stray
 * extra event — double tap, duplicate animation callback, etc. — cannot
 * double-count or re-trigger the completion transition).
 */
export function tapCounter(
  progress: SectionProgress,
  items: RecitationItem[],
  itemId: string,
  today: string,
): TapOutcome {
  const reset = withDailyReset(progress, items, today);
  const item = items.find((i) => i.id === itemId);
  if (!item) return { progress: reset, justCompletedItemId: null };

  const alreadyCompleted = reset.completedIds.includes(itemId);
  const currentCount = reset.counts[itemId] ?? 0;
  if (alreadyCompleted || currentCount >= item.targetCount) {
    return { progress: reset, justCompletedItemId: null };
  }

  const nextCount = currentCount + 1;
  const reachedTarget = nextCount >= item.targetCount;

  const nextProgress: SectionProgress = {
    ...reset,
    counts: { ...reset.counts, [itemId]: nextCount },
    completedIds: reachedTarget ? [...reset.completedIds, itemId] : reset.completedIds,
    lastActiveDate: today,
  };

  return { progress: nextProgress, justCompletedItemId: reachedTarget ? itemId : null };
}

/**
 * Returns the id of the first not-yet-completed item in source order, or
 * null when every item in the sequence is done (caller should show a
 * completion summary instead of advancing).
 */
export function nextIncompleteItemId(progress: SectionProgress, items: RecitationItem[]): string | null {
  const ordered = [...items].sort((a, b) => a.order - b.order);
  const next = ordered.find((i) => !progress.completedIds.includes(i.id));
  return next?.id ?? null;
}

/** Moves focus to the next incomplete item (or stays put / clears focus
 *  when the sequence is finished). Call this after showing the brief
 *  completion feedback for `justCompletedItemId`, not synchronously with
 *  the tap that completed it. */
export function advanceToNext(progress: SectionProgress, items: RecitationItem[]): SectionProgress {
  return { ...progress, activeItemId: nextIncompleteItemId(progress, items) };
}

export function isSequenceComplete(progress: SectionProgress, items: RecitationItem[]): boolean {
  return items.length > 0 && items.every((i) => progress.completedIds.includes(i.id));
}

export function resetItem(progress: SectionProgress, itemId: string, today: string): SectionProgress {
  const restCounts = Object.fromEntries(
    Object.entries(progress.counts).filter(([id]) => id !== itemId),
  );
  return {
    ...progress,
    counts: restCounts,
    completedIds: progress.completedIds.filter((id) => id !== itemId),
    activeItemId: itemId,
    lastActiveDate: today,
  };
}

export function resetSection(sectionId: string, items: RecitationItem[], today: string): SectionProgress {
  return emptyProgress(sectionId, items, today);
}

/**
 * Toggles a "did I do this today" checkmark for a non-recitation practice
 * item (an action/habit). Shares the same `completedIds` list as the
 * recitation flow's completion tracking — safe to mix, since
 * `nextIncompleteItemId`/`isSequenceComplete` only ever check membership
 * against the recitation items they're explicitly given, so a stray
 * practice-item id sitting in `completedIds` never gets mistaken for a
 * finished recitation.
 */
export function togglePracticeDone(
  progress: SectionProgress,
  recitationItems: RecitationItem[],
  practiceItemId: string,
  today: string,
): SectionProgress {
  const reset = withDailyReset(progress, recitationItems, today);
  const alreadyDone = reset.completedIds.includes(practiceItemId);
  return {
    ...reset,
    completedIds: alreadyDone
      ? reset.completedIds.filter((id) => id !== practiceItemId)
      : [...reset.completedIds, practiceItemId],
    lastActiveDate: today,
  };
}

// ─── localStorage persistence (impure — mirrors sirah-progress.ts) ──────

const KEY_PREFIX = 'furqan_zikr_section_';

export function loadSectionProgress(sectionId: string): SectionProgress | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY_PREFIX + sectionId);
    return raw ? (JSON.parse(raw) as SectionProgress) : null;
  } catch {
    return null;
  }
}

export function saveSectionProgress(progress: SectionProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY_PREFIX + progress.sectionId, JSON.stringify(progress));
  } catch {}
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const AUTO_ADVANCE_KEY = 'furqan_zikr_auto_advance';

/** Global preference (not per-section) for whether completing an item
 *  automatically moves to the next one. Defaults to on. */
export function getAutoAdvancePreference(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(AUTO_ADVANCE_KEY);
    return raw === null ? true : raw === '1';
  } catch {
    return true;
  }
}

export function setAutoAdvancePreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTO_ADVANCE_KEY, enabled ? '1' : '0');
  } catch {}
}
