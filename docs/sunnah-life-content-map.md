# Sunnah Life — Content Map (Phase 0 output)

This maps the four source books named in the task to the app's two Sunnah
Life navigation surfaces. It is a **navigation/content-planning document**,
not a religious verification record — the per-practice evidence record
(source reference, grading, classification, reviewer status) lives in
`app/lib/sunnah-life-registry.ts`, and that is the thing that actually gates
what ships as "verified."

## How this map was built — and its real limitations

- The five starting URLs the task named (sushikkha.in, mail.islamicstudies.info,
  risala.prh.gov.sa, hadithbd.com, sunnah.day) were **not directly fetched**.
  `WebFetch` has been unreliable against external domains throughout this
  session (see `public/quran/TAFSIR-SOURCES.md` §5 for the same finding on a
  different task), and a sandbox egress block was hit on at least one
  previously-attempted doc-reference domain. This session's two `WebSearch`
  queries (for *The Ideal Muslim*'s chapter list and *Hisnul Muslim*'s
  structure) returned **indexed/secondary summaries**, not a verified read of
  the primary pages, and those summaries explicitly disagreed with each other
  on chapter counts and numbering across editions.
- The chapter structure below for *The Ideal Muslim* and *Hisnul Muslim* is
  reconstructed from **general knowledge of these well-known, widely
  published works**, cross-checked against those search summaries. It is
  **not a confirmed match to the specific editions/pages at the five linked
  URLs**, and exact hadith numbering/wording is **not** asserted here.
- Riyad as-Salihin and Al-Adab al-Mufrad are referenced only at the
  theme/chapter level (e.g. "the chapter on kindness to parents"), never
  with a specific hadith number invented to fill a gap — per the task's
  explicit instruction not to fabricate references.
- **Every row's "Reviewer status" is `pending_review`.** No practice in this
  app is marked religiously verified by this work. See
  `docs/sunnah-life-sources.md` for why, and for the standing blocker.

## Book → App category → Practice → Source claim → Reviewer status

