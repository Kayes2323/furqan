// Validates Phase 8's curated "Quran by Topic" / "Important Surahs &
// Ayahs" content against the real, verified Tanzil dataset — not just
// that it reads plausibly. Every surah/ayah reference is checked
// against the actual per-surah ayah counts so an invented or
// off-by-one reference fails this test, not just looks wrong in the UI.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOPICS, IMPORTANT_SURAHS } from './topics-data.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QURAN_DIR = join(__dirname, '..', '..', 'public', 'quran');

interface SurahMeta {
  number: number;
  ayahCount: number;
}

function readMeta(): SurahMeta[] {
  return JSON.parse(readFileSync(join(QURAN_DIR, 'meta.json'), 'utf-8'));
}

const meta = readMeta();
const ayahCountBySurah = new Map(meta.map((s) => [s.number, s.ayahCount]));

function assertValidRef(surah: number, ayahStart: number, ayahEnd: number, context: string) {
  const count = ayahCountBySurah.get(surah);
  assert.ok(count !== undefined, `${context}: surah ${surah} does not exist`);
  assert.ok(ayahStart >= 1, `${context}: ayahStart must be >= 1`);
  assert.ok(ayahEnd >= ayahStart, `${context}: ayahEnd must be >= ayahStart`);
  assert.ok(ayahEnd <= count!, `${context}: ayah ${ayahEnd} exceeds surah ${surah}'s real ayah count (${count})`);
}

test('topics-data: every topic has a non-empty id, name, and at least one ayah', () => {
  assert.ok(TOPICS.length > 0);
  const ids = new Set<string>();
  for (const topic of TOPICS) {
    assert.ok(topic.id.length > 0);
    assert.ok(!ids.has(topic.id), `duplicate topic id: ${topic.id}`);
    ids.add(topic.id);
    assert.ok(topic.nameBn.length > 0, `topic ${topic.id} missing nameBn`);
    assert.ok(topic.summaryBn.length > 0, `topic ${topic.id} missing summaryBn`);
    assert.ok(topic.ayahs.length > 0, `topic ${topic.id} has no ayahs`);
  }
});

test('topics-data: every topic ayah reference is valid against the real dataset', () => {
  for (const topic of TOPICS) {
    for (const ref of topic.ayahs) {
      assertValidRef(ref.surah, ref.ayahStart, ref.ayahEnd, `topic "${topic.id}"`);
      assert.ok(ref.glossBn.length > 0, `topic "${topic.id}" ${ref.surah}:${ref.ayahStart} missing glossBn`);
      // The gloss must never claim to be the Arabic text or a formal
      // named translation — only Bangla explanatory prose.
      assert.ok(!/^[؀-ۿ\s]+$/.test(ref.glossBn), `topic "${topic.id}" ${ref.surah}:${ref.ayahStart} glossBn looks like raw Arabic, not an explanatory gloss`);
    }
  }
});

test('topics-data: every important surah/ayah entry is valid and has at least one evidence item', () => {
  assert.ok(IMPORTANT_SURAHS.length > 0);
  const ids = new Set<string>();
  for (const item of IMPORTANT_SURAHS) {
    assert.ok(!ids.has(item.id), `duplicate important-surah id: ${item.id}`);
    ids.add(item.id);
    const count = ayahCountBySurah.get(item.surahNumber);
    assert.ok(count !== undefined, `important surah "${item.id}": surah ${item.surahNumber} does not exist`);
    if (item.highlightAyah) {
      assertValidRef(item.surahNumber, item.highlightAyah.ayahStart, item.highlightAyah.ayahEnd, `important surah "${item.id}" highlightAyah`);
    }
    assert.ok(item.whySelectedBn.length > 0, `important surah "${item.id}" missing whySelectedBn`);
    assert.ok(item.evidence.length > 0, `important surah "${item.id}" has no evidence — per Phase 8 rules, an item must not be presented as having a virtue without cited evidence`);
  }
});

test('topics-data: every evidence item names a source and a grading note, and is not presented as a direct quotation', () => {
  const VALID_KINDS = ['quran', 'hadith-authentic', 'hadith-hasan', 'hadith-disputed', 'scholarly', 'popular-unverified'];
  for (const item of IMPORTANT_SURAHS) {
    for (const ev of item.evidence) {
      assert.ok(VALID_KINDS.includes(ev.kind), `important surah "${item.id}": invalid evidence kind "${ev.kind}"`);
      assert.ok(ev.summaryBn.length > 0, `important surah "${item.id}": evidence missing summaryBn`);
      assert.ok(ev.sourceLabel.length > 0, `important surah "${item.id}": evidence missing sourceLabel`);
      assert.ok(ev.gradingNoteBn.length > 0, `important surah "${item.id}": evidence missing gradingNoteBn`);
      // A hadith summary must never be wrapped in quotation marks as if
      // it were a verbatim narration — this project only ever has a
      // paraphrased summary, never a verified exact quotation.
      assert.ok(!ev.summaryBn.startsWith('"') && !ev.summaryBn.startsWith('"'), `important surah "${item.id}": evidence summary must not be presented as a direct quotation`);
    }
  }
});

test('topics-data: Al-Mulk (67) and Ayat al-Kursi (2:255) are present, matching the Phase 8 brief\'s priority example', () => {
  assert.ok(IMPORTANT_SURAHS.some((s) => s.surahNumber === 67), 'Surah Al-Mulk (67) should be included as the priority example named in the brief');
  const kursi = IMPORTANT_SURAHS.find((s) => s.id === 'ayat-al-kursi');
  assert.ok(kursi);
  assert.equal(kursi!.surahNumber, 2);
  assert.deepEqual(kursi!.highlightAyah, { ayahStart: 255, ayahEnd: 255 });
});
