import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfDir = path.join(__dirname, '../.temp-raheeq');
const pdfPath = path.join(pdfDir, fs.readdirSync(pdfDir).find((f) => f.endsWith('.pdf')));
const outDir = path.join(pdfDir, 'pages');
fs.mkdirSync(outDir, { recursive: true });

const pages = process.argv.slice(2).map(Number).filter(Boolean);
if (!pages.length) {
  console.error('Usage: node scripts/render-pdf-pages.mjs 10 11 12 ...');
  process.exit(1);
}

const data = new Uint8Array(fs.readFileSync(pdfPath));
const doc = await getDocument({ data, disableFontFace: true }).promise;

for (const num of pages) {
  const page = await doc.getPage(num);
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
  const out = path.join(outDir, `page-${String(num).padStart(3, '0')}.png`);
  fs.writeFileSync(out, canvas.toBuffer('image/png'));
  console.log('Rendered', num, '->', out);
}
