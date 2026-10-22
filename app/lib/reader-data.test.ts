import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeArabic } from './reader-data.ts';

// Codepoints are used instead of hand-typed Arabic literals throughout
// this file, after an earlier test file in this project (see
// quran-dataset.test.ts) caught a real Arabic-Unicode transcription
// mistake from hand-retyping — \u escapes can't suffer that problem.

test('normalizeArabic strips short-vowel diacritics (fatha, kasra, damma, sukun)', () => {
  const withDiacritics = 'بِسْمِ'; // ب ِس ْم ِ (bismi, diacritized)
  const plain = normalizeArabic(withDiacritics);
  assert.equal(plain, 'بسم'); // ب س م with no marks left
});

test('normalizeArabic strips tatweel', () => {
  assert.equal(normalizeArabic('بـس'), 'بس');
});

test('normalizeArabic folds alef variants (wasla, hamza-above, hamza-below, madda) to plain alef', () => {
  const PLAIN_ALEF = 'ا';
  assert.equal(normalizeArabic('ٱ'), PLAIN_ALEF); // alef wasla
  assert.equal(normalizeArabic('أ'), PLAIN_ALEF); // alef with hamza above
  assert.equal(normalizeArabic('إ'), PLAIN_ALEF); // alef with hamza below
  assert.equal(normalizeArabic('آ'), PLAIN_ALEF); // alef with madda above
});

test('normalizeArabic folds teh marbuta to heh, and alef maksura to yeh', () => {
  assert.equal(normalizeArabic('ة'), 'ه'); // ة -> ه
  assert.equal(normalizeArabic('ى'), 'ي'); // ى -> ي
});

test('normalizeArabic makes a plain-typed query (regular alef, no diacritics) match text that uses alef-wasla and diacritics', () => {
  // "قُلْ هُوَ ٱللَّهُ أَحَدٌ" (Al-Ikhlas 112:1, the part after the Bismillah)
  // using alef-wasla (ٱ) for "Allah" and full diacritics, exactly
  // as the verbatim Tanzil dataset stores it.
  const verbatim =
    'قُلْ هُوَ ' +
    'ٱللَّهُ ' +
    'أَحَدٌ';
  // What a person typing on a plain Arabic keyboard would actually enter:
  // regular alef, no diacritics.
  const typedQuery = 'قل هو الله احد';
  assert.ok(normalizeArabic(verbatim).includes(normalizeArabic(typedQuery)));
});
