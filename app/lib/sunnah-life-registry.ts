// ═══════════════════════════════════════════
// FURQAN — Sunnah Life: curated starter registry
//
// A small, deliberately limited collection (not padded out to "look
// full" — see docs/sunnah-life-content-map.md). Every entry's
// review.status is 'pending_review': NONE of this is published as
// verified religious guidance. See docs/sunnah-life-sources.md §4 for
// why, and what that blocks.
//
// Every instructionsBn below is a short, product-authored summary — not
// a copied book paragraph (see docs/sunnah-life-sources.md §2). Arabic is
// included only for extremely short, universally known phrases
// (Bismillah). No specific hadith number is asserted unless this file
// marks identifierConfirmed: true, which none currently do.
// ═══════════════════════════════════════════

import type { SunnahPractice } from './sunnah-life-types';

/** Shared defaults every entry starts from, to keep each entry below
 *  focused on what actually differs (content + evidence fields), not
 *  boilerplate. Still fully explicit per-field — this is not a shortcut
 *  around the evidence gate, just reducing repetition of the same
 *  "nothing is approved yet" review/licensing shape. */
function pendingReview(note: string) {
  return {
    status: 'pending_review' as const,
    versionHistory: [note],
  };
}

const noLicensingConcern = { requiresPermission: false as const };

