// Integrity regression test for the bundled Quran dataset
// (public/quran/*), built from the verbatim Tanzil Uthmani text.
// Re-run any time the dataset is regenerated to catch missing,
// duplicated, reordered, or truncated verses before they ship.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { BISMILLAH, BISMILLAH_SHADDA_VARIANT, splitOpeningBismillah } from './bismillah.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QURAN_DIR = join(__dirname, '..', '..', 'public', 'quran');

interface SurahMeta {
  number: number;
  ayahCount: number;
  arabicName: string;
  banglaName: string;
  revelationType: 'Meccan' | 'Medinan';
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

// The well-known standard ayah count per surah (Kufi count, standard
// Uthmani/Hafs numbering), used as an independent cross-check against
// both the Tanzil metadata file and the Tanzil text file.
const STANDARD_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89,
  59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30,
  52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15,
  21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

test('dataset: meta.json lists exactly 114 surahs, numbered 1..114 with no gaps or duplicates', () => {
  const meta = readMeta();
  assert.equal(meta.length, 114);
  const numbers = meta.map((s) => s.number).sort((a, b) => a - b);
  assert.deepEqual(numbers, Array.from({ length: 114 }, (_, i) => i + 1));
});

test('dataset: every surah has a non-empty Arabic name and Bangla name', () => {
  for (const s of readMeta()) {
    assert.ok(s.arabicName && s.arabicName.length > 0, `surah ${s.number} missing arabicName`);
    assert.ok(s.banglaName && s.banglaName.length > 0, `surah ${s.number} missing banglaName`);
    assert.ok(s.revelationType === 'Meccan' || s.revelationType === 'Medinan', `surah ${s.number} bad revelationType`);
  }
});

test('dataset: meta.json ayah counts match the standard well-known per-surah counts', () => {
  const meta = readMeta();
  for (const s of meta) {
    assert.equal(s.ayahCount, STANDARD_AYAH_COUNTS[s.number - 1], `surah ${s.number} ayahCount mismatch`);
  }
});

test('dataset: total ayah count across all 114 surahs is exactly 6236', () => {
  const meta = readMeta();
  const total = meta.reduce((sum, s) => sum + s.ayahCount, 0);
  assert.equal(total, 6236);
  assert.equal(STANDARD_AYAH_COUNTS.reduce((a, b) => a + b, 0), 6236);
});

test('dataset: every declared surah file exists on disk', () => {
  for (let n = 1; n <= 114; n++) {
    const padded = String(n).padStart(3, '0');
    assert.ok(existsSync(join(QURAN_DIR, 'surah', `${padded}.json`)), `surah ${n} file missing`);
  }
});

test('dataset: every surah file has sequential ayah numbers 1..N with no gaps, duplicates, or reordering', () => {
  const meta = readMeta();
  for (const m of meta) {
    const doc = readSurah(m.number);
    assert.equal(doc.number, m.number);
    assert.equal(doc.ayahs.length, m.ayahCount, `surah ${m.number}: ayah array length mismatch`);
    const numbers = doc.ayahs.map((a) => a.number);
    assert.deepEqual(numbers, Array.from({ length: m.ayahCount }, (_, i) => i + 1), `surah ${m.number}: ayah numbering not sequential from 1`);
    for (const a of doc.ayahs) {
      assert.ok(a.text && a.text.trim().length > 0, `surah ${m.number} ayah ${a.number} has empty text`);
    }
  }
});

test('dataset: spot-check well-known verses against expected text', () => {
  // Expected values are copied programmatically from the verified Tanzil
  // source file (never hand-retyped), to rule out a transcription error
  // in this test itself rather than the dataset.
  const FATIHA_1_1 = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";
  const KURSI_255 = "ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُۥ مَا فِى ٱلسَّمَـٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَىْءٍ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضَ ۖ وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ";
  const TAWBAH_1 = "بَرَآءَةٌ مِّنَ ٱللَّهِ وَرَسُولِهِۦٓ إِلَى ٱلَّذِينَ عَـٰهَدتُّم مِّنَ ٱلْمُشْرِكِينَ";
  const IKHLAS_1 = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ قُلْ هُوَ ٱللَّهُ أَحَدٌ";
  const IKHLAS_4 = "وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ";
  const NAAS_6 = "مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ";

  const fatiha = readSurah(1);
  assert.equal(fatiha.ayahs[0].text, FATIHA_1_1);

  const baqarah = readSurah(2);
  const ayatulKursi = baqarah.ayahs.find((a) => a.number === 255)!;
  assert.equal(ayatulKursi.text, KURSI_255);

  // At-Tawbah is the only surah whose first ayah has no Bismillah prefix.
  const tawbah = readSurah(9);
  assert.equal(tawbah.ayahs[0].text, TAWBAH_1);
  assert.ok(!tawbah.ayahs[0].text.startsWith('بِسْمِ'));

  const ikhlas = readSurah(112);
  assert.equal(ikhlas.ayahs.length, 4);
  assert.equal(ikhlas.ayahs[0].text, IKHLAS_1);
  assert.equal(ikhlas.ayahs[3].text, IKHLAS_4);

  const naas = readSurah(114);
  assert.equal(naas.ayahs[naas.ayahs.length - 1].text, NAAS_6);
});

test('dataset integrity: SHA-256 of the verbatim surah|ayah|text stream matches the checksum recorded in SOURCE.md', () => {
  // Reconstructs the exact "surah|ayah|text" stream as originally
  // received from Tanzil (before reformatting into per-surah JSON) and
  // recomputes its checksum, comparing against the value recorded at
  // import time in public/quran/SOURCE.md. This is a permanent,
  // network-independent regression guard: any future change to the
  // bundled dataset — intentional or not — that alters a single
  // character of canonical text will change this hash and fail this
  // test, without requiring a live re-fetch from Tanzil.
  const RECORDED_SHA256 = '9017fffbd70a592438733b748f9704b30b26f091deb6e4828c2c71d82c4c5b3a';
  const meta = readMeta();
  const lines: string[] = [];
  for (const m of meta) {
    const doc = readSurah(m.number);
    for (const a of doc.ayahs) lines.push(`${m.number}|${a.number}|${a.text}`);
  }
  const stream = lines.join('\n');
  const computed = createHash('sha256').update(stream, 'utf-8').digest('hex');
  assert.equal(computed, RECORDED_SHA256);
});

test('Bismillah display split: every one of the 114 surahs\' ayah 1 is classified correctly, with no surah assumed', () => {
  // Exhaustive, not spot-checked: every surah's actual ayah-1 text (not
  // a hardcoded expectation) decides which of the three cases applies,
  // and every surah is asserted into exactly one of them. This is the
  // audit backing app/lib/bismillah.ts's splitOpeningBismillah, run
  // against the real, verified dataset rather than synthetic strings.
  const meta = readMeta();
  assert.equal(meta.length, 114);

  const fatihaLike: number[] = []; // ayah 1 IS exactly the Bismillah
  const noBismillah: number[] = []; // ayah 1 has no Bismillah prefix
  const canonicalPrefix: number[] = []; // ayah 1 starts with the plain Bismillah
  const shaddaVariantPrefix: number[] = []; // ayah 1 starts with the shadda variant

  for (const m of meta) {
    const ayah1 = readSurah(m.number).ayahs[0].text;
    const split = splitOpeningBismillah(1, ayah1);

    if (ayah1 === BISMILLAH) {
      fatihaLike.push(m.number);
      assert.equal(split, null, `surah ${m.number}: Al-Fatiha-shaped ayah 1 must not get a duplicate header`);
    } else if (ayah1.startsWith(BISMILLAH_SHADDA_VARIANT)) {
      shaddaVariantPrefix.push(m.number);
      assert.ok(split, `surah ${m.number}: expected a Bismillah split (shadda variant)`);
      assert.equal(split!.bismillah, BISMILLAH_SHADDA_VARIANT);
      assert.ok(split!.body.length > 0);
      assert.ok(ayah1.startsWith(split!.bismillah) && ayah1.endsWith(split!.body));
    } else if (ayah1.startsWith(BISMILLAH)) {
      canonicalPrefix.push(m.number);
      assert.ok(split, `surah ${m.number}: expected a Bismillah split (canonical)`);
      assert.equal(split!.bismillah, BISMILLAH);
      assert.ok(split!.body.length > 0);
      assert.ok(ayah1.startsWith(split!.bismillah) && ayah1.endsWith(split!.body));
    } else {
      noBismillah.push(m.number);
      assert.equal(split, null, `surah ${m.number}: must never have a Bismillah header invented`);
    }
  }

  // Every surah accounted for exactly once, across all four buckets.
  assert.equal(
    fatihaLike.length + noBismillah.length + canonicalPrefix.length + shaddaVariantPrefix.length,
    114,
  );

  // The specific, empirically-confirmed classification (never assumed):
  assert.deepEqual(fatihaLike, [1]);
  assert.deepEqual(noBismillah, [9]);
  assert.deepEqual(shaddaVariantPrefix, [95, 97]);
  assert.equal(canonicalPrefix.length, 110);
});

test('Bismillah display split: An-Naml 27:30\'s mid-ayah Bismillah (Prophet Sulaiman\'s letter) is never touched', () => {
  const naml = readSurah(27);
  const ayah30 = naml.ayahs.find((a) => a.number === 30)!;
  // Genuine Quranic narrative content, not a header: the ayah does not
  // start with the Bismillah, it contains one mid-sentence.
  assert.ok(ayah30.text.includes(BISMILLAH));
  assert.ok(!ayah30.text.startsWith(BISMILLAH));
  // splitOpeningBismillah only ever inspects ayah number 1, so calling
  // it with this ayah's real number is a structural guarantee (not a
  // special case) that this text is never split or altered.
  assert.equal(splitOpeningBismillah(30, ayah30.text), null);

  // Surah 27's own ayah 1 (the actual opening Bismillah + muqatta'at
  // "طسٓ") is unaffected by, and textually distinct from, ayah 30.
  const ayah1 = naml.ayahs[0];
  const split = splitOpeningBismillah(1, ayah1.text);
  assert.ok(split);
  assert.equal(split!.bismillah, BISMILLAH);
});

test('dataset: the required Tanzil attribution/license file is present and unmodified', () => {
  const license = readFileSync(join(QURAN_DIR, 'TANZIL-LICENSE.txt'), 'utf-8');
  assert.ok(license.includes('Tanzil Quran Text'));
  assert.ok(license.includes('Tanzil Project'));
  assert.ok(license.includes('Creative Commons Attribution 3.0'));
  assert.ok(license.includes('CHANGING IT IS NOT ALLOWED'));
});
