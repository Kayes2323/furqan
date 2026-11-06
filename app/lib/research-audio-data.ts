// ═══════════════════════════════════════════
// FURQAN — Research Audio Reader: static audio manifest
//
// Mirrors sirah-audio-data.ts's pattern, but for Research (গবেষণা)
// articles, whose canonical text lives in Firestore
// (research/{categoryId}/articles/{articleId}.content, Markdown) rather
// than a static TS file. This manifest only records what's actually
// been narrated and committed as static MP3s — it is NOT a cache of the
// article text itself, so a future edit to an article's Firestore
// content is simply not reflected in old audio until re-generated; this
// file never claims otherwise.
//
// `totalChunksExpected` per article was computed once by running the
// real Firestore content through markdown-narration.ts's
// extractNarrationText() + splitIntoNarrationChunks() — see
// docs/audio-reader-pilot.md §9 for how and when. `chunks` only ever
// grows as a PREFIX of that count (chunk 0, then 1, then 2, ...),
// generated a few at a time against Gemini's free-tier daily quota —
// never generated out of order, so "chunks.length" alone tells you
// exactly how far narration has progressed for that article.
// ═══════════════════════════════════════════

export interface ResearchAudioChunk {
  path: string;
  durationSec: number;
}

export interface ResearchArticleAudio {
  articleId: string;
  title: string;
  subtitle: string;
  order: number;
  /** How many chunks this article's full narration will need once
   *  complete — computed once from the real article text, not a guess. */
  totalChunksExpected: number;
  /** Always a prefix [0..chunks.length) of totalChunksExpected. */
  chunks: ResearchAudioChunk[];
}

export interface ResearchCategoryAudio {
  categoryId: string;
  voiceLabel: string;
  model: string;
  articles: ResearchArticleAudio[];
}

