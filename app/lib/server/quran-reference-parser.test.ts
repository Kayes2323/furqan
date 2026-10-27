import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  convertBanglaDigits,
  extractSurahAyahRefs,
  matchImportantSurah,
  matchTopic,
  looksAyahSpecific,
} from './quran-reference-parser.ts';
import { loadSurahMetaServer } from './quran-local-data.ts';
import { TOPICS, IMPORTANT_SURAHS } from '../topics-data.ts';

const meta = await loadSurahMetaServer();

test('convertBanglaDigits converts Bangla numerals to Latin', () => {
  assert.equal(convertBanglaDigits('২:২৫৫'), '2:255');
  assert.equal(convertBanglaDigits('no digits here'), 'no digits here');
});

test('extracts a plain "surah:ayah" numeric reference', () => {
  const refs = extractSurahAyahRefs('2:255 এর অর্থ কী?', meta);
  assert.deepEqual(refs[0], { surah: 2, ayah: 255, ayahEnd: undefined });
});

test('extracts a Bangla-digit "surah:ayah" reference', () => {
  const refs = extractSurahAyahRefs('২:২৫৫ এর অর্থ কী?', meta);
  assert.deepEqual(refs[0], { surah: 2, ayah: 255, ayahEnd: undefined });
});

test('extracts a numeric ayah range "surah:ayah-ayahEnd"', () => {
  const refs = extractSurahAyahRefs('২:১৫৫-১৫৭ পড়তে চাই', meta);
  assert.deepEqual(refs[0], { surah: 2, ayah: 155, ayahEnd: 157 });
});

test('extracts "সূরা <number> আয়াত <n>"', () => {
  const refs = extractSurahAyahRefs('সূরা ২ আয়াত ২৫৫ ব্যাখ্যা করো', meta);
  assert.equal(refs[0].surah, 2);
  assert.equal(refs[0].ayah, 255);
});

test('extracts "সূরা <name> আয়াত <n>" using the surah name', () => {
  const refs = extractSurahAyahRefs('সূরা বাকারা আয়াত ২৫৫ এর তাফসির বলো', meta);
  assert.equal(refs[0].surah, 2);
  assert.equal(refs[0].ayah, 255);
});

test('a bare known surah name with no number resolves to a surah-level reference', () => {
  const refs = extractSurahAyahRefs('সূরা ফাতিহা সম্পর্কে বলো', meta);
  assert.equal(refs[0].surah, 1);
  assert.equal(refs[0].ayah, undefined);
});

test('returns no references for unrelated text', () => {
  const refs = extractSurahAyahRefs('আজকে আবহাওয়া কেমন?', meta);
  assert.deepEqual(refs, []);
});

test('does not duplicate the same reference found by multiple patterns', () => {
  const refs = extractSurahAyahRefs('সূরা ২ আয়াত ২৫৫, অর্থাৎ ২:২৫৫', meta);
  const unique = new Set(refs.map((r) => `${r.surah}:${r.ayah}`));
  assert.equal(unique.size, refs.length);
});

test('matchImportantSurah resolves "আয়াতুল কুরসি" to Ayat al-Kursi', () => {
  const match = matchImportantSurah('আয়াতুল কুরসির অর্থ কী?', IMPORTANT_SURAHS);
  assert.equal(match?.id, 'ayat-al-kursi');
  assert.equal(match?.surahNumber, 2);
  assert.deepEqual(match?.highlightAyah, { ayahStart: 255, ayahEnd: 255 });
});

test('matchImportantSurah returns null when nothing matches', () => {
  assert.equal(matchImportantSurah('আজকে কী রান্না করব?', IMPORTANT_SURAHS), null);
});

test('matchTopic resolves a topic by Bangla name', () => {
  const match = matchTopic('সবর নিয়ে কুরআনে কী আছে?', TOPICS);
  assert.equal(match?.id, 'sabr');
});

test('matchTopic returns null when nothing matches', () => {
  assert.equal(matchTopic('আজকে কী রান্না করব?', TOPICS), null);
});

test('looksAyahSpecific gates on Quran/tafsir-related keywords', () => {
  assert.equal(looksAyahSpecific('এই আয়াতের তাফসির কী?'), true);
  assert.equal(looksAyahSpecific('what does this verse mean?'), true);
  assert.equal(looksAyahSpecific('আজকে আবহাওয়া কেমন?'), false);
});
