import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isBookmarked, toggleBookmark, sortedBookmarks } from './reader-progress.ts';
import type { ReaderBookmark } from './reader-types.ts';

test('isBookmarked is false for an empty list', () => {
  assert.equal(isBookmarked([], 2, 255), false);
});

test('isBookmarked finds an exact surah+ayah match only', () => {
  const list: ReaderBookmark[] = [{ surah: 2, ayah: 255, createdAt: '2026-01-01T00:00:00.000Z' }];
  assert.equal(isBookmarked(list, 2, 255), true);
  assert.equal(isBookmarked(list, 2, 256), false);
  assert.equal(isBookmarked(list, 3, 255), false);
});

test('toggleBookmark adds a new bookmark when not present', () => {
  const next = toggleBookmark([], 1, 1);
  assert.equal(next.length, 1);
  assert.equal(next[0].surah, 1);
  assert.equal(next[0].ayah, 1);
  assert.ok(next[0].createdAt);
});

test('toggleBookmark removes an existing bookmark (on/off is idempotent per tap)', () => {
  const once = toggleBookmark([], 112, 1);
  const twice = toggleBookmark(once, 112, 1);
  assert.deepEqual(twice, []);
});

test('toggleBookmark only affects the targeted ayah, leaving others untouched', () => {
  const list: ReaderBookmark[] = [
    { surah: 1, ayah: 1, createdAt: '2026-01-01T00:00:00.000Z' },
    { surah: 36, ayah: 1, createdAt: '2026-01-02T00:00:00.000Z' },
  ];
  const next = toggleBookmark(list, 1, 1); // removes the first
  assert.equal(next.length, 1);
  assert.equal(next[0].surah, 36);
});

test('sortedBookmarks orders most-recently-created first without mutating the input', () => {
  const list: ReaderBookmark[] = [
    { surah: 1, ayah: 1, createdAt: '2026-01-01T00:00:00.000Z' },
    { surah: 2, ayah: 255, createdAt: '2026-03-01T00:00:00.000Z' },
    { surah: 112, ayah: 1, createdAt: '2026-02-01T00:00:00.000Z' },
  ];
  const sorted = sortedBookmarks(list);
  assert.deepEqual(
    sorted.map((b) => b.surah),
    [2, 112, 1]
  );
  // original order preserved (not mutated)
  assert.equal(list[0].surah, 1);
});
