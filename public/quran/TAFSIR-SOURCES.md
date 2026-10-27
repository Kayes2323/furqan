# Bengali Translation & Tafsir — Source Verification Report

This document records what was verified, what remains unverified, and what
constraints govern how Bengali Quran translation and tafsir content may be
used in Furqan. It exists because the canonical Arabic dataset in this
folder (`meta.json`, `surah/NNN.json`, licensed under `TANZIL-LICENSE.txt`)
covers **only the Arabic text** — translation and tafsir are a separate
content supply with separate terms, and must never be treated as if the
Tanzil CC-BY license covers them.

## 1. Access model: Quran Foundation Content API v4

The only credible authorized source identified for both a Bengali Quran
translation and Bengali Tafsir Ibn Kathir is the **Quran Foundation Content
API** (`https://api-docs.quran.foundation/`, formerly branded under
quran.com). Key facts about the access model, as documented by the
provider:

- **Auth**: OAuth2 `client_credentials` grant. `POST /oauth2/token` with
  HTTP Basic auth (`client_id:client_secret`) and
  `grant_type=client_credentials&scope=content`. Tokens are short-lived;
  there is no refresh token, so a client re-requests a new token on
  expiry.
- **Environments**: `https://prelive-oauth2.quran.foundation` (sandbox,
  used before production access is granted) and
  `https://oauth2.quran.foundation` (production). Content calls go to
  `https://apis.quran.foundation/content/api/v4` (production) with an
  equivalent prelive host for sandbox testing.
- **Required headers on content calls**: `x-auth-token` (the bearer token)
  and `x-client-id`.
- **Obtaining credentials**: requires a human to register as a developer
  on the Quran Foundation portal and accept their Developer Terms. This
  cannot be done by an automated agent — it is a one-time manual step for
  the project owner.

Relevant endpoints:
- `GET /resources/translations` and `GET /resources/tafsirs` — list
  available resources, filterable by `language`. **These must be queried
  live, with real credentials, to get authoritative resource IDs** — see
  §3.
- `GET /verses/by_chapter/{surah}` and `GET /verses/by_key/{surah}:{ayah}`
  — accept `translations=<id,id,...>` and `tafsirs=<id,id,...>` query
  params and return embedded `translations: [{resource_id, resource_name,
  text}]` and `tafsirs: [{id, resource_id, name, text}]` arrays. Text
  fields may contain HTML (e.g. footnote markup), which this app must
  render through a safe parser rather than `dangerouslySetInnerHTML`.

## 2. Content terms — what is and isn't permitted

The Quran Foundation Developer Terms (publicly posted legal page) state, in
substance, that the API content license is:

- **Revocable, non-exclusive, non-transferable.**
- Permitted for **display inside the end-user experience of the
  consuming app**, with ordinary runtime/display caching.
- **Not permitted**: reselling, sublicensing, or redistributing the
  content *except* as part of the end-user app experience. In practice,
  this is read as: **no bulk-downloading the translation/tafsir corpus
  into this public, redistributable git repository as a static dataset**
  (unlike the Arabic text, which Tanzil explicitly licenses CC-BY for
  verbatim redistribution).

This is the reason the architecture (§4 and task #53 onward) fetches
translation/tafsir content live through a server-side proxy at request
time, rather than bundling it as static JSON the way `surah/NNN.json` is
bundled.

**This interpretation has not been confirmed by Quran Foundation support
directly** — it is read from their public terms page as surfaced via
search, since this session's tools could not reach
`api-docs.quran.foundation` directly (see §5). The project owner should
treat this as the conservative, safe reading unless/until they get
clarifying confirmation while setting up API credentials.

## 3. Resource identification — Bengali translation & tafsir

**Nothing below is hardcoded as fact in the implementation.** Per the
task's explicit constraint ("do not fabricate resource IDs"), all resource
IDs are resolved by the server-side client **at runtime** against the live
`/resources/translations` and `/resources/tafsirs` endpoints, matching on
`language` and known slug/name patterns, with an environment-variable
override available once the project owner confirms the correct IDs from
their own dashboard/API access.

**Update — live-verified against the project owner's real Quran Foundation
credentials (prelive/testing tier) on 2026-10-27:**

- The owner's **prelive tier catalog is small** — 14 translation resources
  and 6 tafsir resources total, far fewer than the full production
  catalogue. This is expected: Quran Foundation apps start in prelive and
  request production scope only once testing is complete (per their
  quickstart docs).
- **Bengali translation**: exactly one resource exists in this tier —
  **id 161, "Taisirul Quran", attributed to Tawheed Publication**. Live
  response-verified: returns real Bengali text for all 7 ayahs of
  Al-Fatiha. This is what `resolveBengaliTranslationId()` resolves to.
- **Bengali tafsir**: exactly one resource exists in this tier —
  **id 381, "Tafsir Fathul Majid", by AbdulRahman Bin Hasan Al-Alshaikh**.
  **This is NOT Ibn Kathir.** No Bengali Ibn Kathir tafsir resource exists
  in this account's current (prelive) catalog. The originally-researched
  candidate id `31`/`bn-tafseer-ibn-e-kaseer` was not found live — it may
  exist only in the full production catalogue, which this tier does not
  expose.
- **Resolution, with the project owner's explicit sign-off (asked via the
  app, 2026-10-27)**: rather than leave tafsir unavailable, the owner chose
  to use Tafsir Fathul Majid now. To keep this honest, the resolver
  function was renamed from `resolveBengaliIbnKathirTafsirId` to
  `resolveBengaliTafsirId` — it prefers an Ibn Kathir match by name/slug
  if one is ever present (e.g. after the owner requests production
  access), but falls back to whatever real, named Bengali tafsir the
  catalog actually has. **The UI never hardcodes a source name** — it
  always displays the API's own `resource_name` for whatever was
  resolved, so a user always sees "Tafsir Fathul Majid" (not "Ibn Kathir")
  while this is the active resource. The override env var was renamed to
  the source-agnostic `QURAN_TAFSIR_BN_ID` to match.
