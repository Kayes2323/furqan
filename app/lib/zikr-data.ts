// ═══════════════════════════════════════════
// FURQAN — Zikr content, transcribed from the uploaded source PDF
// ("আত্মরক্ষার আমল" — 2 pages, Word-exported, not a scan).
//
// Fidelity rules followed here:
//  - Every targetCount below is copied verbatim from a "- N বার" in the
//    source; none are estimated or rounded.
//  - Phonetic transliteration is reproduced only where the source
//    actually gives it.
//  - Arabic SCRIPT is hand-typed in this file only for items that are
//    NOT Quranic ayahs (e.g. Sayyidul Istighfar, a hadith dua). An item
//    whose recitation genuinely is Quran text (Ayatul Kursi, the
//    closing two ayahs of Al-Baqarah, তিন কুল, etc.) instead carries a
//    `quranRefs` pointer and the screen loads the canonical Arabic
//    live from public/quran/ via reader-data.ts — never re-typed here.
//    This was fixed in the Phase 8.2 audit: the Arabic previously
//    hand-typed here for Ayatul Kursi / Baqarah 285-286 did not use
//    the Tanzil Uthmani orthography (e.g. plain alef "الله" instead of
//    alef-wasla "ٱللَّهُ") and so did not exactly match the app's own
//    canonical dataset — see Phase 8.2's final report for the full
//    audit of every item.
//  - Where the source only *names* a recitation without giving its text
//    (তিন কুল, দুআ ইউনুছ), the Phase 8.2 audit verified which of those
//    are genuine Quranic ayahs (both are) and added `quranRefs`
//    accordingly; nothing is invented for items that aren't.
// ═══════════════════════════════════════════

import type { ZikrCollection, RecitationItem, PracticeItem } from './zikr-types';

interface ReferenceRecitation {
  id: string;
  title: string;
  /** Hand-typed Arabic, present only for non-Quranic (hadith-based)
   *  reference recitations — see the fidelity note above. */
  arabic?: string;
  phonetic: string;
  note?: string;
}

/** Full recitations the source gives once (page 2) and refers back to by
 *  name elsewhere — kept here once to avoid repeating long phonetic text. */
export const REFERENCE_RECITATIONS: Record<string, ReferenceRecitation> = {
  'ref-ayatul-kursi': {
    id: 'ref-ayatul-kursi',
    title: 'আয়াতুল কুরসি',
    phonetic:
      'আল্লা-হু লা ইলা-হা ইল্লা হুওয়াল হাইয়ুল ক্বাইয়্যুম। লা তা\'খুযুহু সিনাতুঁও ওয়ালা নাউম। লাহু মা ফিস সামা-ওয়াতি ওয়ামা ফিল আরদ্বি। মান যাল্লাযী ইয়াশফাউ\' ইনদাহু ইল্লা বিইজনিহি। ইয়া\'লামু মা বাইনা আইদিহিম ওয়ামা খালফাহুম, ওয়ালা ইউহিতূনা বিশাইয়িম মিন \'ইলমিহি ইল্লা বিমা শা-আ\'। ওয়াসিআ\' কুরসিইয়্যুহুস সামা-ওয়া-তি ওয়াল আরদ্বি, ওয়ালা ইয়াউদুহু হিফযুহুমা। ওয়া হুওয়াল \'আলিইয়্যুল \'আজিম।',
  },
  'ref-baqarah-285-286': {
    id: 'ref-baqarah-285-286',
    title: 'সূরা বাক্বারার শেষ দুই আয়াত (২৮৫-২৮৬)',
    phonetic:
      '২৮৫. আমানার রাসূলু বিমা উনযিলা ইলাইহি মির রাব্বিহি ওয়াল মু\'মিনূন। কুল্লুন আমানা বিল্লাহি ওয়া মালা-ইকাতিহি ওয়া কুতুবিহি ওয়া রুসুলিহি, লা নুফার্‌রিকু বাইনা আহাদিম মির রুসুলিহি। ওয়া ক্বালূ সামি\'না ওয়া আতা\'না, গুফরা-নাকা রাব্বানা ওয়া ইলাইকাল মাসির। ২৮৬. লা ইউকাল্লিফুল্লাহু নাফসান ইল্লা উসআ\'হা। লাহা মা কাসাবাত ওয়া আ\'লাইহা মাকতাসাবাত। রাব্বানা লা তুআখিযনা ইন নাসীনা আও আখতা\'না। রাব্বানা ওয়ালা তাহমিল আ\'লাইনা ইসরান কামা হামালতাহু আ\'লাল্লাযীনা মিন ক্বাবলিনা। রাব্বানা ওয়ালা তুহাম্মিলনা মা লা তা-ক্বাতা লানা বিহ্। ওয়া\'ফু আ\'ন্না, ওয়াগফিরলানা, ওয়ারহামনা। আংতা মাওলানা, ফানসুরনা আ\'লাল ক্বাওমিল কা-ফিরীন। (আমীন)।',
  },
  'ref-sayyidul-istighfar': {
    id: 'ref-sayyidul-istighfar',
    title: 'সাইয়িদুল ইস্তিগফার',
    arabic:
      'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    phonetic:
      'আল্লা-হুম্মা আনতা রব্বি, লা ইলা-হা ইল্লা আনতা, খালাক্বতানী ওয়া আনা \'আবদুকা, ওয়া আনা \'আলা \'আহদিকা ওয়া ওয়া\'দিকা মাসতাতা\'তু। আ\'উযুবিকা মিন শাররি মা সানা\'তু। আবূউ লাকা বিনি\'মাতিকা আলাইয়্যা, ওয়া আবূউ বিযাম্বী, ফাগফিরলী, ফাইন্নাহু লা ইয়াগফিরুয যুনূবা ইল্লা আনতা।',
  },
};

