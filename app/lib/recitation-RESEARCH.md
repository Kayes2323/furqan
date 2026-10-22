# Phase 7A — Quran Recitation Checking: technical feasibility research

Written before implementation, per the explicit instruction not to assume
a general Arabic speech model would be accurate enough. This records
what was actually investigated, what was found, and why the adapter
shipped in this phase is the one it is — kept here rather than only in
commit messages so the decision is auditable later.

## 1. Options investigated

### Tarteel AI (the inspiration for this feature)
Tarteel is a consumer mobile app ("Tarteel: AI Quran Memorization") with
a Premium "mistake detection" feature (missed/incorrect/extra words — not
Tajweed/pronunciation). **No public developer API or self-serve pricing
page for programmatic access was found.** Its support docs point to
`tarteel.ai/pricing` for the consumer subscription only. This rules out
calling "the Tarteel API" directly — it doesn't appear to exist for
third-party developers.

### Tarteel's own open models (Hugging Face)
Tarteel's org publishes Whisper models fine-tuned specifically on Quranic
recitation audio (their blog states training on 75,000+ minutes of
recitation):
- `tarteel-ai/whisper-tiny-ar-quran` — license: **apache-2.0** (confirmed
  on the model card). Self-reported eval: Loss 0.09, WER ~7.05% (model
  card doesn't document the exact eval set — "More information needed").
- `tarteel-ai/whisper-base-ar-quran` — a third-party aggregator cites a
  final WER of 5.75%, not confirmed on the official card; license not
  independently confirmed for this specific variant (sibling `tiny`
  model is apache-2.0, and both derive from OpenAI Whisper, MIT).
- A community Hugging Face discussion (`InferenceSupport/discussions/2870`)
  shows someone requesting that `whisper-base-ar-quran` be added to HF's
  hosted **Inference Providers** — meaning, as of this research, it is
  **not confirmed to be available via HF's free/pay-as-you-go hosted
  inference** without a dedicated (paid) Inference Endpoint or
  self-hosting the weights.

This is the most credible Quran-specific, openly-licensed option found.
**It is not wired into this prototype** because deploying it needs
either a paid HF Inference Endpoint + an API token, or self-hosting a
Whisper model (GPU/CPU inference infrastructure) — neither of which
exists in this project's Vercel deployment today. This project's Vercel
environment variables were checked directly (`GEMINI_API_KEY` is the
only one configured); there is no Hugging Face, Azure, or Google Cloud
Speech credential to call a hosted model with. **This is the honest
blocker**: the better option is real and openly licensed, but this
session has no credentials or infrastructure to turn it on. Enabling it
later needs: an `HUGGINGFACE_API_TOKEN` (or self-hosted endpoint URL) in
Vercel's project environment variables, plus a new adapter implementing
`RecognitionAdapter` that POSTs recorded audio chunks to it — the
`RecognitionAdapter` interface in `recitation-types.ts` was designed so
that adapter can be added without touching the comparison engine or UI.

### Web Speech API (browser-native `SpeechRecognition`)
Built into Chrome/Edge (desktop and Android) as `window.SpeechRecognition`
/ `window.webkitSpeechRecognition`. Chrome does the recognition
server-side (not offline) but the audio goes directly from the browser
to the browser vendor's own speech service — **never to Furqan's
servers**, and Furqan never stores or sees the audio. No API key, no
added cost, no backend code, works today with zero new Vercel
configuration. It is **general-purpose Arabic recognition, not trained
on Quranic recitation** — no Tajweed-aware elongation handling, no
muqatta'at-letter familiarity, accuracy on real recitation is unverified
(see §5 for exactly what was and wasn't tested).

### Gemini audio input (noted, not implemented)
This project already has a working `GEMINI_API_KEY` (used by
`/api/nur`), and Gemini models accept audio input directly, which could
transcribe/compare a recorded clip through a new server route using the
exact same pattern as `/api/nur`. This is a real, lower-effort path to
add later — but it is still general-purpose (not Quran-fine-tuned) and
chunked/batch rather than live word-by-word, and was not built in this
phase to keep the prototype's recognition source to one, thoroughly
tested adapter rather than two half-verified ones.

### Other findings from the search
- An open small ASR model, `Abdou/quran-asr-tiny` (6.94% WER / 2.81% CER
  on its own held-out set, training code public), transcribes Quranic
  audio but does no alignment/mistake-detection on its own.
- A GitHub project ("Real-Time Quran Recitation Tracker") does
  fuzzy-matching word tracking, but its license/code quality wasn't
  vetted, so its algorithm wasn't reused — `recitation-compare.ts`
  implements a standard word-level edit-distance alignment instead (the
  same technique used to compute WER), which is simple enough to own
  and fully unit-test rather than depend on.
- A 2026 ICML paper, *TajweedWER*, proposes a recitation-aware ASR
  evaluation metric; relevant to a future accuracy evaluation, not to
  this phase's architecture.

## 2. Decision

Ship `RecognitionAdapter` as a pluggable interface
(`app/lib/recitation-types.ts`) with exactly one real implementation in
this phase: `WebSpeechRecognitionAdapter`
(`app/lib/web-speech-adapter.ts`). It is the only option that is (a)
actually deployable today with the credentials this project has, (b)
testable by this session (feature-detection and the full error path —
see §5), and (c) honest about not being Quran-specific — the in-app
privacy/capability disclosure says so explicitly in Bangla, and nowhere
does the UI claim Tajweed, makharij, or pronunciation checking.

The comparison engine (`recitation-compare.ts`) is adapter-agnostic: it
takes canonical words + recognized words (with optional per-word
confidence) and produces a word-level diff. Swapping in a Quran-specific
adapter later (Tarteel's HF Whisper model behind a server route, or
Gemini audio) requires no change to the engine or the UI beyond adding
the new adapter and letting the user pick it.

## 3. Confidence handling

Any recognized word below `CONFIDENCE_THRESHOLD` (0.5) is reported as
`'uncertain'`, never as a confirmed match or a confirmed mistake — see
`recitation-compare.test.ts` for the two tests proving this (a correct
word at low confidence is `'uncertain'`, not `'match'`; a wrong word at
low confidence is `'uncertain'`, not `'substituted'`). The UI shows
"সম্ভাব্য ভুল—আবার যাচাই করুন" whenever any word in a session lands in
that bucket.

Chrome's `SpeechRecognitionAlternative.confidence` is reported per
*result* (per recognized phrase chunk), not per word — every word in
that chunk inherits the same value. This is coarser than true per-word
confidence but still a real, non-fabricated signal from the engine, and
is documented as such in `web-speech-adapter.ts`.

## 4. Integrity of the canonical text

The canonical Arabic text displayed and compared against is loaded
straight from the same verified Tanzil dataset the Reader uses
(`loadSurah`/`loadSurahMeta` from `reader-data.ts`) — nothing is
retyped or regenerated. `compareRecitation` only ever *reads*
`normalizeArabic(canonicalText)` to decide whether two words match; the
`canonicalText` carried on every result is the verbatim source string.
The opening-Bismillah display split (`splitOpeningBismillah`, from the
earlier Bismillah-display fix) is reused so Al-Kawthar's ayah 1 renders
with the same header/body separation as the Reader.

## 5. What was actually verified in this session vs. not

**Verified (real, run in this session):**
- `recitation-compare.ts`'s alignment/classification logic: 14 unit
  tests covering correct recitation, a single omission, substitution,
  insertion, silence, confidence-threshold behavior (both edges),
  repeated-word alignment, and Unicode-normalization equivalence — all
  passing (`recitation-compare.test.ts`).
- The UI's feature-detection path: in this sandbox's headless Chromium,
  `window.webkitSpeechRecognition` **is** present, so the mic-permission
  button correctly appears (the unsupported-browser message was also
  separately confirmed to render when the constructor is forced absent).
- The UI's error-handling path end-to-end with a *real* SpeechRecognition
  error: launching Chromium with `--use-fake-device-for-media-stream`
  and `--use-fake-ui-for-media-stream` and calling `recognition.start()`
  produced a genuine `'audio-capture'` error from the browser itself
  (not simulated by this code) — **before any network request to a
  recognition backend was made**. The adapter correctly surfaced this
  through `onError`, and the screen kept rendering normally afterward
  (confirmed via Playwright).
- Full regression: `tsc --noEmit` clean, lint unchanged from the
  project's established 11-problem baseline, 123/123 unit tests passing
  (was 109), production build clean, and a Playwright smoke pass
  confirming Reader/Khatm/Nazera/Tafsir/Qibla/Zikr/Sirah/Research/
  NUR/Knowledge/Profile/bookmarks/search all still load.

**Not verified (honestly not claimed):**
- **Real recognition accuracy on actual Quran recitation audio.** This
  sandbox has no microphone hardware, and Chromium's fake-audio-device
  flags were not sufficient to get the Web Speech API's internal audio
  capture working headless (it failed at the `'audio-capture'` stage,
  before reaching the network). No word-error-rate, false-positive, or
  false-negative numbers were measured for Al-Kawthar or any other
  passage, with any reciter, voice, or noise condition. **This is the
  evaluation required by the task's step 5, and it did not happen in
  this session** — it needs a real device (phone or desktop with a
  working mic) running the deployed app.
- Whether `ar-SA` interim results behave well on mobile Chrome
  specifically (vs. desktop) — not tested on a real device.
- Whether this sandbox's network egress policy would even allow Chrome's
  speech backend traffic from a real device reaching it (irrelevant for
  an end-user's own browser/network, but means this session cannot
  self-verify the network leg either).

Given the above, **the headline claim this phase can honestly make is**:
the UI, the comparison engine, and the adapter's error-handling are real
and tested; live recognition accuracy on real Quranic recitation is
architecturally wired up but has not been measured by this session, and
must not be presented to the user as validated until it is.
