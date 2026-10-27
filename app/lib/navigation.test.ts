import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paramsToRoute, routeToUrl, routesEqual, isValidScreen, isLegacyJourneyScreen } from './navigation.ts';

const route = (qs: string) => paramsToRoute(new URLSearchParams(qs));

test('the unified destination is a valid screen; the old standalone ones are no longer screens', () => {
  assert.equal(isValidScreen('quran-journey'), true);
  assert.equal(isValidScreen('khatm'), false);
  assert.equal(isValidScreen('nazera'), false);
});

test('?s=khatm and ?s=nazera deep links land in the matching Quran Journey tab', () => {
  assert.deepEqual(route('s=khatm'), { screen: 'quran-journey', journeyTab: 'khatm' });
  assert.deepEqual(route('s=nazera'), { screen: 'quran-journey', journeyTab: 'nazera' });
  assert.equal(isLegacyJourneyScreen('khatm'), true);
  assert.equal(isLegacyJourneyScreen('nazera'), true);
  assert.equal(isLegacyJourneyScreen('khatm-setup'), false);
  assert.equal(isLegacyJourneyScreen(null), false);
  // the redirect target is canonical, so the hook can replace the URL with it
  assert.equal(routeToUrl(route('s=khatm')), '/?s=quran-journey&jt=khatm');
});

test('Object.prototype keys are not mistaken for legacy screens', () => {
  assert.equal(isLegacyJourneyScreen('constructor'), false);
  assert.equal(isLegacyJourneyScreen('__proto__'), false);
  assert.equal(route('s=constructor').screen, 'home');
});

test('quran-journey: every tab round-trips; unknown or missing tab falls back to the plan tab', () => {
  for (const tab of ['plan', 'khatm', 'nazera', 'progress'] as const) {
    const r = route(`s=quran-journey&jt=${tab}`);
    assert.equal(r.journeyTab, tab);
    assert.deepEqual(route(routeToUrl(r).slice(2)), r);
  }
  assert.equal(route('s=quran-journey').journeyTab, 'plan');
  assert.equal(route('s=quran-journey&jt=bogus').journeyTab, 'plan');
});

test('the tab is only serialised for the journey screen, and tabs make routes unequal', () => {
  assert.equal(routeToUrl({ screen: 'home', journeyTab: 'khatm' }), '/?s=home');
  assert.equal(routesEqual({ screen: 'quran-journey', journeyTab: 'khatm' }, { screen: 'quran-journey', journeyTab: 'nazera' }), false);
});

test('setup screens (full-screen forms) stay reachable as before', () => {
  assert.deepEqual(route('s=khatm-setup'), { screen: 'khatm-setup' });
  assert.deepEqual(route('s=nazera-setup'), { screen: 'nazera-setup' });
});

test('unrelated routes are unaffected (reader deep link keeps its params)', () => {
  assert.deepEqual(route('s=reader-surah&rsurah=18&rayah=10'), { screen: 'reader-surah', readerSurah: 18, readerAyah: 10 });
  assert.deepEqual(route(''), { screen: 'home' });
});
