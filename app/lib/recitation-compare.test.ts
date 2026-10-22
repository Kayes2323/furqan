import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareRecitation, splitIntoWords, CONFIDENCE_THRESHOLD } from './recitation-compare.ts';
import type { RecognizedWord } from './recitation-types';

// Codepoints/short literals used below are copied from the already
// verified Al-Kawthar text (public/quran/surah/108.json), not
// hand-reconstructed, following the project's established
// anti-transcription-error convention.
const AL_KAWTHAR_1_BODY = 'إِنَّآ أَعْطَيْنَـٰكَ ٱلْكَوْثَرَ'; // ayah 1, after the Bismillah
const AL_KAWTHAR_2 = 'فَصَلِّ لِرَبِّكَ وَٱنْحَرْ';
const AL_KAWTHAR_3 = 'إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ';

function rec(text: string, confidence: number | null = 0.9): RecognizedWord {
  return { text, confidence, isFinal: true };
}

test('splitIntoWords splits on whitespace and drops empty tokens', () => {
  assert.deepEqual(splitIntoWords('a  b   c'), ['a', 'b', 'c']);
  assert.deepEqual(splitIntoWords('  leading and trailing  '), ['leading', 'and', 'trailing']);
});

test('compareRecitation: exact correct recitation marks every word a match', () => {
  const canonical = splitIntoWords(AL_KAWTHAR_2); // فَصَلِّ لِرَبِّكَ وَٱنْحَرْ
  const recognized = canonical.map((w) => rec(w));
  const result = compareRecitation(canonical, recognized);
  assert.equal(result.length, 3);
  assert.ok(result.every((w) => w.status === 'match'));
  assert.deepEqual(
    result.map((w) => w.canonicalText),
    canonical,
  );
});

test('compareRecitation: one omitted word is flagged without cascading into the rest', () => {
  const canonical = splitIntoWords(AL_KAWTHAR_3); // إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ
  // Recite everything except the second word ("شَانِئَكَ")
  const recognized = [canonical[0], canonical[2], canonical[3]].map((w) => rec(w));
  const result = compareRecitation(canonical, recognized);
  assert.equal(result.length, 4);
  assert.equal(result[0].status, 'match');
  assert.equal(result[1].status, 'omitted');
  assert.equal(result[1].canonicalText, canonical[1]);
  assert.equal(result[1].recognizedText, null);
  assert.equal(result[2].status, 'match');
  assert.equal(result[3].status, 'match');
});

test('compareRecitation: one substituted word is flagged as substituted, not omitted+inserted', () => {
  const canonical = splitIntoWords(AL_KAWTHAR_2);
  const recognized = [rec(canonical[0]), rec('غلط'), ...canonical.slice(2).map((w) => rec(w))];
  const result = compareRecitation(canonical, recognized);
  assert.equal(result.length, 3);
  assert.equal(result[0].status, 'match');
  assert.equal(result[1].status, 'substituted');
  assert.equal(result[1].canonicalText, canonical[1]);
  assert.equal(result[1].recognizedText, 'غلط');
  assert.equal(result[2].status, 'match');
});

test('compareRecitation: one extra (inserted) word is flagged without displacing the real words', () => {
  const canonical = splitIntoWords(AL_KAWTHAR_2);
  const recognized = [rec(canonical[0]), rec('অতিরিক্ত'), ...canonical.slice(1).map((w) => rec(w))];
  const result = compareRecitation(canonical, recognized);
  assert.equal(result.length, 4);
  assert.equal(result[0].status, 'match');
  assert.equal(result[1].status, 'inserted');
  assert.equal(result[1].canonicalIndex, null);
  assert.equal(result[1].recognizedText, 'অতিরিক্ত');
  assert.equal(result[2].status, 'match');
  assert.equal(result[3].status, 'match');
});

test('compareRecitation: nothing recognized (silence/no speech) marks every canonical word omitted', () => {
  const canonical = splitIntoWords(AL_KAWTHAR_1_BODY);
  const result = compareRecitation(canonical, []);
  assert.equal(result.length, 3);
  assert.ok(result.every((w) => w.status === 'omitted'));
});

test('compareRecitation: recognized words with no canonical text are all insertions', () => {
  const result = compareRecitation([], [rec('a'), rec('b')]);
  assert.equal(result.length, 2);
  assert.ok(result.every((w) => w.status === 'inserted'));
});

test('compareRecitation: low-confidence word is reported as uncertain, never a confirmed match or mistake', () => {
  const canonical = splitIntoWords(AL_KAWTHAR_2);
  // Correct word, but low confidence from the recognizer.
  const recognized = [rec(canonical[0], 0.2), rec(canonical[1]), rec(canonical[2])];
  const result = compareRecitation(canonical, recognized);
  assert.equal(result[0].status, 'uncertain');
  assert.notEqual(result[0].status, 'match');
});

test('compareRecitation: low-confidence wrong word is reported as uncertain, not a definite substitution', () => {
  const canonical = splitIntoWords(AL_KAWTHAR_2);
  const recognized = [rec(canonical[0]), rec('ভুল', 0.1), rec(canonical[2])];
  const result = compareRecitation(canonical, recognized);
  assert.equal(result[1].status, 'uncertain');
  assert.notEqual(result[1].status, 'substituted');
});

test('compareRecitation: a word right at the confidence threshold is not treated as uncertain (boundary is exclusive below)', () => {
  const canonical = ['كلمة'];
  const result = compareRecitation(canonical, [rec('كلمة', CONFIDENCE_THRESHOLD)]);
  assert.equal(result[0].status, 'match');
});

test('compareRecitation: a null confidence (engine does not report one) is treated as confident, not uncertain', () => {
  const canonical = ['كلمة'];
  const result = compareRecitation(canonical, [rec('كلمة', null)]);
  assert.equal(result[0].status, 'match');
});

test('compareRecitation: a correctly repeated word in the canonical text aligns one-to-one, not as an omission+insertion', () => {
  const canonical = ['ربنا', 'ربنا', 'اغفر'];
  const recognized = canonical.map((w) => rec(w));
  const result = compareRecitation(canonical, recognized);
  assert.equal(result.length, 3);
  assert.ok(result.every((w) => w.status === 'match'));
});

test('compareRecitation: diacritic/alef-variant differences between canonical and recognized text still count as a match (normalized comparison)', () => {
  // Canonical uses alef-wasla + full diacritics (as Tanzil stores it);
  // "recognized" simulates a plain-typed/ASR-normalized form, same as
  // reader-data.test.ts's normalizeArabic equivalence tests.
  const canonical = ['ٱلْكَوْثَرَ'];
  const result = compareRecitation(canonical, [rec('الكوثر')]);
  assert.equal(result[0].status, 'match');
});

test('compareRecitation never mutates its input arrays', () => {
  const canonical = splitIntoWords(AL_KAWTHAR_2);
  const canonicalCopy = [...canonical];
  const recognized = canonical.map((w) => rec(w));
  const recognizedCopy = recognized.map((w) => ({ ...w }));
  compareRecitation(canonical, recognized);
  assert.deepEqual(canonical, canonicalCopy);
  assert.deepEqual(recognized, recognizedCopy);
});
