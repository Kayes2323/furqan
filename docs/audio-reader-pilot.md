# Furqan Audio Reader — Pilot (Sirah, chapter 11)

## 1. What this pilot is

A "শুনুন" (Listen) audiobook-style narration for **one** existing Sirah
chapter — `ch-11`, "হেরা গুহা ও প্রথম ওহী" (The Cave of Hira and the First
Revelation) — reading the chapter's existing Bengali text aloud in a
Bengali male voice. Listening is entirely optional; the text reader is
unchanged and fully functional with or without audio. No other chapter
has audio, and this does not expand automatically — `isChapterAudioAvailable()`
in `app/lib/sirah-audio-data.ts` is the single switch any other chapter
would need.

**Why ch-11**: it is real, finished content (not a "coming soon"
placeholder), long enough to meaningfully evaluate natural speech (6
sections, ~8,600 characters), thematically self-contained, and contains
no Quranic Arabic script that would need to be excluded from narration
(see §5).

## 2. Voice option investigated first: Edge TTS / bn-BD-PradeepNeural

The task's preferred starting point was the Bengali male Azure neural
voice **bn-BD-PradeepNeural**, accessed via the unofficial "Edge TTS"
trick (reusing Microsoft Edge's internal Read Aloud service for free,
with no official API key).

- **Confirmed real voice**: `bn-BD-PradeepNeural` is a real, Microsoft-
  documented Azure AI Speech voice (male, Bangla/Bangladesh).
- **Terms/reliability research** (via `WebSearch`, since the primary
  Microsoft Q&A/GitHub discussion pages could not be fetched directly):
  no source confirms this unofficial endpoint is licensed for third-party
  use. One technical discussion argues it is "probably not permitted" for
  anything beyond personal use, and warns Microsoft can block the
  endpoint or rotate its token at any time without notice. Multiple
  sources explicitly recommend the **official** Azure AI Speech service
  for any commercial/public-facing product instead.
- **This session's environment could not reach it at all**: installing
  the `edge-tts` Python package and calling it (`edge-tts --list-voices`)
  failed with a hard `403` from this sandbox's egress proxy. The proxy's
  own diagnostic log recorded this as a deliberate policy denial —
  `speech.platform.bing.com:443` is not an allowed destination for this
  session — not a transient network error. Separately, the real
  synthesis call this library makes is a WebSocket upgrade, which this
  sandbox's proxy documents as categorically unsupported regardless of
  host policy.
- **Conclusion, per the task's own instruction not to bypass
  restrictions**: this path was not pursued further here. It was not
  "tried and found low quality" — it was **network-blocked at the
  infrastructure level**, and independently flagged by outside sources as
  risky for a deployed/commercial app. Whoever runs this app's own
  deployment infrastructure (Vercel, not this sandbox) may have different
  network access and could still evaluate it later, with eyes open to the
  terms caveat above.

## 3. Voice actually used: Gemini API TTS ("Charon")

Per the task's own allowance to "compare... with other legitimate
free-tier options" when the first choice isn't workable, this pilot used
the **Gemini API's text-to-speech capability** (model `gemini-3.8-flash-tts`),
already present in this codebase's dependencies (`@google/genai`, the
same library the NUR feature uses) and already configured with a working
`GEMINI_API_KEY` on this project's Vercel deployment. This is Google's
own officially documented API, not an unofficial endpoint, and the key
never leaves the server (same pattern as `/api/nur`).

- **Voice chosen**: `Charon`, one of Gemini TTS's prebuilt voices,
  documented by Google as male, "informative," and described by
  third-party reviewers as "calm and professional" — a reasonable fit
  for an Islamic-educational-audiobook tone. This was a documented-
  character-based choice, not a personally "heard and judged" one — see
  the honesty note in §4.
- **Generation method**: a temporary, narrowly-scoped server route
  (`app/api/tts-pilot-internal/route.ts` — **removed** before this pilot
  shipped; see §6) that:
  1. Looked up the exact section text straight from `sirah-data.ts` (the
     app's own canonical content), so the narrated text could never drift
     from or rewrite the real article.
  2. Called Gemini TTS for that section's text, got back raw PCM audio.
  3. Wrapped the PCM in a WAV header (plain JS, no extra dependency).
  4. Fed that same audio back into a second Gemini call asking for a
     Bengali transcription, as an automatic content-integrity check (see
     §4).
  5. Returned everything as base64 inside JSON — returning raw binary
     directly was tried first and found to **corrupt the audio** when
     fetched through this session's HTTP tooling (which decodes
     responses as UTF-8 text); base64 is pure ASCII and round-trips
     exactly. This was caught by checking the fetched bytes for the UTF-8
     replacement character before trusting any output.
- **Pacing/pauses**: each section's heading and paragraphs are sent to
  the model separated by blank lines; the model naturally paused there
  (confirmed by `ffmpeg silencedetect` on the first generated clip — a
  genuine ~1-second pause after the heading, before the first paragraph).
  No SSML-style pause tags were used (Gemini TTS does not document
  support for them); no artificial pause was manually inserted.

## 4. Verification actually performed (not just claimed)

Per the task's explicit instruction not to claim quality without
checking, every generated clip was verified three ways:

