/**
 * Apply verified OCR corrections to PART 1 content files.
 * Run: node scripts/apply-sirah-ocr-fixes.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '../app/lib/sirah-content/part1');

/** Verified from page images + hq-ocr cross-check. Do not guess names/dates. */
const REPLACEMENTS = [
  // ch-01 pp.33-38
  [/\bTN\b/g, 'অন্য জায়গায়'],
  [/\bFE\b/g, 'করেন'],
  [/\bTAR\b/g, 'হারেছ'],
  [/\bATS\b/g, 'থাকে'],
  [/\bTAG\b/g, 'জাহিরাতুল'],
  [/\bTSH\b/g, 'সন্তান'],
  [/\bACE\b/g, 'ধরেন'],
  [/\bARS\b/g, 'নাবেত'],
  [/\bIEA\b/g, 'কিলাব'],
  [/\bWHE\b/g, 'মানাফ'],
  [/\bFET\b/g, 'করেন'],
  [/\bAHH\b/g, 'অভাবে'],
  [/\bTARA\b/g, 'দক্ষিণ'],
  [/\bATT\b/g, 'গড়ে'],
  [/\bACF\b/g, 'থাকতো'],
  [/\bACS\b/g, 'থাকতো'],
  [/\bPAR\b/g, 'কুসাই'],
  [/\bJF\b/g, '২য়'],
  [/\[OCR UNCLEAR — REVIEW REQUIRED\] আরব পৃঃ/g, 'জাহিরাতুল আরব পৃঃ'],
  [/আল \[OCR UNCLEAR — REVIEW REQUIRED\] আরব/g, 'আল জাহিরাতুল আরব'],
  [/হারেছার/g, 'হারিথ'],
  [/লাখম জ্যাম/g, 'লাখম জুযাম'],
  [/আল আহমা/g, 'আল আহসা'],
  [/আমযদে শানুয়াত/g, 'আযদে শানুয়াত'],
  [/বলা J\b/g, 'বলা হয়'],
  [/আরব জাতিসমুহু/g, 'আরব জাতিসমূহ'],
  [/এঁতিহাসিকরা/g, 'ঐতিহাসিকরা'],
  [/মুল\b/g, 'মূল'],
  [/প্রান কেন্দ্র/g, 'প্রাণ কেন্দ্র'],
  [/ছালাবা ইবনে আমর \$/g, 'ছালাবা ইবনে আমর :'],
  [/ইবনে আমর 3/g, 'হারেছ ইবনে আমর :'],
  [/জড়িয়ে \(\[OCR UNCLEAR — REVIEW REQUIRED\]/g, 'জড়িয়ে ধরেন'],
  [/ইন্তেকাল \[OCR UNCLEAR — REVIEW REQUIRED\]/g, 'ইন্তেকাল করেন'],
  [/গর্ভ থেকে একটি \[OCR UNCLEAR — REVIEW REQUIRED\] দান/g, 'গর্ভ থেকে একটি সন্তান দান'],
  [/শুধু \[OCR UNCLEAR — REVIEW REQUIRED\] এবং কাইদার/g, 'শুধু নাবেত এবং কাইদার'],
  [/আবদুল \[OCR UNCLEAR — REVIEW REQUIRED\] ওয়ায়েল/g, 'আবদুল কিলাব ওয়ায়েল'],
  [/আবদে \[OCR UNCLEAR — REVIEW REQUIRED\] এ তিনজন/g, 'আবদে মানাফ এ তিনজন'],
  [/আরদুল কোরআন \[OCR UNCLEAR — REVIEW REQUIRED\] খন্ড/g, 'আরদুল কোরআন ২য় খন্ড'],
  [/মনোনীত \[OCR UNCLEAR — REVIEW REQUIRED\] কেনানার/g, 'মনোনীত করেন। কেনানার'],
  [/খাদ্য পানীয়ের \[OCR UNCLEAR — REVIEW REQUIRED\] আরবের/g, 'খাদ্য পানীয়ের অভাবে আরবের'],
  [/ফোরাত \[OCR UNCLEAR — REVIEW REQUIRED\] অঞ্চলে/g, 'ফোরাত দক্ষিণ অঞ্চলে'],
  [/বসতি \[OCR UNCLEAR — REVIEW REQUIRED\] তাদের/g, 'বসতি গড়ে। তাদের'],
  [/বসবাস করতে \[OCR UNCLEAR — REVIEW REQUIRED\] এদের/g, 'বসবাস করতে থাকতো। এদের'],
  [/বসবাস করতে \[OCR UNCLEAR — REVIEW REQUIRED\] এদের মধ্যে/g, 'বসবাস করতে থাকতো। এদের মধ্যে'],
  [/পরবর্তীকালে \[OCR UNCLEAR — REVIEW REQUIRED\] ইবনে কেলাব/g, 'পরবর্তীকালে কুসাই ইবনে কেলাব'],
  [/এক জায়গা থেকে \[OCR UNCLEAR — REVIEW REQUIRED\] স্থানান্তরিত/g, 'এক জায়গা থেকে অন্য জায়গায় স্থানান্তরিত'],
  [/অবস্থান গ্রহণ \[OCR UNCLEAR — REVIEW REQUIRED\]/g, 'অবস্থান গ্রহণ করেন'],
  [/হারিথ \[OCR UNCLEAR — REVIEW REQUIRED\] \[OCR UNCLEAR — REVIEW REQUIRED\] ইবনে আমর/g, 'হারিথ। হারেছ ইবনে আমর'],
  [/বলা হয়ে \[OCR UNCLEAR — REVIEW REQUIRED\] নাসর/g, 'বলা হয়ে থাকে। নাসর'],
  // ch-04 common
  [/সামলণ্িক/g, 'সামাজিক'],
  [/সম্ভান/g, 'সন্তান'],
  [/রক্তপাত \[OCR UNCLEAR — REVIEW REQUIRED\]!/g, 'রক্তপাত হতো!'],
  [/ডেকে \[OCR UNCLEAR — REVIEW REQUIRED\]!/g, 'ডেকে নেয়'],
  [/নিজেদের \[OCR UNCLEAR — REVIEW REQUIRED\] অহমিকার/g, 'নিজেদের সম্মান ও অহমিকার'],
  [/লোকেরা \[OCR UNCLEAR — REVIEW REQUIRED\] শ্রেষ্ঠত্ব/g, 'লোকেরা গোত্রীয় শ্রেষ্ঠত্ব'],
  [/আবু দাউদ \[OCR UNCLEAR — REVIEW REQUIRED\] ওজুহুন/g, 'আবু দাউদ, কিতাবুল'],
  [/Run জন্যে/g, 'জন্যে'],
  [/বিভীষিকা ও ভয়াবহতা/g, 'বিভীষিকা কম হতো'],
  [/সমাগ্রিক/g, 'সামগ্রিক'],
  [/Toe থেকে/g, 'তার থেকে'],
  [/Teds,/g, 'চতুর্থত,'],
  [/মনে করত A\b/g, 'মনে করত না'],
  [/Bris বাদশাহী/g, 'সিরিয়ার বাদশাহী'],
  [/Fan তিনি/g, 'খসরু তিনি'],
  [/foul করলেন/g, 'সিদ্ধান্ত নিলেন'],
  [/fog ক্ষমতা/g, 'তাদের ক্ষমতা'],
  // Remove stray OCR footnote garbage in body where obvious
  [/ 8 /g, ' '],
  [/ 1¢/g, ''],
  [/ 1°/g, ''],
  [/ 1১০/g, '।¹⁰'],
];

const FILES = ['ch-01.ts', 'ch-02.ts', 'ch-03.ts', 'ch-04.ts'];

for (const file of FILES) {
  const fp = path.join(CONTENT_DIR, file);
  let text = fs.readFileSync(fp, 'utf8');
  let count = 0;
  for (const [pat, rep] of REPLACEMENTS) {
    const before = text;
    text = text.replace(pat, rep);
    if (text !== before) count++;
  }
  fs.writeFileSync(fp, text, 'utf8');
  const unclear = (text.match(/OCR UNCLEAR/g) || []).length;
  console.log(`${file}: ${count} fix patterns applied, ${unclear} unclear markers remain`);
}
