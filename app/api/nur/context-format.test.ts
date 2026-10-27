import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRefsOut, buildSourcesOut, formatContextForPrompt } from './context-format.ts';
import type { RetrievedContext } from './retrieval.ts';
import { getSourceById } from '../../lib/server/tafsir-registry.ts';

const translationSource = getSourceById('qf-bn-taisirul-quran')!;
const tafsirSource = getSourceById('qf-bn-fathul-majid')!;

function baseCtx(overrides: Partial<RetrievedContext> = {}): RetrievedContext {
  return {
    ayahs: [], surahOverview: null, topic: null, fazilah: null,
    sourcesUsed: [], notFound: [], resolvedVia: 'none',
    ...overrides,
  };
}

test('buildRefsOut produces one ref per retrieved ayah with a readable label', () => {
  const ctx = baseCtx({
    ayahs: [{ surah: 2, ayah: 255, surahBanglaName: 'আল-বাকারা', arabic: 'x', translation: null, tafsir: null }],
  });
  const refs = buildRefsOut(ctx);
  assert.deepEqual(refs, [{ surah: 2, ayah: 255, label: 'সূরা আল-বাকারা 2:255' }]);
});

test('buildSourcesOut never includes a source that was not actually used', () => {
  const ctx = baseCtx({ sourcesUsed: [translationSource] });
  const sources = buildSourcesOut(ctx);
  assert.equal(sources.length, 1);
  assert.equal(sources[0].id, 'qf-bn-taisirul-quran');
});

test('formatContextForPrompt labels Arabic, translation, and tafsir distinctly with their sources', () => {
  const ctx = baseCtx({
    ayahs: [{
      surah: 1, ayah: 1, surahBanglaName: 'আল-ফাতিহা', arabic: 'بِسْمِ ٱللَّهِ',
      translation: { text: 'শুরু করছি আল্লাহর নামে', source: translationSource },
      tafsir: { verseKey: '1:1', blocks: [{ type: 'paragraph', text: 'এই আয়াতের ব্যাখ্যা।' }], source: tafsirSource },
    }],
  });
  const text = formatContextForPrompt(ctx);
  assert.ok(text.includes('আরবি'));
  assert.ok(text.includes('بِسْمِ ٱللَّهِ'));
  assert.ok(text.includes('Taisirul Quran'));
  assert.ok(text.includes('Tafsir Fathul Majid'));
  assert.ok(text.includes('এই আয়াতের ব্যাখ্যা।'));
});

test('a not_found tafsir is stated plainly, never silently omitted or invented', () => {
  const ctx = baseCtx({
    ayahs: [{ surah: 5, ayah: 1, surahBanglaName: 'আল-মায়িদা', arabic: 'x', translation: null, tafsir: 'not_found' }],
  });
  const text = formatContextForPrompt(ctx);
  assert.ok(text.includes('পাওয়া যায়নি'));
});

test('topic refs are explicitly labeled as the app\'s own gloss, not a translation', () => {
  const ctx = baseCtx({
    topic: { id: 'sabr', nameBn: 'সবর', summaryBn: 'ধৈর্য।', refs: [{ surah: 2, ayahStart: 153, ayahEnd: 153, glossBn: 'ধৈর্যের কথা।' }] },
  });
  const text = formatContextForPrompt(ctx);
  assert.ok(text.includes('অ্যাপের নিজস্ব সংক্ষিপ্ত ব্যাখ্যা'));
  assert.ok(text.includes('ধৈর্যের কথা।'));
});

test('fazilah hadith evidence is explicitly labeled as a summary, not a direct quotation', () => {
  const ctx = baseCtx({
    fazilah: {
      id: 'ayat-al-kursi', nameBn: 'আয়াতুল কুরসি', whySelectedBn: 'গুরুত্বপূর্ণ।',
      evidence: [{ kind: 'hadith-authentic', summaryBn: 'test summary', sourceLabel: 'বুখারী ২৩১১', gradingNoteBn: 'সহীহ' }],
    },
  });
  const text = formatContextForPrompt(ctx);
  assert.ok(text.includes('শব্দানুবাদ নয়'));
  assert.ok(text.includes('বুখারী ২৩১১'));
});

test('an empty context formats to an empty string, prompting honest "no context" behavior', () => {
  assert.equal(formatContextForPrompt(baseCtx()), '');
});

test('notFound entries appear verbatim in the formatted block', () => {
  const ctx = baseCtx({ notFound: ['9:1 — অনুবাদ পাওয়া যায়নি'] });
  const text = formatContextForPrompt(ctx);
  assert.ok(text.includes('9:1 — অনুবাদ পাওয়া যায়নি'));
});
