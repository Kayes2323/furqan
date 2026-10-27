// ═══════════════════════════════════════════
// FURQAN — Quran Foundation Content API v4 client (server-only)
//
// Never imported by client components — holds OAuth2 credentials and the
// bearer token in server memory only. See public/quran/TAFSIR-SOURCES.md
// for the full source-verification report, terms, and the reasoning
// behind every policy encoded here (no bulk download/redistribution, no
// fabricated resource IDs, honest "not configured" states).
// ═══════════════════════════════════════════

const OAUTH_HOST = process.env.QURAN_FOUNDATION_OAUTH_HOST ?? 'https://oauth2.quran.foundation';
const API_BASE = process.env.QURAN_FOUNDATION_API_BASE ?? 'https://apis.quran.foundation/content/api/v4';

// Margin subtracted from the token's reported expiry so we never use a
// token that's about to lapse mid-request.
const EXPIRY_MARGIN_MS = 30_000;

export class QuranFoundationNotConfiguredError extends Error {}
export class QuranFoundationUpstreamError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.QURAN_FOUNDATION_CLIENT_ID;
  const clientSecret = process.env.QURAN_FOUNDATION_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new QuranFoundationNotConfiguredError('QURAN_FOUNDATION_CLIENT_ID/SECRET not set');
  }
  return { clientId, clientSecret };
}

let tokenCache: { token: string; expiresAt: number } | null = null;
let tokenPromise: Promise<string> | null = null;

async function fetchToken(): Promise<string> {
  const { clientId, clientSecret } = getCredentials();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${OAUTH_HOST}/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=content',
  });
  if (!res.ok) {
    throw new QuranFoundationUpstreamError(`oauth2/token: HTTP ${res.status}`, res.status);
  }
  const data = await res.json() as { access_token: string; expires_in: number };
  tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 - EXPIRY_MARGIN_MS };
  return data.access_token;
}

async function getToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.token;
  if (!tokenPromise) {
    tokenPromise = fetchToken().finally(() => { tokenPromise = null; });
  }
  return tokenPromise;
}

