import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coerceInterpretation, explanationUsesOnlyGivenNumbers, sanitizeExplanation, numberTokens, parseModelJson, isInterpretStep } from './llm.ts';

test('interpretation: only allowed values pass; anything else is rejected', () => {
  assert.deepEqual(coerceInterpretation('goal', { value: 'both' }), { value: 'both' });
  assert.equal(coerceInterpretation('goal', { value: 'hifz' }), null);
  assert.deepEqual(coerceInterpretation('goal', { skip: true }), { skip: true });
  assert.equal(coerceInterpretation('goal', 'both'), null);
  assert.deepEqual(coerceInterpretation('dailyMinutes', { value: 29.6 }), { value: 30 });
  assert.equal(coerceInterpretation('dailyMinutes', { value: -3 }), null);
  assert.equal(coerceInterpretation('dailyMinutes', { value: '30' }), null);
  assert.deepEqual(coerceInterpretation('start', { value: { surah: 36 } }), { value: { surah: 36 } });
  assert.equal(coerceInterpretation('start', { value: { surah: 200 } }), null);
  assert.deepEqual(coerceInterpretation('lightDays', { value: [5, 5, 6] }), { value: [5, 6] });
  assert.equal(coerceInterpretation('lightDays', { value: [9] }), null);
  assert.equal(coerceInterpretation('slots', { value: 'sunrise' }), null);
});

test('the model can never supply a deadline date — only "sustainable"', () => {
  assert.equal(coerceInterpretation('deadline', { value: '2027-03-01' }), null);
  assert.equal(coerceInterpretation('deadline', { value: { date: '2027-03-01' } }), null);
  assert.deepEqual(coerceInterpretation('deadline', { value: 'sustainable' }), { value: 'sustainable' });
});

test('step allow-list and JSON parsing are strict', () => {
  assert.equal(isInterpretStep('goal'), true);
  assert.equal(isInterpretStep('__proto__'), false);
  assert.equal(isInterpretStep(5), false);
  assert.deepEqual(parseModelJson('```json\n{"value":"khatm"}\n```'), { value: 'khatm' });
  assert.equal(parseModelJson('not json'), null);
});

test('explanation: numbers must all come from the supplied facts (Bengali and ASCII digits)', () => {
  const facts = JSON.stringify({ dailyAyahs: 30, minutes: 25, finish: '2027-01-12' });
  assert.deepEqual(numberTokens('দৈনিক ৩০ আয়াত'), ['30']);
  assert.equal(explanationUsesOnlyGivenNumbers('প্রতিদিন প্রায় ৩০ আয়াত, আনুমানিক ২৫ মিনিট।', facts), true);
  assert.equal(explanationUsesOnlyGivenNumbers('প্রতিদিন প্রায় 30 আয়াত পড়বে।', facts), true);
  assert.equal(explanationUsesOnlyGivenNumbers('প্রতিদিন প্রায় ৪০ আয়াত পড়বে।', facts), false);
  assert.equal(explanationUsesOnlyGivenNumbers('কোনো সংখ্যা ছাড়া একটি উৎসাহমূলক বাক্য।', facts), true);
});

test('sanitizeExplanation strips markdown and rejects invented figures or absurd lengths', () => {
  const facts = JSON.stringify({ d: 30 });
  const ok = sanitizeExplanation('**তোমার** পরিকল্পনায় প্রতিদিন আনুমানিক ৩০ আয়াত পড়তে হবে — ধীরে, নিয়মিত।', facts);
  assert.ok(ok && !ok.includes('*'));
  assert.equal(sanitizeExplanation('প্রতিদিন আনুমানিক ৯৯ আয়াত পড়তে হবে — ধীরে, নিয়মিত।', facts), null);
  assert.equal(sanitizeExplanation('ছোট', facts), null);
  assert.equal(sanitizeExplanation('ক'.repeat(1000), facts), null);
});
