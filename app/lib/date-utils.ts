// ═══════════════════════════════════════════
// FURQAN — shared date-only (timezone-safe) helpers
// Used by both the Khatm Planner and Nazera modules for "today",
// day-count math, and daily-reset snapshots.
// ═══════════════════════════════════════════

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDateKey(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split('-').map(Number);
  return { y, m, d };
}

function toUtcMs(key: string): number {
  const { y, m, d } = parseDateKey(key);
  return Date.UTC(y, m - 1, d);
}

/** b - a, in whole calendar days. Can be negative. Timezone-safe: both
 *  sides are parsed as plain calendar dates, not instants. */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtcMs(b) - toUtcMs(a)) / 86400000);
}

export function addDays(key: string, days: number): string {
  const { y, m, d } = parseDateKey(key);
  const ms = Date.UTC(y, m - 1, d + days);
  const dt = new Date(ms);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}