| Book / theme | App category | Precise practice (product-authored) | Source claim to verify | Reviewer status |
|---|---|---|---|---|
| Hisnul Muslim — waking-up chapter | Today's Routine → ঘুম থেকে ওঠা (Waking) | Say the waking-up dua on opening your eyes | Hadith (Bukhari), specific wording/grading not pinned down here | pending_review |
| Hisnul Muslim — dressing chapter | Today's Routine → পরিচ্ছন্নতা ও পোশাক (Cleanliness/dressing) | Say "Bismillah" and the dressing dua when putting on clothes | Hadith (Abu Dawood/Tirmidhi per common compilations), exact grading unconfirmed | pending_review |
| Hisnul Muslim — mosque/adhan chapters; general fiqh | Today's Routine → ফজর ও সকালের আমল (Fajr/morning) | Fajr prayer is obligatory (fard) worship, performed at its prescribed time | Qur'an + mutawatir practice — obligatory status is not in dispute among any school | pending_review (classification itself is undisputed, but the record's full citation/grading fields are still unfilled) |
| Hisnul Muslim — morning/evening remembrance chapters | Today's Routine → সকালের আযকার ও কুরআন লক্ষ্য (Morning adhkar + Quran goal) | A short, open-ended personal Qur'an reading goal, framed as the user's own flexible target, not a fixed count | General encouragement toward regular Qur'an recitation; no specific invented verse count or reward figure | pending_review |
| Al-Adab al-Mufrad / Riyad as-Salihin — chapters on manners, kindness, truthfulness | Today's Routine → কাজ, পরিবার ও আচরণ (Work/family/manners) | General adab: truthful speech, keeping promises, kindness at work/home | Multiple hadith across both compilations on honesty/manners; no single hadith cited here to avoid over-specifying an unverified reference | pending_review |
| Fiqh of the five daily prayers (general) | Today's Routine → দৈনিক নামাজ (Daily prayers) | Track the five obligatory prayers as a flexible daily checklist | Qur'an + consensus — obligatory status undisputed | pending_review (citation fields unfilled) |
| Hisnul Muslim — evening remembrance chapter | Today's Routine → সন্ধ্যার আযকার (Evening adhkar) | Evening adhkar as an established, recommended (not obligatory) practice | Hadith-based collection of evening remembrance; Hisnul Muslim is itself a secondary compilation — ultimate hadith source per item not individually re-verified here | pending_review |
| Hisnul Muslim — sleep chapter | Today's Routine → রাত ও ঘুমানোর আগে (Isha/night + before-sleep) | Isha prayer (obligatory) + the before-sleep dua and sleeping on the right side | Isha: Qur'an/consensus. Dua + sleeping posture: hadith, specific grading unconfirmed | pending_review |
| The Ideal Muslim — "The Muslim and his Lord" | Learn by Life Area → আল্লাহর সাথে সম্পর্ক | Framing worship and daily life as service to Allah; tawakkul in daily affairs | Qur'anic themes (general, not a single invented ayah pulled out of context) | pending_review |
| The Ideal Muslim — "The Muslim and himself" | Learn by Life Area → নিজের সাথে সম্পর্ক | Self-accountability (muhasabah), guarding one's time and health | General Islamic ethical teaching; no single hadith pinned without confirming it | pending_review |
| The Ideal Muslim — "The Muslim and his parents" + Al-Adab al-Mufrad kindness-to-parents chapter | Learn by Life Area → পিতা-মাতা | Birr al-walidayn — kindness and obedience to parents (adapted: framed for any reader regardless of whether parents are living) | Qur'an (e.g. commands to honour parents) + hadith chapters in both books; exact ayah/hadith citation left for reviewer to confirm before publishing as "verified" | pending_review |
| The Ideal Muslim — "The Muslim and his wife" | Learn by Life Area → বিবাহ ও স্ত্রী/স্বামী (relabeled, inclusive: only shown as relevant to a user who has or expects a spouse, never assumed) | Mutual kindness and rights between spouses | Qur'an + hadith on marital conduct; book's own chapter is gender-specific (husband's duties) — app explicitly does not universalize a gender-specific ruling to all users | pending_review |
| The Ideal Muslim — "The Muslim and his children" | Learn by Life Area → সন্তান ও অভিভাবকত্ব (relabeled: shown as relevant content, never assumed every user is a parent) | A parent's responsibility to raise, educate, and show mercy to children | Hadith on mercy to children (e.g. general compilations); specific citation pending reviewer | pending_review |
| The Ideal Muslim — "The Muslim and his relatives" | Learn by Life Area → আত্মীয়তা ও আত্মীয়ের হক (kinship ties) | Silat ar-rahim — maintaining family/kinship ties | Qur'an + hadith on silat ar-rahim; frequently cited, but exact reference still unconfirmed here | pending_review |
| The Ideal Muslim — "The Muslim and his neighbour" + Al-Adab al-Mufrad neighbour chapter | Learn by Life Area → প্রতিবেশী | Kindness and rights of neighbours | Hadith (commonly cited, e.g. on Jibril's repeated advice about neighbours) — specific wording/grading to be confirmed by reviewer, not asserted here | pending_review |
| The Ideal Muslim — "The Muslim and his friends/Muslim brothers" | Learn by Life Area → বন্ধু ও মুসলিম সমাজ | Brotherhood, loyalty, and good company | Hadith on brotherhood in Islam; left for reviewer confirmation | pending_review |
| The Ideal Muslim — "The Muslim and his society" | Learn by Life Area → সমাজ ও সামাজিক দায়িত্ব | Amr bil ma'ruf, social responsibility, honesty in dealings | Qur'an + hadith on social conduct; left for reviewer confirmation | pending_review |

## Separation of evidence from product/engineering decisions

- **Book-derived evidence** (the "Source claim" column above) describes what
  these well-known works are generally understood to cover — it is a
  starting point for a qualified reviewer, not a finished citation.
- **Product-design choices** made independently of any book: the 9 life-area
  labels are reworded to be inclusive (e.g. "সন্তান ও অভিভাবকত্ব" is shown to
  everyone as informational content, never gated behind "do you have
  children?"); Today's Routine's time slots are a flexible personal
  organizer, not a claim that Islam prescribes exactly these slots or this
  order.
- **General engineering recommendation**: reuse the existing
  `zikr-tracker-engine.ts` snapshot-on-interaction pattern for practice
  tracking (see `docs/sunnah-life-sources.md` and the new
  `app/lib/sunnah-life-engine.ts`), since it already solves "preserve past
  records when the source item later changes."
