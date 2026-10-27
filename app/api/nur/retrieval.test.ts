import { test } from 'node:test';
import assert from 'node:assert/strict';
import { retrieveContext, type RetrievalDeps } from './retrieval.ts';
import { TAFSIR_SOURCE_REGISTRY, getSourceById } from '../../lib/server/tafsir-registry.ts';
import type { SurahMeta } from '../../lib/reader-types.ts';
import type { Topic, ImportantSurah } from '../../lib/topics-types.ts';

const FAKE_META: SurahMeta[] = [
  { number: 1, arabicName: 'الفاتحة', transliteratedName: 'Al-Faatiha', englishName: 'The Opening', banglaName: 'আল-ফাতিহা', ayahCount: 7, revelationType: 'Meccan', revelationOrder: 5 },
  { number: 2, arabicName: 'البقرة', transliteratedName: 'Al-Baqara', englishName: 'The Cow', banglaName: 'আল-বাকারা', ayahCount: 286, revelationType: 'Medinan', revelationOrder: 87 },
  { number: 67, arabicName: 'الملك', transliteratedName: 'Al-Mulk', englishName: 'The Sovereignty', banglaName: 'আল-মুলক', ayahCount: 30, revelationType: 'Meccan', revelationOrder: 77 },
];

const FAKE_TOPICS: Topic[] = [
  {
    id: 'sabr', nameBn: 'সবর (ধৈর্য)', nameAr: 'الصبر', icon: 'Clock', summaryBn: 'ধৈর্যের শিক্ষা।',
    ayahs: [{ surah: 2, ayahStart: 153, ayahEnd: 153, glossBn: 'ধৈর্যশীলদের কথা।' }],
  },
];

const FAKE_IMPORTANT: ImportantSurah[] = [
  {
    id: 'ayat-al-kursi', surahNumber: 2, nameBn: 'আয়াতুল কুরসি',
    highlightAyah: { ayahStart: 255, ayahEnd: 255 },
    whySelectedBn: 'আল্লাহর সত্তার বর্ণনা।',
    evidence: [{ kind: 'hadith-authentic', summaryBn: 'test', sourceLabel: 'বুখারী', gradingNoteBn: 'সহীহ' }],
  },
  {
    id: 'al-mulk', surahNumber: 67, nameBn: 'সূরা আল-মুলক',
    whySelectedBn: 'সুপারিশ করবে।',
    evidence: [],
  },
];

const translationSource = getSourceById('qf-bn-taisirul-quran')!;
const tafsirSource = getSourceById('qf-bn-fathul-majid')!;

function makeDeps(overrides: Partial<RetrievalDeps> = {}): RetrievalDeps {
  return {
    loadMeta: async () => FAKE_META,
    loadAyahArabic: async (s, a) => `ARABIC[${s}:${a}]`,
    loadAyahTranslation: async (s, a) => ({ text: `TRANSLATION[${s}:${a}]` }),
    loadAyahTafsir: async (s, a) => ({ verseKey: `${s}:${a}`, blocks: [{ type: 'paragraph', text: `TAFSIR[${s}:${a}]` }] }),
    isConfigured: () => true,
    translationSource: () => translationSource,
    tafsirSource: () => tafsirSource,
    topics: FAKE_TOPICS,
    importantSurahs: FAKE_IMPORTANT,
    ...overrides,
  };
}

test('explicit context always wins and is never re-derived from the message', async () => {
  const deps = makeDeps();
  const ctx = await retrieveContext('কিছু একটা প্রশ্ন', deps, { explicitContext: { surah: 2, ayah: 255 } });
  assert.equal(ctx.resolvedVia, 'explicit-context');
  assert.equal(ctx.ayahs.length, 1);
  assert.equal(ctx.ayahs[0].surah, 2);
  assert.equal(ctx.ayahs[0].ayah, 255);
});

test('deterministic numeric reference resolves without any fallback', async () => {
  const deps = makeDeps();
  const ctx = await retrieveContext('2:255 এর অর্থ কী?', deps);
  assert.equal(ctx.resolvedVia, 'deterministic');
  assert.equal(ctx.ayahs[0].arabic, 'ARABIC[2:255]');
  assert.equal(ctx.ayahs[0].translation?.text, 'TRANSLATION[2:255]');
  assert.equal(ctx.ayahs[0].translation?.source.id, 'qf-bn-taisirul-quran');
});

test('important-surah name match (Ayat al-Kursi) resolves to the right ayah', async () => {
  const deps = makeDeps();
  const ctx = await retrieveContext('আয়াতুল কুরসির ফযীলত কী?', deps);
  assert.equal(ctx.resolvedVia, 'important-surah');
  assert.equal(ctx.ayahs[0].surah, 2);
  assert.equal(ctx.ayahs[0].ayah, 255);
  assert.equal(ctx.fazilah?.id, 'ayat-al-kursi');
});

