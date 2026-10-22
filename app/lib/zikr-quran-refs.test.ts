// Phase 8.2 audit: validates every Quran reference newly added to the
// Zikr/আমল content against the real, verified Tanzil dataset — not
// just that it reads plausibly. A reference this file gets wrong
// fails here, not just looks wrong in the UI.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZIKR_COLLECTION } from './zikr-data.ts';
import { isRecitation } from './zikr-types.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QURAN_DIR = join(__dirname, '..', '..', 'public', 'quran');

interface SurahMeta {
  number: number;
  ayahCount: number;
  banglaName: string;
}
interface SurahDoc {
  number: number;
  ayahs: { number: number; text: string }[];
}

function readMeta(): SurahMeta[] {
  return JSON.parse(readFileSync(join(QURAN_DIR, 'meta.json'), 'utf-8'));
}
function readSurah(n: number): SurahDoc {
  const padded = String(n).padStart(3, '0');
  return JSON.parse(readFileSync(join(QURAN_DIR, 'surah', `${padded}.json`), 'utf-8'));
}

const meta = readMeta();
const ayahCountBySurah = new Map(meta.map((s) => [s.number, s.ayahCount]));

// Hadith-based items this audit explicitly confirmed are NOT Quranic
// ayahs — asserting they carry no quranRefs guards against a future
// edit accidentally attaching a fabricated reference to one of them.
const EXPECTED_NO_QURAN_REF = new Set([
  'me-3', 'me-4', 'me-5', 'me-6', 'me-7',
  'op-12b',
  'bs-4', 'bs-5a', 'bs-5b', 'bs-5c', 'bs-6',
  'op-4', 'op-5', 'op-6', 'op-7',
]);

// Recitation items confirmed (Phase 8.2 research) to be genuine
// Quranic text, with their exact expected reference(s).
const EXPECTED_QURAN_REFS: Record<string, { surah: number; ayahStart: number; ayahEnd: number }[]> = {
  'me-1a': [{ surah: 2, ayahStart: 255, ayahEnd: 255 }], // Ayatul Kursi
  'bs-2a': [{ surah: 2, ayahStart: 255, ayahEnd: 255 }], // Ayatul Kursi (night duplicate)
  'bs-2b': [{ surah: 2, ayahStart: 285, ayahEnd: 286 }], // last two ayahs of Al-Baqarah
  'me-1b': [
    { surah: 112, ayahStart: 1, ayahEnd: 4 },
    { surah: 113, ayahStart: 1, ayahEnd: 5 },
    { surah: 114, ayahStart: 1, ayahEnd: 6 },
  ], // তিন কুল
  'bs-3': [
    { surah: 112, ayahStart: 1, ayahEnd: 4 },
    { surah: 113, ayahStart: 1, ayahEnd: 5 },
    { surah: 114, ayahStart: 1, ayahEnd: 6 },
  ], // তিন কুল (night duplicate)
  'me-2': [{ surah: 9, ayahStart: 129, ayahEnd: 129 }], // Hasbiyallah
  'op-12a': [{ surah: 21, ayahStart: 87, ayahEnd: 87 }], // Dua Yunus
};

// Items confirmed to require a quranCaveatBn: the recited text is
// confirmed Quranic, but the *practice* around it rests on a hadith
// whose authenticity is disputed — the two facts must stay separated.
const EXPECTED_HAS_CAVEAT = new Set(['me-2', 'op-12a']);

function allItems() {
  return ZIKR_COLLECTION.sections.flatMap((s) => s.items);
}

test('zikr audit: every quranRef in the content is within the real dataset\'s bounds', () => {
  let checked = 0;
  for (const item of allItems()) {
    if (!isRecitation(item) || !item.quranRefs) continue;
    for (const ref of item.quranRefs) {
      const count = ayahCountBySurah.get(ref.surah);
      assert.ok(count !== undefined, `item "${item.id}": surah ${ref.surah} does not exist`);
      assert.ok(ref.ayahStart >= 1, `item "${item.id}": ayahStart must be >= 1`);
      assert.ok(ref.ayahEnd >= ref.ayahStart, `item "${item.id}": ayahEnd must be >= ayahStart`);
      assert.ok(ref.ayahEnd <= count!, `item "${item.id}": ayah ${ref.ayahEnd} exceeds surah ${ref.surah}'s real ayah count (${count})`);
      checked++;
    }
  }
  assert.ok(checked > 0, 'expected at least one quranRef to validate');
});

test('zikr audit: every quranSurahLinks entry is a valid surah number (1-114)', () => {
  let checked = 0;
  for (const item of allItems()) {
    if (isRecitation(item) || !item.quranSurahLinks) continue;
    for (const surahNum of item.quranSurahLinks) {
      assert.ok(ayahCountBySurah.has(surahNum), `item "${item.id}": surah ${surahNum} does not exist`);
      checked++;
    }
  }
  assert.ok(checked > 0, 'expected at least one quranSurahLinks entry to validate');
});

