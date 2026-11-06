import test from 'node:test';
import assert from 'node:assert/strict';
import { DAILY_AYAHS, getDailyAyah, localDayNumber } from './daily-ayah.ts';

test('every daily ayah carries Arabic, Bengali, a reference and a reader target', () => {
  for (const a of DAILY_AYAHS) {
    assert.ok(a.arabic.trim().length > 0, 'missing arabic');
    assert.ok(a.bangla.trim().length > 0, `missing bangla for ${a.ref}`);
    assert.ok(a.ref.trim().length > 0, 'missing ref');
    assert.ok(a.surah >= 1 && a.surah <= 114, `surah ${a.surah} out of range for ${a.ref}`);
    assert.ok(a.ayah >= 1, `ayah ${a.ayah} out of range for ${a.ref}`);
  }
});

test('the reference text agrees with the surah:ayah the card links to', () => {
  // The ref string ends in "<surah>:<ayah>" written in Bengali digits; the
  // numeric fields drive navigation, so a mismatch would send the reader to a
  // different verse than the one quoted.
  const toBengaliDigits = (n: number) =>
    String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
  for (const a of DAILY_AYAHS) {
    const expectedSuffix = `${toBengaliDigits(a.surah)}:${toBengaliDigits(a.ayah)}`;
    assert.ok(
      a.ref.endsWith(expectedSuffix),
      `ref "${a.ref}" does not end with ${expectedSuffix} (surah ${a.surah}, ayah ${a.ayah})`,
    );
  }
});

test('the same calendar date always yields the same ayah', () => {
  const a = getDailyAyah(new Date(2026, 10, 6, 0, 1));
  const b = getDailyAyah(new Date(2026, 10, 6, 23, 59));
  assert.deepEqual(a, b);
});

test('consecutive days yield different ayahs', () => {
  const day1 = getDailyAyah(new Date(2026, 10, 6));
  const day2 = getDailyAyah(new Date(2026, 10, 7));
  assert.notDeepEqual(day1, day2);
});

test('the rotation covers every ayah over one full cycle', () => {
  const seen = new Set<string>();
  for (let i = 0; i < DAILY_AYAHS.length; i++) {
    seen.add(getDailyAyah(new Date(2026, 0, 1 + i)).ref);
  }
  assert.equal(seen.size, DAILY_AYAHS.length);
});

test('dates before the epoch still produce a valid ayah (no negative index)', () => {
  const old = getDailyAyah(new Date(1960, 4, 17));
  assert.ok(DAILY_AYAHS.includes(old));
});

test('localDayNumber advances by exactly one per local calendar day', () => {
  const a = localDayNumber(new Date(2026, 10, 6, 23, 59));
  const b = localDayNumber(new Date(2026, 10, 7, 0, 0));
  assert.equal(b - a, 1);
});
