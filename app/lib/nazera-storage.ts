// ═══════════════════════════════════════════
// FURQAN — Nazera: persistence (localStorage)
// Mirrors app/lib/khatm-storage.ts / sirah-progress.ts / zikr-progress.ts:
// thin try/catch localStorage I/O, no logic here beyond load/save.
// ═══════════════════════════════════════════

import type { NazeraProfile } from './nazera-types';

const KEY_PROFILE = 'furqan_nazera_profile';

export function loadProfile(): NazeraProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: NazeraProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY_PROFILE, JSON.stringify(profile));
  } catch {}
}

export function clearProfile(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KEY_PROFILE);
  } catch {}
}
