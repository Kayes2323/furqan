import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isArticleRead,
  markArticleRead,
  unmarkArticleRead,
  readCount,
  readCountOf,
  type ResearchReadMap,
} from './research-progress.ts';

test('isArticleRead is false for an empty map and for unknown categories', () => {
  assert.equal(isArticleRead({}, 'science', 'a1'), false);
  assert.equal(isArticleRead({ science: ['a1'] }, 'economy', 'a1'), false);
  assert.equal(isArticleRead({ science: ['a1'] }, 'science', 'a2'), false);
  assert.equal(isArticleRead({ science: ['a1'] }, 'science', 'a1'), true);
});

test('isArticleRead tolerates a non-array value for a category', () => {
  // A corrupted/legacy entry must not throw where it is rendered.
  const bad = { science: 'a1' } as unknown as ResearchReadMap;
  assert.equal(isArticleRead(bad, 'science', 'a1'), false);
});

test('markArticleRead adds the article and leaves other categories alone', () => {
  const next = markArticleRead({ economy: ['e1'] }, 'science', 'a1');
  assert.deepEqual(next, { economy: ['e1'], science: ['a1'] });
});

test('markArticleRead is idempotent and returns the same object when already read', () => {
  const start: ResearchReadMap = { science: ['a1'] };
  const next = markArticleRead(start, 'science', 'a1');
  assert.equal(next, start, 'no new object when nothing changes');
});

test('markArticleRead does not mutate the input', () => {
  const start: ResearchReadMap = { science: ['a1'] };
  markArticleRead(start, 'science', 'a2');
  assert.deepEqual(start, { science: ['a1'] });
});

test('markArticleRead preserves the order articles were read in', () => {
  let m: ResearchReadMap = {};
  m = markArticleRead(m, 'science', 'a1');
  m = markArticleRead(m, 'science', 'a2');
  m = markArticleRead(m, 'science', 'a3');
  assert.deepEqual(m.science, ['a1', 'a2', 'a3']);
});

test('unmarkArticleRead removes just that article', () => {
  const next = unmarkArticleRead({ science: ['a1', 'a2'] }, 'science', 'a1');
  assert.deepEqual(next, { science: ['a2'] });
});

test('unmarkArticleRead returns the same object when the article was not read', () => {
  const start: ResearchReadMap = { science: ['a1'] };
  assert.equal(unmarkArticleRead(start, 'science', 'zz'), start);
  assert.equal(unmarkArticleRead(start, 'philosophy', 'a1'), start);
});

test('mark then unmark round-trips back to the original state', () => {
  const start: ResearchReadMap = { science: ['a1'] };
  const round = unmarkArticleRead(markArticleRead(start, 'science', 'a2'), 'science', 'a2');
  assert.deepEqual(round, start);
});

test('readCount counts per category and is 0 for unknown ones', () => {
  const m: ResearchReadMap = { science: ['a1', 'a2'], economy: [] };
  assert.equal(readCount(m, 'science'), 2);
  assert.equal(readCount(m, 'economy'), 0);
  assert.equal(readCount(m, 'philosophy'), 0);
});

test('readCountOf ignores ids for articles that no longer exist', () => {
  // The user read a3, then a3 was removed from the dataset. The count must
  // not exceed the number of articles actually on offer.
  const m: ResearchReadMap = { science: ['a1', 'a3'] };
  assert.equal(readCountOf(m, 'science', ['a1', 'a2']), 1);
  assert.equal(readCountOf(m, 'science', ['a1', 'a2', 'a3']), 2);
  assert.equal(readCountOf(m, 'science', []), 0);
});

test('readCountOf never reports more read than there are articles', () => {
  const m: ResearchReadMap = { science: ['a1', 'a2', 'a3', 'a4'] };
  const existing = ['a1', 'a2'];
  assert.ok(readCountOf(m, 'science', existing) <= existing.length);
});

test('readCountOf is 0 for a category with no recorded progress', () => {
  assert.equal(readCountOf({}, 'science', ['a1']), 0);
});
