# কুরআন যাত্রা (Quran Journey) — audit findings and implementation plan

## Audit (state of the repository when this work started)

| Area | Finding |
|---|---|
| Khatm | `app/lib/khatm-plan.ts` (pure engine, tested), `khatm-storage.ts` (`furqan_khatm_plan`), `KhatmScreen` + `KhatmSetupScreen`. Progress pointer `completedAyahs`, day anchor, 5-prayer/single split, pause/resume/reschedule/restart, `history`, `rescheduleLog`. Always starts at 1:1. |
| Nazera | `nazera-plan.ts`, `nazera-storage.ts` (`furqan_nazera_profile`), `NazeraScreen` + `NazeraSetupScreen`. Independent pointer (`position`), ayahs- or sessions-mode targets, daily history with `metTarget`. |
| Quran data | Verbatim Tanzil text under `public/quran/surah/*.json`, `meta.json`; `quran-index.ts` maps global ayah ↔ surah:ayah. No Mushaf page data exists and none is invented. |
| Reader | Own `furqan_reader_last_read` / bookmarks; independent of Khatm and Nazera. |
| NUR | `app/api/nur/route.ts` (Gemini via `@google/genai`, `GEMINI_API_KEY`, server-only, 10 s cap, flash/flash-lite race). Source-grounded Q&A prompt. |
| Navigation | URL-driven (`/?s=<screen>`), `navigation.ts` + `useAppNavigation`. Primary nav (BottomNav / MainSidebar) = হোম, কুরআন, NUR, জ্ঞান, প্রোফাইল — **Khatm and Nazera were never primary items**; they were two cards inside the কুরআন hub plus two Home quick links. |
| Design system | Inline-style components, CSS variables (light/dark set by `ThemeProvider`), Hind Siliguri / Amiri / Noto Serif Bengali, lucide-react icons. No UI framework to reuse beyond that. |
| Tests | `node --test` over pure `app/lib/*.test.ts` (279 passing before this work). No browser tests existed. |
| Lint/tsc baseline | `tsc` clean. ESLint: 8 errors / 3 warnings, all pre-existing (React-compiler `set-state-in-effect`, `any` in PWAInstaller, ResearchScreen). |
| Deploy | Vercel project (README → furqan-tan.vercel.app), git-integrated. |

## Decisions

1. **One entry, no new primary nav item.** The bottom nav is full (5 slots, centred NUR). The single destination `quran-journey` replaces the two Khatm/Nazera cards in the কুরআন hub and the two Home quick links. Desktop sidebar and mobile bottom nav both treat it as part of "কুরআন".
2. **Tabs inside the journey:** আমার পরিকল্পনা · খতম · নাযেরা · অগ্রগতি, URL-addressable (`?s=quran-journey&jt=…`). `?s=khatm` / `?s=nazera` redirect to the matching tab. Setup screens stay as full-screen forms.
3. **No duplicate sources of truth.** The journey plan (`furqan_journey_plan`, schema v1) stores goals, assumptions and preferences only. Progress stays in the Khatm and Nazera records, which are *configured* by a confirmed plan (reschedule/retarget, never restart) and remain separate.
4. **Deterministic numbers; NUR converses.** Quantities, dates, feasibility and time estimates come from pure functions weighted by real per-ayah letter counts derived (read-only) from the Tanzil data. NUR (same Gemini key/client) only (a) interprets a free-text reply to one question, validated against an allow-list, and (b) phrases an explanation, rejected if it contains any number the app did not supply. Every question has tappable options, so the flow works when the model is unavailable.
5. **Small, backward-compatible engine additions:** Khatm `prayerSlots?` (subset of prayer times; absent = all five), Nazera `advanceAyahs` (for shared reading).
6. **Local-only.** Everything is stored in this browser's `localStorage`. No account, cloud sync, cross-device continuity or push notifications are implemented or claimed.

## Verification

`npm test` (unit), `npx tsc --noEmit`, `npx eslint` (no new problems), `npm run build`, and `npm run test:e2e` (Playwright against a running server).
