# Furqan — Quran Learning System: Product Blueprint

**Status:** Structure/planning only. Nothing in this phase changes production behavior.
**Author context:** Written from a direct inspection of the Furqan repository (`kayes2323/furqan`) on branch `claude/furqan-sirah-content-mapping-fc3yfd` as of 2026-10-22.
**Confirmed vs. Proposed:** Every section below is labeled. **Confirmed** facts are backed by a direct read of the code in this repo at the time of writing and are cited by file path. **Proposed** content is this document's own design and has not been built, approved, or reviewed by a scholar.

---

## 0. How to read this document

- Section 1–2 ground the plan in what the app actually is today.
- Sections 3–9 are the proposed design for the four (plus one future) features.
- Section 10–11 are the two sections most likely to gate everything else — content sourcing and AI boundaries — and should be read first by anyone approving this plan.
- Section 14 lists every decision that needs a human (often a qualified scholar, not an engineer) to sign off before Phase 1 can start for real.
- Nothing here has been implemented. See Section 16 for an explicit statement of what was and wasn't done.

---

## 1. Product vision and user problems

Furqan's own tagline is "কুরআন পড়ো না, বোঝো" — *don't just read the Quran, understand it* (`app/layout.tsx`). The app today delivers understanding through a Sirah biography reader, topical research articles, an AI Q&A assistant (NUR), a Qibla compass, and a PDF-sourced Azkar/Tasbih tracker. It does **not** yet give a user a reliable way to:

1. **Read the Quran itself**, verse by verse, with trustworthy Arabic text and translation. (`TafsirScreen.tsx` today covers 11 of 114 surahs by name, and only Surah Al-Fatiha has real ayah content — see Section 2.3.)
2. **Commit to finishing the Quran** on a realistic schedule — the single most common devotional goal among regularly-practicing users (a *khatm*), and one with no tooling in the app at all today.
3. **Memorize a verified, pedagogically-ordered set of essential surahs and ayat** — distinct from browsing tafsir, this is a structured, repetition-based skill-building track.
4. **Get a plan personalized to where they actually are** — a beginner who recently started praying has a different realistic schedule than someone who memorized half the Quran as a child and is rebuilding fluency.
5. **Eventually get feedback on their own recitation** — today NUR can discuss Quranic topics in text, but nothing in the app listens to or evaluates how someone actually recites.

The common thread: Furqan has invested heavily in *explaining* the Quran (tafsir, research, Sirah context) but has no feature yet for the two things a practicing Muslim does daily — *reading* the Quran and *memorizing* it — done well, safely, and without unrealistic promises. This blueprint exists to plan that system before writing any of it.

---

## 2. Confirmed facts about the existing application

Everything in this section was verified by reading the named file. Nothing here is inferred or assumed.

### 2.1 Framework and routing

- Next.js **16.2.10** with Turbopack, React **19.2.4**, TypeScript in strict mode (`package.json`).
- **This is not conventional file-based routing.** The entire app is one page (`app/page.tsx`) that renders a different screen component based on a `?s=<screen>` query parameter. Navigation state lives in `app/lib/navigation.ts` (`AppRoute`, `paramsToRoute`, `routeToParams`, `routesEqual`) and `app/hooks/useAppNavigation.ts`. The project's own `AGENTS.md` explicitly warns that this Next.js build has breaking changes from the one in training data and to consult `node_modules/next/dist/docs/` before writing code — any future implementation phase must re-verify App Router behavior against that local doc, not assumptions.
- The `Screen` union type (`app/types/index.ts`) is the single source of truth for valid screens; `VALID_SCREENS` in `navigation.ts` must be kept in sync with it by hand. Currently: `home | tafsir | nur | knowledge | research | sirah | sirah-part | sirah-read | qibla | zikr | zikr-section | zikr-read | profile`.
- Deep-linkable state (selected surah, chapter, section, item) is carried as extra query params on `AppRoute` (e.g. `surah`, `chapter`, `part`, `zikrSection`, `zikrItem`), not as path segments.

### 2.2 Navigation / information architecture

Five-item bottom nav (`app/components/BottomNav.tsx`): **হোম** (Home), **তাফসির** (Tafsir), **ن NUR** (center, elevated FAB — opens the AI chat), **জ্ঞান** (Knowledge — a hub screen), **প্রোফাইল** (Profile). The Knowledge tab is a router for a *family* of screens: Research, Sirah (3-tier: journey → part → chapter reading), Qibla, and Zikr all mark the Knowledge tab active via an `isKnowledgeActive` boolean that's manually extended each time a new screen joins that family (`BottomNav.tsx:11-20`). This is the established pattern for "new major feature that isn't quite Tafsir, NUR, or Profile" — it is the most likely home for three of the four new features (Section 3).

`HomeScreen.tsx` additionally surfaces a 2×3 grid of quick-access tiles (Tafsir, Research, NUR, Qibla, "আমল"/Zikr, and a **non-functional "বুকমার্ক" (Bookmarks) tile labeled "শীঘ্রই আসছে" / "coming soon"**, which currently routes to Profile). This bookmarks placeholder is a direct, pre-existing acknowledgment that bookmarking is wanted and not yet built — relevant to the Reader's bookmark requirement (Section 4.A).

### 2.3 What Quran-related code already exists

This matters because the new system must *reconcile with*, not duplicate, what's already there:

- **`app/components/TafsirScreen.tsx`** — a surah browser hardcoded to **11 of 114 surahs** (`SURAHS` array, lines 6–18) with a client-side search filter over that hardcoded list. Tapping a surah opens a detail view; only **Surah 1 (Al-Fatiha)** has real content — 7 ayat with Arabic text, a Bengali translation, and a short hand-written paraphrase under the heading "📚 Ibn Kathir তাফসির দেখো" (lines 20–28). Every other surah renders "এই সূরার তাফসির শীঘ্রই আসছে..." ("tafsir coming soon"). The Fatiha paraphrase is **not sourced from an actual Ibn Kathir translation API or text** — it's short original prose attributed to Ibn Kathir in the UI copy without a citation. This is a real content-integrity issue the new Reader must not inherit (Section 10).
- **`app/lib/quran.ts`** — defines `getSurahList()`, `getSurah()`, `getDailyAyah()` against `https://api.alquran.cloud/v1`, fetching Arabic (`quran-uthmani`) and Bengali (`bn.bengali`) text. **Confirmed dead code**: grepping the full `app` tree for `getSurah`, `getDailyAyah`, `getSurahList` finds zero call sites outside the file itself. It is not wired into any screen. **Risk flag:** in this sandboxed environment, outbound requests to `api.alquran.cloud` and other third-party hosts were blocked by the network policy during a prior session (confirmed via direct `curl` test), returning a proxy-level 403. That does not necessarily mean it's blocked in the actual Vercel production deployment, but it must be re-verified from production before any phase depends on it, and a self-hosted/bundled fallback should be the default assumption (Section 10).
- **`app/types/index.ts`** already declares `Surah`, `Ayah` (with an optional `tafsir?: string` field commented "Ibn Kathir simplified Bangla"), and `ChatMessage` interfaces — forward-looking scaffolding that was never wired to real data. These can likely be reused or extended rather than redefined from scratch (Section 8 treats them as a starting point, not a constraint).
- **`app/components/HomeScreen.tsx`**'s `DAILY_AYAH` constant and **`NurScreen.tsx`**'s initial greeting both hardcode a single fixed ayah (Surah Muhammad 47:24) as inline strings — a second, independent, unsourced place Arabic/Bengali Quran text already lives in the codebase outside any shared data layer.