function recitation(input: Omit<RecitationItem, 'kind'>): RecitationItem {
  return { kind: 'recitation', ...input };
}

function practice(input: Omit<PracticeItem, 'kind'>): PracticeItem {
  return { kind: 'habit', ...input };
}

function action(input: Omit<PracticeItem, 'kind'>): PracticeItem {
  return { kind: 'action', ...input };
}

// ─── সকাল-সন্ধ্যার আমল ──────────────────────────────────────────
const morningEvening: ZikrCollection['sections'][number] = {
  id: 'morning-evening',
  title: 'সকাল-সন্ধ্যার আমল',
  description: 'প্রতিদিন সকালে ও সন্ধ্যায় পাঠ করার আমল',
  items: [
    recitation({
      id: 'me-1a',
      order: 1,
      title: 'আয়াতুল কুরসি',
      phonetic: REFERENCE_RECITATIONS['ref-ayatul-kursi'].phonetic,
      targetCount: 1,
      sourceRef: 'সকাল-সন্ধ্যার আমল #১',
      quranRefs: [{ surah: 2, ayahStart: 255, ayahEnd: 255 }],
    }),
    recitation({
      id: 'me-1b',
      order: 2,
      title: 'তিন কুল (সূরা ইখলাস, সূরা ফালাক্ব, সূরা নাস)',
      targetCount: 3,
      sourceRef: 'সকাল-সন্ধ্যার আমল #১',
      quranRefs: [
        { surah: 112, ayahStart: 1, ayahEnd: 4 },
        { surah: 113, ayahStart: 1, ayahEnd: 5 },
        { surah: 114, ayahStart: 1, ayahEnd: 6 },
      ],
    }),
    recitation({
      id: 'me-2',
      order: 3,
      title: 'হাসবিয়াল্লাহু লা ইলাহা ইল্লা হুওয়া...',
      phonetic:
        'হাসবিয়াল্লাহ লা-ইলাহা ইল্লা হুওয়া আলাইহি তাওয়াক্কালতু ওয়া হুওয়া রাব্বুল আরশিল আযিম।',
      targetCount: 7,
      sourceRef: 'সকাল-সন্ধ্যার আমল #২',
      quranRefs: [{ surah: 9, ayahStart: 129, ayahEnd: 129 }],
      quranCaveatBn:
        'এই দোয়ার বাক্যটি কুরআনের আয়াত (সূরা আত-তাওবা ৯:১২৯) থেকে নেওয়া — তা নিশ্চিত। তবে এটি সকাল-সন্ধ্যা ৭ বার পাঠের আমল হিসেবে যে বর্ণনায় এসেছে (আবু দাউদ), সেই বর্ণনার সনদ নিয়ে মুহাদ্দিসদের মধ্যে মতভেদ আছে — কেউ কেউ তা সহীহ মাওকূফ (সাহাবীর কথা) বলেছেন, আবার আলবানীর মতে এটি মাওযূ (জাল) বলে চিহ্নিত হয়েছে। তাই আয়াতের পাঠ্য নিশ্চিত হলেও "৭ বার" আমলের সনদ অনিশ্চিত — এ বিষয়ে আরও যাচাই প্রয়োজন।',
    }),
    recitation({
      id: 'me-3',
      order: 4,
      title: 'আ\'উযু বিকালিমাতিল্লাহিত তাম্মাতি...',
      phonetic:
        'আ\'উযু বিকালিমা-তিল্লা-হিত তা-ম্মাতি মিন শাররি মা খালাক্ব।',
      targetCount: 3,
      sourceRef: 'সকাল-সন্ধ্যার আমল #৩',
    }),
    recitation({
      id: 'me-4',
      order: 5,
      title: 'বিসমিল্লাহিল্লাযী লা ইয়াদ্বুররু...',
      phonetic:
        'বিসমিল্লা-হিল্লাযী লা ইয়াদ্বুররু মা\'আ ইসমিহী শাইউন ফিল আরদ্বি ওয়ালা ফিস সামা-ই, ওয়াহুওয়াস সামী\'উল \'আলীম।',
      targetCount: 3,
      sourceRef: 'সকাল-সন্ধ্যার আমল #৪',
    }),
    recitation({
      id: 'me-5',
      order: 6,
      title: 'লা ইলাহা ইল্লাল্লাহু ওয়াহদাহু লা শারিকালাহ... (তাহলীল)',
      phonetic:
        'লা ইলা-হা ইল্লাল্লা-হু ওয়াহদাহু লা শারীকা লাহ, লাহুল মুলকু, ওয়া লাহুল হামদু, ওয়া হুওয়া \'আলা কুল্লি শাই\'ইন ক্বাদীর।',
      targetCount: 100,
      sourceRef: 'সকাল-সন্ধ্যার আমল #৫',
    }),
    recitation({
      id: 'me-6',
      order: 7,
      title: 'সাইয়িদুল ইস্তিগফার',
      arabic: REFERENCE_RECITATIONS['ref-sayyidul-istighfar'].arabic,
      phonetic: REFERENCE_RECITATIONS['ref-sayyidul-istighfar'].phonetic,
      targetCount: 1,
      sourceRef: 'সকাল-সন্ধ্যার আমল #৬',
    }),
    action({
      id: 'me-7',
      order: 8,
      title: 'সকালে খালি পেটে ৭টি খেজুর',
      instruction: 'খালি পেটে ৭টি আজওয়া/সাধারণ খেজুর খাওয়া (সকালে)।',
      sourceRef: 'সকাল-সন্ধ্যার আমল #৭',
    }),
  ],
};

