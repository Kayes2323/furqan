import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toBnDigits } from './bn-digits.ts';
import { normalizeDigits } from './journey-interview.ts';

test('converts each ASCII digit to its Bengali counterpart', () => {
  assert.equal(toBnDigits('0123456789'), '০১২৩৪৫৬৭৮৯');
});

test('accepts numbers as well as strings', () => {
  assert.equal(toBnDigits(7), '৭');
  assert.equal(toBnDigits(2026), '২০২৬');
  assert.equal(toBnDigits(0), '০');
});

test('leaves non-digit characters untouched', () => {
  assert.equal(toBnDigits('3/7'), '৩/৭');
  assert.equal(toBnDigits('১২টি'), '১২টি', 'already-Bengali text is unchanged');
  assert.equal(toBnDigits('কোনো প্রবন্ধ নেই'), 'কোনো প্রবন্ধ নেই');
  assert.equal(toBnDigits(''), '');
});

test('handles a count embedded in a Bengali sentence', () => {
  assert.equal(toBnDigits(`${12}টি প্রবন্ধ পড়া হয়েছে`), '১২টি প্রবন্ধ পড়া হয়েছে');
});

test('round-trips with normalizeDigits, the parsing inverse', () => {
  for (const n of [0, 5, 42, 1007, 88]) {
    assert.equal(normalizeDigits(toBnDigits(n)), String(n));
  }
});

test('is idempotent — converting twice changes nothing further', () => {
  const once = toBnDigits('5/18');
  assert.equal(toBnDigits(once), once);
});
