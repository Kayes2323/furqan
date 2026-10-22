import test from 'node:test';
import assert from 'node:assert/strict';
import type { RecitationItem } from './zikr-types.ts';
import {
  emptyProgress,
  withDailyReset,
  tapCounter,
  nextIncompleteItemId,
  advanceToNext,
  isSequenceComplete,
  resetItem,
  resetSection,
  togglePracticeDone,
} from './zikr-progress.ts';

function item(id: string, order: number, targetCount: number): RecitationItem {
  return { kind: 'recitation', id, order, title: id, targetCount, sourceRef: 'test' };
}

const ITEMS: RecitationItem[] = [item('a', 1, 3), item('b', 2, 1), item('c', 3, 33)];
const TODAY = '2026-10-22';

test('tapCounter increments by exactly one per call', () => {
  let { progress } = tapCounter(emptyProgress('s', ITEMS, TODAY), ITEMS, 'a', TODAY);
  assert.equal(progress.counts.a, 1);
  ({ progress } = tapCounter(progress, ITEMS, 'a', TODAY));
  assert.equal(progress.counts.a, 2);
});

test('tapCounter marks the item completed exactly on the tap that reaches target, not before', () => {
  let progress = emptyProgress('s', ITEMS, TODAY);
  let outcome = tapCounter(progress, ITEMS, 'a', TODAY);
  progress = outcome.progress;
  assert.equal(outcome.justCompletedItemId, null);
  assert.deepEqual(progress.completedIds, []);

  outcome = tapCounter(progress, ITEMS, 'a', TODAY);
  progress = outcome.progress;
  assert.equal(outcome.justCompletedItemId, null);

  outcome = tapCounter(progress, ITEMS, 'a', TODAY); // 3rd tap, target is 3
  progress = outcome.progress;
  assert.equal(outcome.justCompletedItemId, 'a');
  assert.deepEqual(progress.completedIds, ['a']);
  assert.equal(progress.counts.a, 3);
});

test('tapCounter never counts past the target, even with many extra taps (rapid-tap safety)', () => {
  let progress = emptyProgress('s', ITEMS, TODAY);
  for (let i = 0; i < 20; i++) {
    ({ progress } = tapCounter(progress, ITEMS, 'b', TODAY)); // target is 1
  }
  assert.equal(progress.counts.b, 1);
  assert.deepEqual(progress.completedIds, ['b']);
});

test('tapCounter does not re-fire justCompletedItemId once an item is already completed (no double-advance)', () => {
  let progress = emptyProgress('s', ITEMS, TODAY);
  let outcome = tapCounter(progress, ITEMS, 'b', TODAY); // completes on first tap (target 1)
  progress = outcome.progress;
  assert.equal(outcome.justCompletedItemId, 'b');

  outcome = tapCounter(progress, ITEMS, 'b', TODAY); // tapping again after completion
  assert.equal(outcome.justCompletedItemId, null);
  assert.equal(outcome.progress.counts.b, 1);
});

test('nextIncompleteItemId follows source order and skips completed items', () => {
  let progress = emptyProgress('s', ITEMS, TODAY);
  assert.equal(nextIncompleteItemId(progress, ITEMS), 'a');

  ({ progress } = tapCounter(progress, ITEMS, 'a', TODAY));
  ({ progress } = tapCounter(progress, ITEMS, 'a', TODAY));
  ({ progress } = tapCounter(progress, ITEMS, 'a', TODAY)); // 'a' done
  assert.equal(nextIncompleteItemId(progress, ITEMS), 'b');

  ({ progress } = tapCounter(progress, ITEMS, 'b', TODAY)); // 'b' done
  assert.equal(nextIncompleteItemId(progress, ITEMS), 'c');
});

test('advanceToNext moves activeItemId to the next incomplete item', () => {
  let progress = emptyProgress('s', ITEMS, TODAY);
  ({ progress } = tapCounter(progress, ITEMS, 'a', TODAY));
  ({ progress } = tapCounter(progress, ITEMS, 'a', TODAY));
  ({ progress } = tapCounter(progress, ITEMS, 'a', TODAY));
  progress = advanceToNext(progress, ITEMS);
  assert.equal(progress.activeItemId, 'b');
});

test('on the final item, advanceToNext sets activeItemId to null (caller shows a completion summary, never crashes into a nonexistent item)', () => {
  let progress = emptyProgress('s', ITEMS, TODAY);
  for (const id of ['a', 'a', 'a', 'b']) {
    ({ progress } = tapCounter(progress, ITEMS, id, TODAY));
  }
  for (let i = 0; i < 33; i++) {
    ({ progress } = tapCounter(progress, ITEMS, 'c', TODAY));
  }
  assert.ok(isSequenceComplete(progress, ITEMS));
  progress = advanceToNext(progress, ITEMS);
  assert.equal(progress.activeItemId, null);
  assert.equal(nextIncompleteItemId(progress, ITEMS), null);
});