// ─── অন্যান্য পালনীয় আমল ────────────────────────────────────────
const otherPractices: ZikrCollection['sections'][number] = {
  id: 'other-practices',
  title: 'অন্যান্য পালনীয় আমল',
  description: 'দৈনন্দিন জীবনে মেনে চলার মতো অভ্যাস ও আমল',
  items: [
    practice({ id: 'op-1', order: 1, title: 'সর্বদা ওযু অবস্থায় থাকা', instruction: 'সর্বদা ওযু অবস্থায় থাকা।', sourceRef: 'অন্যান্য পালনীয় আমল #১' }),
    practice({ id: 'op-2', order: 2, title: 'জামায়াতে নিয়মিত স্বলাত', instruction: 'নিয়মিত মসজিদে জামায়াতের সহিত স্বলাত আদায় করা।', sourceRef: 'অন্যান্য পালনীয় আমল #২' }),
    practice({ id: 'op-3', order: 3, title: 'তাহাজ্জুদ ও দুআ', instruction: 'নিয়মিত তাহাজ্জুদের স্বলাত আদায় করা + দুআ করা।', sourceRef: 'অন্যান্য পালনীয় আমল #৩' }),
    action({
      id: 'op-4', order: 4, title: 'বাথরুমে প্রবেশের দুআ',
      instruction: 'বাথরুমে প্রবেশের পূর্বে দুআ পাঠ করা।',
      phonetic: 'আল্লাহুম্মা ইন্নি আউযুবিকা মিনাল খুবুসি ওয়াল খাবা\'ইস।',
      sourceRef: 'অন্যান্য পালনীয় আমল #৪',
    }),
    action({
      id: 'op-5', order: 5, title: 'স্বলাত শুরুর আগে আশ্রয় প্রার্থনা',
      instruction: 'প্রত্যেক স্বলাত শুরু করার সময় আল্লাহর নিকট শয়তান হতে আশ্রয় চাওয়া (১ বার)।',
      phonetic:
        'আল্লাহু আকবার কাবিরা, ওয়াল হামদুলিল্লাহি কাসিরা, ওয়া সুবহানাল্লাহি বুকরাতাও ওয়া আসিলা। আউযুবিল্লাহি মিনাশ শয়তানির রাজিম, মিন নাফখিহি ওয়া নাফসিহি ওয়া হামযিহ।',
      sourceRef: 'অন্যান্য পালনীয় আমল #৫',
    }),
    action({
      id: 'op-6', order: 6, title: 'মসজিদে প্রবেশের দুআ',
      instruction: 'মসজিদে প্রবেশকালে এই দুআ পাঠ করা।',
      phonetic: 'আ\'উযু বিল্লা-হিল \'আযীম, ওয়া বিওয়াজহিহিল কারীম, ওয়া সুলতা-নিহিল ক্বাদীম, মিনাশ শাইতা-নির রাজীম।',
      sourceRef: 'অন্যান্য পালনীয় আমল #৬',
    }),
    action({
      id: 'op-7', order: 7, title: 'ঘর থেকে বের হওয়ার দুআ',
      instruction: 'ঘর থেকে বের হওয়ার সময় দুআ পাঠ করা।',
      phonetic: 'বিসমিল্লাহি তাওয়াক্কালতু আলাল্লাহ, লা-হাওলা ওয়ালা কুওয়াতা ইল্লা বিল্লাহ।',
      sourceRef: 'অন্যান্য পালনীয় আমল #৭',
    }),
    practice({ id: 'op-8', order: 8, title: 'সকল কাজের শুরুতে বিসমিল্লাহ', instruction: 'সকল কাজের শুরুতে "বিসমিল্লাহ" বলা।', sourceRef: 'অন্যান্য পালনীয় আমল #৮' }),
    practice({ id: 'op-9', order: 9, title: 'আমলদার লোকের সাথে সম্পর্ক', instruction: 'আমলদার লোকের সাথে সম্পর্ক করা।', sourceRef: 'অন্যান্য পালনীয় আমল #৯' }),
    practice({
      id: 'op-10', order: 10, title: 'দৈনিক ১ ঘণ্টা কুরআন তিলাওয়াত',
      instruction: 'প্রতিদিন সর্বনিম্ন ১ ঘণ্টা কুরআন তিলাওয়াত করা/শোনা, বিশেষত সূরা বাক্বারাহ, আয়াতুল কুরসি, সূরা বাক্বারার শেষ দুই আয়াত, সূরা গাফিরের প্রথম অংশ, সূরা ইয়াসিন, সূরা আস-সাফফাত, সূরা আদ-দুখান, সূরা জিন।',
      sourceRef: 'অন্যান্য পালনীয় আমল #১০',
      // Named surahs, surah-level only — Ayatul Kursi and Baqarah's last
      // two ayahs are within Al-Baqarah (2) itself, not separate links.
      quranSurahLinks: [2, 40, 36, 37, 44, 72],
    }),
    practice({ id: 'op-11', order: 11, title: 'দৈনিক ১ ঘণ্টা ইসলামিক জ্ঞান চর্চা', instruction: 'দিনে ১ ঘণ্টা ইসলামিক জ্ঞান চর্চা করা।', sourceRef: 'অন্যান্য পালনীয় আমল #১১' }),
    recitation({
      id: 'op-12a',
      order: 12,
      title: 'দুআ ইউনুছ',
      targetCount: 100,
      sourceRef: 'অন্যান্য পালনীয় আমল #১২',
      quranRefs: [{ surah: 21, ayahStart: 87, ayahEnd: 87 }],
      quranCaveatBn:
        'এই দোয়াটি (লা ইলাহা ইল্লা আনতা সুবহানাকা...) সরাসরি কুরআনের আয়াত — সূরা আল-আম্বিয়া ২১:৮৭, ইউনুস (আ.)-এর দোয়া হিসেবে পরিচিত। এই দোয়া পাঠের ফযীলত সম্পর্কিত হাদিসের সঠিক উৎস (তিরমিযী না আবু দাউদ) নিয়ে বিভিন্ন সূত্রে কিছুটা অসংগতি পাওয়া গেছে — মূল হাদিস সংকলনে যাচাই করে নেওয়ার পরামর্শ দেওয়া হচ্ছে।',
    }),
    recitation({
      id: 'op-12b',
      order: 13,
      title: 'লা-হাওলা ওয়ালা কুওয়াতা ইল্লা বিল্লাহ',
      phonetic: 'লা-হাওলা ওয়ালা কুওয়াতা ইল্লা বিল্লাহ।',
      targetCount: 100,
      sourceRef: 'অন্যান্য পালনীয় আমল #১২',
    }),
    practice({
      id: 'op-13', order: 14, title: 'আয়াতুল কুরসি ও তিন কুল (প্রতি স্বলাতের পর)',
      instruction: 'পাঁচ ওয়াক্ত স্বলাত শেষে আয়াতুল কুরসি-১ বার, তিন কুল-১ বার (সূরা ইখলাস, সূরা ফালাক্ব, সূরা নাস)।',
      duplicatesItemId: 'me-1a',
      sourceRef: 'অন্যান্য পালনীয় আমল #১৩',
    }),
    practice({
      id: 'op-14', order: 15, title: 'অপ্রয়োজনীয় তাকানো-কথা-খাওয়া-মেশা থেকে বিরত থাকা',
      instruction: 'অপ্রয়োজনীয় তাকানো, কথা বলা, খাওয়া ও মানুষের সাথে মেশা থেকে বিরত থাকা — কারণ এই চারটি বিষয় অমান্য করলে মানুষের আধ্যাত্মিকতা নষ্ট হয়ে যায়, এবং এই অবস্থায় জ্বিন ও শয়তান তার ওপর ক্ষমতা অর্জন সহজ হয়ে যায়।',
      sourceRef: 'অন্যান্য পালনীয় আমল #১৪',
    }),
    practice({
      id: 'op-15', order: 16, title: 'তাহলীল বেশি বেশি পড়া',
      instruction: 'লা ইলাহা ইল্লাল্লাহু ওয়াহদাহু লা শারিকালাহ, লাহুল মুলকু, ওয়া লাহুল হামদু, ওয়া হুওয়া \'আলা কুল্লি শাই\'ইন ক্বাদীর — বেশি বেশি পড়তে হবে (নির্দিষ্ট সংখ্যা উল্লেখ নেই)।',
      duplicatesItemId: 'me-5',
      sourceRef: 'অন্যান্য পালনীয় আমল #১৫',
    }),
  ],
};