export const RESEARCH_AUDIO: Record<string, ResearchCategoryAudio> = {
  economy: {
    categoryId: 'economy',
    voiceLabel: 'Charon (Gemini TTS, বাংলা পুরুষ কণ্ঠ)',
    model: 'gemini-3.8-flash-tts',
    articles: [
      { articleId: 'overview', title: 'অর্থনীতি — সূচনা', subtitle: 'কুরআনে অর্থনৈতিক নীতি', order: 1, totalChunksExpected: 6, chunks: [
        { path: '/audio/research/economy/overview-0.mp3', durationSec: 158.047417 },
        { path: '/audio/research/economy/overview-1.mp3', durationSec: 161.064000 },
        { path: '/audio/research/economy/overview-2.mp3', durationSec: 144.024000 },
        { path: '/audio/research/economy/overview-3.mp3', durationSec: 155.592000 },
        { path: '/audio/research/economy/overview-4.mp3', durationSec: 156.816000 },
        { path: '/audio/research/economy/overview-5.mp3', durationSec: 120.144000 },
      ] },
      { articleId: 'part1_problem', title: 'পর্ব ১ — বর্তমান সংকট', subtitle: 'আজকের অর্থনীতির রোগ', order: 2, totalChunksExpected: 5, chunks: [
        { path: '/audio/research/economy/part1_problem-0.mp3', durationSec: 161.424000 },
        { path: '/audio/research/economy/part1_problem-1.mp3', durationSec: 161.016000 },
        { path: '/audio/research/economy/part1_problem-2.mp3', durationSec: 169.632000 },
        { path: '/audio/research/economy/part1_problem-3.mp3', durationSec: 152.736000 },
        { path: '/audio/research/economy/part1_problem-4.mp3', durationSec: 55.704000 },
      ] },
      { articleId: 'part2_riba', title: 'পর্ব ২ — সুদের বিকল্প', subtitle: 'সুদ ছাড়া অর্থনীতি কীভাবে?', order: 3, totalChunksExpected: 5, chunks: [
        { path: '/audio/research/economy/part2_riba-0.mp3', durationSec: 165.192000 },
        { path: '/audio/research/economy/part2_riba-1.mp3', durationSec: 141.192000 },
        { path: '/audio/research/economy/part2_riba-2.mp3', durationSec: 139.992000 },
        { path: '/audio/research/economy/part2_riba-3.mp3', durationSec: 154.776000 },
        { path: '/audio/research/economy/part2_riba-4.mp3', durationSec: 136.704000 },
      ] },
      { articleId: 'part3_vision', title: 'পর্ব ৩ — বাংলাদেশ ভিশন', subtitle: 'নতুন বাংলাদেশের স্বপ্ন', order: 4, totalChunksExpected: 7, chunks: [
        { path: '/audio/research/economy/part3_vision-0.mp3', durationSec: 144.312000 },
        { path: '/audio/research/economy/part3_vision-1.mp3', durationSec: 136.464000 },
        { path: '/audio/research/economy/part3_vision-2.mp3', durationSec: 168.432000 },
        { path: '/audio/research/economy/part3_vision-3.mp3', durationSec: 166.056000 },
        { path: '/audio/research/economy/part3_vision-4.mp3', durationSec: 149.712000 },
        { path: '/audio/research/economy/part3_vision-5.mp3', durationSec: 158.232000 },
        { path: '/audio/research/economy/part3_vision-6.mp3', durationSec: 96.744000 },
      ] },
      { articleId: 'part4_zakat', title: 'পর্ব ৪ — যাকাত ব্যবস্থা', subtitle: 'দারিদ্র্যমুক্তির রোডম্যাপ', order: 5, totalChunksExpected: 6, chunks: [
        { path: '/audio/research/economy/part4_zakat-0.mp3', durationSec: 154.896000 },
        { path: '/audio/research/economy/part4_zakat-1.mp3', durationSec: 135.744000 },
        { path: '/audio/research/economy/part4_zakat-2.mp3', durationSec: 151.872000 },
        { path: '/audio/research/economy/part4_zakat-3.mp3', durationSec: 149.136000 },
        { path: '/audio/research/economy/part4_zakat-4.mp3', durationSec: 157.584000 },
        { path: '/audio/research/economy/part4_zakat-5.mp3', durationSec: 109.344000 },
      ] },
      { articleId: 'part5_business', title: 'পর্ব ৫ — ব্যবসা ও প্রযুক্তি', subtitle: 'ইসলামী ব্যবসার নীতি', order: 6, totalChunksExpected: 7, chunks: [
        { path: '/audio/research/economy/part5_business-0.mp3', durationSec: 156.816000 },
        { path: '/audio/research/economy/part5_business-1.mp3', durationSec: 147.336000 },
        { path: '/audio/research/economy/part5_business-2.mp3', durationSec: 152.184000 },
        { path: '/audio/research/economy/part5_business-3.mp3', durationSec: 155.304000 },
        { path: '/audio/research/economy/part5_business-4.mp3', durationSec: 143.832000 },
        { path: '/audio/research/economy/part5_business-5.mp3', durationSec: 163.584000 },
        { path: '/audio/research/economy/part5_business-6.mp3', durationSec: 49.656000 },
      ] },
      { articleId: 'part6_complete', title: 'পর্ব ৬ — পূর্ণাঙ্গ ব্যবস্থা', subtitle: 'সম্পূর্ণ ইসলামী অর্থনীতি', order: 7, totalChunksExpected: 6, chunks: [
        { path: '/audio/research/economy/part6_complete-0.mp3', durationSec: 133.104000 },
        { path: '/audio/research/economy/part6_complete-1.mp3', durationSec: 169.896000 },
        { path: '/audio/research/economy/part6_complete-2.mp3', durationSec: 161.736000 },
        { path: '/audio/research/economy/part6_complete-3.mp3', durationSec: 154.104000 },
        { path: '/audio/research/economy/part6_complete-4.mp3', durationSec: 151.824000 },
        { path: '/audio/research/economy/part6_complete-5.mp3', durationSec: 166.032000 },
      ] },
    ],
  },
  politics: {
    categoryId: 'politics',
    voiceLabel: 'Charon (Gemini TTS, বাংলা পুরুষ কণ্ঠ)',
    model: 'gemini-3.8-flash-tts',
    articles: [
      { articleId: 'overview', title: 'খিলাফত — সূচনা', subtitle: 'ইসলামী শাসনব্যবস্থা', order: 1, totalChunksExpected: 7, chunks: [
        { path: '/audio/research/politics/overview-0.mp3', durationSec: 154.416000 },
        { path: '/audio/research/politics/overview-1.mp3', durationSec: 146.016000 },
        { path: '/audio/research/politics/overview-2.mp3', durationSec: 159.336000 },
        { path: '/audio/research/politics/overview-3.mp3', durationSec: 162.984000 },
        { path: '/audio/research/politics/overview-4.mp3', durationSec: 159.984000 },
        { path: '/audio/research/politics/overview-5.mp3', durationSec: 159.696000 },
        { path: '/audio/research/politics/overview-6.mp3', durationSec: 118.032000 },
      ] },
      { articleId: 'part2_election', title: 'পর্ব ২ — খলিফা নির্বাচন', subtitle: 'যোগ্যতা ও মজলিসে শুরা', order: 2, totalChunksExpected: 4, chunks: [
        { path: '/audio/research/politics/part2_election-0.mp3', durationSec: 158.352000 },
        { path: '/audio/research/politics/part2_election-1.mp3', durationSec: 168.432000 },
        { path: '/audio/research/politics/part2_election-2.mp3', durationSec: 153.072000 },
        { path: '/audio/research/politics/part2_election-3.mp3', durationSec: 10.104000 },
      ] },
      { articleId: 'part3_ministries', title: 'পর্ব ৩ — মন্ত্রণালয় ব্যবস্থা', subtitle: 'সরকার কাঠামো', order: 3, totalChunksExpected: 4, chunks: [
        { path: '/audio/research/politics/part3_ministries-0.mp3', durationSec: 172.296000 },
        { path: '/audio/research/politics/part3_ministries-1.mp3', durationSec: 167.664000 },
        { path: '/audio/research/politics/part3_ministries-2.mp3', durationSec: 171.984000 },
        { path: '/audio/research/politics/part3_ministries-3.mp3', durationSec: 94.632000 },
      ] },
      { articleId: 'part4_economy', title: 'পর্ব ৪ — অর্থনৈতিক শাসন', subtitle: 'বায়তুলমাল থেকে বাজেট', order: 4, totalChunksExpected: 5, chunks: [
        { path: '/audio/research/politics/part4_economy-0.mp3', durationSec: 160.176000 },
        { path: '/audio/research/politics/part4_economy-1.mp3', durationSec: 174.672000 },
        { path: '/audio/research/politics/part4_economy-2.mp3', durationSec: 169.584000 },
        { path: '/audio/research/politics/part4_economy-3.mp3', durationSec: 160.392000 },
        { path: '/audio/research/politics/part4_economy-4.mp3', durationSec: 53.304000 },
      ] },
      { articleId: 'part5_foreign', title: 'পর্ব ৫ — পররাষ্ট্রনীতি', subtitle: 'ইসলামী কূটনীতি', order: 5, totalChunksExpected: 4, chunks: [
        { path: '/audio/research/politics/part5_foreign-0.mp3', durationSec: 169.872000 },
        { path: '/audio/research/politics/part5_foreign-1.mp3', durationSec: 173.904000 },
        { path: '/audio/research/politics/part5_foreign-2.mp3', durationSec: 160.656000 },
        { path: '/audio/research/politics/part5_foreign-3.mp3', durationSec: 39.456000 },
      ] },
      { articleId: 'part6_women', title: 'পর্ব ৬ — নারী ও সংখ্যালঘু', subtitle: 'খিলাফতে তাদের অধিকার', order: 6, totalChunksExpected: 4, chunks: [
        { path: '/audio/research/politics/part6_women-0.mp3', durationSec: 155.664000 },
        { path: '/audio/research/politics/part6_women-1.mp3', durationSec: 155.784000 },
        { path: '/audio/research/politics/part6_women-2.mp3', durationSec: 162.864000 },
        { path: '/audio/research/politics/part6_women-3.mp3', durationSec: 62.712000 },
      ] },
      { articleId: 'part7_western', title: 'পর্ব ৭ — পশ্চিমের বাধা', subtitle: 'ষড়যন্ত্র মোকাবেলা', order: 7, totalChunksExpected: 3, chunks: [
        { path: '/audio/research/politics/part7_western-0.mp3', durationSec: 163.584000 },
        { path: '/audio/research/politics/part7_western-1.mp3', durationSec: 153.432000 },
        { path: '/audio/research/politics/part7_western-2.mp3', durationSec: 133.536000 },
      ] },
      { articleId: 'part8_rasul', title: 'পর্ব ৮ — রাসূল ২০২৬-এ', subtitle: 'আধুনিক যুগে নবীজি', order: 8, totalChunksExpected: 5, chunks: [
        { path: '/audio/research/politics/part8_rasul-0.mp3', durationSec: 173.064000 },
        { path: '/audio/research/politics/part8_rasul-1.mp3', durationSec: 142.632000 },
        { path: '/audio/research/politics/part8_rasul-2.mp3', durationSec: 154.704000 },
        { path: '/audio/research/politics/part8_rasul-3.mp3', durationSec: 160.944000 },
        { path: '/audio/research/politics/part8_rasul-4.mp3', durationSec: 40.824000 },
      ] },
      { articleId: 'part10_world', title: 'পর্ব ৯ — বিশ্ব খিলাফত', subtitle: 'সম্ভব কিনা, কীভাবে?', order: 9, totalChunksExpected: 4, chunks: [
        { path: '/audio/research/politics/part10_world-0.mp3', durationSec: 189.984000 },
        { path: '/audio/research/politics/part10_world-1.mp3', durationSec: 166.584000 },
        { path: '/audio/research/politics/part10_world-2.mp3', durationSec: 160.656000 },
        { path: '/audio/research/politics/part10_world-3.mp3', durationSec: 46.032000 },
      ] },
      { articleId: 'part11_nonmuslims', title: 'পর্ব ১০ — বিধর্মীদের অধিকার', subtitle: 'শুধু মুসলিমদের জন্য নয়', order: 10, totalChunksExpected: 5, chunks: [
        { path: '/audio/research/politics/part11_nonmuslims-0.mp3', durationSec: 161.976000 },
        { path: '/audio/research/politics/part11_nonmuslims-1.mp3', durationSec: 164.064000 },
        { path: '/audio/research/politics/part11_nonmuslims-2.mp3', durationSec: 144.936000 },
        { path: '/audio/research/politics/part11_nonmuslims-3.mp3', durationSec: 160.632000 },
        { path: '/audio/research/politics/part11_nonmuslims-4.mp3', durationSec: 52.536000 },
      ] },
    ],
  },
  science: {
    categoryId: 'science',
    voiceLabel: 'Charon (Gemini TTS, বাংলা পুরুষ কণ্ঠ)',
    model: 'gemini-3.8-flash-tts',
    articles: [
      { articleId: 'astronomy', title: 'জ্যোতির্বিজ্ঞান', subtitle: 'মহাকাশ ও মহাবিশ্ব', order: 1, totalChunksExpected: 6, chunks: [
        { path: '/audio/research/science/astronomy-0.mp3', durationSec: 163.776000 },
        { path: '/audio/research/science/astronomy-1.mp3', durationSec: 150.072000 },
        { path: '/audio/research/science/astronomy-2.mp3', durationSec: 153.432000 },
        { path: '/audio/research/science/astronomy-3.mp3', durationSec: 153.192000 },
        { path: '/audio/research/science/astronomy-4.mp3', durationSec: 162.936000 },
        { path: '/audio/research/science/astronomy-5.mp3', durationSec: 85.056000 },
      ] },
      { articleId: 'embryology', title: 'ভ্রূণবিদ্যা', subtitle: 'মানব সৃষ্টির ধাপ', order: 2, totalChunksExpected: 6, chunks: [
        { path: '/audio/research/science/embryology-0.mp3', durationSec: 163.032000 },
        { path: '/audio/research/science/embryology-1.mp3', durationSec: 162.264000 },
        { path: '/audio/research/science/embryology-2.mp3', durationSec: 163.992000 },
        { path: '/audio/research/science/embryology-3.mp3', durationSec: 138.264000 },
      ] },
      { articleId: 'oceanography', title: 'সমুদ্রবিজ্ঞান', subtitle: 'সমুদ্রের গভীর রহস্য', order: 3, totalChunksExpected: 5, chunks: [] },
      { articleId: 'geography', title: 'ভূগোল', subtitle: 'পৃথিবী ও ভূমির বিজ্ঞান', order: 4, totalChunksExpected: 6, chunks: [] },
      { articleId: 'mountain', title: 'পাহাড়ের রহস্য', subtitle: 'পৃথিবীর খুঁটি', order: 5, totalChunksExpected: 2, chunks: [] },
      { articleId: 'medicine', title: 'চিকিৎসাবিজ্ঞান', subtitle: 'কুরআনে স্বাস্থ্য ও চিকিৎসা', order: 6, totalChunksExpected: 7, chunks: [] },
      { articleId: 'botany', title: 'উদ্ভিদবিজ্ঞান', subtitle: 'গাছপালা ও কৃষি', order: 7, totalChunksExpected: 7, chunks: [] },
    ],
  },
  psychology: {
    categoryId: 'psychology',
    voiceLabel: 'Charon (Gemini TTS, বাংলা পুরুষ কণ্ঠ)',
    model: 'gemini-3.8-flash-tts',
    articles: [
      { articleId: 'part1_mental_health', title: 'পর্ব ১ — মানসিক স্বাস্থ্য', subtitle: 'উদ্বেগ ও বিষণ্নতার সমাধান', order: 1, totalChunksExpected: 6, chunks: [] },
      { articleId: 'part2_nafs', title: 'পর্ব ২ — নফস', subtitle: 'আপনি আসলে কে?', order: 2, totalChunksExpected: 5, chunks: [] },
      { articleId: 'part3_forgiveness', title: 'পর্ব ৩ — ক্ষমা', subtitle: 'মনের মুক্তির পথ', order: 3, totalChunksExpected: 4, chunks: [] },
    ],
  },
  sociology: {
    categoryId: 'sociology',
    voiceLabel: 'Charon (Gemini TTS, বাংলা পুরুষ কণ্ঠ)',
    model: 'gemini-3.8-flash-tts',
    articles: [
      { articleId: 'part1_family', title: 'পর্ব ১ — পরিবার', subtitle: 'সমাজের মূল ভিত্তি', order: 1, totalChunksExpected: 3, chunks: [] },
      { articleId: 'part2_justice', title: 'পর্ব ২ — ন্যায়বিচার', subtitle: 'ইসলামে সামাজিক সমতা', order: 2, totalChunksExpected: 2, chunks: [] },
      { articleId: 'part3_women', title: 'পর্ব ৩ — নারীর অধিকার', subtitle: 'ইসলামের দৃষ্টিভঙ্গি', order: 3, totalChunksExpected: 3, chunks: [] },
      { articleId: 'part4_hudud', title: 'পর্ব ৪ — শাস্তির বিধান', subtitle: 'কঠোর শাস্তি কেন?', order: 4, totalChunksExpected: 4, chunks: [] },
      { articleId: 'part5_coexistence', title: 'পর্ব ৫ — সহাবস্থান', subtitle: 'ভিন্নতার মধ্যে ঐক্য', order: 5, totalChunksExpected: 2, chunks: [] },
      { articleId: 'part6_social_diseases', title: 'পর্ব ৬ — সামাজিক রোগ', subtitle: 'মাদক, দুর্নীতি, পর্নোগ্রাফি', order: 6, totalChunksExpected: 4, chunks: [] },
    ],
  },
  philosophy: {
    categoryId: 'philosophy',
    voiceLabel: 'Charon (Gemini TTS, বাংলা পুরুষ কণ্ঠ)',
    model: 'gemini-3.8-flash-tts',
    articles: [
      { articleId: 'overview', title: 'দর্শন — সূচনা', subtitle: 'জীবনের বড় প্রশ্নগুলো', order: 1, totalChunksExpected: 7, chunks: [] },
      { articleId: 'part2_tawhid', title: 'পর্ব ২ — তাওহীদ', subtitle: 'একত্ববাদের দর্শন', order: 2, totalChunksExpected: 3, chunks: [] },
      { articleId: 'part3_epistemology', title: 'পর্ব ৩ — জ্ঞানতত্ত্ব', subtitle: 'আমরা কীভাবে জানি?', order: 3, totalChunksExpected: 3, chunks: [] },
      { articleId: 'part4_ethics', title: 'পর্ব ৪ — নৈতিকতা', subtitle: 'ভালো ও মন্দ কে নির্ধারণ করে?', order: 4, totalChunksExpected: 3, chunks: [] },
    ],
  },
};

export function getCategoryAudio(categoryId: string): ResearchCategoryAudio | undefined {
  return RESEARCH_AUDIO[categoryId];
}

export function getArticleAudio(categoryId: string, articleId: string): ResearchArticleAudio | undefined {
  return getCategoryAudio(categoryId)?.articles.find((a) => a.articleId === articleId);
}

export function isArticleFullyNarrated(article: ResearchArticleAudio): boolean {
  return article.chunks.length >= article.totalChunksExpected && article.totalChunksExpected > 0;
}

export function isArticlePartiallyNarrated(article: ResearchArticleAudio): boolean {
  return article.chunks.length > 0;
}

export function isAnyAudioAvailable(categoryId: string, articleId: string): boolean {
  const article = getArticleAudio(categoryId, articleId);
  return !!article && article.chunks.length > 0;
}
