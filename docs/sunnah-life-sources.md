# Sunnah Life — Sources, Review Gate, and the Standing Blocker

## 1. What this feature is and isn't

Sunnah Life is a native Furqan feature with two connected surfaces:

- **Today's Routine** — a flexible, time-slot-organized personal routine
  (waking, cleanliness, Fajr/morning, morning adhkar + a personal Qur'an
  goal, work/family/manners, daily prayers, evening adhkar, Isha/night,
  before-sleep). It is explicitly **not** a claim that Islam prescribes this
  exact set of slots, this order, or any specific repetition count/time/
  reward for an item unless that item's own evidence record says so.
- **Learn by Life Area** — 9 thematic areas adapted from *The Ideal Muslim*'s
  chapter structure (see `docs/sunnah-life-content-map.md`), used purely as
  a **navigation framework**. It is not a claim that the app reproduces or
  replaces the book, and no chapter text is copied into the app.

Both surfaces open the **same shared practice-detail record** for a given
practice ID (`app/lib/sunnah-life-registry.ts`), so a practice reached from
either entry point — or later, a reminder or search result — is always the
same record with the same tracking state.

## 2. Content sources named in the task (starting points only)

1. *Adorsho Muslim* / *The Ideal Muslim*, Dr. Muhammad Ali al-Hashimi,
   Bengali translation by Masudur Rahman Nur, pub. Sabujpatra Publications.
2. *Hisnul Muslim*, Dr. Saeed ibn Ali ibn Wahf al-Qahtani.
3. *Riyad as-Salihin*, Imam al-Nawawi.
4. *Al-Adab al-Mufrad*, attributed to Imam al-Bukhari.

Starting URLs given (sushikkha.in, mail.islamicstudies.info,
risala.prh.gov.sa, hadithbd.com, sunnah.day): per the task's own framing,
these are **starting points, not guarantees of authenticity, translation
rights, or permission to republish** — and this session could not directly
fetch them (see `docs/sunnah-life-content-map.md` for why). **No text from
any of these sources, or from the specific translations named, has been
copied into this app.** All displayed instructions in
`sunnah-life-registry.ts` are short, product-authored summaries, each
carrying only a *claim* about what the general subject area/source type is
— not a reproduction of book paragraphs.

## 3. The religious evidence gate (what every registry entry must carry)

Defined in `app/lib/sunnah-life-types.ts` (`SunnahPractice`). Every entry
has: stable ID + content version; Bengali title + product-authored
instructions; optional Arabic/transliteration/meaning (only included when
short and well-attested, e.g. "Bismillah" — never a full invented
translation); `sourceType` (quran / hadith / scholarly_reference /
general_habit); a structured `sourceReference` (collection, book/chapter,
identifier, whether that identifier is confirmed, and a URL where
resolvable); optional grading + grading authority (also flagged
confirmed/unconfirmed); a `classification` (obligatory / wajib /
emphasized_sunnah / sunnah / nafl / adab / general_habit) with
`classificationNotes` for genuine scholarly disagreement; explicit booleans
for whether a count/time/virtue claim is directly evidenced; and a
`review` block (status, reviewer identity/role/date, editorial notes,
version history, licensing notes).

## 4. The standing blocker — stated plainly, per the task's own instruction

**I am an AI assistant, not a qualified Islamic scholar or religious
reviewer, and no human religious reviewer has been engaged for this work.**
The task itself requires: *"An editor or reviewer with appropriate religious
expertise must approve religious claims and classifications. Engineering
tests cannot replace religious review... Unreviewed content must not be
published as verified religious guidance."*

Consequently:

- **Every single entry in `sunnah-life-registry.ts` is created with
  `review.status: 'pending_review'`.** None are marked `approved`. This is
  enforced by a test (`sunnah-life-engine.test.ts`) that fails the build if
  any registry entry is ever set to `approved` without a `reviewer` name
  and `reviewDate` also being present — i.e. the code itself refuses to
  treat an entry as verified absent reviewer metadata.
- The UI never says "verified" for a pending practice. It shows a clear,
  honest "পর্যালোচনাধীন" (under review) badge and the source claim as a
  claim to verify, not an established fact.
- This is a genuine, acknowledged **stop-and-report blocker** for the
  "verified religious guidance" portion of the task, exactly as the task's
  own delivery-process instructions require when "religious reviewer
  approval... is missing": *"stop that dependent portion safely and clearly
  report the blocker"* — rather than inventing an approval that didn't
  happen.
- What is **not** blocked: the undisputed-obligatory-worship items (the
  five daily prayers) are classified `obligatory` because that
  classification itself is not a matter of scholarly dispute in any school
  of thought — but their individual citation/grading fields are still
  `pending_review`, honestly, since no reviewer has confirmed the exact
  Qur'anic/hadith citations attached to each record.

## 5. Licensing / reuse posture

No translated book text, chapter prose, or large excerpts from any of the
four named works are stored or displayed anywhere in this app. If a future
reviewer wants to quote a specific translated passage (e.g. a specific
Hisnul Muslim dua translation) verbatim, that requires separately confirming
the translation's own license/permission — not assumed here, per the task's
explicit instruction not to copy "copyrighted translations... without
documented permission or an appropriate license."
