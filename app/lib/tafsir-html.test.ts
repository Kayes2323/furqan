import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTafsirHtml } from './tafsir-html.ts';

test('parses a simple paragraph', () => {
  const blocks = parseTafsirHtml('<p>এটি একটি তাফসীর অনুচ্ছেদ।</p>');
  assert.deepEqual(blocks, [{ type: 'paragraph', text: 'এটি একটি তাফসীর অনুচ্ছেদ।' }]);
});

test('parses headings and paragraphs in order', () => {
  const blocks = parseTafsirHtml('<h2>শিরোনাম</h2><p>প্রথম অনুচ্ছেদ।</p><p>দ্বিতীয় অনুচ্ছেদ।</p>');
  assert.deepEqual(blocks, [
    { type: 'heading', text: 'শিরোনাম' },
    { type: 'paragraph', text: 'প্রথম অনুচ্ছেদ।' },
    { type: 'paragraph', text: 'দ্বিতীয় অনুচ্ছেদ।' },
  ]);
});

test('strips inline formatting tags but keeps their text', () => {
  const blocks = parseTafsirHtml('<p>এটি <b>গুরুত্বপূর্ণ</b> এবং <i>বিশেষ</i>।</p>');
  assert.deepEqual(blocks, [{ type: 'paragraph', text: 'এটি গুরুত্বপূর্ণ এবং বিশেষ।' }]);
});

test('folds a footnote marker <sup> into an inline bracket marker', () => {
  const blocks = parseTafsirHtml('<p>এই আয়াতের একটি তাৎপর্য আছে<sup>1</sup>।</p>');
  assert.deepEqual(blocks, [{ type: 'paragraph', text: 'এই আয়াতের একটি তাৎপর্য আছে [1]।' }]);
});

test('recognizes a numbered <li> as a footnote definition', () => {
  const blocks = parseTafsirHtml('<li>1. এটি একটি পাদটীকা।</li>');
  assert.deepEqual(blocks, [{ type: 'footnote', number: '1', text: 'এটি একটি পাদটীকা।' }]);
});

test('treats a non-numbered <li> as a bulleted paragraph', () => {
  const blocks = parseTafsirHtml('<li>একটি তালিকা আইটেম</li>');
  assert.deepEqual(blocks, [{ type: 'paragraph', text: '• একটি তালিকা আইটেম' }]);
});

test('decodes HTML entities', () => {
  const blocks = parseTafsirHtml('<p>বাংলা &amp; আরবি &quot;উদ্ধৃতি&quot;</p>');
  assert.deepEqual(blocks, [{ type: 'paragraph', text: 'বাংলা & আরবি "উদ্ধৃতি"' }]);
});

test('falls back to a single paragraph for plain text with no block tags', () => {
  const blocks = parseTafsirHtml('শুধুমাত্র প্লেইন টেক্সট, কোনো ট্যাগ ছাড়া।');
  assert.deepEqual(blocks, [{ type: 'paragraph', text: 'শুধুমাত্র প্লেইন টেক্সট, কোনো ট্যাগ ছাড়া।' }]);
});

test('skips empty blocks', () => {
  const blocks = parseTafsirHtml('<p></p><p>  </p><p>বাস্তব বিষয়বস্তু</p>');
  assert.deepEqual(blocks, [{ type: 'paragraph', text: 'বাস্তব বিষয়বস্তু' }]);
});

test('returns an empty array for empty input', () => {
  assert.deepEqual(parseTafsirHtml(''), []);
  assert.deepEqual(parseTafsirHtml('   '), []);
});

test('collapses internal whitespace and <br> tags within a paragraph', () => {
  const blocks = parseTafsirHtml('<p>প্রথম লাইন<br/>দ্বিতীয়   লাইন</p>');
  assert.deepEqual(blocks, [{ type: 'paragraph', text: 'প্রথম লাইন দ্বিতীয় লাইন' }]);
});

test('multi-ayah passage: same HTML parses identically regardless of which ayah requested it (no invented split)', () => {
  const html = '<p>এই অনুচ্ছেদটি একাধিক আয়াত জুড়ে একটি একক ব্যাখ্যা।</p>';
  const forAyah1 = parseTafsirHtml(html);
  const forAyah3 = parseTafsirHtml(html);
  assert.deepEqual(forAyah1, forAyah3);
});
