// ═══════════════════════════════════════════
// FURQAN — one-shot handoff of a pending NUR query across a screen
// navigation (e.g. "NUR-কে জিজ্ঞাসা করো" tapped from an ayah in the
// Reader/TafsirPanel). Uses sessionStorage rather than a URL param
// since this is transient, consumed-once state, not shareable/bookmark-
// worthy route state. The explicit surah/ayah travels alongside the
// display text so NUR's retrieval never has to re-derive it by parsing
// text — it's passed as real structured context (see app/api/nur/route.ts).
// ═══════════════════════════════════════════

const KEY = 'furqan_nur_pending_query';

export interface PendingNurQuery {
  text: string;
  surah: number;
  ayah?: number;
}

export function setPendingNurQuery(query: PendingNurQuery): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(query));
  } catch {
    // sessionStorage can be unavailable (private mode, disabled storage);
    // NUR simply won't auto-populate in that case — not a hard failure.
  }
}

export function consumePendingNurQuery(): PendingNurQuery | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as PendingNurQuery;
    if (typeof parsed.text !== 'string' || typeof parsed.surah !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}