- **If/when the owner requests production scope** and a Bengali Ibn Kathir
  resource becomes available in the catalogue, the resolver will pick it
  up automatically on next cold start (no code change needed) because of
  the name/slug-match preference — or the owner can pin it explicitly via
  `QURAN_TAFSIR_BN_ID`.

**Until credentials are configured, the app shows an honest "not
configured" / "unavailable" state — never a fabricated or guessed
translation/tafsir body.** This is enforced in the client/server code, not
just documentation.

## 4. Caching & redistribution posture adopted in this app

- No Bengali translation or tafsir text is stored as a static file in this
  repository. Only the Arabic Tanzil text remains static.
- The server-side API client (`app/lib/server/quran-foundation.ts`) holds
  the OAuth token in memory with an expiry margin and re-requests as
  needed. It is never imported by client-side code and the client secret
  is never sent to the browser.
- The client (`app/lib/translation-tafsir-data.ts`) calls only this app's
  own `/api/quran-translation` and `/api/quran-tafsir` routes, which proxy
  to Quran Foundation server-side. Results are cached **in memory, for the
  lifetime of the page session only** (mirroring the existing
  `reader-data.ts` pattern) — this is ordinary request-level/display
  caching, not bulk storage, consistent with the terms in §2.
- **No offline tafsir/translation support is claimed.** Without
  credentials configured, or without network access, the UI shows a clear
  "not available" / "offline" state rather than silently failing or
  fabricating content.

## 5. Access limitations hit during this research (reported transparently)

- `WebFetch` failed on every domain attempted this session (including a
  sanity check against `www.wikipedia.org`), so verification relied on
  `WebSearch` results only — i.e. indexed/secondary summaries of Quran
  Foundation's docs and terms pages, not a live fetch of the primary
  source. These should be treated as best-effort, not confirmed primary
  evidence.
- Direct `curl` access to `api-docs.quran.foundation` was blocked (403) by
  the sandbox's egress policy, which explicitly disallows that host for
  this session. This was not retried or routed around, per sandbox policy.
- As a result, **the exact current Bengali tafsir/translation resource IDs
  and the precise current wording of the Developer Terms could not be
  directly confirmed from the primary source in this session.** The
  project owner should re-verify both (resource IDs via an authenticated
  `/resources/translations` and `/resources/tafsirs` call, and terms via
  their own read of the Developer Terms) once they have registered for API
  access.

## 6. Compliant fallback while credentials are unset

Until the project owner supplies `QURAN_FOUNDATION_CLIENT_ID` /
`QURAN_FOUNDATION_CLIENT_SECRET` (and optionally the resource-ID
overrides above) as server environment variables:

- The Reader continues to work exactly as before (Arabic text, bookmarks,
  search, progress, Khatm, Nazera, Quran by Topic — all untouched).
- Translation area under each ayah shows a quiet "বাংলা অনুবাদ এখনো যুক্ত করা
  হয়নি" (Bengali translation not yet connected) state — never placeholder
  or invented text.
- Tapping "তাফসির পড়ুন" opens the tafsir panel, which shows a "তাফসির সংযোগ
  এখনো সম্পন্ন হয়নি" (tafsir connection not yet complete) state with a short
  explanation, instead of any fabricated commentary.

No content shown to the user is ever generated by AI and labeled as a named
scholarly source. This is a hard invariant of the implementation, not just
a documentation note.
