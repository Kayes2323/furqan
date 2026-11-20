// ═══════════════════════════════════════════
// FURQAN — গবেষণা (Research): reading progress (localStorage)
// Follows the app/lib/reader-progress.ts pattern: pure functions for every
// state transition, thin try/catch around localStorage I/O so a private
// window or disabled storage degrades to "no progress recorded" rather
// than throwing.
//
// Two things are tracked, deliberately kept separate:
//   - `read`:     which articles the user has finished, per category.
//   - `lastRead`: the single most recent article opened, app-wide, so the
//                 Research screen can offer one "continue where you left
//                 off" card instead of making the user remember.
// ═══════════════════════════════════════════

export interface ResearchLastRead {
  categoryId: string;
  articleId: string;
  title: string;
  /** ISO timestamp — used only for display/ordering, never for logic. */
  at: string;
}

/** categoryId → list of articleIds the user has marked as read. */
export type ResearchReadMap = Record<string, string[]>;

const KEY_READ = 'furqan_research_read';
const KEY_LAST_READ = 'furqan_research_last_read';

// ── pure helpers ────────────────────────────────────────────────────────

export function isArticleRead(read: ResearchReadMap, categoryId: string, articleId: string): boolean {
  const ids = read[categoryId];
  return Array.isArray(ids) && ids.includes(articleId);
}

/** Pure: returns the next map with this article marked read (idempotent). */
export function markArticleRead(
  read: ResearchReadMap,
  categoryId: string,
  articleId: string,
): ResearchReadMap {
  if (isArticleRead(read, categoryId, articleId)) return read;
  const ids = Array.isArray(read[categoryId]) ? read[categoryId] : [];
  return { ...read, [categoryId]: [...ids, articleId] };
}

/** Pure: returns the next map with this article no longer read. */
export function unmarkArticleRead(
  read: ResearchReadMap,
  categoryId: string,
  articleId: string,
): ResearchReadMap {
  if (!isArticleRead(read, categoryId, articleId)) return read;
  return { ...read, [categoryId]: read[categoryId].filter((id) => id !== articleId) };
}

/** Pure: how many articles of this category are read. */
export function readCount(read: ResearchReadMap, categoryId: string): number {
  const ids = read[categoryId];
  return Array.isArray(ids) ? ids.length : 0;
}

/**
 * Pure: read count for a category, counted only against the articles that
 * actually exist right now. Stale ids (an article removed from Firestore
 * after the user read it) would otherwise inflate the count past the total
 * and show "৮/৭ পড়া হয়েছে".
 */
export function readCountOf(
  read: ResearchReadMap,
  categoryId: string,
  existingArticleIds: string[],
): number {
  const ids = read[categoryId];
  if (!Array.isArray(ids)) return 0;
  const existing = new Set(existingArticleIds);
  return ids.filter((id) => existing.has(id)).length;
}

// ── storage I/O ─────────────────────────────────────────────────────────

export function getRead(): ResearchReadMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KEY_READ);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    // Drop anything that isn't a string[] so a corrupted entry can't crash
    // the screen that renders it.
    const clean: ResearchReadMap = {};
    for (const [cat, ids] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(ids)) clean[cat] = ids.filter((id): id is string => typeof id === 'string');
    }
    return clean;
  } catch {
    return {};
  }
}

export function saveRead(read: ResearchReadMap): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY_READ, JSON.stringify(read));
  } catch {}
}

export function getResearchLastRead(): ResearchLastRead | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY_LAST_READ);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ResearchLastRead;
    if (
      !parsed ||
      typeof parsed.categoryId !== 'string' ||
      typeof parsed.articleId !== 'string' ||
      typeof parsed.title !== 'string'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveResearchLastRead(data: ResearchLastRead): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY_LAST_READ, JSON.stringify(data));
  } catch {}
}