async function apiGet<T>(path: string): Promise<T> {
  const { clientId } = getCredentials();
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'x-auth-token': token,
      'x-client-id': clientId,
    },
  });
  if (!res.ok) {
    throw new QuranFoundationUpstreamError(`${path}: HTTP ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

// ── Resource resolution ───────────────────────────────────────────────
// Resource IDs are never hardcoded as fact (see TAFSIR-SOURCES.md §3).
// We resolve them live against /resources/* and cache the resolved id for
// the life of the server process, with an explicit env override for the
// project owner once they've confirmed the right id from their own
// dashboard access.

interface ResourceListItem {
  id: number;
  name: string;
  language_name?: string;
  slug?: string;
  author_name?: string;
}

let translationIdCache: number | null | undefined;
let tafsirIdCache: number | null | undefined;

function isBengali(item: ResourceListItem): boolean {
  const lang = (item.language_name ?? '').toLowerCase();
  return lang === 'bengali' || lang === 'bangla' || lang === 'bn';
}

export async function resolveBengaliTranslationId(): Promise<number | null> {
  const override = process.env.QURAN_TRANSLATION_BN_ID;
  if (override) return Number(override);
  if (translationIdCache !== undefined) return translationIdCache;

  const { translations } = await apiGet<{ translations: ResourceListItem[] }>('/resources/translations');
  const bengali = translations.filter(isBengali);
  // Prefer a resource whose name signals wide acceptance (Taisirul Quran is
  // the most commonly cited standard Bengali rendering on this API), but
  // fall back to the first Bengali entry rather than guessing further.
  const preferred = bengali.find((t) => /taisirul/i.test(t.name)) ?? bengali[0] ?? null;
  translationIdCache = preferred ? preferred.id : null;
  return translationIdCache;
}

// Named generically (not "...IbnKathirTafsirId") because the resolved
// resource is whatever this account's catalog actually contains — Ibn
// Kathir is preferred when present, but the UI always labels the result
// with the API's own resource_name, so a different, equally-real Bengali
// tafsir (e.g. this account's current catalog only has "Tafsir Fathul
// Majid") is never mislabeled as Ibn Kathir. See TAFSIR-SOURCES.md.
export async function resolveBengaliTafsirId(): Promise<number | null> {
  const override = process.env.QURAN_TAFSIR_BN_ID;
  if (override) return Number(override);
  if (tafsirIdCache !== undefined) return tafsirIdCache;

  const { tafsirs } = await apiGet<{ tafsirs: ResourceListItem[] }>('/resources/tafsirs');
  const bengali = tafsirs.filter(isBengali);
  const ibnKathir = bengali.find((t) => /ibn.?kath[ei]r|kaseer/i.test(t.name) || /ibn.?kath[ei]r|kaseer/i.test(t.slug ?? ''));
  const preferred = ibnKathir ?? bengali[0] ?? null;
  tafsirIdCache = preferred ? preferred.id : null;
  return tafsirIdCache;
}

// ── Verse content ─────────────────────────────────────────────────────

export interface RawAyahTranslation {
  resource_id: number;
  resource_name: string;
  text: string;
}

export interface RawAyahTafsir {
  id: number;
  resource_id: number;
  name: string;
  text: string;
  verse_key?: string;
}

interface VerseWithTranslations {
  verse_key: string;
  translations: RawAyahTranslation[];
}

export async function fetchSurahTranslations(surah: number): Promise<{ ayah: number; translation: RawAyahTranslation | null }[]> {
  const translationId = await resolveBengaliTranslationId();
  if (translationId == null) return [];

  const { verses } = await apiGet<{ verses: VerseWithTranslations[] }>(
    `/verses/by_chapter/${surah}?translations=${translationId}&per_page=300&fields=text_uthmani`
  );
  return verses.map((v) => {
    const ayah = Number(v.verse_key.split(':')[1]);
    const translation = v.translations.find((t) => t.resource_id === translationId) ?? v.translations[0] ?? null;
    return { ayah, translation };
  });
}

// Single-ayah translation fetch — used by NUR's retrieval layer, which
// only ever needs one ayah's translation per question, unlike the
// Reader's whole-surah view (fetchSurahTranslations above). Avoids
// pulling an entire surah's translations just to answer one question.
export async function fetchAyahTranslation(surah: number, ayah: number): Promise<RawAyahTranslation | null> {
  const translationId = await resolveBengaliTranslationId();
  if (translationId == null) return null;

  const { verse } = await apiGet<{ verse: { translations: RawAyahTranslation[] } }>(
    `/verses/by_key/${surah}:${ayah}?translations=${translationId}&fields=text_uthmani`
  );
  return verse.translations.find((t) => t.resource_id === translationId) ?? verse.translations[0] ?? null;
}

// The tafsir-by-ayah endpoint returns the resource's single commentary
// passage for the requested ayah. When a source groups several ayat under
// one explanation (common for short consecutive verses), the API's own
// `verse_key` on the response reflects that grouping (e.g. a request for
// "2:3" can come back keyed "2:1-5") — we surface that range as-is rather
// than inventing a per-ayah split of the same text.
export async function fetchAyahTafsir(surah: number, ayah: number): Promise<RawAyahTafsir | null> {
  const tafsirId = await resolveBengaliTafsirId();
  if (tafsirId == null) return null;

  // Like the verses endpoint (which needs fields=text_uthmani), this API
  // omits the actual commentary body unless `fields` explicitly asks for
  // it — otherwise it returns metadata only with an empty "text".
  const data = await apiGet<{ tafsir: RawAyahTafsir }>(
    `/tafsirs/${tafsirId}/by_ayah/${surah}:${ayah}?fields=text`
  );
  return data.tafsir ?? null;
}

export function isQuranFoundationConfigured(): boolean {
  return Boolean(process.env.QURAN_FOUNDATION_CLIENT_ID && process.env.QURAN_FOUNDATION_CLIENT_SECRET);
}
