import { test } from 'node:test';
import assert from 'node:assert/strict';

import { extractNarrationText, splitIntoNarrationChunks, NARRATION_CHUNK_MAX_CHARS } from './markdown-narration.ts';

test('extractNarrationText strips a full Quranic ayah quoted in Arabic script', () => {
  const md = '> يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ\n\n"হে মুমিনগণ — আল্লাহকে ভয় করো।"';
  const out = extractNarrationText(md);
  assert.ok(!/[؀-ۿ]/.test(out), 'no Arabic-script codepoint should survive');
  assert.ok(out.includes('হে মুমিনগণ'), 'the Bengali translation must be preserved');
});

test('extractNarrationText strips Arabic even when mixed inline with Bengali on the same line', () => {
  const md = '**الرِّبَا — আর-রিবা।**';
  const out = extractNarrationText(md);
  assert.ok(!/[؀-ۿ]/.test(out));
  assert.ok(out.includes('আর-রিবা'));
});

test('extractNarrationText removes markdown bold/italic/header/blockquote syntax without losing the text', () => {
  const md = '# শিরোনাম\n\n**গুরুত্বপূর্ণ** কথা।\n\n*উদ্ধৃতি টেক্সট*\n\n> উদ্ধৃত অংশ';
  const out = extractNarrationText(md);
  assert.ok(!out.includes('#'));
  assert.ok(!out.includes('*'));
  assert.ok(!out.includes('>'));
  assert.ok(out.includes('শিরোনাম'));
  assert.ok(out.includes('গুরুত্বপূর্ণ কথা।'));
  assert.ok(out.includes('উদ্ধৃতি টেক্সট'));
  assert.ok(out.includes('উদ্ধৃত অংশ'));
});

test('extractNarrationText converts a markdown link to its visible text, dropping the URL', () => {
  const md = '[সহীহ বুখারী, হাদিস: ১৪০৩](https://example.com/hadith/1403)';
  const out = extractNarrationText(md);
  assert.ok(!out.includes('http'));
  assert.ok(out.includes('সহীহ বুখারী'));
});

test('extractNarrationText converts a plain bracket citation to readable text', () => {
  const md = '[সূরা বাকারা ২:২৭৮-২৭৯]';
  const out = extractNarrationText(md);
  assert.equal(out, 'সূরা বাকারা ২:২৭৮-২৭৯');
});

test('extractNarrationText strips emoji', () => {
  const md = '🤔 একটি প্রশ্ন।';
  const out = extractNarrationText(md);
  assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(out));
  assert.ok(out.includes('একটি প্রশ্ন।'));
});

test('extractNarrationText drops lines that become empty once Arabic/markdown is stripped (a line that was pure Arabic)', () => {
  const md = 'প্রথম অনুচ্ছেদ।\n\n**سورة البقرة ٢:٢٧٥**\n\nদ্বিতীয় অনুচ্ছেদ।';
  const out = extractNarrationText(md);
  const paragraphs = out.split('\n\n');
  assert.deepEqual(paragraphs, ['প্রথম অনুচ্ছেদ।', 'দ্বিতীয় অনুচ্ছেদ।']);
});

test('extractNarrationText preserves paragraph breaks (blank-line-separated) for TTS pacing', () => {
  const md = 'প্রথম।\n\nদ্বিতীয়।\n\nতৃতীয়।';
  const out = extractNarrationText(md);
  assert.equal(out, 'প্রথম।\n\nদ্বিতীয়।\n\nতৃতীয়।');
});

// ─── Chunking ────────────────────────────────────────────────────────────

test('splitIntoNarrationChunks returns one chunk when text is under the limit', () => {
  const text = 'ছোট একটি লেখা।';
  const chunks = splitIntoNarrationChunks(text);
  assert.deepEqual(chunks, [text]);
});

test('splitIntoNarrationChunks never breaks a chunk mid-paragraph', () => {
  const paragraphs = Array.from({ length: 10 }, (_, i) => `অনুচ্ছেদ ${i} `.repeat(30));
  const text = paragraphs.join('\n\n');
  const chunks = splitIntoNarrationChunks(text, 500);
  for (const chunk of chunks) {
    for (const para of paragraphs) {
      // Either a paragraph is fully contained in exactly one chunk, or absent from it.
      assert.ok(chunk.includes(para) || !chunk.includes(para.slice(0, 10)));
    }
  }
  // Every original paragraph appears in the rejoined output, in order, nothing lost.
  assert.equal(chunks.join('\n\n'), text);
});

test('splitIntoNarrationChunks keeps every chunk at or under the configured max (for paragraphs individually under that max)', () => {
  const paragraphs = Array.from({ length: 20 }, (_, i) => `প্যারা ${i}।`.repeat(10));
  const text = paragraphs.join('\n\n');
  const chunks = splitIntoNarrationChunks(text, 300);
  for (const chunk of chunks) assert.ok(chunk.length <= 300, `chunk length ${chunk.length} exceeds 300`);
});

test('splitIntoNarrationChunks still returns a chunk for a single paragraph longer than max (never drops content)', () => {
  const longPara = 'অ'.repeat(5000);
  const chunks = splitIntoNarrationChunks(longPara, 1800);
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0], longPara);
});

test('NARRATION_CHUNK_MAX_CHARS stays comfortably under the TTS model\'s observed failure threshold (~2,200 chars)', () => {
  assert.ok(NARRATION_CHUNK_MAX_CHARS < 2200);
});