test('important-surah match with no highlightAyah produces a surah overview, not an ayah fetch', async () => {
  const deps = makeDeps();
  const ctx = await retrieveContext('সূরা আল-মুলক সম্পর্কে বলো', deps);
  assert.equal(ctx.ayahs.length, 0);
  assert.equal(ctx.surahOverview?.surah, 67);
});

test('topic match returns the topic\'s own refs and glossBn, not full tafsir text for each', async () => {
  const deps = makeDeps();
  const ctx = await retrieveContext('সবর নিয়ে কুরআনে কী আছে?', deps);
  assert.equal(ctx.resolvedVia, 'topic');
  assert.equal(ctx.topic?.id, 'sabr');
  assert.equal(ctx.topic?.refs[0].glossBn, 'ধৈর্যশীলদের কথা।');
  assert.equal(ctx.ayahs.length, 1);
});

test('llm fallback is only invoked when nothing deterministic matched AND the question looks ayah-specific', async () => {
  const deps = makeDeps();
  let called = false;
  const ctx = await retrieveContext('এই আয়াতের তাফসির কী বলে?', deps, {
    llmReferenceFallback: async () => { called = true; return { surah: 1, ayah: 1 }; },
  });
  assert.equal(called, true);
  assert.equal(ctx.resolvedVia, 'llm-fallback');
  assert.equal(ctx.ayahs[0].surah, 1);
});

test('llm fallback is never called for a non-Quran question', async () => {
  const deps = makeDeps();
  let called = false;
  const ctx = await retrieveContext('আজকে আবহাওয়া কেমন?', deps, {
    llmReferenceFallback: async () => { called = true; return { surah: 1, ayah: 1 }; },
  });
  assert.equal(called, false);
  assert.equal(ctx.resolvedVia, 'none');
});

test('an unresolvable question returns an empty context, never fabricated content', async () => {
  const deps = makeDeps();
  const ctx = await retrieveContext('আজকে আবহাওয়া কেমন?', deps);
  assert.deepEqual(ctx.ayahs, []);
  assert.equal(ctx.surahOverview, null);
  assert.equal(ctx.topic, null);
  assert.equal(ctx.resolvedVia, 'none');
});

test('a missing tafsir is reported honestly in notFound, never silently dropped', async () => {
  const deps = makeDeps({
    loadAyahTafsir: async () => 'not_found',
  });
  const ctx = await retrieveContext('2:255', deps);
  assert.equal(ctx.ayahs[0].tafsir, 'not_found');
  assert.ok(ctx.notFound.some((n) => n.includes('তাফসির')));
});

test('when the source is not configured, no translation/tafsir is fabricated — Arabic still returns', async () => {
  const deps = makeDeps({ isConfigured: () => false });
  const ctx = await retrieveContext('2:255', deps);
  assert.equal(ctx.ayahs[0].arabic, 'ARABIC[2:255]');
  assert.equal(ctx.ayahs[0].translation, null);
  assert.equal(ctx.ayahs[0].tafsir, null);
  assert.ok(ctx.notFound.length > 0);
});

test('an ayah range is capped so a huge range never triggers unbounded fetching', async () => {
  const deps = makeDeps();
  const ctx = await retrieveContext('2:1-500', deps);
  assert.ok(ctx.ayahs.length <= 5);
});

test('sourcesUsed only includes sources actually fetched, each exactly once', async () => {
  const deps = makeDeps();
  const ctx = await retrieveContext('2:1-3', deps);
  const ids = ctx.sourcesUsed.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes('qf-bn-taisirul-quran'));
  assert.ok(ids.includes('qf-bn-fathul-majid'));
});

test('resolves an English-phrased numeric reference the same as a Bangla one', async () => {
  const deps = makeDeps();
  const ctx = await retrieveContext('What does verse 2:255 mean?', deps);
  assert.equal(ctx.resolvedVia, 'deterministic');
  assert.equal(ctx.ayahs[0].surah, 2);
  assert.equal(ctx.ayahs[0].ayah, 255);
});

test('a source\'s identity (title/attribution) is preserved exactly as registered, never renamed or merged', async () => {
  const deps = makeDeps();
  const ctx = await retrieveContext('2:1', deps);
  const tafsirUsed = ctx.ayahs[0].tafsir;
  assert.notEqual(tafsirUsed, 'not_found');
  assert.notEqual(tafsirUsed, null);
  if (tafsirUsed && typeof tafsirUsed === 'object') {
    assert.equal(tafsirUsed.source.title, 'Tafsir Fathul Majid');
    assert.equal(tafsirUsed.source.authorAttribution, 'AbdulRahman Bin Hasan Al-Alshaikh');
  }
});

test('registry sanity: the two sources used in these tests are both verified-live', () => {
  assert.equal(translationSource.availability, 'verified-live');
  assert.equal(tafsirSource.availability, 'verified-live');
  assert.ok(TAFSIR_SOURCE_REGISTRY.includes(translationSource));
});
