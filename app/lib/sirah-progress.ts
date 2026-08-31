// ═══════════════════════════════════════════
// FURQAN — Sirah Reading Progress (localStorage)
// ═══════════════════════════════════════════

const KEY_LAST = 'furqan_sirah_last';
const KEY_DONE = 'furqan_sirah_completed';
const KEY_SCROLL = 'furqan_sirah_scroll';

export interface LastRead {
  chapterId: string;
  chapterTitle: string;
  chapterNumber: number;
}

export function saveLastRead(data: LastRead): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY_LAST, JSON.stringify(data));
  } catch {}
}

export function getLastRead(): LastRead | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY_LAST);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getCompleted(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY_DONE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markCompleted(chapterId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const done = getCompleted();
    if (!done.includes(chapterId)) {
      done.push(chapterId);
      localStorage.setItem(KEY_DONE, JSON.stringify(done));
    }
  } catch {}
}

export function saveScroll(chapterId: string, y: number): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(KEY_SCROLL);
    const map = raw ? JSON.parse(raw) : {};
    map[chapterId] = y;
    localStorage.setItem(KEY_SCROLL, JSON.stringify(map));
  } catch {}
}

export function getScroll(chapterId: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(KEY_SCROLL);
    const map = raw ? JSON.parse(raw) : {};
    return map[chapterId] || 0;
  } catch {
    return 0;
  }
}

export function getProgressPercent(totalChapters: number): number {
  if (totalChapters === 0) return 0;
  return Math.round((getCompleted().length / totalChapters) * 100);
}