// ─── রাতে ঘুমানোর পূর্বের আমল ───────────────────────────────────
const beforeSleep: ZikrCollection['sections'][number] = {
  id: 'before-sleep',
  title: 'রাতে ঘুমানোর পূর্বের আমল',
  description: 'প্রতি রাতে ঘুমানোর আগে পাঠ করার আমল',
  items: [
    action({
      id: 'bs-1', order: 1, title: 'বিছানা ঝাড়া ও ডান কাতে ঘুমানো',
      instruction: 'ঘুমানোর সময় বিছানা ৩ বার ঝাড়া এবং ডান কাতে ঘুমানো (ওযু অবস্থায়)।',
      sourceRef: 'রাতে ঘুমানোর পূর্বের আমল #১',
    }),
    recitation({
      id: 'bs-2a',
      order: 2,
      title: 'আয়াতুল কুরসি',
      phonetic: REFERENCE_RECITATIONS['ref-ayatul-kursi'].phonetic,
      targetCount: 1,
      sourceRef: 'রাতে ঘুমানোর পূর্বের আমল #২',
      quranRefs: [{ surah: 2, ayahStart: 255, ayahEnd: 255 }],
    }),
    recitation({
      id: 'bs-2b',
      order: 3,
      title: 'সূরা বাক্বারার শেষ দুই আয়াত',
      phonetic: REFERENCE_RECITATIONS['ref-baqarah-285-286'].phonetic,
      targetCount: 1,
      sourceRef: 'রাতে ঘুমানোর পূর্বের আমল #২',
      quranRefs: [{ surah: 2, ayahStart: 285, ayahEnd: 286 }],
    }),
    recitation({
      id: 'bs-3',
      order: 4,
      title: 'তিন কুল (ফুঁ দিয়ে শরীর মাসেহ)',
      targetCount: 3,
      sourceRef: 'রাতে ঘুমানোর পূর্বের আমল #৩',
      reviewNote: 'পাঠের পর দু\'হাতে ফুঁ দিয়ে সমস্ত শরীর মাসেহ করুন (৩ বার) — উৎস PDF অনুযায়ী।',
      quranRefs: [
        { surah: 112, ayahStart: 1, ayahEnd: 4 },
        { surah: 113, ayahStart: 1, ayahEnd: 5 },
        { surah: 114, ayahStart: 1, ayahEnd: 6 },
      ],
    }),
    recitation({
      id: 'bs-4',
      order: 5,
      title: 'ঘুমানোর পূর্বে গুনাহ মাফের দুআ',
      phonetic:
        'বিসমিল্লাহি ওয়াদা\'তু জানবী, আল্লাহুম্মাগফিরলী যানবী, ওয়া আখসিই শাইত্বা-নী, ওয়া ফুক্কা রিহা-নী, ওয়াজ\'আলনী ফিন নাদিয়্যিনাল আ\'লা।',
      targetCount: 1,
      sourceRef: 'রাতে ঘুমানোর পূর্বের আমল #৪',
    }),
    recitation({
      id: 'bs-5a',
      order: 6,
      title: 'সুবহানাল্লাহ',
      phonetic: 'সুবহানাল্লাহ্',
      targetCount: 33,
      sourceRef: 'রাতে ঘুমানোর পূর্বের আমল #৫',
    }),
    recitation({
      id: 'bs-5b',
      order: 7,
      title: 'আলহামদুলিল্লাহ',
      phonetic: 'আলহামদুলিল্লাহ্',
      targetCount: 33,
      sourceRef: 'রাতে ঘুমানোর পূর্বের আমল #৫',
    }),
    recitation({
      id: 'bs-5c',
      order: 8,
      title: 'আল্লাহু আকবার',
      phonetic: 'আল্লাহু আকবার',
      targetCount: 34,
      sourceRef: 'রাতে ঘুমানোর পূর্বের আমল #৫',
    }),
    recitation({
      id: 'bs-6',
      order: 9,
      title: 'ঘুমানোর দুআ',
      phonetic: 'আল্লাহুম্মা বিসমিকা আমূতু ওয়া আহইয়া।',
      targetCount: 1,
      sourceRef: 'রাতে ঘুমানোর পূর্বের আমল #৬',
    }),
  ],
};

export const ZIKR_COLLECTION: ZikrCollection = {
  id: 'self-protection',
  title: 'আত্মরক্ষার আমল',
  subtitle: 'সকাল-সন্ধ্যা ও রাতের নিরাপত্তামূলক আমল',
  sections: [morningEvening, otherPractices, beforeSleep],
};

export function getZikrSection(sectionId: string) {
  return ZIKR_COLLECTION.sections.find((s) => s.id === sectionId);
}

export function getZikrItem(sectionId: string, itemId: string) {
  return getZikrSection(sectionId)?.items.find((i) => i.id === itemId);
}
