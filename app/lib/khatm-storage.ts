// ═══════════════════════════════════════════
// FURQAN — Khatm Planner: persistence (localStorage)
// Mirrors app/lib/sirah-progress.ts / zikr-progress.ts / reader-progress.ts:
// thin try/catch localStorage I/O, no logic here beyond load/save.
// ═══════════════════════════════════════════

import type { KhatmPlan } from './khatm-types';

const KEY_PLAN = 'furqan_khatm_plan';

export function loadPlan(): KhatmPlan | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY_PLAN);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function savePlan(plan: KhatmPlan): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY_PLAN, JSON.stringify(plan));
  } catch {}
}

export function clearPlan(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KEY_PLAN);
  } catch {}
}
