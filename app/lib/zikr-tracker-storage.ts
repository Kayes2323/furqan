// ═══════════════════════════════════════════
// FURQAN — Personal Custom Zikr Tracker: localStorage persistence
//
// Thin I/O layer only — all real logic lives in zikr-tracker-engine.ts
// (pure, unit-tested). Mirrors the existing reader-progress.ts /
// zikr-progress.ts convention: try/catch around localStorage, a
// typed-and-sanitized load, a plain JSON.stringify save.
//
// NOTE ON SYNC: this storage is localStorage-only — it lives on this
// device/browser only and does not sync across devices. The data shape
// (stable `id`s, versioned blob) is deliberately kept ready for a
// future cloud-sync backend, but no such backend exists yet and this
// module must not claim otherwise.
// ═══════════════════════════════════════════

import { migrateTrackerData, emptyTrackerData } from './zikr-tracker-engine';
import type { ZikrTrackerData } from './zikr-tracker-types';

const KEY = 'furqan_zikr_tracker_v1';

export function loadTrackerData(): ZikrTrackerData {
  if (typeof window === 'undefined') return emptyTrackerData();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyTrackerData();
    return migrateTrackerData(JSON.parse(raw));
  } catch {
    // Malformed JSON is treated the same as "no recognizable data" —
    // never throws, never wipes anything by crashing the app; the
    // untouched raw string stays in localStorage in case of future
    // recovery tooling, since we only ever call setItem with a value
    // this module itself produced.
    return emptyTrackerData();
  }
}

export function saveTrackerData(data: ZikrTrackerData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}
