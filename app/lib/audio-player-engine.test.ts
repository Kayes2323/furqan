import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTimeline,
  positionAtGlobalTime,
  globalTimeForChunkStart,
  globalTimeForChunkOffset,
  nextSpeed,
  formatTime,
  clampSkip,
  PLAYBACK_SPEEDS,
} from './audio-player-engine.ts';

test('buildTimeline computes cumulative start offsets and total duration', () => {
  const timeline = buildTimeline([
    { id: 'a', durationSec: 10 },
    { id: 'b', durationSec: 20 },
    { id: 'c', durationSec: 5 },
  ]);
  assert.equal(timeline.chunks[0].startSec, 0);
  assert.equal(timeline.chunks[1].startSec, 10);
  assert.equal(timeline.chunks[2].startSec, 30);
  assert.equal(timeline.totalDurationSec, 35);
});

test('buildTimeline on an empty chunk list is a valid empty timeline', () => {
  const timeline = buildTimeline([]);
  assert.equal(timeline.totalDurationSec, 0);
  assert.equal(timeline.chunks.length, 0);
});

test('positionAtGlobalTime finds the correct chunk and in-chunk offset', () => {
  const timeline = buildTimeline([{ id: 'a', durationSec: 10 }, { id: 'b', durationSec: 20 }]);
  assert.deepEqual(positionAtGlobalTime(timeline, 0), { chunkIndex: 0, offsetSec: 0 });
  assert.deepEqual(positionAtGlobalTime(timeline, 5), { chunkIndex: 0, offsetSec: 5 });
  assert.deepEqual(positionAtGlobalTime(timeline, 10), { chunkIndex: 1, offsetSec: 0 });
  assert.deepEqual(positionAtGlobalTime(timeline, 25), { chunkIndex: 1, offsetSec: 15 });
});

test('positionAtGlobalTime clamps out-of-range time instead of throwing', () => {
  const timeline = buildTimeline([{ id: 'a', durationSec: 10 }]);
  assert.deepEqual(positionAtGlobalTime(timeline, -5), { chunkIndex: 0, offsetSec: 0 });
  assert.deepEqual(positionAtGlobalTime(timeline, 1000), { chunkIndex: 0, offsetSec: 10 });
});

test('positionAtGlobalTime on an empty timeline returns a sentinel, never throws', () => {
  assert.deepEqual(positionAtGlobalTime(buildTimeline([]), 5), { chunkIndex: -1, offsetSec: 0 });
});

test('globalTimeForChunkStart maps a chunk index back to its global offset', () => {
  const timeline = buildTimeline([{ id: 'a', durationSec: 10 }, { id: 'b', durationSec: 20 }]);
  assert.equal(globalTimeForChunkStart(timeline, 0), 0);
  assert.equal(globalTimeForChunkStart(timeline, 1), 10);
  assert.equal(globalTimeForChunkStart(timeline, 99), 0); // out-of-range -> safe default
});

test('globalTimeForChunkOffset clamps the in-chunk offset to that chunk\'s own duration', () => {
  const timeline = buildTimeline([{ id: 'a', durationSec: 10 }, { id: 'b', durationSec: 20 }]);
  assert.equal(globalTimeForChunkOffset(timeline, 1, 5), 15);
  assert.equal(globalTimeForChunkOffset(timeline, 1, 999), 30); // clamped to chunk b's own end
  assert.equal(globalTimeForChunkOffset(timeline, 1, -5), 10); // clamped to chunk b's start
});

test('nextSpeed cycles through the fixed speed list and wraps around', () => {
  assert.equal(nextSpeed(0.8), 1);
  assert.equal(nextSpeed(1), 1.2);
  assert.equal(nextSpeed(1.2), 1.5);
  assert.equal(nextSpeed(1.5), 0.8);
});

test('PLAYBACK_SPEEDS matches the task spec exactly', () => {
  assert.deepEqual(PLAYBACK_SPEEDS, [0.8, 1, 1.2, 1.5]);
});

test('formatTime renders mm:ss, zero-padding seconds', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(5), '0:05');
  assert.equal(formatTime(65), '1:05');
  assert.equal(formatTime(3605), '60:05');
});

test('formatTime never shows a negative or NaN time', () => {
  assert.equal(formatTime(-10), '0:00');
  assert.equal(formatTime(NaN), '0:00');
});

test('clampSkip stays within [0, totalDuration]', () => {
  assert.equal(clampSkip(5, 10, 100), 15);
  assert.equal(clampSkip(5, -10, 100), 0);
  assert.equal(clampSkip(95, 10, 100), 100);
});
