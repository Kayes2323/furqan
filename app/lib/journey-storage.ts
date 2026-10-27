// ═══════════════════════════════════════════
// FURQAN — Quran Journey: persistence (localStorage, this device only)
// Same thin try/catch pattern as khatm-storage.ts / nazera-storage.ts.
// Only the plan's goals/assumptions live here; progress stays in the
// Khatm and Nazera records. Nothing is synced to any server.
// ═══════════════════════════════════════════

import type { JourneyPlan } from './journey-types';

const KEY_PLAN = 'furqan_journey_plan';

function isPlan(v: unknown): v is JourneyPlan {
  if (!v || typeof v !== 'object') return false;
  const p = v as Partial<JourneyPlan>;
  return (
    p.schemaVersion === 1 &&
    typeof p.id === 'string' &&
    (p.goal === 'khatm' || p.goal === 'nazera' || p.goal === 'both') &&
    typeof p.dailyMinutes === 'number' &&
    typeof p.lettersPerMinute === 'number' &&
    Array.isArray(p.lightDays) &&
    Array.isArray(p.sessionLog) &&
    typeof p.assumptions === 'object' && p.assumptions !== null
  );
}

/** Returns null for missing, corrupt or future-version data — it never
 *  deletes anything, so an unreadable plan is simply ignored, not lost. */
export function loadJourneyPlan(): JourneyPlan | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY_PLAN);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isPlan(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveJourneyPlan(plan: JourneyPlan): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(KEY_PLAN, JSON.stringify(plan));
    return true;
  } catch {
    return false;
  }
}

export function clearJourneyPlan(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KEY_PLAN);
  } catch {}
}
