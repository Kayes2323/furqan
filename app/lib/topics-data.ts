// ═══════════════════════════════════════════
// FURQAN — Phase 8: Quran by Topic + Important Surahs & Ayahs — content
//
// A deliberately small, carefully checked starting set (per the Phase
// 8 brief: "beginning with a manageable, properly researched
// collection rather than attempting to fill every category with
// low-quality content"). Every surah:ayah reference here was checked
// against secondary Quranic reference sources before being added
// (research findings recorded in the Phase 8 final report), and is
// additionally verified mechanically in topics-data.test.ts against
// the real bundled dataset's actual ayah counts — a reference this
// file gets wrong would fail that test, not just look wrong in the UI.
//
// Hadith evidence: every citation names its collection, narrator
// (where known), and grading, and is written as a summary in this
// project's own words — never presented as a direct quotation of the
// hadith's exact wording (which this phase had no reliable, verified
// source for). Where scholars disagree on a narration's grading, that
// disagreement is stated rather than smoothed over.
// ═══════════════════════════════════════════

import type { Topic, ImportantSurah } from './topics-types';

export const TOPICS: Topic[] = [
  {
    id: 'sabr',
    nameBn: 'সবর (ধৈর্য)',
    nameAr: 'الصبر',
    icon: 'Clock',
    summaryBn: 'কঠিন সময়ে আল্লাহর সাহায্য চাওয়ার এবং পরীক্ষায় অবিচল থাকার নির্দেশনা।',
    ayahs: [
      {
        surah: 2, ayahStart: 153, ayahEnd: 153,
        glossBn: 'বিশ্বাসীদের ধৈর্য ও সালাতের মাধ্যমে আল্লাহর সাহায্য চাইতে বলা হয়েছে — আল্লাহ ধৈর্যশীলদের সাথে আছেন।',
      },
      {
        surah: 2, ayahStart: 155, ayahEnd: 157,
        glossBn: 'ভয়, ক্ষুধা, সম্পদ ও জীবনহানির মাধ্যমে পরীক্ষা করার কথা বলে ধৈর্যশীলদের সুসংবাদ দেওয়া হয়েছে — যারা বিপদে বলে, "আমরা আল্লাহরই এবং তাঁরই কাছে ফিরে যাব।"',
      },
    ],
  },
  {
    id: 'dua',
    nameBn: 'দোয়া',
    nameAr: 'الدعاء',
    icon: 'HandHeart',
    summaryBn: 'আল্লাহর নৈকট্য ও তাঁর কাছে চাওয়ার প্রতিশ্রুতি।',
    ayahs: [
      {
        surah: 2, ayahStart: 186, ayahEnd: 186,
        glossBn: 'আল্লাহ বান্দার নিকটে আছেন এবং আহ্বানকারী যখন তাঁকে ডাকে তখন তাঁর ডাকে সাড়া দেন — শর্ত হলো বান্দাও আল্লাহর ডাকে সাড়া দেবে ও তাঁর প্রতি বিশ্বাস রাখবে।',
      },
      {
        surah: 40, ayahStart: 60, ayahEnd: 60,
        glossBn: 'আল্লাহ নিজেই বলছেন, "তোমরা আমাকে ডাকো, আমি সাড়া দেব" — যারা অহংকারবশত তাঁর ইবাদত (দোয়া) থেকে মুখ ফিরিয়ে নেয় তাদের সতর্ক করা হয়েছে।',
      },
    ],
  },
  {
    id: 'tawakkul',
    nameBn: 'তাওয়াক্কুল (আল্লাহর উপর ভরসা)',
    nameAr: 'التوكل',
    icon: 'Shield',
    summaryBn: 'সিদ্ধান্ত ও পরিণতি আল্লাহর ওপর ছেড়ে দেওয়ার শিক্ষা।',
    ayahs: [
      {
        surah: 3, ayahStart: 159, ayahEnd: 159,
        glossBn: 'পরামর্শের পর দৃঢ় সংকল্প নিলে আল্লাহর ওপর ভরসা করতে বলা হয়েছে — আল্লাহ ভরসাকারীদের ভালোবাসেন।',
      },
      {
        surah: 65, ayahStart: 3, ayahEnd: 3,
        glossBn: 'যে আল্লাহর ওপর ভরসা করে, আল্লাহ তার জন্য যথেষ্ট — এবং তিনি ধারণাতীত উৎস থেকে রিযিক দান করেন।',
      },
    ],
  },
  {
    id: 'tawbah',
    nameBn: 'তাওবা ও ক্ষমা',
    nameAr: 'التوبة',
    icon: 'RefreshCw',
    summaryBn: 'গুনাহ যত বড়ই হোক, আল্লাহর ক্ষমার আশা ছাড়তে নিষেধ করা হয়েছে।',
    ayahs: [
      {
        surah: 39, ayahStart: 53, ayahEnd: 53,
        glossBn: 'যারা নিজেদের ওপর বাড়াবাড়ি করেছে তাদেরও আল্লাহর রহমত থেকে নিরাশ না হতে বলা হয়েছে — আল্লাহ সকল গুনাহ ক্ষমা করেন।',
      },
      {
        surah: 66, ayahStart: 8, ayahEnd: 8,
        glossBn: 'বিশ্বাসীদের আন্তরিক তাওবা করতে আহ্বান জানানো হয়েছে — প্রকৃত অনুশোচনা, পাপ ত্যাগ ও তাতে না ফেরার দৃঢ় সংকল্পসহ।',
      },
    ],
  },
];