test('zikr audit: every verified item carries exactly the expected Quran reference(s)', () => {
  for (const [id, expected] of Object.entries(EXPECTED_QURAN_REFS)) {
    const item = allItems().find((i) => i.id === id);
    assert.ok(item, `expected item "${id}" to exist`);
    assert.ok(isRecitation(item!), `item "${id}" should be a recitation`);
    assert.deepEqual(item!.quranRefs, expected, `item "${id}" has an unexpected quranRefs value`);
  }
});

test('zikr audit: hadith-based items carry no quranRefs (no fabricated Quran citation)', () => {
  for (const id of EXPECTED_NO_QURAN_REF) {
    const item = allItems().find((i) => i.id === id);
    assert.ok(item, `expected item "${id}" to exist`);
    if (isRecitation(item!)) {
      assert.equal(item!.quranRefs, undefined, `item "${id}" should not carry a quranRefs — it is hadith-based, not a Quranic ayah`);
    }
  }
});

test('zikr audit: items with a disputed-practice caveat carry a non-empty quranCaveatBn', () => {
  for (const id of EXPECTED_HAS_CAVEAT) {
    const item = allItems().find((i) => i.id === id);
    assert.ok(item && isRecitation(item), `expected recitation item "${id}" to exist`);
    assert.ok(item!.quranCaveatBn && item!.quranCaveatBn.length > 0, `item "${id}" should carry a quranCaveatBn`);
  }
});

test('zikr audit: op-10\'s named surahs resolve to the expected list', () => {
  const item = allItems().find((i) => i.id === 'op-10');
  assert.ok(item && !isRecitation(item));
  assert.deepEqual(item!.quranSurahLinks, [2, 40, 36, 37, 44, 72]);
});

test('zikr audit: the canonical text for every quranRef is non-empty and spans exactly the declared ayah range', () => {
  for (const item of allItems()) {
    if (!isRecitation(item) || !item.quranRefs) continue;
    for (const ref of item.quranRefs) {
      const doc = readSurah(ref.surah);
      const ayahsInRange = doc.ayahs.filter((a) => a.number >= ref.ayahStart && a.number <= ref.ayahEnd);
      assert.equal(
        ayahsInRange.length,
        ref.ayahEnd - ref.ayahStart + 1,
        `item "${item.id}": expected ${ref.ayahEnd - ref.ayahStart + 1} ayahs in surah ${ref.surah} range ${ref.ayahStart}-${ref.ayahEnd}, found ${ayahsInRange.length}`,
      );
      for (const a of ayahsInRange) {
        assert.ok(a.text.trim().length > 0, `item "${item.id}": surah ${ref.surah} ayah ${a.number} has empty canonical text`);
      }
    }
  }
});

// The canonical dataset's Arabic uses combining diacritics whose internal
// ordering can differ from a hand-typed string that looks identical —
// NFC normalization makes those canonically-equivalent forms compare equal,
// without weakening the check (it's still an exact substring match).
function includesArabic(haystack: string, needle: string): boolean {
  return haystack.normalize('NFC').includes(needle.normalize('NFC'));
}

test('zikr audit: Ayatul Kursi (2:255) reference text matches the well-known verse content', () => {
  const doc = readSurah(2);
  const kursi = doc.ayahs.find((a) => a.number === 255)!;
  // Spot-checks a distinctive substring rather than the whole string,
  // to confirm this is genuinely Ayat al-Kursi and not some other
  // ayah accidentally numbered 255 by a bug.
  assert.ok(includesArabic(kursi.text, 'ٱلْحَىُّ ٱلْقَيُّومُ'), 'expected "Al-Hayyul-Qayyum" phrase in 2:255');
});

test('zikr audit: Dua Yunus (21:87) reference text matches the well-known dua content', () => {
  const doc = readSurah(21);
  const ayah = doc.ayahs.find((a) => a.number === 87)!;
  assert.ok(includesArabic(ayah.text, 'لَّآ إِلَـٰهَ إِلَّآ أَنتَ سُبْحَـٰنَكَ'), 'expected "la ilaha illa anta subhanaka" phrase in 21:87');
});

test('zikr audit: Hasbiyallah (9:129) reference text matches the well-known dua content', () => {
  const doc = readSurah(9);
  const ayah = doc.ayahs.find((a) => a.number === 129)!;
  assert.ok(includesArabic(ayah.text, 'حَسْبِىَ ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ'), 'expected "hasbiyallahu la ilaha illa huwa" phrase in 9:129');
});