test('isSequenceComplete is false until every item has reached its target', () => {
  let progress = emptyProgress('s', ITEMS, TODAY);
  assert.equal(isSequenceComplete(progress, ITEMS), false);
  ({ progress } = tapCounter(progress, ITEMS, 'b', TODAY));
  assert.equal(isSequenceComplete(progress, ITEMS), false);
});

test('withDailyReset leaves progress untouched on the same day', () => {
  let progress = emptyProgress('s', ITEMS, TODAY);
  ({ progress } = tapCounter(progress, ITEMS, 'a', TODAY));
  const sameDay = withDailyReset(progress, ITEMS, TODAY);
  assert.equal(sameDay.counts.a, 1);
});

test('withDailyReset clears counts and completion on a new day', () => {
  let progress = emptyProgress('s', ITEMS, TODAY);
  ({ progress } = tapCounter(progress, ITEMS, 'a', TODAY));
  ({ progress } = tapCounter(progress, ITEMS, 'b', TODAY));
  const nextDay = withDailyReset(progress, ITEMS, '2026-10-23');
  assert.deepEqual(nextDay.counts, {});
  assert.deepEqual(nextDay.completedIds, []);
  assert.equal(nextDay.activeItemId, 'a');
  assert.equal(nextDay.lastActiveDate, '2026-10-23');
});

test('tapCounter itself applies the daily reset before counting (tapping on a new day starts fresh, not stacking onto yesterday)', () => {
  let progress = emptyProgress('s', ITEMS, TODAY);
  ({ progress } = tapCounter(progress, ITEMS, 'a', TODAY));
  ({ progress } = tapCounter(progress, ITEMS, 'a', TODAY));
  // two taps yesterday, 'a' at count 2/3 — now a new day starts
  const outcome = tapCounter(progress, ITEMS, 'a', '2026-10-23');
  assert.equal(outcome.progress.counts.a, 1); // fresh count, not 3
  assert.equal(outcome.justCompletedItemId, null);
});

test('resetItem clears only that item and refocuses it, leaving other progress intact', () => {
  let progress = emptyProgress('s', ITEMS, TODAY);
  ({ progress } = tapCounter(progress, ITEMS, 'a', TODAY));
  ({ progress } = tapCounter(progress, ITEMS, 'b', TODAY)); // 'b' completed
  progress = resetItem(progress, 'b', TODAY);
  assert.equal(progress.counts.b, undefined);
  assert.equal(progress.completedIds.includes('b'), false);
  assert.equal(progress.activeItemId, 'b');
  assert.equal(progress.counts.a, 1); // untouched
});

test('resetSection returns a completely fresh progress object', () => {
  let progress = emptyProgress('s', ITEMS, TODAY);
  ({ progress } = tapCounter(progress, ITEMS, 'a', TODAY));
  const fresh = resetSection('s', ITEMS, TODAY);
  assert.deepEqual(fresh.counts, {});
  assert.equal(fresh.activeItemId, 'a');
});

test('tapCounter on an unknown item id is a safe no-op', () => {
  const progress = emptyProgress('s', ITEMS, TODAY);
  const outcome = tapCounter(progress, ITEMS, 'does-not-exist', TODAY);
  assert.equal(outcome.justCompletedItemId, null);
  assert.deepEqual(outcome.progress.counts, {});
});

test('togglePracticeDone marks a non-recitation item done and back off, without affecting recitation completion', () => {
  let progress = emptyProgress('s', ITEMS, TODAY);
  ({ progress } = tapCounter(progress, ITEMS, 'b', TODAY)); // 'b' completed (target 1)

  progress = togglePracticeDone(progress, ITEMS, 'practice-1', TODAY);
  assert.ok(progress.completedIds.includes('practice-1'));
  assert.ok(progress.completedIds.includes('b')); // untouched
  assert.equal(isSequenceComplete(progress, ITEMS), false); // practice-1 isn't in ITEMS, doesn't count toward it

  progress = togglePracticeDone(progress, ITEMS, 'practice-1', TODAY);
  assert.equal(progress.completedIds.includes('practice-1'), false);
  assert.ok(progress.completedIds.includes('b'));
});

test('togglePracticeDone also resets on a new day, like the recitation flow', () => {
  let progress = emptyProgress('s', ITEMS, TODAY);
  progress = togglePracticeDone(progress, ITEMS, 'practice-1', TODAY);
  progress = togglePracticeDone(progress, ITEMS, 'practice-1', '2026-10-23');
  // a fresh day resets completedIds first, so this toggle turns it back ON for the new day
  assert.ok(progress.completedIds.includes('practice-1'));
  assert.equal(progress.lastActiveDate, '2026-10-23');
});
