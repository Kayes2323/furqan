// ═══════════════════════════════════════════
// FURQAN — Sunnah Life: localStorage persistence
//
// Thin I/O layer only — all real logic lives in sunnah-life-engine.ts
// (pure, unit-tested). Mirrors zikr-tracker-storage.ts.
//
// NOTE ON SYNC: localStorage-only, this device/browser only. No claim of
// cross-device sync is made anywhere in this feature (see
// docs/sunnah-life-sources.md and the Phase 2/3 notes in the task spec).
// ═══════════════════════════════════════════

import { migrateTrackerData, emptyTrackerData } from './sunnah-life-engine';
import type { SunnahLifeTrackerData } from './sunnah-life-types';

const KEY = 'furqan_sunnah_life_tracker_v1';

export function loadSunnahTrackerData(): SunnahLifeTrackerData {
  if (typeof window === 'undefined') return emptyTrackerData();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyTrackerData();
    return migrateTrackerData(JSON.parse(raw));
  } catch {
    return emptyTrackerData();
  }
}

export function saveSunnahTrackerData(data: SunnahLifeTrackerData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}
