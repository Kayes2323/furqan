// ═══════════════════════════════════════════
// FURQAN — Quran Journey: progress-view helpers (pure)
// ═══════════════════════════════════════════

import { addDays } from './date-utils.ts';

export interface DayCell { date: string; value: number; met: boolean }

/** Last `n` days ending today, oldest first, from the Khatm history +
 *  today's live anchor. Days without an entry are simply 0 — empty, not
 *  "failed". */
export function khatmWeek(
  history: { date: string; ayahsRead: number; event?: string }[],
  liveToday: { date: string; read: number } | null,
  today: string,
  n = 14,
): DayCell[] {
  const byDate = new Map(history.filter((h) => h.event !== 'restarted').map((h) => [h.date, h.ayahsRead]));
  if (liveToday) byDate.set(liveToday.date, liveToday.read);
  const out: DayCell[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const v = byDate.get(d) ?? 0;
    out.push({ date: d, value: v, met: v > 0 });
  }
  return out;
}
