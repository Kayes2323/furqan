/**
 * Build PART 1 Sirah content from HQ OCR files.
 * Run: node scripts/build-sirah-part1.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OCR_DIR = path.join(__dirname, '../_source_study/part1/hq-ocr');
const OUT_DIR = path.join(__dirname, '../app/lib/sirah-content/part1');

const CHAPTER_RANGES = [
  { id: 'ch-01', pdfStart: 32, pdfEnd: 38, sections: [
    { id: 'ch-01-s-01', title: 'আরবের ভৌগোলিক পরিচয় এবং বিভিন্ন জাতির অবস্থান', pages: [32] },
    { id: 'ch-01-s-02', title: 'আরব জাতিসমূহ', pages: [33, 34, 35, 36, 37, 38] },
  ]},
  { id: 'ch-02', pdfStart: 39, pdfEnd: 50, sections: [
    { id: 'ch-02-s-01', title: 'আরবের প্রশাসনিক অবস্থা', pages: [39] },
    { id: 'ch-02-s-02', title: 'ইয়েমেনের বাদশাহী', pages: [40, 41] },
    { id: 'ch-02-s-03', title: 'হীরার বাদশাহী', pages: [42] },
    { id: 'ch-02-s-04', title: 'সিরিয়ার বাদশাহী', pages: [43, 44] },
    { id: 'ch-02-s-05', title: 'হেজাযের নেতৃত্ব', pages: [45, 46, 47, 48] },
    { id: 'ch-02-s-06', title: 'আরবের অন্যান্য অংশের প্রশাসনিক অবস্থা', pages: [49] },
    { id: 'ch-02-s-07', title: 'রাজনৈতিক পরিস্থিতি', pages: [50] },
  ]},
  { id: 'ch-03', pdfStart: 51, pdfEnd: 57, sections: [
    { id: 'ch-03-s-01', title: 'আরবের ধর্ম বিশ্বাস ও ধর্মীয় মতবাদ', pages: [51, 52, 53, 54] },
    { id: 'ch-03-s-02', title: 'দ্বীনে ইব্রাহীমীতে কোরায়শদের বিবাদ', pages: [55, 56] },
    { id: 'ch-03-s-03', title: 'সাধারণ ধর্মীয় অবস্থা', pages: [57] },
  ]},
  { id: 'ch-04', pdfStart: 58, pdfEnd: 61, sections: [
    { id: 'ch-04-s-01', title: 'জাহেলী সমাজের কিছু খন্ড চিত্র', pages: [58, 59] },
    { id: 'ch-04-s-02', title: 'অর্থনৈতিক অবস্থা', pages: [60] },
    { id: 'ch-04-s-03', title: 'চারিত্রিক অবস্থা', pages: [61] },
  ]},
  { id: 'ch-05', pdfStart: 63, pdfEnd: 64, sections: [
    { id: 'ch-05-s-01', title: 'নবী পরিবারের পরিচয়', pages: [63] },
    { id: 'ch-05-s-02', title: 'হাশেম ও আবদুল মোত্তালেব', pages: [64] },
  ]},
];

const SKIP_PATTERNS = [
  /^http/i, /QuranerAlo/i, /^\[.*আর রাহীকুল/i, /^\[.*\d+\]$/,
  /^রাহীক\s*\d+$/i, /^Bm\s*\d+$/i, /^\.?\s*r\s*$/i,
];

const FIXES = [
  [/\bANE\b/g, 'প্রশাসনিক'],
  [/\bTAHT\b/g, 'প্রশাসনিক'],
  [/^RR শব্দের/g, "'আরব' শব্দের"],
  [/\|/g, ''],
  [/এবংএরা/g, 'এবং এরা'],
  [/প্রান্তর এযং/g, 'প্রান্তর এবং'],
  [/মুল\b/g, 'মূল'],
  [/পয়গন্বর/g, 'পয়গম্বর'],
];

function readPage(n) {
  const f = path.join(OCR_DIR, `ocr-${String(n).padStart(3, '0')}.txt`);
  if (!fs.existsSync(f)) return '';
  return fs.readFileSync(f, 'utf8');
}

function cleanText(raw) {
  let t = raw;
  for (const [pat, rep] of FIXES) t = t.replace(pat, rep);
  // Mark isolated Latin/garbled tokens — do not guess
  t = t.replace(/\b[A-Z]{2,}\b/g, '[OCR UNCLEAR — REVIEW REQUIRED]');
  return t;
}

function toParagraphs(raw, pageNum) {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const filtered = lines.filter(l => !SKIP_PATTERNS.some(p => p.test(l)));
  let text = cleanText(filtered.join('\n'));
  // Split on sentence boundaries for readable paragraphs
  const chunks = text
    .split(/(?<=[।|])\s+/)
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(s => s.length > 15);
  if (!chunks.length && text.trim()) chunks.push(text.trim());
  return chunks.map(text => ({ type: 'para', text, sourcePdfPage: pageNum }));
}

function detectHeading(para) {
  const short = para.length < 80;
  const patterns = [
    /^আরবের ভৌগোলিক/, /^আরব জাতিসমূহ/, /^আরবের প্রশাসনিক/,
    /^ইয়েমেনের বাদশাহী/, /^হীরার বাদশাহী/, /^সিরিয়ার বাদশাহী/,
    /^হেজাযের নেতৃত্ব/, /^রাজনৈতিক পরিস্থিতি/,
    /^আরবের ধর্ম/, /^দ্বীনে ইব্রাহীমী/, /^সাধারণ ধর্মীয়/,
    /^জাহেলী সমাজের/, /^সামগ্রিক অবস্থা/, /^অর্থনৈতিক অবস্থা/, /^চারিত্রিক অবস্থা/,
    /^নবী পরিবারের পরিচয়/, /^যমযম/, /^প্রথম অংশ$/, /^দ্বিতীয় অংশ$/, /^তৃতীয় অংশ$/,
  ];
  if (short && patterns.some(p => p.test(para))) return 'heading';
  if (/^(এক|দুই|তিন|চার|পাঁচ|ছয়|সাত|এক\)|দুই\)|তিন\)|চার\))/.test(para) && para.length < 120) return 'subheading';
  return 'para';
}

function buildSection(section) {
  const blocks = [];
  const seen = new Set();
  for (const page of section.pages) {
    const raw = readPage(page);
    const paras = toParagraphs(raw, page);
    for (const p of paras) {
      const key = p.text.slice(0, 60);
      if (seen.has(key)) continue;
      seen.add(key);
      const type = detectHeading(p.text);
      blocks.push({ type, text: p.text, sourcePdfPage: page });
    }
  }
  return { ...section, blocks, sourcePdfStart: section.pages[0], sourcePdfEnd: section.pages[section.pages.length - 1] };
}

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
}

function emitChapter(ch) {
  const sections = ch.sections.map(buildSection);
  const blocks = sections.map(s => {
    const blockStr = s.blocks.map(b =>
      `      { type: '${b.type}', text: '${esc(b.text)}', sourcePdfPage: ${b.sourcePdfPage} },`
    ).join('\n');
    return `    {
      id: '${s.id}',
      title: '${esc(s.title)}',
      sourcePdfStart: ${s.sourcePdfStart},
      sourcePdfEnd: ${s.sourcePdfEnd},
      blocks: [
${blockStr}
      ],
    }`;
  }).join(',\n');
  return `import type { SirahChapter } from '../../sirah-types';

export const ${ch.id.replace('-', '')}Chapter: SirahChapter = {
  id: '${ch.id}',
  number: ${parseInt(ch.id.split('-')[1])},
  title: '${CHAPTER_META[ch.id].title}',
  subtitle: '${CHAPTER_META[ch.id].subtitle}',
  partId: 'part-1',
  source: {
    book: 'আর রাহীকুল মাখতূম',
    edition: 'বাংলা অনুবাদ — খাদিজা আখতার রেজায়ী',
    pdfPageStart: ${ch.pdfStart},
    pdfPageEnd: ${ch.pdfEnd},
  },
  sections: [
${blocks}
  ],
};
`;
}

const CHAPTER_META = {
  'ch-01': { title: 'আরব ভূমি ও গোত্র', subtitle: 'ভৌগোলিক পরিচয় ও জাতিসমূহ' },
  'ch-02': { title: 'শাসনব্যবস্থা ও রাজনীতি', subtitle: 'প্রশাসনিক অবস্থা ও রাজনৈতিক পরিস্থিতি' },
  'ch-03': { title: 'ধর্মীয় অবস্থা', subtitle: 'আরবের ধর্ম বিশ্বাস ও মতবাদ' },
  'ch-04': { title: 'সামাজিক অবস্থা', subtitle: 'জাহেলী সমাজ, অর্থনীতি ও চরিত্র' },
  'ch-05': { title: 'নবীর বংশ পরিচয়', subtitle: 'নবী পরিবারের বংশধারা' },
};

fs.mkdirSync(OUT_DIR, { recursive: true });
const SKIP_CHAPTERS = new Set(['ch-05']); // preserve manual verification
for (const ch of CHAPTER_RANGES) {
  if (SKIP_CHAPTERS.has(ch.id)) {
    console.log('Skipped (manual):', ch.id);
    continue;
  }
  const out = path.join(OUT_DIR, `${ch.id}.ts`);
  fs.writeFileSync(out, emitChapter(ch), 'utf8');
  console.log('Wrote', out);
}
console.log('Done.');