export const IMPORTANT_SURAHS: ImportantSurah[] = [
  {
    id: 'al-mulk',
    surahNumber: 67,
    nameBn: 'সূরা আল-মুলক (তাবারক)',
    whySelectedBn: 'হাদিসে বর্ণিত এসেছে যে এই সূরা তার পাঠকারীর জন্য সুপারিশ করবে — এটি একটি সুপরিচিত ও তুলনামূলক শক্তিশালীভাবে প্রমাণিত ফযীলত, যদিও এর সাথে সম্পর্কিত কিছু বর্ণনার সনদ দুর্বল বলে বিবেচিত।',
    evidence: [
      {
        kind: 'hadith-hasan',
        summaryBn: 'আবু হুরায়রা (রাঃ) থেকে বর্ণিত — রাসূলুল্লাহ ﷺ বলেছেন, ত্রিশ আয়াতবিশিষ্ট একটি সূরা তার পাঠকারীর জন্য সুপারিশ করবে, যতক্ষণ না তাকে ক্ষমা করা হয়; তা হলো সূরা তাবারাক (আল-মুলক)। (এটি হাদিসের মর্মার্থের সারসংক্ষেপ, শব্দানুবাদ নয়।)',
        sourceLabel: 'জামি\' আত-তিরমিযী, হাদিস ২৮৯১',
        narrator: 'আবু হুরায়রা (রাঃ)',
        gradingNoteBn: 'ইমাম তিরমিযী নিজে একে হাসান বলেছেন; ইবনে হিব্বান ও হাকিম একে সহীহ বলে উল্লেখ করেছেন বলে একাধিক গৌণ সূত্রে পাওয়া যায়। আবু দাউদে অনুরূপ একটি বর্ণনা আছে যা আলবানী সহীহ বলেছেন।',
        sourceUrl: 'https://sunnah.com/tirmidhi:2891',
      },
      {
        kind: 'hadith-disputed',
        summaryBn: 'ইবনে মাসউদ (রাঃ)-এর সূত্রে একটি পৃথক বর্ণনায় আছে যে প্রতি রাতে এই সূরা পাঠকারী কবরের আযাব থেকে রক্ষা পাবে। এটি পূর্বোক্ত তিরমিযীর হাদিস থেকে আলাদা একটি সনদ, এবং এর গ্রহণযোগ্যতা নিয়ে মুহাদ্দিসদের মধ্যে মতভেদ আছে।',
        sourceLabel: 'নাসায়ী/তাবারানী সূত্রে বর্ণিত (দ্বিতীয় সূত্র)',
        narrator: 'ইবনে মাসউদ (রাঃ)',
        gradingNoteBn: 'কিছু মুহাদ্দিস গ্রহণযোগ্য বলেছেন, তবে এটি পূর্বোক্ত তিরমিযী ২৮৯১-এর মতো সুপ্রতিষ্ঠিত নয়। (লক্ষণীয়: তিরমিযীতে বর্ণিত "কবরের উপর তাঁবু" সংক্রান্ত আরেকটি পৃথক বর্ণনাকে আলবানী ও অন্যান্য মুহাদ্দিস দুর্বল (যঈফ) বলে চিহ্নিত করেছেন — তাই সেটি এখানে ফযীলতের প্রমাণ হিসেবে অন্তর্ভুক্ত করা হয়নি।)',
      },
    ],
  },
  {
    id: 'ayat-al-kursi',
    surahNumber: 2,
    nameBn: 'আয়াতুল কুরসি',
    highlightAyah: { ayahStart: 255, ayahEnd: 255 },
    whySelectedBn: 'আল্লাহর সত্তা, জ্ঞান ও ক্ষমতার বর্ণনা সম্বলিত এই আয়াতের ফযীলত বুখারী শরীফের একটি সর্বসম্মতভাবে সহীহ হাদিসে বর্ণিত হয়েছে।',
    evidence: [
      {
        kind: 'hadith-authentic',
        summaryBn: 'আবু হুরায়রা (রাঃ) বর্ণনা করেন — রমযানের সদকার মাল পাহারা দেওয়ার দায়িত্বে থাকাকালীন তিনি পরপর কয়েক রাত এক চোরকে ধরেন; সে শয়তান ছিল। শয়তান তাঁকে শেখায় যে ঘুমানোর আগে আয়াতুল কুরসি পড়লে আল্লাহর পক্ষ থেকে একজন রক্ষক নিযুক্ত থাকবে এবং সকাল পর্যন্ত কোনো শয়তান কাছে আসবে না। রাসূলুল্লাহ ﷺ পরে নিশ্চিত করেন যে শয়তান এক্ষেত্রে সত্য বলেছিল, যদিও সে একজন মিথ্যাবাদী। (এটি হাদিসের মর্মার্থের সারসংক্ষেপ, শব্দানুবাদ নয়।)',
        sourceLabel: 'সহীহ আল-বুখারী, হাদিস ২৩১১ (কিতাব ৪০, হাদিস ১১)',
        narrator: 'আবু হুরায়রা (রাঃ)',
        gradingNoteBn: 'সহীহ — সহীহ আল-বুখারীতে বর্ণিত হওয়ায় এর সনদ সর্বসম্মতভাবে গ্রহণযোগ্য বলে বিবেচিত।',
        sourceUrl: 'https://sunnah.com/bukhari:2311',
      },
    ],
  },
];
