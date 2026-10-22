// ═══════════════════════════════════════════
// FURQAN — Quran Reader: reading progress & bookmarks (localStorage)
// Mirrors the existing app/lib/sirah-progress.ts / zikr-progress.ts pattern:
// pure functions for state transitions, thin try/catch localStorage I/O.
// ═══════════════════════════════════════════

import type { ReaderLastRead, ReaderBookmark } from './reader-types';

const KEY_LAST_READ = 'furqan_reader_last_read';
const KEY_BOOKMARKS = 'furqan_reader_bookmarks';

export function saveLastRead(data: ReaderLastRead): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY_LAST_READ, JSON.stringify(data));
  } catch {}
}

export function getLastRead(): ReaderLastRead | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY_LAST_READ);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getBookmarks(): ReaderBookmark[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY_BOOKMARKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isBookmarked(bookmarks: ReaderBookmark[], surah: number, ayah: number): boolean {
  return bookmarks.some((b) => b.surah === surah && b.ayah === ayah);
}

// Pure: returns the next bookmarks array with the given ayah toggled.
export function toggleBookmark(bookmarks: ReaderBookmark[], surah: number, ayah: number): ReaderBookmark[] {
  if (isBookmarked(bookmarks, surah, ayah)) {
    return bookmarks.filter((b) => !(b.surah === surah && b.ayah === ayah));
  }
  return [...bookmarks, { surah, ayah, createdAt: new Date().toISOString() }];
}

export function saveBookmarks(bookmarks: ReaderBookmark[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY_BOOKMARKS, JSON.stringify(bookmarks));
  } catch {}
}

// Sorted for display: most recently bookmarked first.
export function sortedBookmarks(bookmarks: ReaderBookmark[]): ReaderBookmark[] {
  return [...bookmarks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
