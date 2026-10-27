import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSurahMetaServer, loadSurahServer, loadAyahServer } from './quran-local-data.ts';

test('loadSurahMetaServer reads all 114 surahs from the bundled dataset', async () => {
  const meta = await loadSurahMetaServer();
  assert.equal(meta.length, 114);
  assert.equal(meta[0].banglaName, 'আল-ফাতিহা');
});

test('loadSurahServer reads Al-Fatiha with 7 ayahs', async () => {
  const doc = await loadSurahServer(1);
  assert.equal(doc.number, 1);
  assert.equal(doc.ayahs.length, 7);
});

test('loadAyahServer finds a specific ayah', async () => {
  const ayah = await loadAyahServer(2, 255);
  assert.ok(ayah);
  assert.equal(ayah?.number, 255);
  assert.ok(ayah?.text.length > 0);
});

test('loadAyahServer returns null for an out-of-range ayah', async () => {
  const ayah = await loadAyahServer(1, 999);
  assert.equal(ayah, null);
});

test('repeated calls return cached, identical data', async () => {
  const first = await loadSurahServer(112);
  const second = await loadSurahServer(112);
  assert.deepEqual(first, second);
});
