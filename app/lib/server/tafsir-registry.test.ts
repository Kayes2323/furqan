import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TAFSIR_SOURCE_REGISTRY,
  getSourceById,
  getAvailableSources,
  getActiveBengaliTranslationSource,
  getActiveBengaliTafsirSource,
} from './tafsir-registry.ts';

test('every registry entry has a unique, non-empty id', () => {
  const ids = TAFSIR_SOURCE_REGISTRY.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.ok(id.length > 0);
});

test('an "unavailable" entry never carries a confirmed resourceId or verifiedAt', () => {
  for (const s of TAFSIR_SOURCE_REGISTRY) {
    if (s.availability === 'unavailable') {
      assert.equal(s.resourceId, null, `${s.id}: unavailable source must not pin a resourceId`);
      assert.equal(s.verifiedAt, null, `${s.id}: unavailable source must not claim a verification date`);
    }
  }
});

test('a "verified-live" live-api entry must carry a real resourceId and verifiedAt', () => {
  for (const s of TAFSIR_SOURCE_REGISTRY) {
    if (s.availability === 'verified-live' && s.retrievalMethod === 'live-api') {
      assert.ok(typeof s.resourceId === 'number', `${s.id}: verified live-api source needs a numeric resourceId`);
      assert.ok(s.verifiedAt, `${s.id}: verified source needs a verifiedAt date`);
    }
  }
});

test('getSourceById finds known entries and returns undefined for unknown ids', () => {
  assert.equal(getSourceById('qf-bn-taisirul-quran')?.title, 'Taisirul Quran');
  assert.equal(getSourceById('does-not-exist'), undefined);
});

test('getAvailableSources only returns verified-live entries, optionally filtered by kind', () => {
  const all = getAvailableSources();
  assert.ok(all.every((s) => s.availability === 'verified-live'));
  assert.ok(all.every((s) => s.kind !== undefined));

  const tafsirs = getAvailableSources('tafsir');
  assert.ok(tafsirs.every((s) => s.kind === 'tafsir'));
  assert.ok(tafsirs.some((s) => s.id === 'qf-bn-fathul-majid'));
});

test('the active Bengali tafsir source is Fathul Majid, never silently Ibn Kathir', () => {
  const active = getActiveBengaliTafsirSource();
  assert.equal(active?.id, 'qf-bn-fathul-majid');
  assert.notEqual(active?.title, 'Tafsir Ibn Kathir (Bengali)');
});

test('the active Bengali translation source is Taisirul Quran', () => {
  const active = getActiveBengaliTranslationSource();
  assert.equal(active?.id, 'qf-bn-taisirul-quran');
  assert.equal(active?.resourceId, 161);
});

test('the unavailable Ibn Kathir placeholder is excluded from "active" lookups', () => {
  const ibnKathir = getSourceById('qf-bn-ibn-kathir');
  assert.equal(ibnKathir?.availability, 'unavailable');
  const availableTafsirs = getAvailableSources('tafsir');
  assert.ok(!availableTafsirs.some((s) => s.id === 'qf-bn-ibn-kathir'));
});