export const SUNNAH_PRACTICES: SunnahPractice[] = [
  // ── waking ──────────────────────────────────────────────────────────
  {
    id: 'sp-waking-dua',
    contentVersion: 1,
    titleBn: 'ঘুম থেকে উঠে দুআ পড়া',
    instructionsBn:
      'চোখ খুলেই আল্লাহর প্রশংসা করে একটি ছোট দুআ পড়ুন — নতুন দিন দেওয়ার জন্য কৃতজ্ঞতা জ্ঞাপন করে।',
    sourceType: 'hadith',
    sourceReference: {
      collection: 'হাদিস সংকলন (সহিহ বুখারি ঘরানার একাধিক সংকলনে উল্লিখিত)',
      bookOrChapter: 'ঘুম থেকে ওঠার অধ্যায়',
      identifierConfirmed: false,
      identifierNote: 'সুনির্দিষ্ট হাদিস নম্বর এখনো পর্যালোচকের মাধ্যমে নিশ্চিত করা হয়নি।',
    },
    classification: 'sunnah',
    evidencedCount: false,
    evidencedTime: true,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — অপর্যালোচিত'),
    licensing: noLicensingConcern,
    routineSlot: 'waking',
    lifeAreas: ['relationship-with-allah'],
  },

  // ── cleanliness-dressing ────────────────────────────────────────────
  {
    id: 'sp-dressing-bismillah',
    contentVersion: 1,
    titleBn: 'পোশাক পরার সময় বিসমিল্লাহ বলা',
    instructionsBn: 'কাপড় পরার শুরুতে ডান দিক থেকে শুরু করে "বিসমিল্লাহ" বলুন।',
    arabicOriginal: 'بِسْمِ اللَّهِ',
    transliterationBn: 'বিসমিল্লাহ',
    sourceType: 'hadith',
    sourceReference: {
      collection: 'হাদিস (পোশাক-সংক্রান্ত অধ্যায়ের সংকলনসমূহে সাধারণভাবে উল্লিখিত)',
      identifierConfirmed: false,
      identifierNote: 'সুনির্দিষ্ট সংকলন ও নম্বর পর্যালোচকের মাধ্যমে নিশ্চিত করা প্রয়োজন।',
    },
    classification: 'adab',
    evidencedCount: false,
    evidencedTime: false,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — অপর্যালোচিত'),
    licensing: noLicensingConcern,
    routineSlot: 'cleanliness-dressing',
    lifeAreas: ['relationship-with-self'],
  },

  // ── fajr-morning ────────────────────────────────────────────────────
  {
    id: 'sp-fajr-prayer',
    contentVersion: 1,
    titleBn: 'ফজরের ফরজ নামাজ',
    instructionsBn: 'ফজরের ওয়াক্ত হলে ফরজ নামাজ আদায় করুন — এটি একটি আবশ্যক ইবাদত, ঐচ্ছিক নয়।',
    sourceType: 'quran',
    sourceReference: {
      collection: 'কুরআন ও ইজমা (পাঁচ ওয়াক্ত নামাজের ফরজিয়্যাত)',
      identifierConfirmed: false,
      identifierNote: 'নির্দিষ্ট আয়াত রেফারেন্স পর্যালোচকের মাধ্যমে সংযুক্ত করা প্রয়োজন।',
    },
    classification: 'obligatory',
    classificationNotes: 'পাঁচ ওয়াক্ত নামাজের ফরজ হওয়া নিয়ে কোনো মতভেদ নেই — এটি সকল মাযহাবে সর্বসম্মত।',
    evidencedCount: false,
    evidencedTime: true,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — উদ্ধৃতি/হাওয়ালা পর্যালোচনাধীন, তবে ফরজ শ্রেণিবিন্যাস নিয়ে কোনো মতভেদ নেই'),
    licensing: noLicensingConcern,
    routineSlot: 'fajr-morning',
    lifeAreas: ['relationship-with-allah'],
  },
  {
    id: 'sp-fajr-sunnah-2rakat',
    contentVersion: 1,
    titleBn: 'ফজরের আগে দুই রাকাত সুন্নাত',
    instructionsBn: 'ফরজের আগে দুই রাকাত সুন্নাত নামাজ পড়ার চেষ্টা করুন — হাদিসে এর বিশেষ গুরুত্বের কথা এসেছে।',
    sourceType: 'hadith',
    sourceReference: {
      collection: 'সহিহ মুসলিম ঘরানার সংকলনে উল্লিখিত (সুনির্দিষ্ট নম্বর অনিশ্চিত)',
      identifierConfirmed: false,
      identifierNote: 'এই নির্দিষ্ট হাদিসের প্রকৃত নম্বর ও সনদ পর্যালোচকের মাধ্যমে নিশ্চিত করা আবশ্যক।',
    },
    classification: 'emphasized_sunnah',
    evidencedCount: true,
    evidencedTime: true,
    evidencedVirtue: true,
    virtueNoteBn: 'হাদিসে এই দুই রাকাতের বিশেষ ফযিলতের কথা এসেছে বলে সাধারণভাবে পরিচিত — সুনির্দিষ্ট শব্দ ও সনদ পর্যালোচনাধীন।',
    review: pendingReview('প্রাথমিক সংযোজন — অপর্যালোচিত'),
    licensing: noLicensingConcern,
    routineSlot: 'fajr-morning',
    lifeAreas: ['relationship-with-allah'],
  },

  // ── morning-adhkar-quran ────────────────────────────────────────────
  {
    id: 'sp-morning-adhkar',
    contentVersion: 1,
    titleBn: 'সকালের আযকার',
    instructionsBn: 'সকালে কিছু সময় রেখে নির্ধারিত সকালের আযকার/তাসবিহ পড়ুন। এটি একটি প্রতিষ্ঠিত, স্বীকৃত আমল — তবে কোনো নির্দিষ্ট সংখ্যা বা সময় এখানে চাপিয়ে দেওয়া হচ্ছে না।',
    sourceType: 'hadith',
    sourceReference: {
      collection: 'হিসনুল মুসলিম (একটি গৌণ সংকলন, মূল হাদিস উৎস পৃথকভাবে যাচাই করা হয়নি)',
      identifierConfirmed: false,
      identifierNote: 'প্রতিটি আযকার আইটেমের মূল হাদিস উৎস ও গ্রেডিং পৃথকভাবে পর্যালোচনা প্রয়োজন।',
    },
    classification: 'sunnah',
    evidencedCount: false,
    evidencedTime: false,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — অপর্যালোচিত'),
    licensing: noLicensingConcern,
    routineSlot: 'morning-adhkar-quran',
    lifeAreas: ['relationship-with-allah'],
  },
  {
    id: 'sp-quran-reading-goal',
    contentVersion: 1,
    titleBn: 'ব্যক্তিগত কুরআন তিলাওয়াতের লক্ষ্য',
    instructionsBn:
      'আপনার নিজের সুবিধামতো একটি ছোট, নমনীয় তিলাওয়াতের লক্ষ্য ঠিক করুন (যেমন কয়েক আয়াত বা এক পৃষ্ঠা)। এটি আপনার নিজের ঠিক করা লক্ষ্য — কোনো নির্দিষ্ট সংখ্যা ইসলামে বাধ্যতামূলক হিসেবে দাবি করা হচ্ছে না।',
    sourceType: 'quran',
    sourceReference: {
      collection: 'কুরআন তিলাওয়াতের সাধারণ উৎসাহ (একাধিক আয়াত ও হাদিসে)',
      identifierConfirmed: false,
      identifierNote: 'নির্দিষ্ট আয়াত/হাদিস রেফারেন্স পর্যালোচকের মাধ্যমে সংযুক্ত করা প্রয়োজন।',
    },
    classification: 'sunnah',
    classificationNotes: 'তিলাওয়াত নিজেই একটি স্বীকৃত ইবাদত; তবে এখানে ব্যবহারকারীর নির্ধারিত সংখ্যাটি একান্তই ব্যক্তিগত পছন্দ, কোনো শরয়ী বাধ্যবাধকতা নয়।',
    evidencedCount: false,
    evidencedTime: false,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — অপর্যালোচিত'),
    licensing: noLicensingConcern,
    routineSlot: 'morning-adhkar-quran',
    lifeAreas: ['relationship-with-allah'],
  },

  // ── work-family-manners ─────────────────────────────────────────────
  {
    id: 'sp-truthful-speech',
    contentVersion: 1,
    titleBn: 'সত্য কথা বলা',
    instructionsBn: 'কাজে, পরিবারে ও সবখানে সত্য কথা বলার চেষ্টা করুন, এমনকি তা কঠিন হলেও।',
    sourceType: 'hadith',
    sourceReference: {
      collection: 'আল-আদাবুল মুফরাদ ও রিয়াদুস সালিহীনের সততা-সংক্রান্ত অধ্যায়ে সাধারণভাবে উল্লিখিত',
      identifierConfirmed: false,
      identifierNote: 'সুনির্দিষ্ট হাদিস নম্বর পর্যালোচকের মাধ্যমে নিশ্চিত করা প্রয়োজন।',
    },
    classification: 'adab',
    evidencedCount: false,
    evidencedTime: false,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — অপর্যালোচিত'),
    licensing: noLicensingConcern,
    routineSlot: 'work-family-manners',
    lifeAreas: ['relationship-with-self', 'society-and-social-responsibility'],
  },
  {
    id: 'sp-keeping-promises',
    contentVersion: 1,
    titleBn: 'প্রতিশ্রুতি রক্ষা করা',
    instructionsBn: 'কাউকে কথা দিলে তা রক্ষা করার চেষ্টা করুন — কাজে ও সম্পর্কে এটি বিশ্বাসযোগ্যতার ভিত্তি।',
    sourceType: 'hadith',
    sourceReference: {
      collection: 'আল-আদাবুল মুফরাদের আমানতদারি-সংক্রান্ত অধ্যায়ে সাধারণভাবে উল্লিখিত',
      identifierConfirmed: false,
      identifierNote: 'সুনির্দিষ্ট হাদিস নম্বর পর্যালোচকের মাধ্যমে নিশ্চিত করা প্রয়োজন।',
    },
    classification: 'adab',
    evidencedCount: false,
    evidencedTime: false,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — অপর্যালোচিত'),
    licensing: noLicensingConcern,
    routineSlot: 'work-family-manners',
    lifeAreas: ['relationship-with-self'],
  },

  // ── daily-prayers (Dhuhr/Asr/Maghrib — Fajr & Isha live in their own
  // named slots above/below, matching the task's own slot grouping) ────
  {
    id: 'sp-dhuhr-prayer',
    contentVersion: 1,
    titleBn: 'যোহরের ফরজ নামাজ',
    instructionsBn: 'যোহরের ওয়াক্তে ফরজ নামাজ আদায় করুন।',
    sourceType: 'quran',
    sourceReference: { collection: 'কুরআন ও ইজমা', identifierConfirmed: false },
    classification: 'obligatory',
    evidencedCount: false,
    evidencedTime: true,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — উদ্ধৃতি পর্যালোচনাধীন, ফরজ শ্রেণিবিন্যাস নিয়ে মতভেদ নেই'),
    licensing: noLicensingConcern,
    routineSlot: 'daily-prayers',
    lifeAreas: ['relationship-with-allah'],
  },
  {
    id: 'sp-asr-prayer',
    contentVersion: 1,
    titleBn: 'আসরের ফরজ নামাজ',
    instructionsBn: 'আসরের ওয়াক্তে ফরজ নামাজ আদায় করুন।',
    sourceType: 'quran',
    sourceReference: { collection: 'কুরআন ও ইজমা', identifierConfirmed: false },
    classification: 'obligatory',
    evidencedCount: false,
    evidencedTime: true,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — উদ্ধৃতি পর্যালোচনাধীন, ফরজ শ্রেণিবিন্যাস নিয়ে মতভেদ নেই'),
    licensing: noLicensingConcern,
    routineSlot: 'daily-prayers',
    lifeAreas: ['relationship-with-allah'],
  },
  {
    id: 'sp-maghrib-prayer',
    contentVersion: 1,
    titleBn: 'মাগরিবের ফরজ নামাজ',
    instructionsBn: 'মাগরিবের ওয়াক্তে ফরজ নামাজ আদায় করুন।',
    sourceType: 'quran',
    sourceReference: { collection: 'কুরআন ও ইজমা', identifierConfirmed: false },
    classification: 'obligatory',
    evidencedCount: false,
    evidencedTime: true,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — উদ্ধৃতি পর্যালোচনাধীন, ফরজ শ্রেণিবিন্যাস নিয়ে মতভেদ নেই'),
    licensing: noLicensingConcern,
    routineSlot: 'daily-prayers',
    lifeAreas: ['relationship-with-allah'],
  },

  // ── evening-adhkar ──────────────────────────────────────────────────
  {
    id: 'sp-evening-adhkar',
    contentVersion: 1,
    titleBn: 'সন্ধ্যার আযকার',
    instructionsBn: 'সন্ধ্যায় কিছু সময় রেখে নির্ধারিত সন্ধ্যার আযকার/তাসবিহ পড়ুন।',
    sourceType: 'hadith',
    sourceReference: {
      collection: 'হিসনুল মুসলিম (একটি গৌণ সংকলন, মূল হাদিস উৎস পৃথকভাবে যাচাই করা হয়নি)',
      identifierConfirmed: false,
    },
    classification: 'sunnah',
    evidencedCount: false,
    evidencedTime: true,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — অপর্যালোচিত'),
    licensing: noLicensingConcern,
    routineSlot: 'evening-adhkar',
    lifeAreas: ['relationship-with-allah'],
  },

  // ── isha-night ──────────────────────────────────────────────────────
  {
    id: 'sp-isha-prayer',
    contentVersion: 1,
    titleBn: 'ইশার ফরজ নামাজ',
    instructionsBn: 'ইশার ওয়াক্তে ফরজ নামাজ আদায় করুন।',
    sourceType: 'quran',
    sourceReference: { collection: 'কুরআন ও ইজমা', identifierConfirmed: false },
    classification: 'obligatory',
    evidencedCount: false,
    evidencedTime: true,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — উদ্ধৃতি পর্যালোচনাধীন, ফরজ শ্রেণিবিন্যাস নিয়ে মতভেদ নেই'),
    licensing: noLicensingConcern,
    routineSlot: 'isha-night',
    lifeAreas: ['relationship-with-allah'],
  },

  // ── before-sleep ────────────────────────────────────────────────────
  {
    id: 'sp-before-sleep-dua',
    contentVersion: 1,
    titleBn: 'ঘুমানোর আগে দুআ',
    instructionsBn: 'শোয়ার আগে ছোট একটি দুআ পড়ে ঘুমাতে যান।',
    sourceType: 'hadith',
    sourceReference: {
      collection: 'হিসনুল মুসলিম ঘরানার সংকলনে উল্লিখিত',
      identifierConfirmed: false,
    },
    classification: 'sunnah',
    evidencedCount: false,
    evidencedTime: true,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — অপর্যালোচিত'),
    licensing: noLicensingConcern,
    routineSlot: 'before-sleep',
    lifeAreas: ['relationship-with-allah'],
  },
  {
    id: 'sp-ayatul-kursi-before-sleep',
    contentVersion: 1,
    titleBn: 'ঘুমানোর আগে আয়াতুল কুরসি পড়া',
    instructionsBn: 'শোয়ার আগে আয়াতুল কুরসি (সূরা বাকারা, আয়াত ২৫৫) পড়ার অভ্যাস করুন।',
    sourceType: 'hadith',
    sourceReference: {
      collection: 'সহিহ বুখারি ঘরানার সংকলনে ব্যাপকভাবে পরিচিত',
      bookOrChapter: 'সূরা বাকারা, আয়াত ২৫৫ সংক্রান্ত হাদিস',
      identifierConfirmed: false,
      identifierNote: 'এই হাদিসটি ব্যাপকভাবে পরিচিত হলেও এর সুনির্দিষ্ট নম্বর ও শব্দ পর্যালোচকের মাধ্যমে নিশ্চিত করা প্রয়োজন।',
    },
    classification: 'sunnah',
    evidencedCount: true,
    evidencedTime: true,
    evidencedVirtue: true,
    virtueNoteBn: 'হাদিসে এর সুরক্ষা-সংক্রান্ত ফযিলতের কথা ব্যাপকভাবে বর্ণিত হয়েছে বলে পরিচিত — সুনির্দিষ্ট শব্দ পর্যালোচনাধীন।',
    review: pendingReview('প্রাথমিক সংযোজন — অপর্যালোচিত'),
    licensing: noLicensingConcern,
    routineSlot: 'before-sleep',
    lifeAreas: ['relationship-with-allah'],
  },
  {
    id: 'sp-sleep-right-side',
    contentVersion: 1,
    titleBn: 'ডান কাত হয়ে ঘুমানো',
    instructionsBn: 'ডান কাতে শোয়ার চেষ্টা করুন — এটি হাদিসে বর্ণিত একটি প্রতিষ্ঠিত আদব।',
    sourceType: 'hadith',
    sourceReference: {
      collection: 'হাদিস (ঘুম-সংক্রান্ত অধ্যায়ের সংকলনসমূহে সাধারণভাবে উল্লিখিত)',
      identifierConfirmed: false,
    },
    classification: 'adab',
    evidencedCount: false,
    evidencedTime: false,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — অপর্যালোচিত'),
    licensing: noLicensingConcern,
    routineSlot: 'before-sleep',
    lifeAreas: ['relationship-with-self'],
  },

  // ── Learn by Life Area — entries with no natural routine-slot home ──
  {
    id: 'sp-muhasabah',
    contentVersion: 1,
    titleBn: 'নিজের হিসাব নেওয়া (মুহাসাবা)',
    instructionsBn: 'দিনের শেষে একটু সময় নিয়ে নিজের কাজকর্ম নিয়ে ভাবুন — কোথায় ভালো করলেন, কোথায় শুধরানো দরকার।',
    sourceType: 'scholarly_reference',
    sourceReference: {
      collection: 'সাধারণ ইসলামী নৈতিক শিক্ষা (একাধিক সূত্রে আলোচিত)',
      identifierConfirmed: false,
    },
    classification: 'adab',
    evidencedCount: false,
    evidencedTime: false,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — অপর্যালোচিত'),
    licensing: noLicensingConcern,
    lifeAreas: ['relationship-with-self'],
  },
  {
    id: 'sp-tawakkul',
    contentVersion: 1,
    titleBn: 'দৈনন্দিন কাজে আল্লাহর উপর ভরসা (তাওয়াক্কুল)',
    instructionsBn: 'চেষ্টা করার পাশাপাশি ফলাফল আল্লাহর উপর ছেড়ে দেওয়ার মানসিকতা গড়ে তুলুন।',
    sourceType: 'quran',
    sourceReference: {
      collection: 'কুরআনের তাওয়াক্কুল-সংক্রান্ত একাধিক আয়াতে আলোচিত বিষয়',
      identifierConfirmed: false,
      identifierNote: 'নির্দিষ্ট আয়াত উদ্ধৃতি পর্যালোচকের মাধ্যমে সংযুক্ত করা প্রয়োজন — প্রসঙ্গের বাইরে একক আয়াত তুলে ধরা হয়নি।',
    },
    classification: 'adab',
    evidencedCount: false,
    evidencedTime: false,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — অপর্যালোচিত'),
    licensing: noLicensingConcern,
    lifeAreas: ['relationship-with-allah'],
  },
  {
    id: 'sp-kindness-to-parents',
    contentVersion: 1,
    titleBn: 'পিতা-মাতার সাথে সদ্ব্যবহার',
    instructionsBn: 'পিতা-মাতার সাথে নম্র ব্যবহার করুন, তাদের খোঁজখবর রাখুন এবং সাধ্যমতো সাহায্য করুন।',
    sourceType: 'quran',
    sourceReference: {
      collection: 'কুরআন ও আল-আদাবুল মুফরাদের পিতা-মাতা সংক্রান্ত অধ্যায়ে আলোচিত',
      identifierConfirmed: false,
      identifierNote: 'নির্দিষ্ট আয়াত/হাদিস উদ্ধৃতি পর্যালোচকের মাধ্যমে সংযুক্ত করা প্রয়োজন।',
    },
    classification: 'sunnah',
    classificationNotes: 'পিতা-মাতার সাথে সদ্ব্যবহারের মূলনীতি সর্বসম্মত হলেও এখানে নির্দিষ্ট শ্রেণিবিন্যাস (ওয়াজিব/জোরালো সুন্নাত) পর্যালোচকের সিদ্ধান্তের অপেক্ষায়।',
    evidencedCount: false,
    evidencedTime: false,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — অপর্যালোচিত'),
    licensing: noLicensingConcern,
    lifeAreas: ['parents'],
  },
  {
    id: 'sp-spouse-kindness',
    contentVersion: 1,
    titleBn: 'স্বামী-স্ত্রীর পারস্পরিক সদ্ব্যবহার',
    instructionsBn: 'যদি আপনার জীবনসঙ্গী থাকেন, তার সাথে সদয়, ধৈর্যশীল ও ন্যায়সঙ্গত আচরণ করার চেষ্টা করুন।',
    sourceType: 'hadith',
    sourceReference: {
      collection: 'হাদিস ও দ্য আইডিয়াল মুসলিম বইয়ের স্বামী-স্ত্রী অধ্যায়ে আলোচিত বিষয়',
      identifierConfirmed: false,
      identifierNote: 'মূল বইয়ের এই অধ্যায় লিঙ্গ-নির্দিষ্ট (স্বামীর দায়িত্ব কেন্দ্রিক); এখানে তা সবার জন্য প্রযোজ্য আকারে উপস্থাপন করা হয়েছে, সার্বজনীন একতরফা বিধান হিসেবে নয়।',
    },
    classification: 'sunnah',
    evidencedCount: false,
    evidencedTime: false,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — অপর্যালোচিত'),
    licensing: noLicensingConcern,
    lifeAreas: ['marriage-and-spouse'],
  },
  {
    id: 'sp-mercy-to-children',
    contentVersion: 1,
    titleBn: 'সন্তানদের প্রতি স্নেহ ও দায়িত্বশীলতা',
    instructionsBn: 'যদি আপনার সন্তান থাকে, তাদের প্রতি স্নেহশীল থাকুন এবং তাদের শিক্ষা ও চরিত্র গঠনে মনোযোগ দিন।',
    sourceType: 'hadith',
    sourceReference: {
      collection: 'হাদিস (সন্তানদের প্রতি স্নেহ সংক্রান্ত একাধিক বর্ণনায় আলোচিত)',
      identifierConfirmed: false,
    },
    classification: 'sunnah',
    evidencedCount: false,
    evidencedTime: false,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — অপর্যালোচিত'),
    licensing: noLicensingConcern,
    lifeAreas: ['children-and-parenting'],
  },
  {
    id: 'sp-silat-ar-rahim',
    contentVersion: 1,
    titleBn: 'আত্মীয়তার সম্পর্ক বজায় রাখা (সিলা রাহিম)',
    instructionsBn: 'আত্মীয়-স্বজনের সাথে যোগাযোগ রাখুন ও সম্পর্ক অটুট রাখার চেষ্টা করুন।',
    sourceType: 'hadith',
    sourceReference: {
      collection: 'কুরআন ও হাদিসে সিলা রাহিমের গুরুত্ব সম্পর্কে ব্যাপকভাবে আলোচিত',
      identifierConfirmed: false,
      identifierNote: 'নির্দিষ্ট আয়াত/হাদিস উদ্ধৃতি পর্যালোচকের মাধ্যমে সংযুক্ত করা প্রয়োজন।',
    },
    classification: 'emphasized_sunnah',
    classificationNotes: 'কিছু আলেমের মতে আত্মীয়তার সম্পর্ক ছিন্ন করা কবিরা গুনাহ হিসেবে বিবেচিত, যা এই আমলের গুরুত্বকে জোরালো সুন্নাতের কাছাকাছি নিয়ে যায় — তবে প্রতিটি অবস্থার সুনির্দিষ্ট হুকুম পর্যালোচকের সিদ্ধান্তের অপেক্ষায়।',
    evidencedCount: false,
    evidencedTime: false,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — অপর্যালোচিত'),
    licensing: noLicensingConcern,
    lifeAreas: ['relatives-and-kinship'],
  },
  {
    id: 'sp-neighbour-kindness',
    contentVersion: 1,
    titleBn: 'প্রতিবেশীর সাথে সদ্ব্যবহার',
    instructionsBn: 'প্রতিবেশীর হক আদায় করুন — খোঁজখবর রাখা, কষ্ট না দেওয়া, প্রয়োজনে পাশে থাকা।',
    sourceType: 'hadith',
    sourceReference: {
      collection: 'হাদিস ও আল-আদাবুল মুফরাদের প্রতিবেশী অধ্যায়ে আলোচিত বিষয় (জিবরীল আলাইহিস সালামের বারবার উপদেশ হিসেবে সাধারণভাবে পরিচিত)',
      identifierConfirmed: false,
      identifierNote: 'সুনির্দিষ্ট হাদিস নম্বর ও শব্দ পর্যালোচকের মাধ্যমে নিশ্চিত করা প্রয়োজন।',
    },
    classification: 'emphasized_sunnah',
    evidencedCount: false,
    evidencedTime: false,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — অপর্যালোচিত'),
    licensing: noLicensingConcern,
    lifeAreas: ['neighbours'],
  },
  {
    id: 'sp-good-company',
    contentVersion: 1,
    titleBn: 'ভালো বন্ধু ও সঙ্গ নির্বাচন',
    instructionsBn: 'এমন বন্ধুদের সাথে মেলামেশা করুন যারা আপনাকে ভালো কাজে উৎসাহিত করে, এবং নিজেও তেমন বন্ধু হওয়ার চেষ্টা করুন।',
    sourceType: 'hadith',
    sourceReference: {
      collection: 'হাদিসে সৎসঙ্গের গুরুত্ব সম্পর্কে সাধারণভাবে আলোচিত (যেমন ভালো/মন্দ সঙ্গীর উপমা-সংক্রান্ত বর্ণনা)',
      identifierConfirmed: false,
    },
    classification: 'adab',
    evidencedCount: false,
    evidencedTime: false,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — অপর্যালোচিত'),
    licensing: noLicensingConcern,
    lifeAreas: ['friends-and-community'],
  },
  {
    id: 'sp-amr-bil-maruf',
    contentVersion: 1,
    titleBn: 'ভালো কাজের দাওয়াত ও সামাজিক দায়িত্ব',
    instructionsBn: 'সাধ্যমতো ভালো কাজে উৎসাহ দিন এবং সমাজে সততা ও ন্যায়ের পক্ষে থাকুন — নিজের অবস্থান ও সামর্থ্য অনুযায়ী।',
    sourceType: 'quran',
    sourceReference: {
      collection: 'কুরআন ও হাদিসে আমর বিল মারুফ সংক্রান্ত আলোচিত বিষয়',
      identifierConfirmed: false,
      identifierNote: 'নির্দিষ্ট আয়াত/হাদিস উদ্ধৃতি পর্যালোচকের মাধ্যমে সংযুক্ত করা প্রয়োজন।',
    },
    classification: 'wajib',
    classificationNotes: 'অধিকাংশ আলেমের মতে এটি সামষ্টিক দায়িত্ব (ফরজে কিফায়া) — প্রতিটি ব্যক্তির উপর প্রতিটি অবস্থায় পৃথকভাবে বাধ্যতামূলক নয়। সুনির্দিষ্ট প্রয়োগ পর্যালোচকের সিদ্ধান্তের অপেক্ষায়।',
    evidencedCount: false,
    evidencedTime: false,
    evidencedVirtue: false,
    review: pendingReview('প্রাথমিক সংযোজন — অপর্যালোচিত'),
    licensing: noLicensingConcern,
    lifeAreas: ['society-and-social-responsibility'],
  },
];

export function findPracticeById(id: string): SunnahPractice | undefined {
  return SUNNAH_PRACTICES.find((p) => p.id === id);
}

export function practicesForRoutineSlot(slot: SunnahPractice['routineSlot']): SunnahPractice[] {
  return SUNNAH_PRACTICES.filter((p) => p.routineSlot === slot);
}

export function practicesForLifeArea(area: SunnahPractice['lifeAreas'][number]): SunnahPractice[] {
  return SUNNAH_PRACTICES.filter((p) => p.lifeAreas.includes(area));
}