**Conclusion for planning:** there is no existing, working, verified Quran text pipeline in this app. `TafsirScreen` is a UI prototype with placeholder data for 113 of 114 surahs; `quran.ts` is an untested, unused client for a third-party API of unconfirmed reliability and unconfirmed licensing terms. Phase 1 starts from near zero on data, not near zero on UI ideas.

### 2.4 Design system

- Styling convention is **inline `style={{}}` objects reading CSS custom properties**, not Tailwind utility classes, despite Tailwind being installed (`app/globals.css` imports it, but it's effectively unused in practice — confirmed by reading every existing screen component).
- Color tokens live in `:root` in `app/globals.css`: `--bg`, `--card`, `--text`, `--text-muted`, `--text-light`, `--border`, `--accent`/`--accent-light` (green), `--gold`/`--gold-light`, `--green`/`--green-light`.
- `app/lib/theme.tsx` implements light/dark mode by **overwriting these CSS variables via `document.documentElement.style.setProperty` in a `useEffect`**, persisted to `localStorage['furqan-theme']` (note the hyphen, not underscore — a real gotcha already hit once in this project's own history). Any new screen must consume these same `var(--…)` tokens to stay theme-consistent; a few phases already shipped new screens this way (Qibla, Zikr) with before/after screenshots confirming correct dark-mode rendering.
- Fonts (`app/layout.tsx`): **Hind Siliguri** (Bengali UI text), **Amiri** (Arabic, serif, used via a global `.arabic { font-family: 'Amiri', serif; direction: rtl; }` class), **Noto Serif Bengali** (headings), **Marcellus**. Amiri + the `.arabic` class is the established, reusable primitive for any RTL Quran text the Reader renders — it's already used in `QiblaScreen`, `TafsirScreen`, and the Zikr reading screen.
- No component library (no shadcn/MUI/etc.) — every screen is hand-built inline. `lucide-react` is the icon set in use throughout.

### 2.5 Authentication and backend

- **There is no authentication system in this codebase.** `app/lib/firebase.ts` initializes only `getFirestore` — there is no `firebase/auth` import anywhere in the `app` tree (verified by search). `ProfileScreen.tsx` displays "অতিথি ব্যবহারকারী" (**Guest User**) and a settings row reading "Google দিয়ে লগিন" ("Log in with Google") — **this is decorative UI only; it has no `onClick`, no auth SDK call, nothing behind it.** It visually promises a feature that does not exist.
- Firestore is used in exactly **one place**, **read-only**: `ResearchScreen.tsx` calls `getDocs(collection(db, 'research', catId, 'articles'))` to fetch pre-uploaded markdown research articles. No `setDoc`/`addDoc`/`updateDoc` call exists anywhere in the repo.
- **No `firestore.rules` or `firebase.json` file exists in this repository.** Security rules, if any, are managed entirely outside version control (presumably via the Firebase console directly). This is itself a gap worth flagging independent of this blueprint.
- **Practical consequence for this blueprint:** every durable, per-user feature in the app today (Sirah reading progress, Zikr counters, Qibla's last-used state, theme preference) is stored **client-side only, in `localStorage`, scoped to one browser/device**, via small hand-written key/value modules (`app/lib/sirah-progress.ts`, `app/lib/zikr-progress.ts`). There is no cross-device sync and no server-side notion of "this user." This is the single biggest open architectural question for Khatm Planner and Hifz Roadmap, both of which are naturally multi-week, cross-session, ideally cross-device commitments (Section 14.1).

### 2.6 Existing persistence pattern (the one to extend, not replace)

Confirmed in `app/lib/sirah-progress.ts` and `app/lib/zikr-progress.ts`, and reused across three shipped features (Sirah, Qibla preference storage, Zikr):

- A small set of `localStorage` keys, each namespaced with a `furqan_` or `furqan-` prefix.
- Every read/write wrapped in `try/catch` and guarded by `typeof window === 'undefined'` for SSR safety.
- Business logic for anything stateful (counters, completion, daily resets) is factored into **pure, exported functions** that take the current state and return the next state — no logic embedded directly in components. This is what made `app/lib/zikr-progress.ts` unit-testable without a DOM (28 passing tests) and `app/lib/qibla.ts`'s bearing/distance math unit-testable the same way (12 passing tests). **This "pure engine function + thin React wrapper" pattern is the strongest existing convention in the codebase and should be the default architecture for Khatm Planner's scheduling math and Hifz Roadmap's adjustment math** (Section 7, Section 13).

### 2.7 AI assistant (NUR)

- `app/components/NurScreen.tsx` is a chat UI that posts to a Next.js Route Handler, `/api/nur` (confirmed via `fetch('/api/nur', …)`), which — per this repo's own commit history (`git log`: "Migrate NUR from Anthropic to Gemini API (free tier)") — is backed by the Gemini API (`@google/genai` dependency in `package.json`).
- NUR's own system framing, visible in its hardcoded opening message, is explicit that it may not know an answer directly and will point to related ayat instead of asserting certainty (`"সরাসরি উত্তর না জানলেও সংশ্লিষ্ট আয়াত দেবো"` — *"even if I don't know the direct answer, I'll give related ayat"*). This existing self-limiting framing is a useful precedent for Section 11 (AI boundaries) — NUR is already positioned as a conversational guide that defers to the Quran itself, not as a scholarly authority, and future AI-assisted features should keep that same posture explicit rather than assume it's understood.
- NUR is a general Q&A assistant, **not Quran-reading-specific** — it does not currently know what surah/ayah a user is reading, has no access to reading progress, and is not described anywhere as giving Tajweed or recitation feedback.

### 2.8 Tests, lint, build

- Test runner: Node's built-in `node --test app/**/*.test.ts` (`package.json` `"test"` script), enabled by `allowImportingTsExtensions: true` in `tsconfig.json`. **Confirmed present today:** `app/lib/qibla.test.ts` (12 tests) and `app/lib/zikr-progress.test.ts` (28 tests), both green. **Confirmed absent:** no test file exists for Sirah's progress logic (`sirah-progress.ts`) despite it following the same pattern — an existing gap, not something this blueprint introduces.
- Lint: `eslint` via `eslint-config-next@16.2.10`. There is a **known, accepted, pre-existing baseline** of 11 lint findings (8 errors, 3 warnings), all `react-hooks/set-state-in-effect` warnings from the "read localStorage on mount" pattern (Section 2.6) plus two `next/image`/custom-font advisory warnings. The established team convention (seen in the Qibla and Zikr implementations) is a scoped `eslint-disable-next-line` with a one-line justification referencing the existing precedent, not restructuring the pattern. Any new phase should expect to add the same disables for the same reason and keep the total at baseline, not grow it.
- Build: `next build` (Turbopack) — confirmed to complete cleanly as of the latest commit on this branch.

### 2.9 PWA / offline

- `public/manifest.json` and `public/sw.js` exist and are wired via `app/layout.tsx`. The service worker (`sw.js`) is a basic **app-shell + runtime cache** strategy: on install it precaches a short static list (`/`, `/offline.html`, manifest, a couple of icons); on fetch, successful GET responses are cached opportunistically and served from cache as a fallback. **There is no fine-grained or dataset-aware caching strategy today** — nothing in the current service worker is built to handle a large, structured dataset like the full Quran text or recitation audio files. This is a real gap the Reader's offline requirement must design for, not assume is already solved (Section 12.5).

### 2.10 Content-authoring pattern already in use

`app/content/*.md` holds ~30 long-form research articles as plain Markdown files, rendered via `app/components/MarkdownRenderer.tsx`, alongside the Firestore-backed research path (Section 2.5). This shows the team is comfortable with **both** a bundled-static-file content strategy and a Firestore-backed one depending on the content type — relevant precedent when choosing how to ship Quran text/translations in Section 7.3.

---

## 3. Information architecture and navigation (Proposed)

The existing five-tab shell should **not** be restructured — the task description explicitly forbids rebuilding navigation, and the Knowledge-tab "sub-app" pattern already demonstrated by Research/Sirah/Qibla/Zikr is proven and reusable.

**Proposed placement:**

| New feature | Home | Nav tab | Rationale |
|---|---|---|---|
| A. Quran Reader | Replaces/absorbs the **তাফসির** tab's role over time | তাফসির (existing tab, re-scoped) | Tafsir is already the closest existing concept to "read the Quran, see what it means." Re-scoping this tab avoids a 6th nav item and gives the Reader the most prominent existing slot. The current `TafsirScreen` becomes the Reader's first screen once real data exists, not a parallel feature. |
| B. Khatm Planner | New tile on Home + entry under জ্ঞান | জ্ঞান (Knowledge hub) | A planning/tracking tool, same shape as Qibla/Zikr — not core "reading," so it fits the Knowledge-hub family, same as those two. |
| C. Essential Surah/Ayah Memorization | New tile on Home + entry under জ্ঞান | জ্ঞান | Structured curriculum + lessons, closer in spirit to Sirah (structured, progressive reading/learning) than to Tafsir (reference lookup). |
| D. Personalized Hifz Roadmap | Surfaced *from inside* Memorization (C), not a separate nav destination | জ্ঞান (sub-screen of C) | The Roadmap is an assessment + schedule *over* the Memorization curriculum, not an independent content area. Giving it its own tab would fragment one coherent user journey into two. |
| E. Live Recitation Checking (future) | Surfaced *from inside* both the Reader (A) and Memorization (C) as a contextual action ("চেক করুন" on a given ayah/lesson) | No new tab | It's a capability applied to existing reading/memorization surfaces, not a destination of its own. |

This keeps the bottom nav at five items and reuses the `isKnowledgeActive` grouping pattern (Section 2.2) for B and C, exactly as Qibla and Zikr already did.

**Proposed `Screen` union additions** (illustrative, not final — to be confirmed at the start of each phase against the `Screen` type and `VALID_SCREENS` array that must stay in sync):

```
// Reader (Phase 1)
'reader' | 'reader-surah' | 'reader-search' | 'reader-bookmarks'

// Khatm Planner (Phase 2)
'khatm' | 'khatm-setup' | 'khatm-today' | 'khatm-progress'

// Memorization (Phase 3)
'hifz-curriculum' | 'hifz-unit' | 'hifz-lesson'

// Hifz Roadmap (Phase 4)
'hifz-assessment' | 'hifz-roadmap' | 'hifz-revision'
```

Each follows the existing `AppRoute` extra-param convention (e.g. a `surah`/`ayah` pair for deep-linking into the Reader, mirroring how `zikrSection`/`zikrItem` already work for Zikr).

---

## 4. User journeys (Proposed)

### 4.A Quran Reader

1. User taps তাফসির (re-scoped) or a Home tile → lands on a **Surah index**: all 114 surahs, Arabic name, Bengali name, ayah count, revelation type (Meccan/Medinan), search box (an evolution of the existing `TafsirScreen` index, now backed by real complete data instead of 11 hardcoded entries).
2. Taps a surah → **Surah reading view**: ayah-by-ayah, Arabic (Amiri, RTL) + translation beneath each ayah, a bookmark toggle per ayah, a "continue from here" affordance.
3. Can search across all surahs/ayah translations (not just surah names, unlike today's `TafsirScreen` search).
4. Can bookmark any ayah; bookmarks list is reachable from the Home "বুকমার্ক" tile, finally making that existing placeholder real.
5. Reading position auto-saves (mirroring `sirah-progress.ts`'s `LastRead` pattern) so returning to Reader resumes where they left off.
6. Tafsir and recitation audio are **not** in Phase 1 scope — the screen must clearly show "coming soon" for those rather than imply they exist, exactly the mistake the current `TafsirScreen` makes by crediting "Ibn Kathir" without a real source.

### 4.B Quran Khatm Planner

1. User opens Khatm Planner (new, empty state: "আপনার কুরআন খতম পরিকল্পনা শুরু করুন").
2. Chooses either a **target completion date** or a **duration** (e.g. "30 days", "6 months", "1 year").
3. App calculates a daily ayah/page target (Section 9.1) and shows how it would be distributed across the five daily prayers or a custom schedule the user defines.
4. User confirms → plan is created and persisted.
5. Each day, a "today's target" view shows what's due, lets the user mark portions read (ideally driven by actual reading activity in the Reader, with manual mark-as-read as a fallback since Reader↔Planner integration may lag — see Section 6).
6. If a day is missed, the app shows a **catch-up plan**: how the remaining days' targets adjust, never silently dropping the completion date without telling the user (Section 9.1 edge cases).
7. On completion, a simple completion summary/celebration, consistent with the tone already established by Zikr's `CompletionSummary` screen.

### 4.C Essential Surah and Ayah Memorization

1. User opens the Memorization hub → sees a **curriculum**: an ordered list of surahs/ayah-sets (e.g. short Meccan surahs first, essential prayer-related ayat, etc.), each tagged with estimated difficulty/length.
2. Picks a unit → enters a **lesson flow**: listen (audio — Phase 3 may ship this stubbed/deferred if licensed audio isn't ready, see Section 10.4), repeat, chunked recall (breaking a long ayah into memorizable phrases), self-check recall.
3. Progress per unit tracked through defined stages (e.g. *Introduced → Practicing → Recall-ready → Mastered*, with explicit mastery criteria, not just a binary done/not-done — Section 9.2).
4. Revision of previously-"mastered" units is prompted on a schedule (the seed of what Hifz Roadmap (D) later generalizes).
5. Any AI-generated practice hints or encouragement are visually distinguished from the verified Arabic text/translation itself (Section 11).

### 4.D Personalized Hifz Roadmap

1. User completes a short **assessment**: self-reported current memorization level (e.g. "none," "a few short surahs," "several juz," "nearly complete"), recitation confidence, daily available time, and (optionally) a target date.
2. App generates a **realistic schedule**: how much new material to introduce per week, how revision time is balanced against new memorization, explicitly avoiding a promised completion date that the assessed pace can't support (Section 9.2).
3. Each day/week, the user sees what's due: new memorization + revision queue, pulling from the Memorization (C) curriculum/engine.
4. If the user falls behind, the roadmap **recalculates** rather than silently failing — showing the user what changed and why (Section 9.2 adjustment rules), the same transparency principle as the Khatm Planner's catch-up plan.
5. Long-term retention is modeled as a recurring revision cadence, not a one-time pass — this is the feature's core differentiator from (C), which is the content/lesson engine Hifz Roadmap schedules.

### 4.E Live Recitation Checking (future, not built)

1. (Future) From a Reader ayah or a Memorization lesson, a "চেক করুন" (check) action opens a microphone-based recitation check.
2. (Future) The system attempts **word-level recognition only** at first — did the user say the right words, in the right order — with an explicit, visible confidence indicator, not a silent pass/fail.
3. (Future) Pronunciation/Tajweed-level feedback is **explicitly out of scope** until a validated, Tajweed-aware model exists; the UI must not imply Tajweed checking is happening when it isn't (Section 11.3).
4. (Future) Low-confidence results are surfaced as "uncertain — try again or skip" rather than guessed at.

---

## 5. Screen-by-screen requirements (Proposed)

### 5.A Quran Reader

| Screen | Purpose | Key elements | States to handle |
|---|---|---|---|
| Surah Index | Browse/search all 114 surahs | Search bar, surah list (number, Arabic name, Bengali name, ayah count, Meccan/Medinan badge), continue-reading card if a saved position exists | Empty search results; first-ever visit (no saved position) |
| Surah Reading | Read one surah ayah-by-ayah | Per-ayah: number, Arabic (RTL, Amiri), translation, bookmark toggle; surah header (name, info); jump-to-ayah control | Long surah performance (Al-Baqarah = 286 ayat — must not render all at once without virtualization/pagination); mid-surah deep link from Planner/search |
| Search | Full-text search across translations (Arabic search deferred unless normalization is solved — Section 14.3) | Query input, results list with surah:ayah + snippet | No results; query too short |
| Bookmarks | List of saved ayat | Grouped by surah, tap to jump back into Reading | Empty state (ties directly into retiring the Home "বুকমার্ক — শীঘ্রই আসছে" placeholder) |

### 5.B Khatm Planner

| Screen | Purpose | Key elements | States to handle |
|---|---|---|---|
| Setup | Choose date/duration + schedule style | Date picker or duration presets, 5-prayer vs custom schedule toggle, calculated daily target preview before confirming | Target date in the past; duration too short for even 1 page/day (impossible pace — must warn, not silently accept) |
| Today | Daily target + mark progress | Today's assigned portion (surah:ayah range or page range), mark-as-read action, streak/on-track indicator | No active plan yet (empty state → routes to Setup); plan already completed |
| Progress | Overview across the whole plan | Calendar/timeline view, completed vs. remaining, missed days flagged, catch-up plan summary | Plan abandoned/restarted; plan completed early |

### 5.C Essential Surah/Ayah Memorization

| Screen | Purpose | Key elements | States to handle |
|---|---|---|---|
| Curriculum | Ordered list of memorization units | Unit title, length/difficulty tag, stage badge (not-started/practicing/mastered), progress bar | Curriculum not yet populated (Phase 3 start) |
| Unit/Lesson | Step through listen→repeat→chunk→recall | Audio player (if available) or text-only fallback, chunked ayah display, self-check recall prompt, "I've got this" / "needs more practice" self-assessment | No audio available yet (must degrade gracefully to text-only, not block the lesson) |
| Revision Queue | Units due for review | List sorted by due date, quick-recall check | Empty queue (nothing due today) |

### 5.D Personalized Hifz Roadmap

| Screen | Purpose | Key elements | States to handle |
|---|---|---|---|
| Assessment | Capture current level, time, target | Multi-step form (level, confidence, daily minutes, optional target date) | User skips optional target date (schedule should still generate a pace-based estimate, not block) |
| Roadmap | The generated schedule | Weekly breakdown: new material + revision load, estimated completion range (a range, never a single guaranteed date — Section 9.2) | Pace is mathematically unrealistic for the stated target (must warn and offer an adjusted target, never silently promise the original one) |
| Revision (shared with 5.C's Revision Queue, scheduled by this engine) | Day-to-day due items | Same as 5.C Revision Queue, but populated by the Roadmap's schedule instead of a fixed cadence | Learner falls behind — show recalculated plan with a visible "your plan changed because…" explanation |

### 5.E Live Recitation Checking (future — design only, not built)

| Screen | Purpose | Key elements | States to handle |
|---|---|---|---|
| Recitation Check | Mic-based word-match against an ayah | Record button, live/post-attempt word-level match indicator, explicit confidence label | Microphone permission denied; low-confidence result; background noise / unsupported browser |

---

## 6. Feature boundaries and dependencies (Proposed)

```
            ┌────────────────────┐
            │   A. Quran Reader   │  (text + translation data layer)
            └─────────┬───────────┘
                       │ provides verified text/ayah-count data to
           ┌───────────┼─────────────┐
           ▼                         ▼
┌─────────────────────┐   ┌─────────────────────────────┐
│ B. Khatm Planner      │   │ C. Memorization Curriculum   │
│ (reading pace/schedule)│   │ (verified lesson content)    │
└─────────────────────┘   └──────────────┬──────────────┘
                                          │ scheduled by
                                          ▼
                             ┌─────────────────────────────┐
                             │ D. Personalized Hifz Roadmap │
                             └──────────────┬──────────────┘
                                            │ checked via (future)
                                            ▼
                             ┌─────────────────────────────┐
                             │ E. Live Recitation Checking  │
                             │          (future)            │
                             └─────────────────────────────┘
```

**Hard dependency:** B and C both need **A's verified text and at least ayah-level metadata** (ayah counts per surah, at minimum) to calculate anything — B for daily page/ayah targets, C for defining what a "unit" even is. **This is why Phase 1 (Reader/data layer) must precede Phase 2 and Phase 3**, not just by the roadmap's ordering convention but by genuine data dependency.

**Soft dependency, explicitly not hard:** B (Khatm Planner) does **not** require C or D to function — a user can run a Khatm plan with zero interest in memorization. Conversely C/D do not require B. The two tracks (reading-through vs. memorizing) are **independent features sharing one data layer (A)**, and should be built so a user can use one without the other ever being touched. This independence should be preserved deliberately — do not let Khatm Planner and Hifz Roadmap share a single "progress" data model just because they're both schedules; they track different things (pages/ayat read once vs. units memorized to mastery with ongoing revision) and conflating them would be a modeling mistake (Section 8 keeps them as separate types).

**D depends on C**, not the reverse: the Roadmap schedules units that C's curriculum defines; it has no independent content of its own.

**E depends on both A and C** as *targets* to check recitation against, but is architecturally bolt-on — it should not require changes to A/C's core data models, only an additional action surfaced from their existing reading screens.

**Everything in A–D depends on NUR (existing) not at all**, and NUR should not be assumed to "know about" any of this in Phase 1–4 — if a future phase wants NUR to be aware of what a user is currently memorizing, that is new integration work, not a free side effect of building these features.

---

## 7. Proposed technical architecture (compatible with the existing project)

### 7.1 Screen/navigation layer
Extend `Screen`, `VALID_SCREENS`, `AppRoute`, and `useAppNavigation.ts` following the exact pattern Qibla and Zikr already established (Section 3's proposed screen list). No new routing mechanism, no file-based routes — this project's `?s=` switcher is a deliberate existing convention, not a limitation to work around.

### 7.2 Component/styling layer
New screens are React components under `app/components/`, styled with inline `style={{}}` objects reading the existing `var(--…)` CSS custom properties, matching every existing screen. No new design system, no Tailwind-utility rewrite, no component library introduction. RTL Arabic uses the existing `.arabic` class / Amiri font convention.

### 7.3 Data/content layer — three live concerns, kept separate

1. **Quran text + translation (Arabic + at least one translation)**: a **bundled, version-controlled dataset** (static JSON shipped with the app, similar in spirit to how `app/content/*.md` is bundled today) is the recommended default, **not** a live third-party API call at read time. Reasons: (a) the existing `quran.ts` third-party dependency is unverified and was unreachable in this sandbox; (b) a bundled dataset lets the PWA actually work offline (Section 12.5), which a live API cannot; (c) a bundled dataset can be checksummed/diffed for integrity (Section 10.2) in a way a live API response cannot be guaranteed to stay. Firestore is a secondary option only if the team wants server-side updatability without a redeploy — but given the existing Firestore usage is read-only and small (Section 2.5), and the Quran dataset is large and essentially static once verified, bundling is the better fit for *this* codebase's existing patterns.
2. **Per-user progress/state** (reading position, bookmarks, Khatm plan + daily marks, memorization stage per unit, Hifz roadmap + revision queue): follows the existing `localStorage` pure-engine pattern (Section 2.6) **as the Phase 1–4 default**, with the cross-device/account gap called out explicitly as an open decision (Section 14.1), not silently worked around with a new auth system this blueprint didn't ask for.
3. **Any future audio** (recitation audio for Memorization, or the live recitation-checking feature): out of scope for data-modeling detail in this phase beyond flagging licensing and bandwidth as real constraints (Section 10.4, Section 12.3) — no architecture is proposed for audio storage/streaming yet because no source has been selected.

### 7.4 Calculation logic — pure functions, the existing precedent
Khatm Planner's daily-target/catch-up math and Hifz Roadmap's pacing/adjustment math should each be a **pure-function module** (e.g. `app/lib/khatm-plan.ts`, `app/lib/hifz-schedule.ts`) exactly mirroring `app/lib/qibla.ts` (deterministic math, no side effects, independently unit-testable) and `app/lib/zikr-progress.ts` (state-transition functions taking current state + today's date, returning next state). This is not a stylistic suggestion — it's the one pattern in this codebase that has actually produced reliable, tested, bug-caught-before-shipping code twice already (Qibla's real orientation-listener bug, Zikr's 28 passing edge-case tests), and the scheduling math in B and D is exactly the kind of logic that benefits most from it.

### 7.5 Server-side needs
Everything above can be built as client-side logic + bundled static data, consistent with the existing app (no new backend required for Phases 1–4). The only place a Next.js Route Handler is plausible is **Phase 5 (live recitation)**, if speech processing needs to happen server-side rather than fully on-device — and even that decision is explicitly deferred pending model/vendor selection (Section 14.5), not assumed here.

---

## 8. Data models and relationships — **PROPOSED, NOT IMPLEMENTED**

All interfaces below are design sketches for future phases. None of this has been created in the codebase. Field names are illustrative.

### 8.A Quran Reader

```ts
// Bundled, read-only reference data (ships with the app)
interface SurahMeta {
  number: number;              // 1-114
  arabicName: string;
  banglaName: string;
  englishName: string;
  ayahCount: number;
  revelationType: 'Meccan' | 'Medinan';
}

interface AyahText {
  surah: number;
  ayah: number;
  arabic: string;               // verified source text — see Section 10.1
  translations: {
    [translationId: string]: string; // keyed by a registered, attributed source
  };
}

// User-local state (localStorage, mirrors sirah-progress.ts's LastRead pattern)
interface ReaderLastRead {
  surah: number;
  ayah: number;
  updatedAt: string; // ISO date
}

interface Bookmark {
  surah: number;
  ayah: number;
  note?: string;
  createdAt: string;
}
```

### 8.B Khatm Planner

```ts
interface KhatmPlan {
  id: string;
  createdAt: string;
  mode: 'targetDate' | 'duration';
  targetDate?: string;          // ISO date, if mode === 'targetDate'
  durationDays?: number;        // if mode === 'duration'
  scheduleStyle: 'fivePrayers' | 'custom';
  customSlots?: string[];       // e.g. ['fajr','after-dhuhr','isha'] subset, if custom
  dailyTargetAyahs: number;     // derived at creation time — see Section 9.1
  status: 'active' | 'completed' | 'abandoned';
}

interface KhatmDailyProgress {
  planId: string;
  date: string;                 // ISO date, local-day key (mirrors zikr-progress.ts's todayKey() pattern)
  targetAyahs: number;          // today's target, which may differ from dailyTargetAyahs after a catch-up recalculation
  readAyahs: number;
  completed: boolean;
}

interface KhatmCatchUpEvent {
  planId: string;
  triggeredOnDate: string;
  missedAyahs: number;
  newDailyTarget: number;       // the recalculated pace going forward
  userNotified: boolean;        // the app must surface this, never apply silently
}
```

### 8.C Essential Surah/Ayah Memorization

```ts
type MasteryStage = 'not-started' | 'introduced' | 'practicing' | 'recall-ready' | 'mastered';

interface MemorizationUnit {
  id: string;
  order: number;                // curriculum sequence — preserved like Zikr's source order (Section 2.6 precedent)
  title: string;
  surah: number;
  ayahRange: [number, number];
  estimatedDifficulty: 'easy' | 'medium' | 'hard';
  verified: boolean;             // true only once a qualified reviewer has signed off — see Section 10.5
}

interface UnitProgress {
  unitId: string;
  stage: MasteryStage;
  lastPracticedAt?: string;
  masteredAt?: string;
  nextRevisionDue?: string;      // feeds the Revision Queue (5.C) and, once Phase 4 exists, the Roadmap (5.D)
}
```

### 8.D Personalized Hifz Roadmap

```ts
interface LearnerAssessment {
  id: string;
  createdAt: string;
  currentLevel: 'none' | 'few-short-surahs' | 'several-juz' | 'near-complete';
  recitationConfidence: 'low' | 'medium' | 'high';
  dailyMinutesAvailable: number;
  targetDate?: string;           // optional — a pace estimate must work without one
}

interface HifzSchedule {
  assessmentId: string;
  weeklyNewUnits: number;        // derived — see Section 9.2
  weeklyRevisionLoad: number;    // in units or minutes, derived
  estimatedCompletionRange: [string, string]; // a RANGE, never a single promised date
  generatedAt: string;
}

interface ScheduleAdjustment {
  scheduleId: string;
  triggeredOnDate: string;
  reason: 'fell-behind' | 'ahead-of-pace' | 'manual-target-change';
  previousWeeklyNewUnits: number;
  newWeeklyNewUnits: number;
  explanationShownToUser: string; // the human-readable "your plan changed because…" text (Section 4.D.4)
}
```

### 8.E Live Recitation Checking (future — shape only)

```ts
type ConfidenceLevel = 'low' | 'medium' | 'high';

interface RecitationAttempt {
  id: string;
  surah: number;
  ayah: number;
  recognizedWords: string[];     // word-recognition output only — NOT a Tajweed judgment (Section 11.3)
  expectedWords: string[];
  matchConfidence: ConfidenceLevel;
  flaggedForReview: boolean;     // low-confidence attempts surfaced as uncertain, never silently scored
  modelVersion: string;          // required once any model is in use, for later auditing
}
```

### 8.F Where these models live relative to each other

- `SurahMeta`/`AyahText` (8.A) are the **shared reference layer** read by B, C, and E — never duplicated into their own modules.
- `KhatmPlan`/`KhatmDailyProgress` (8.B) and `MemorizationUnit`/`UnitProgress` (8.C) are **deliberately separate** per the independence principle in Section 6 — a user's Khatm reading-through progress and their memorization mastery are different facts about different activities.
- `HifzSchedule` (8.D) **references** `UnitProgress` records (8.C) to know what's due; it does not duplicate or own memorization state.
- All per-user state (B, C, D local progress, 8.E attempts) sits behind the same open question flagged in Section 2.5/14.1: today this can only be `localStorage`-scoped per device, and every model above should be designed so it *could* later be synced to a real backend without a structural rewrite (e.g. plain serializable objects, no circular references, explicit `id`/timestamp fields already included above for that reason) — but no sync mechanism is being built now.

---

## 9. Progress calculations and business rules (Proposed)

### 9.1 Khatm Planner

**Daily target formula (duration mode):**
```
dailyTargetAyahs = ceil(totalAyahsRemaining / daysRemaining)
```
Using **ayah count**, not page count, as the base unit avoids dependency on a specific print mushaf's pagination (which varies by edition) — page-based display can be a UI convenience layered on top later, but ayah count is the portable unit of truth.

**Daily target formula (target-date mode):** identical, with `daysRemaining = targetDate - today` in local days.

**Edge cases that must be explicitly handled, not left to "whatever the formula does":**

| Edge case | Required behavior |
|---|---|
| Target date is today or in the past | Reject at Setup with a clear message; do not create a plan with `daysRemaining <= 0` (division by zero / nonsensical target). |
| `dailyTargetAyahs` would exceed a sane daily maximum (e.g. > 20 pages/day) | Warn at Setup: "এই গতিতে প্রতিদিন X আয়াত লাগবে — বাস্তবসম্মত?" and suggest the plan be extended, rather than silently accepting an unrealistic pace. The exact threshold is a product decision for Section 14.2, not hard-coded here. |
| A day is missed entirely | Do **not** silently push the completion date back. Recalculate `dailyTargetAyahs` for the *remaining* days to stay on the original target date if still feasible; if no longer feasible within the sane-maximum threshold, surface a choice: extend the date, or accept a higher daily pace, explicitly, via the `KhatmCatchUpEvent` record (Section 8.B) with `userNotified: true` required before it's considered handled. |
| Plan created mid-day | Today counts as a normal day in the duration count; do not add an extra "free" day. |
| User reads ahead of target | Should reduce tomorrow's target proportionally (never let a user "owe" negative ayat) — or, as a product choice to confirm in Section 14.2, could instead bank the surplus toward an early finish. Either is defensible; pick one and document it before Phase 2 implementation, don't leave it ambiguous. |
| Multiple overlapping missed days | Catch-up recalculation must be idempotent — running it twice on the same missed-day data must not double-penalize the schedule. (Directly mirrors the `withDailyReset` idempotency property already unit-tested in `zikr-progress.ts` — same class of bug, same style of fix.) |

### 9.2 Personalized Hifz Roadmap

This is explicitly the feature most at risk of overpromising, per the task's own instruction ("Avoid promising unrealistic completion dates"). Proposed guardrails:

1. **Always output a range, never a single date** (`estimatedCompletionRange`, Section 8.D) — e.g. "22–30 weeks at your current pace," not "you will finish on March 3rd."
2. **Weekly new-material pace is capped**, not simply derived from "total remaining ÷ weeks until target date" the way Khatm's reading pace is. Memorization retention degrades if new material is introduced faster than revision can reinforce it — the schedule must balance `weeklyNewUnits` against a `weeklyRevisionLoad` floor (a minimum fraction of available weekly time reserved for revision of already-"mastered" units, not spent on new material), with the exact ratio a decision for a qualified reviewer, not invented here (Section 14.4).
3. **If a stated target date would require exceeding the pace cap**, the Roadmap must say so explicitly at generation time (mirroring Khatm's unrealistic-pace warning in 9.1) and offer the pace-capped range instead of silently generating an aggressive schedule.
4. **Falling-behind adjustment rule:** when actual `UnitProgress` completions trail the schedule for a defined trailing window (e.g. missed revision or no new unit introduced for N consecutive scheduled days — exact N a product decision, Section 14.4), the system generates a new `ScheduleAdjustment` (Section 8.D) that **reduces near-term new-material pace and does not touch the revision floor** — i.e., when behind, the system protects retention of what's already memorized before it protects speed toward new material. This is the core "don't promise unrealistic dates" rule in concrete form: speed is the variable that flexes, retention quality is not.
5. **Getting ahead of pace** should be reflected too (symmetric to 9.1's "read ahead" case) — not handled in this document's formulas in detail, but must not be ignored; a learner who's ahead should see that reflected rather than the schedule staying static.

### 9.3 Memorization mastery criteria (feeds both 9.2 and the Curriculum itself)

A unit should not move to `'mastered'` (Section 8.C) on a single successful recall. Proposed minimum bar (to be confirmed with a qualified reviewer, Section 14.4, not finalized here): at least two independent successful recall checks, separated by a minimum elapsed time (e.g. not both in the same session), before `'mastered'` is set — a lightweight, explicit mastery gate rather than an implicit "they tapped done once" standard, consistent with the task's explicit instruction to define mastery criteria rather than leave them unstated.

---

## 10. Quran text sourcing, licensing, integrity validation, content-verification requirements

This is, alongside Section 11, the section most likely to block or reshape the implementation phases — it should be read and decided on before Phase 1 engineering starts.

### 10.1 Sourcing decision — not yet made
The only Quran-text source currently referenced anywhere in this codebase is the unused `api.alquran.cloud` client (Section 2.3), which:
- Was unreachable from this sandbox environment (403 at the network-policy level) — unconfirmed whether that's sandbox-specific or would also affect the production Vercel deployment.
- Has unconfirmed licensing terms for the specific Arabic mushaf text and Bengali translation it serves — this must be checked before any dependency on it, bundled or live.

**This blueprint does not select a source.** That is an explicit decision for Section 14.3, requiring confirmation of license terms (e.g. a Tanzil.net-style explicit permissive license for the Arabic Uthmani text, and a named, attributable, permission-cleared Bengali translation — translations are usually copyrighted works with named translators and specific usage terms, unlike the Arabic text itself which is generally not restricted by copyright but individual digitized/typeset editions can still carry usage conditions).

### 10.2 Integrity validation
Whatever source is chosen, before it ships:
- **Ayah counts per surah must match the well-known standard counts** (114 surahs, 6,236 ayat in the standard count) as an automated sanity check, not a one-time manual check — this is a mechanical check a unit test can perform once real data exists (consistent with Section 2.8's existing testing culture).
- **Checksum/diff the bundled dataset against the authoritative source on every update**, so a future content update can't silently corrupt or truncate text.
- **No AI-generated or AI-paraphrased Arabic text, ever, under any circumstance.** This is a hard boundary, not a style preference (Section 11.1 restates this as an AI boundary).

### 10.3 Translation and tafsir sourcing
- Translation: must be a named, attributed, licensed source — never machine-translated for display as "the translation." (Machine translation may have a role as an AI-assistance layer explicitly labeled as such — Section 11.2 — but never presented as *the* verified translation.)
- Tafsir: the current `TafsirScreen`'s unsourced "Ibn Kathir" paraphrase (Section 2.3) is a problem to fix, not a pattern to extend. Any future tafsir content needs either (a) a real licensed translation of an actual tafsir work, clearly cited, or (b) to not claim a specific scholarly source at all if the content is original explanatory writing. This blueprint explicitly flags the existing Fatiha tafsir content as needing the same review before Phase 1 ships anything adjacent to it.

### 10.4 Recitation audio (for Memorization, Phase 3)
No audio source is selected. Licensing for reciter audio is its own, separate research task (reciter permissions typically run through specific Quran-audio distribution platforms with their own terms) — flagged for Section 14.5, explicitly deferred, and Phase 3's screen requirements (Section 5.C) already specify a text-only fallback so audio licensing is not a blocker for shipping *some* version of Memorization.

### 10.5 Human review gate
Per the task's explicit instruction not to finalize curriculum content in this phase: **no surah/ayah selection for the Memorization curriculum (Section 8.C's `MemorizationUnit.verified` flag) should default to `true` without a named, qualified reviewer's sign-off**, and the blueprint recommends the app itself never display unverified curriculum content to end users — `verified: false` units should not be user-visible at all, not shown with a lesser badge. This keeps "not yet reviewed" and "reviewed and safe to show" unambiguous in the data model itself, not just in process discipline.

---

## 11. AI and speech-recognition boundaries

### 11.1 Hard boundary: AI never generates or alters Quran text
No Arabic Quran text displayed anywhere in the Reader, Memorization curriculum, or Khatm Planner may be AI-generated, AI-paraphrased, or AI-corrected. This includes NUR — if a future phase lets NUR quote Quran text in a chat response, that quoted text must come from the same verified dataset (Section 10.1), not be generated by the model itself. This is the single most important rule in this document.

### 11.2 Where AI assistance is appropriate (clearly labeled, never the content of record)
- Suggesting a practice *schedule* phrasing or encouragement message in Khatm Planner/Hifz Roadmap (tone, not facts).
- Helping chunk a long ayah into memorizable phrases *as a study aid*, visually distinct from the verified ayah text itself, and never replacing display of the actual verified text.
- NUR-style conversational discussion *about* a passage the user is reading — exactly NUR's existing, already-shipped role (Section 2.7) — kept separate from the Reader's own verified display of that passage.
- Any such AI output must be visually distinguished in the UI (e.g. a distinct card style/label — "AI sahayota" / "AI সহায়তা" or similar, a UI decision for implementation time) from verified content, mirroring how the Zikr feature already visually flags unverified-source items with a "পাঠ্য যাচাইযোগ্য" (needs-review) badge rather than hiding the distinction (Section 2.6's established precedent for honest content-provenance labeling).

### 11.3 Live recitation checking — explicit non-claims for now
- Phase 5 is **word-recognition only**: did the reciter say the correct words, in the correct order. This is a meaningfully different (and meaningfully more tractable) problem than Tajweed correctness (makharij, madd rules, ghunnah, etc.), which requires audio-phonetic analysis far beyond word matching.
- **The app must never claim or imply Tajweed-checking capability until a specifically validated Tajweed model is in place and reviewed** — this is both a UX-honesty requirement and, in a religious-practice context, a trust requirement: a false "correct" on a real Tajweed error is actively harmful in a way a false negative in, say, a vocabulary app is not.
- Every recognition result must carry a `ConfidenceLevel` (Section 8.E) and the UI must render that distinction, not just a binary check/cross.
- No model may be deployed for this feature without an explicit decision on which validated speech model/vendor to use (Section 14.5) — this blueprint deliberately does not pick one.

---

## 12. Accessibility, mobile responsiveness, performance, privacy, offline

### 12.1 Accessibility
- Arabic text must render with adequate line-height and font size for RTL legibility (the existing `.arabic` class already sets `direction: rtl`; actual sizing should follow the same per-screen tuning already seen across Qibla/Zikr's Arabic blocks — no single global font-size is safe across both a dense surah-index list and a focused reading view).
- Respect `prefers-reduced-motion` for any animated transitions (e.g. lesson-stage transitions in Memorization, a Khatm completion celebration) — directly following the precedent already shipped in `app/globals.css`'s `.zikr-counter`/`.nur-dot` animations.
- All interactive controls (bookmark toggle, mark-as-read, recall self-assessment) need adequate touch target size and visible focus/pressed states, matching the existing Zikr reading screen's explicit large-hit-area design (itself a direct response to a prior requirement in this project's history).

### 12.2 Mobile responsiveness
All four features are phone-first, continuing this app's existing single-column, bottom-nav mobile layout (confirmed: no desktop-specific layout exists anywhere in the current app). No new responsive strategy is needed beyond what's already established.

### 12.3 Performance
- The Quran dataset (6,236+ ayat × Arabic + at least one translation) is meaningfully larger than anything currently bundled in this app (the largest existing content is the Sirah chapter set and ~30 markdown research articles). Loading/searching this must not block the main thread or balloon initial bundle size — likely needs per-surah lazy-loading rather than one monolithic JSON file, a concrete technical decision for Phase 1 implementation, not resolved here.
- Full-text search (Reader, Section 5.A) across all translations needs an indexing strategy decided at implementation time (e.g. a precomputed lightweight search index shipped alongside the dataset) — flagged, not designed, here.

### 12.4 Privacy
- Per Section 2.5, there is no user-account system; all progress is local to one device by default. This is, incidentally, a strong privacy baseline (nothing about a user's memorization progress or reading habits leaves their device under the current architecture) — worth preserving deliberately rather than treating the lack of sync purely as a limitation (see the explicit tradeoff framing in Section 14.1).
- If live recitation checking (Phase 5) ever processes audio off-device, that is a new privacy surface requiring its own explicit user consent flow and data-handling disclosure — not assumed solved by anything in this document.

### 12.5 Offline
- The existing service worker (`public/sw.js`, Section 2.9) is a generic app-shell cache, not dataset-aware. The Reader's core promise (read the Quran reliably, including offline, once visited) requires the bundled-dataset approach from Section 7.3 specifically because a bundled static asset is cacheable by the existing service worker's "cache successful GET responses" behavior without any new caching logic — whereas a live third-party API would not be reliably offline-available. This is a direct architectural reason, not just a preference, to prefer bundling over a live API for Phase 1.

---

## 13. Testing and acceptance criteria (Proposed)

Following the existing, proven pattern (Section 2.8):

### 13.1 General acceptance bar for every phase
- `npx tsc --noEmit` clean.
- `npm run lint` at or below the existing 11-problem baseline (new `react-hooks/set-state-in-effect` instances from the established "load localStorage on mount" pattern are expected and should be scoped-disabled with a comment, exactly as done for Qibla/Zikr — not treated as new debt).
- `npm test` green, with new pure-function modules (Khatm pacing/catch-up math, Hifz scheduling/adjustment math, mastery-stage transitions) covered by `node:test` unit tests in the same style as `qibla.test.ts`/`zikr-progress.test.ts` — this should be a hard requirement given how directly that pattern already caught real bugs twice in this project's history.
- `npm run build` clean.
- Manual interactive verification (Playwright against the dev server, as done for both Qibla and Zikr) covering: the feature's full happy path, at least one edge case from Section 9's tables per feature, dark-mode rendering, and — specifically for anything touching `localStorage` — a same-day vs. new-day persistence check (the daily-reset class of bug this project has already hit and fixed once).

### 13.2 Feature-specific acceptance criteria (illustrative, to be finalized per phase)

| Feature | Must-pass criteria before calling a phase done |
|---|---|
| A. Reader | All 114 surahs browsable; ayah counts match the verified standard counts (Section 10.2); bookmark add/remove persists across reload; reading position resumes correctly; RTL Arabic renders correctly in both themes. |
| B. Khatm Planner | Daily target formula matches hand-calculated expected values for a range of durations (unit test); unrealistic-pace warning triggers at the chosen threshold; catch-up recalculation is idempotent (Section 9.1); missed-day and ahead-of-pace cases both produce a user-visible, non-silent outcome. |
| C. Memorization | Curriculum order is preserved and never silently reordered; unverified (`verified: false`) units never render to the end user (Section 10.5); mastery requires the defined minimum criteria (Section 9.3), not a single interaction. |
| D. Hifz Roadmap | `estimatedCompletionRange` is always a range, never collapsed to a single date in any rendered state; an unrealistic target date at Setup produces an explicit warning + alternative, not a silently-generated aggressive schedule; a falling-behind adjustment reduces new-pace before it ever reduces the revision floor (Section 9.2.4). |
| E. Live Recitation (future) | Not applicable until Phase 5 scoping is complete — no acceptance criteria are defined prematurely here beyond the non-claims in Section 11.3. |

---

## 14. Risks, unknowns, and decisions requiring human approval

Listed roughly in blocking order — 14.1–14.3 should be resolved before Phase 1 implementation begins; 14.4 before Phase 4; 14.5 before Phase 5.

### 14.1 Account/sync architecture — does this system need real user accounts?
Today, **nothing** in Furqan has user accounts (Section 2.5) — the "Login with Google" row in Profile is decorative. Khatm Planner and Hifz Roadmap are both naturally multi-week commitments where losing progress by clearing browser data, or being unable to continue on a second device, is a real user-facing failure mode in a way it currently isn't for, say, the Qibla compass. **Decision needed from the product owner:** is local-only `localStorage` persistence acceptable for B and D's first shipped versions (consistent with how Sirah/Zikr/Qibla already ship), or does this new system justify finally building the real authentication the Profile screen already visually promises? This blueprint defaults to "local-only for now, flagged as a known limitation" purely because that's the existing, proven pattern — but this is a product decision, not an engineering one, and should be made explicitly rather than inherited by default.

### 14.2 Khatm Planner's exact numeric thresholds
Section 9.1 flags an "unrealistic daily pace" warning threshold and an "ahead of schedule: reduce tomorrow vs. bank surplus" choice without picking exact numbers/behavior. These are product decisions with real UX consequences (too strict a threshold nags users unnecessarily; too loose lets the feature overpromise exactly as the task instructed it must not).

### 14.3 Quran text/translation source selection and licensing (Section 10.1)
The single highest-priority open decision. No Phase 1 engineering should start against a specific dataset until this is resolved by someone who can confirm licensing terms — this is a legal/content question, not something to resolve by picking whatever API responds fastest in testing.

### 14.4 Memorization mastery bar and Hifz pacing ratios (Section 9.2, 9.3)
The specific numbers (minimum recall attempts for mastery, weekly revision-floor percentage, "falling behind" trailing-window length) are pedagogical decisions this blueprint deliberately left as placeholders rather than inventing. **Recommend involving someone with actual Hifz-teaching/Quran-memorization-pedagogy experience**, not just an engineer's best guess, before Phase 4 locks these in — the task's own instruction to "avoid promising unrealistic completion dates" is a pedagogical claim as much as a UX one.

### 14.5 Live recitation model/vendor selection (Section 11.3)
Completely unscoped by design — no speech model, vendor, on-device-vs-server tradeoff, or language-model-vs-specialized-ASR decision has been made or should be assumed from this document. Phase 5 should start with its own dedicated research/scoping step, not an implementation step.

### 14.6 `api.alquran.cloud` reachability from production
Unconfirmed either way (Section 10.1) — worth a five-minute check from the actual Vercel deployment (not this sandbox) before anyone assumes it is or isn't usable, even as a fallback/secondary source.

### 14.7 Existing content-integrity debt (not created by this blueprint, but adjacent)
`TafsirScreen`'s unsourced "Ibn Kathir" Fatiha content (Section 2.3, 10.3) predates this blueprint and is out of this phase's scope to fix, but should be flagged to the product owner now rather than discovered later as an inconsistency once the new, properly-sourced Reader ships next to it.

---

## 15. Phased implementation roadmap

The task's proposed ordering is sound and is kept, with the dependency reasoning from Section 6 made explicit and one refinement noted below.

| Phase | Scope | Hard prerequisite |
|---|---|---|
| **0** | This blueprint; architecture agreed; Section 14's blocking decisions (14.1–14.3) resolved | None — in progress now |
| **1** | Verified Quran source selected (14.3 resolved); Reader (5.A) built: surah index, reading view, search, bookmarks, reading-position persistence | Phase 0's 14.1–14.3 decisions made |
| **2** | Khatm Planner (5.B): setup, daily target calc (9.1), today/progress screens, catch-up logic | Phase 1's `SurahMeta`/ayah-count data (not full tafsir/audio — see refinement below) |
| **3** | Memorization curriculum (5.C): curriculum structure, lesson flow (text-first; audio deferred per 10.4 if unresolved), progress/mastery (9.3) | Phase 1's verified Arabic text; a reviewed, `verified: true` curriculum list (10.5, 14.4) |
| **4** | Personalized Hifz Roadmap (5.D): assessment, schedule generation (9.2), revision scheduling, adjustment rules | Phase 3's `UnitProgress`/curriculum structure; 14.4's pedagogical thresholds set |
| **5** | Live recitation checking (5.E), starting with validated word-level recognition only | Its own vendor/model scoping (14.5) — independent of Phases 1–4's completion, could in principle run in parallel once scoped, but should not ship before 11.3's non-claims are enforced in the UI |
| **6** | Cross-feature integration (e.g. Reader↔Khatm reading-driven progress instead of manual mark-as-read; NUR awareness of current reading/memorization context, if desired), user testing, refinement | Phases 1–4 stable in production |

**One refinement to flag, not a reordering:** Phase 1 as scoped in Section 5.A includes search and bookmarks, which Phase 2 (Khatm Planner) does not actually need — Khatm Planner only needs `SurahMeta` (ayah counts) and enough of the reading view to mark progress against. If timeline pressure exists, **a "Reader-lite" sub-milestone (surah index + reading view + verified text, no search/bookmarks yet) could unblock Phase 2 earlier** without waiting for all of Phase 1's scope. This is offered as an option, not a required change to the approved ordering.

---

## 16. Definition of done, per phase

- **Phase 0 (this phase):** blueprint document exists at `docs/quran-learning-system-blueprint.md`, reviewed by the product owner, and Section 14.1–14.3 decisions are explicitly answered (even if the answer is "defer, accept the stated default") before Phase 1 starts. **No code implementing any of Features A–E exists.**
- **Phase 1:** Reader ships with a verified, licensed dataset (10.1–10.2 satisfied); all Section 13.2 Reader acceptance criteria pass; `TafsirScreen`'s current 11-surah placeholder is either replaced or explicitly reconciled with the new Reader (not left as a confusing parallel feature); existing features (Sirah, Zikr, Qibla, NUR, Research, Profile) verified still fully functional (lint/build/test baseline unchanged or improved, manual smoke test of each existing screen).
- **Phase 2:** Khatm Planner ships; Section 13.2 Khatm criteria pass; Section 9.1's edge-case table is covered by both unit tests and at least one manual walkthrough per row.
- **Phase 3:** Memorization curriculum ships with a **reviewed** (not placeholder) unit list per 10.5; Section 13.2 Memorization criteria pass; text-only lesson flow fully functional even if audio is deferred.
- **Phase 4:** Hifz Roadmap ships; Section 13.2 Roadmap criteria pass, specifically including the "never a single promised date" and "adjustment protects revision before speed" checks as explicit, tested behaviors, not just design intentions.
- **Phase 5:** Live recitation ships only with a named, validated model/vendor; Section 11.3's non-claims are verifiably reflected in the UI copy (a reviewer should be able to confirm the app never says or implies "Tajweed checked" anywhere); confidence levels are visibly rendered on every result.
- **Phase 6:** Cross-feature integrations ship individually scoped and tested, not as one undifferentiated "integration" blob; user testing findings are captured and triaged before being called complete.

---

## 17. Summary for the approver

- **What exists today, confirmed:** a working Islamic-knowledge app (Sirah biography reader, research library, Qibla compass, PDF-sourced Azkar tracker, general-purpose AI chat) with **no working Quran reading experience** (only an 11-surah placeholder with real content for one surah) and **no account system** (everything is local-device `localStorage`).
- **What this phase produced:** this blueprint document only.
- **What's genuinely risky/undecided and needs a human decision before Phase 1 starts implementing:** the Quran text/translation source and its license (14.3), and whether Khatm/Hifz tracking needs real accounts or can stay local-only like everything else in the app today (14.1).
- **What's deliberately deferred and should stay deferred:** live recitation checking's model/vendor choice (14.5) and recitation audio licensing (10.4) — correctly out of scope until Phase 5 and Phase 3 respectively.

---

*This document is a planning artifact. No Quran dataset was downloaded or integrated, no Khatm Planner/Memorization/Hifz/recitation-checking code was written, and no existing screen, route, or Firebase configuration was modified in the course of producing it.*