1. **Structural validity** — `ffprobe` on every file: confirmed valid
   `pcm_s16le`, 24kHz mono WAV/MP3, with the expected duration (consistent
   at ~15 Bengali characters/second of audio across every section,
   confirming the model wasn't truncating or looping).
2. **Signal sanity** — `ffmpeg volumedetect`/`silencedetect` on every
   clip: healthy dynamic range (mean ≈ -17 to -19 dB, max 0 dB, no
   clipping), not silence, with natural pauses at paragraph breaks.
3. **Content-integrity round-trip** — the generated audio for the test
   section was fed back into a second Gemini call asking for a literal
   Bengali transcription, and that transcription was diffed against the
   original source text. The two matched almost word-for-word (only
   trivial spelling-normalization differences, e.g. ওহী/ওহি,
   বোখারী/বুখারী — the same word, different common spelling, not a
   content error). This confirms the audio actually says the real
   article text, correctly, in order — not silence, not another
   language, not garbled output.
4. **Honest limit**: this is **not** the same as a human listening and
   judging timbre/warmth. "Calm and professional" above is Google's own
   published character description for the Charon voice, not this
   assistant's own auditory judgment — an AI text model cannot literally
   hear audio quality. The project owner should listen to the committed
   files themselves (`public/audio/sirah/ch-11/*.mp3`) before treating
   the voice choice as final.

## 5. Text and audio integrity

- The narrated text is pulled directly from `sirah-data.ts` at
  generation time — nothing was retyped, summarized, or rewritten for
  TTS. `sectionToPlainText()` only joins the existing `title` + block
  `text` fields with blank lines; it changes no wording.
- `ch-11` contains no Quranic ayah text in Arabic script (it does contain
  a Bengali-phonetic rendering of the first revealed words, "ইকরা
  বে-ইসমে রাব্বিকাল্লাযি খালাক", which is Bengali script, not Arabic, so
  reading it as Bengali speech is correct and was not skipped).
- No pronunciation-only reformatting was needed for this chapter, so
  there is nothing kept "separate from the canonical text" here — if a
  future chapter needs that, it should live in a separate
  TTS-input-only field, never edited into the displayed article text.

## 6. The real blocker hit, and what it means going forward

**Gemini API's free tier caps `gemini-3.8-flash-tts` at 10 requests per
day, per project.** This was discovered directly from the API's own
`429 RESOURCE_EXHAUSTED` error (`quotaId:
GenerateRequestsPerDayPerProjectPerModel-FreeTier`, `quotaValue: "10"`),
not assumed. Generating ch-11's 6 sections (one of which is long enough
to need splitting into 2 TTS calls, giving 7 calls total) plus a few
unavoidable retries on transient "no audio returned" responses used up
that entire daily budget before the chapter was fully narrated.

**As shipped in this commit**: 5 of 6 sections are fully narrated
(`ch-11-s-01`, `ch-11-s-03`, `ch-11-s-04`, `ch-11-s-05`, and the first
half of `ch-11-s-06`). The missing parts — section `ch-11-s-02` and the
second half of `ch-11-s-06` — are tracked explicitly in
`app/lib/sirah-audio-data.ts` (not silently dropped), and the player
shows an honest banner naming exactly which part(s) aren't narrated yet,
pointing the listener to the always-available text reader for those.
This is reported as a real, current limitation, not hidden behind a
"complete pilot" claim.

**Going forward, per the task's "do not require a paid API subscription
for the initial pilot" vs. the reality of a 10-request/day cap**: this
free tier is workable for generating a handful of short chapters very
slowly (a few sections per day), but is **not** viable as a live,
on-demand production TTS backend, and is too slow even for finishing
this one pilot chapter same-day. Finishing the remaining two sections
only needs the quota to reset (about 19 hours from generation time) and
re-running the same narrow, temporary generation route — no code changes
needed. Expanding this pilot to more chapters, or wanting audio
generated faster than ~10 short clips/day, would need either Gemini's
paid tier or a properly licensed Azure AI Speech subscription (which
would also let the original bn-BD-PradeepNeural voice be used for real,
on Microsoft's official, documented API rather than the unofficial
endpoint this sandbox could not reach anyway).

## 7. File size / cost

- 5 MP3 files, ~4.3 MB total, committed under `public/audio/sirah/ch-11/`
  (libmp3lame, ~165kbps VBR, 24kHz mono — small enough that the repo and
  deploy size are not a concern; the two missing chunks would add roughly
  1–1.5 MB more once generated).
- Marginal cost: $0 — entirely within the Gemini API's free tier (which
  is also the reason for the 10/day ceiling above).

## 8. Architecture notes for anyone extending this later

- `app/lib/sirah-audio-data.ts` — the manifest (chapter → ordered list of
  section → audio-chunk-or-gap). This is the only file that needs a new
  entry to add audio for another chapter.
- `app/lib/audio-player-engine.ts` (+ `.test.ts`) — pure, framework-free
  multi-chunk timeline math (global time ↔ chunk+offset, seeking, speed
  cycling, time formatting). Fully unit-tested, no DOM dependency.
- `app/components/SirahAudioPlayer.tsx` — the actual `<audio>`-backed
  player UI: play/pause, seek, ±15s skip, 0.8×/1×/1.2×/1.5× speed,
  loading/error/retry states, the gap-section banner, keyboard support
  (Space to toggle, arrow keys on the seek bar), and a sticky "now
  playing" card. Renders nothing at all for a chapter with no audio
  chunks, so the text reader is the only thing that exists for every
  other chapter.
- No claim of background/lock-screen playback is made anywhere — not
  verified on a real device from this environment, and the task
  explicitly says not to promise that without verification.
- No playback-position persistence across screens was added in this
  pilot (kept intentionally small and in-component); the task listed it
  as "if technically feasible," not required.
