import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BISMILLAH, BISMILLAH_SHADDA_VARIANT, splitOpeningBismillah } from './bismillah.ts';

// BISMILLAH/BISMILLAH_SHADDA_VARIANT are the two verified Bismillah forms
// found as the ayah-1 prefix across the real dataset (see
// quran-dataset.test.ts's exhaustive 114-surah audit for where each is
// used). These unit tests only exercise splitOpeningBismillah's own
// logic against those two verified constants, not the full dataset.

test('splitOpeningBismillah only ever looks at ayah number 1', () => {
  assert.equal(splitOpeningBismillah(2, BISMILLAH + ' something'), null);
  assert.equal(splitOpeningBismillah(30, BISMILLAH + ' something'), null);
  assert.equal(splitOpeningBismillah(255, BISMILLAH), null);
});

test('splitOpeningBismillah returns null for Al-Fatiha-shaped ayah 1 (text equals the Bismillah exactly)', () => {
  // Avoids both duplicate display and an empty remainder card.
  assert.equal(splitOpeningBismillah(1, BISMILLAH), null);
});

test('splitOpeningBismillah returns null when ayah 1 has no Bismillah prefix at all (At-Tawbah-shaped)', () => {
  const tawbahLike = 'بَرَآءَةٌ مِّنَ ٱللَّهِ وَرَسُولِهِۦٓ';
  assert.equal(splitOpeningBismillah(1, tawbahLike), null);
});

test('splitOpeningBismillah splits an ordinary surah\'s ayah 1 into the canonical Bismillah header and the remaining body', () => {
  const text = BISMILLAH + ' يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوٓا۟';
  const split = splitOpeningBismillah(1, text);
  assert.ok(split);
  assert.equal(split!.bismillah, BISMILLAH);
  assert.equal(split!.body, 'يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوٓا۟');
  // The split never drops or alters source characters: the header is a
  // true prefix and the body a true (whitespace-trimmed) suffix of the
  // original text.
  assert.ok(text.startsWith(split!.bismillah));
  assert.ok(text.endsWith(split!.body));
});

test('splitOpeningBismillah splits the shadda-variant Bismillah (Surahs 95 and 97) using the longer, more specific prefix', () => {
  const text = BISMILLAH_SHADDA_VARIANT + ' وَٱلتِّينِ وَٱلزَّيْتُونِ';
  const split = splitOpeningBismillah(1, text);
  assert.ok(split);
  assert.equal(split!.bismillah, BISMILLAH_SHADDA_VARIANT);
  assert.equal(split!.body, 'وَٱلتِّينِ وَٱلزَّيْتُونِ');
  assert.notEqual(BISMILLAH_SHADDA_VARIANT, BISMILLAH);
});

test('splitOpeningBismillah is pure: repeated calls never mutate its inputs or return shared mutable state', () => {
  const text = BISMILLAH + ' body text here';
  const a = splitOpeningBismillah(1, text);
  const b = splitOpeningBismillah(1, text);
  assert.deepEqual(a, b);
  assert.equal(text, BISMILLAH + ' body text here'); // input untouched
});

test('splitOpeningBismillah never returns an empty body (would otherwise render a blank ayah card)', () => {
  // A pathological case: text that IS the shadda-variant Bismillah
  // exactly, with nothing after it. Should fall through to null rather
  // than return an empty-string body.
  assert.equal(splitOpeningBismillah(1, BISMILLAH_SHADDA_VARIANT), null);
});
