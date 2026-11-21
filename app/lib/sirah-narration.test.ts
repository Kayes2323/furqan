import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  narratableBlocks,
  sectionNarrationText,
  sectionNarrationChunks,
} from './sirah-narration.ts';
import { NARRATION_CHUNK_MAX_CHARS } from './markdown-narration.ts';
import type { ContentBlock, SirahSection } from './sirah-types.ts';

const section = (blocks: ContentBlock[]): SirahSection => ({ id: 'ch-01-s-01', title: 'অধ্যায়', blocks });

test('image blocks are not narrated', () => {
  const blocks: ContentBlock[] = [
    { type: 'para', text: 'মক্কা ছিল আরবের কেন্দ্র।' },
    { type: 'image', text: 'ছবি: বংশতালিকা', src: '/images/x.jpg', alt: 'বংশতালিকা' },
    { type: 'para', text: 'সেখানেই কাবা অবস্থিত।' },
  ];
  assert.equal(narratableBlocks(blocks).length, 2);
  const text = sectionNarrationText(section(blocks));
  assert.ok(!text.includes('ছবি:'), 'caption leaked into narration');
  assert.ok(!text.includes('বংশতালিকা'), 'alt text leaked into narration');
});

test('headings and subheadings are narrated', () => {
  const text = sectionNarrationText(
    section([
      { type: 'heading', text: 'আরবের অবস্থা' },
      { type: 'subheading', text: 'ভৌগোলিক পরিচয়' },
      { type: 'para', text: 'আরব উপদ্বীপ।' },
    ]),
  );
  assert.ok(text.includes('আরবের অবস্থা'));
  assert.ok(text.includes('ভৌগোলিক পরিচয়'));
  assert.ok(text.includes('আরব উপদ্বীপ।'));
});

test('blocks are joined in source order, blank-line separated', () => {
  const text = sectionNarrationText(
    section([
      { type: 'para', text: 'এক' },
      { type: 'para', text: 'দুই' },
    ]),
  );
  assert.equal(text, 'এক\n\nদুই');
});

test('blank and whitespace-only blocks are dropped', () => {
  const text = sectionNarrationText(
    section([
      { type: 'para', text: '  ' },
      { type: 'para', text: 'আসল পাঠ্য' },
      { type: 'para', text: '' },
    ]),
  );
  assert.equal(text, 'আসল পাঠ্য');
});

test('a section with only images yields no chunks rather than silence', () => {
  const chunks = sectionNarrationChunks(
    section([{ type: 'image', text: 'ছবি', src: '/x.jpg', alt: 'x' }]),
  );
  assert.deepEqual(chunks, []);
});

test('an empty section yields no chunks', () => {
  assert.deepEqual(sectionNarrationChunks(section([])), []);
});

test('a short section is a single chunk holding all its text', () => {
  const chunks = sectionNarrationChunks(section([{ type: 'para', text: 'ছোট অনুচ্ছেদ।' }]));
  assert.equal(chunks.length, 1);
  assert.ok(chunks[0].includes('ছোট অনুচ্ছেদ।'));
});

test('a long section splits into chunks that each fit the TTS limit', () => {
  const para = 'এটি একটি দীর্ঘ বাক্য যা বারবার পুনরাবৃত্ত হচ্ছে। ';
  const blocks: ContentBlock[] = Array.from({ length: 40 }, () => ({ type: 'para' as const, text: para.repeat(5) }));
  const chunks = sectionNarrationChunks(section(blocks));
  assert.ok(chunks.length > 1, 'expected the long section to split');
  for (const c of chunks) {
    assert.ok(c.length <= NARRATION_CHUNK_MAX_CHARS, `chunk of ${c.length} chars exceeds the limit`);
  }
});

test('splitting loses no words', () => {
  const blocks: ContentBlock[] = Array.from({ length: 30 }, (_, i) => ({
    type: 'para' as const,
    text: `অনুচ্ছেদ ${i} ` + 'শব্দ '.repeat(60),
  }));
  const s = section(blocks);
  const joinedWords = sectionNarrationText(s).split(/\s+/).filter(Boolean).length;
  const chunkWords = sectionNarrationChunks(s)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
  assert.equal(chunkWords, joinedWords);
});
