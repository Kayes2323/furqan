// ═══════════════════════════════════════════
// FURQAN — "আজকের আয়াত" (ayah of the day)
//
// The home screen used to label a single hardcoded constant as *today's*
// ayah, so it said "আজকের" while never changing. This picks one from a
// curated rotation by calendar date instead: deterministic (everyone opening
// the app on the same day sees the same ayah, and it does not reshuffle on
// re-render), with no storage and no network.
//
// Every entry's Arabic, Bengali rendering and reference is a verbatim,
// well-known verse; `surah`/`ayah` point at the same verse in the Reader so
// the hero's action can open it in context rather than claiming a tafsir
// screen that no longer exists.
// ═══════════════════════════════════════════

export interface DailyAyah {
  arabic: string;
  bangla: string;
  ref: string;
  surah: number;
  ayah: number;
}

export const DAILY_AYAHS: DailyAyah[] = [
  {
    arabic: 'أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ',
    bangla: 'তারা কি কুরআন নিয়ে গভীরভাবে চিন্তা করে না?',
    ref: 'সূরা মুহাম্মদ ৪৭:২৪',
    surah: 47,
    ayah: 24,
  },
  {
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    bangla: 'জেনে রাখো, আল্লাহর স্মরণেই হৃদয় প্রশান্ত হয়।',
    ref: 'সূরা রা‘দ ১৩:২৮',
    surah: 13,
    ayah: 28,
  },
  {
    arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
    bangla: 'নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি।',
    ref: 'সূরা ইনশিরাহ ৯৪:৫',
    surah: 94,
    ayah: 5,
  },
  {
    arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
    bangla: 'আল্লাহ কারও উপর তার সাধ্যের বাইরে কোনো দায়িত্ব চাপিয়ে দেন না।',
    ref: 'সূরা বাকারা ২:২৮৬',
    surah: 2,
    ayah: 286,
  },
  {
    arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
    bangla: 'যে আল্লাহকে ভয় করে, তিনি তার জন্য উত্তরণের পথ করে দেন।',
    ref: 'সূরা তালাক ৬৫:২',
    surah: 65,
    ayah: 2,
  },
  {
    arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    bangla: 'নিশ্চয়ই আল্লাহ ধৈর্যশীলদের সাথে আছেন।',
    ref: 'সূরা বাকারা ২:১৫৩',
    surah: 2,
    ayah: 153,
  },
  {
    arabic: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
    bangla: 'এবং বলো, হে আমার রব! আমার জ্ঞান বাড়িয়ে দিন।',
    ref: 'সূরা ত্বা-হা ২০:১১৪',
    surah: 20,
    ayah: 114,
  },
  {
    arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ',
    bangla: 'অতএব তোমরা আমাকে স্মরণ করো, আমিও তোমাদের স্মরণ করব।',
    ref: 'সূরা বাকারা ২:১৫২',
    surah: 2,
    ayah: 152,
  },
  {
    arabic: 'وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ',
    bangla: 'আর আল্লাহ সৎকর্মশীলদের ভালোবাসেন।',
    ref: 'সূরা আলে ইমরান ৩:১৩৪',
    surah: 3,
    ayah: 134,
  },
  {
    arabic: 'إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ',
    bangla: 'নিশ্চয়ই আল্লাহ কোনো জাতির অবস্থা পরিবর্তন করেন না, যতক্ষণ না তারা নিজেদের অবস্থা পরিবর্তন করে।',
    ref: 'সূরা রা‘দ ১৩:১১',
    surah: 13,
    ayah: 11,
  },
  {
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً',
    bangla: 'হে আমাদের রব! আমাদের দুনিয়াতে কল্যাণ দিন এবং আখিরাতেও কল্যাণ দিন।',
    ref: 'সূরা বাকারা ২:২০১',
    surah: 2,
    ayah: 201,
  },
  {
    arabic: 'وَتَوَكَّلْ عَلَى اللَّهِ ۚ وَكَفَىٰ بِاللَّهِ وَكِيلًا',
    bangla: 'আর আল্লাহর উপর ভরসা করো; কর্মবিধায়ক হিসেবে আল্লাহই যথেষ্ট।',
    ref: 'সূরা নিসা ৪:৮১',
    surah: 4,
    ayah: 81,
  },
  {
    arabic: 'وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ',
    bangla: 'হয়তো তোমরা এমন কিছুকে অপছন্দ করছ, যা তোমাদের জন্য কল্যাণকর।',
    ref: 'সূরা বাকারা ২:২১৬',
    surah: 2,
    ayah: 216,
  },
  {
    arabic: 'إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ',
    bangla: 'নিশ্চয়ই নামাজ অশ্লীল ও মন্দ কাজ থেকে বিরত রাখে।',
    ref: 'সূরা আনকাবুত ২৯:৪৫',
    surah: 29,
    ayah: 45,
  },
];

/**
 * Days elapsed since the Unix epoch for the *local* calendar date, so the
 * ayah turns over at the user's midnight rather than at UTC midnight.
 */
export function localDayNumber(date: Date): number {
  const startOfDayUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(startOfDayUtc / 86_400_000);
}

/** The ayah for a given calendar date — same date, same ayah, always. */
export function getDailyAyah(date: Date = new Date()): DailyAyah {
  const index = ((localDayNumber(date) % DAILY_AYAHS.length) + DAILY_AYAHS.length) % DAILY_AYAHS.length;
  return DAILY_AYAHS[index];
}
