import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildQuranIndex } from './quran-index.ts';
import type { SurahMeta } from './reader-types.ts';
import { loadJourneyPlan, saveJourneyPlan, clearJourneyPlan } from './journey-storage.ts';
import { loadPlan, savePlan } from './khatm-storage.ts';
import { loadProfile, saveProfile } from './nazera-storage.ts';
import { buildProposal } from './journey-plan.ts';
import { applyProposal } from './journey-apply.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX = buildQuranIndex(JSON.parse(readFileSync(join(__dirname, '..', '..', 'public', 'quran', 'meta.json'), 'utf-8')) as SurahMeta[]);

class MemoryStorage {
  data = new Map<string, string>();
  throwOnSet = false;
  getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null; }
  setItem(k: string, v: string) { if (this.throwOnSet) throw new Error('QuotaExceededError'); this.data.set(k, v); }
  removeItem(k: string) { this.data.delete(k); }
}
let store: MemoryStorage;
const g = globalThis as unknown as { window?: unknown; localStorage?: unknown };

beforeEach(() => { store = new MemoryStorage(); g.window = {}; g.localStorage = store; });
afterEach(() => { delete g.window; delete g.localStorage; });

function sample() {
  const proposal = buildProposal({
    goal: 'both', sharedReading: true, pace: 'sustainable', requestedDate: null, dailyMinutes: 30, lpm: 160, speedSource: 'user',
    slots: ['fajr', 'isha'], lightDays: [5], khatmCompleted: 0, nazeraPosition: 0, today: '2026-10-27',
  }, INDEX);
  return applyProposal({ proposal, index: INDEX, today: '2026-10-27', existingKhatm: null, existingNazera: null, existingJourney: null });
}

test('a saved journey plan round-trips exactly', () => {
  const { journey } = sample();
  assert.equal(saveJourneyPlan(journey), true);
  assert.deepEqual(loadJourneyPlan(), journey);
});

test('missing, corrupt, wrong-shape and future-version data load as null — and are never deleted', () => {
  assert.equal(loadJourneyPlan(), null);
  store.setItem('furqan_journey_plan', '{not json');
  assert.equal(loadJourneyPlan(), null);
  store.setItem('furqan_journey_plan', JSON.stringify({ schemaVersion: 2, id: 'x' }));
  assert.equal(loadJourneyPlan(), null);
  assert.equal(store.getItem('furqan_journey_plan'), JSON.stringify({ schemaVersion: 2, id: 'x' }));
});

test('a failing write (quota/private mode) reports false instead of throwing', () => {
  store.throwOnSet = true;
  assert.equal(saveJourneyPlan(sample().journey), false);
});

test('no window (SSR) is safe', () => {
  delete g.window;
  assert.equal(loadJourneyPlan(), null);
  assert.equal(saveJourneyPlan(sample().journey), false);
  clearJourneyPlan();
});

test('journey storage uses its own key and never touches the Khatm / Nazera / reader records', () => {
  const { khatm, nazera, journey } = sample();
  savePlan(khatm!);
  saveProfile(nazera!);
  store.setItem('furqan_reader_last_read', JSON.stringify({ surah: 18, ayah: 10, updatedAt: '2026-10-01' }));
  const before = new Map(store.data);
  saveJourneyPlan(journey);
  for (const [k, v] of before) assert.equal(store.getItem(k), v, `${k} must be untouched`);
  clearJourneyPlan();
  for (const [k, v] of before) assert.equal(store.getItem(k), v, `${k} must survive clearing the journey plan`);
  assert.deepEqual(loadPlan(), khatm);
  assert.deepEqual(loadProfile(), nazera);
});

test('existing users: Khatm and Nazera records written by the OLD app load unchanged (no migration needed)', () => {
  const legacyKhatm = { id: 'khatm-1', createdAt: '2026-09-01T00:00:00.000Z', mode: 'targetDate', startDate: '2026-09-01', targetDate: '2026-12-01', scheduleStyle: 'fivePrayers', status: 'active', completedAyahs: 1234, history: [{ date: '2026-09-02', ayahsRead: 70 }], rescheduleLog: [], dayAnchor: null };
  const legacyNazera = { id: 'nazera-1', createdAt: '2026-09-01T00:00:00.000Z', targetMode: 'sessions', dailyAyahTarget: 10, dailySessionTarget: 2, ayahsPerSession: 10, position: 456, history: [], dayAnchor: null };
  store.setItem('furqan_khatm_plan', JSON.stringify(legacyKhatm));
  store.setItem('furqan_nazera_profile', JSON.stringify(legacyNazera));
  assert.deepEqual(loadPlan(), legacyKhatm);
  assert.deepEqual(loadProfile(), legacyNazera);
  assert.equal(loadJourneyPlan(), null); // no journey plan yet — and that is a fully supported state
});

test('a plan saved by the journey keeps working after a "reload" (re-read from storage)', () => {
  const { khatm, nazera, journey } = sample();
  savePlan(khatm!); saveProfile(nazera!); saveJourneyPlan(journey);
  const again = { khatm: loadPlan(), nazera: loadProfile(), journey: loadJourneyPlan() };
  assert.equal(again.khatm!.completedAyahs, 0);
  assert.deepEqual(again.khatm!.prayerSlots, ['fajr', 'isha']);
  assert.equal(again.nazera!.dailyAyahTarget, journey.assumptions.nazeraDailyAyahs);
  assert.equal(again.journey!.sharedReading, true);
});
