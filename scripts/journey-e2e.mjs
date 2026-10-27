// Browser tests for Quran Journey (কুরআন যাত্রা).
// Usage: start the app (`npm run dev` or `npm run build && npm start`), then
//   BASE_URL=http://localhost:3000 npm run test:e2e
// Exits non-zero on the first failed check.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const J = `${BASE}/?s=quran-journey`;
const results = [];
const errors = [];

async function check(name, fn) {
  try {
    await fn();
    results.push(['ok', name]);
    console.log('ok  ', name);
  } catch (e) {
    results.push(['FAIL', name]);
    console.log('FAIL', name, '\n    ', e.message.split('\n').slice(0,6).join(' / '));
  }
}

const store = (p) => p.evaluate(() => ({
  k: JSON.parse(localStorage.getItem('furqan_khatm_plan') || 'null'),
  n: JSON.parse(localStorage.getItem('furqan_nazera_profile') || 'null'),
  j: JSON.parse(localStorage.getItem('furqan_journey_plan') || 'null'),
  r: localStorage.getItem('furqan_reader_last_read'),
}));
const click = async (p, name) => { await p.getByRole('button', { name, exact: false }).first().click(); await p.waitForTimeout(200); };
const noHScroll = (p) => p.evaluate(() => {
  const els = [...document.querySelectorAll('div')].filter((d) => getComputedStyle(d).overflowY === 'auto' || getComputedStyle(d).overflowX === 'hidden');
  return !els.some((d) => d.scrollWidth > d.clientWidth + 1);
});

async function open(browser, { viewport, init }) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
  if (init) await page.addInitScript(init);
  return { ctx, page };
}

const browser = await chromium.launch();
const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

// ── navigation & deep links ──────────────────────────────────────────
{
  const { ctx, page } = await open(browser, { viewport: MOBILE });
  await check('deep link ?s=khatm redirects into Quran Journey → খতম tab', async () => {
    await page.goto(`${BASE}/?s=khatm`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => location.search.includes('s=quran-journey'));
    assert.match(page.url(), /s=quran-journey&jt=khatm/);
    assert.equal(await page.getByRole('tab', { name: 'খতম' }).getAttribute('aria-selected'), 'true');
  });
  await check('deep link ?s=nazera redirects into the নাযেরা tab', async () => {
    await page.goto(`${BASE}/?s=nazera`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => location.search.includes('s=quran-journey'));
    assert.equal(await page.getByRole('tab', { name: 'নাযেরা' }).getAttribute('aria-selected'), 'true');
  });
  await check('কুরআন hub has ONE কুরআন যাত্রা entry and no separate খতম / নাযেরা entries', async () => {
    await page.goto(`${BASE}/?s=quran-hub`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    assert.equal(await page.getByText('কুরআন যাত্রা', { exact: true }).count(), 1);
    assert.equal(await page.getByText('খতম পরিকল্পনা', { exact: true }).count(), 0);
    assert.equal(await page.getByText('নাযেরা', { exact: true }).count(), 0);
    await page.getByText('কুরআন যাত্রা', { exact: true }).click();
    await page.waitForFunction(() => location.search.includes('s=quran-journey'));
  });
  await check('primary nav still highlights কুরআন inside the journey and has no extra item', async () => {
    const nav = page.getByRole('navigation', { name: 'প্রধান নেভিগেশন' });
    assert.equal(await nav.getByRole('button').count(), 5);
  });
  await check('all four sections are reachable by tab and by arrow keys', async () => {
    await page.getByRole('tab', { name: 'আমার পরিকল্পনা' }).focus();
    for (const name of ['খতম', 'নাযেরা', 'অগ্রগতি']) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(250);
      assert.equal(await page.getByRole('tab', { name }).getAttribute('aria-selected'), 'true');
    }
  });
  await ctx.close();
}

// ── empty state, mobile layout ───────────────────────────────────────
{
  const { ctx, page } = await open(browser, { viewport: MOBILE });
  await page.goto(J, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await check('empty state offers পরিকল্পনা তৈরি করো and a reader fallback; no horizontal scroll on mobile', async () => {
    assert.ok(await page.getByRole('button', { name: 'পরিকল্পনা তৈরি করো' }).count());
    assert.ok(await page.getByRole('button', { name: 'কুরআন রিডার খোলো' }).count());
    assert.ok(await noHScroll(page));
  });
  await ctx.close();
}

// ── NUR planning flow → shared reading → persistence ─────────────────
{
  const { ctx, page } = await open(browser, { viewport: MOBILE });
  await page.goto(J, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await click(page, 'পরিকল্পনা তৈরি করো');
  await check('NUR asks one question at a time and adapts (Nazera-start is skipped when reading is shared)', async () => {
    await click(page, 'দুটোই');
    await click(page, 'নিজের গতিতে');
    assert.ok(await page.getByText('একই পড়া কি দুটোতেই গণনা হবে').count(), 'sharing question asked for "both"');
    await click(page, 'একই পড়া দুটোতেই');
    assert.equal(await page.getByText('নাযেরা কোথা থেকে শুরু করবে').count(), 0);
    await click(page, '30 মিনিট');
    await click(page, 'পাঁচ ওয়াক্ত');
    await click(page, 'কোনো নির্দিষ্ট দিন নেই');
    await click(page, 'মাঝারি');
  });
  await check('nothing is saved before the user confirms', async () => {
    const s = await store(page);
    assert.equal(s.j, null); assert.equal(s.k, null); assert.equal(s.n, null);
    assert.ok(await page.getByRole('button', { name: 'এই পরিকল্পনা সংরক্ষণ করো' }).count());
  });
  await check('review states estimates as estimates and lists assumptions', async () => {
    assert.ok(await page.getByText('আনুমানিক').count());
    await page.getByText('এই হিসাবের অনুমানগুলো দেখো').click();
    assert.ok(await page.getByText('শুধু এই ডিভাইসে').count());
  });
  await click(page, 'এই পরিকল্পনা সংরক্ষণ করো');
  await page.waitForTimeout(600);
  let before;
  await check('saved: Khatm + Nazera records created with the same target, journey plan stored', async () => {
    before = await store(page);
    assert.equal(before.j.goal, 'both'); assert.equal(before.j.sharedReading, true);
    assert.equal(before.k.dayAnchor.target, before.n.dailyAyahTarget);
    assert.equal(before.k.completedAyahs, 0); assert.equal(before.n.position, 0);
  });
  await check('shared completion advances BOTH by the same ayahs, once (second tap impossible)', async () => {
    await click(page, 'পড়া শেষ — সম্পন্ন করো');
    const s = await store(page);
    assert.equal(s.k.completedAyahs, before.k.dayAnchor.target);
    assert.equal(s.n.position, s.k.completedAyahs);
    assert.equal(await page.getByRole('button', { name: 'পড়া শেষ — সম্পন্ন করো' }).count(), 0);
    assert.ok(await page.getByText('আজকের পড়া সম্পন্ন').count());
  });
  await check('undo restores the exact previous state', async () => {
    await click(page, 'ভুল হলে ফিরিয়ে আনো');
    const s = await store(page);
    assert.equal(s.k.completedAyahs, 0); assert.equal(s.n.position, 0);
    await click(page, 'পড়া শেষ — সম্পন্ন করো');
  });
  await check('progress survives a full reload and tab navigation; Khatm/Nazera stay separate records', async () => {
    const s1 = await store(page);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    for (const t of ['খতম', 'নাযেরা', 'অগ্রগতি', 'আমার পরিকল্পনা']) await page.getByRole('tab', { name: t }).click();
    const s2 = await store(page);
    assert.equal(s2.k.completedAyahs, s1.k.completedAyahs);
    assert.equal(s2.n.position, s1.n.position);
    assert.notEqual(s2.k.id, s2.n.id);
  });
  await check('Nazera tab is read-only in shared mode (no second completion button)', async () => {
    await page.getByRole('tab', { name: 'নাযেরা' }).click();
    assert.equal(await page.getByRole('button', { name: 'আজকের অংশ সম্পন্ন করুন' }).count(), 0);
    assert.ok(await page.getByText('একই পড়া খতম ও নাযেরা').count());
  });
  await check('editing an existing plan asks for confirmation before replacing it', async () => {
    await page.getByRole('tab', { name: 'আমার পরিকল্পনা' }).click();
    await click(page, 'পরিকল্পনা সম্পাদনা');
    await page.waitForTimeout(800);
    await click(page, 'এই পরিকল্পনা সংরক্ষণ করো');
    assert.equal(await page.getByRole('dialog').count(), 1);
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(), 0);
  });
  await ctx.close();
}

// ── existing users: legacy progress is preserved ─────────────────────
{
  const init = () => {
    const d = new Date();
    const k = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    if (!localStorage.getItem('seeded')) {
      localStorage.setItem('seeded', '1');
      localStorage.setItem('furqan_khatm_plan', JSON.stringify({ id: 'k-old', createdAt: new Date().toISOString(), mode: 'targetDate', startDate: k(new Date(d.getTime() - 5 * 864e5)), targetDate: k(new Date(d.getTime() + 60 * 864e5)), scheduleStyle: 'fivePrayers', status: 'active', completedAyahs: 777, history: [], rescheduleLog: [], dayAnchor: null }));
      localStorage.setItem('furqan_nazera_profile', JSON.stringify({ id: 'n-old', createdAt: new Date().toISOString(), targetMode: 'sessions', dailyAyahTarget: 10, dailySessionTarget: 2, ayahsPerSession: 10, position: 321, history: [{ date: '2026-01-01', progress: 2, target: 2, metTarget: true }], dayAnchor: null }));
      localStorage.setItem('furqan_reader_last_read', JSON.stringify({ surah: 18, ayah: 10, updatedAt: '2026-10-01' }));
    }
  };
  const { ctx, page } = await open(browser, { viewport: DESKTOP, init });
  await page.goto(J, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await check('existing Khatm + Nazera show up with no journey plan, and nothing is changed by visiting', async () => {
    const s = await store(page);
    assert.equal(s.k.completedAyahs, 777); assert.equal(s.n.position, 321);
    assert.equal(s.n.targetMode, 'sessions');
    assert.equal(s.j, null);
    assert.equal(JSON.parse(s.r).surah, 18);
    assert.ok(await page.getByText('আজকের পড়া শুরু করো').count());
  });
  await check('desktop: two-column layout, sidebar present, no horizontal scroll', async () => {
    assert.ok(await page.getByRole('navigation', { name: 'প্রধান নেভিগেশন' }).count());
    assert.ok(await noHScroll(page));
  });
  await check('Khatm tab: pause needs confirmation and keeps progress; resume is one tap', async () => {
    await page.getByRole('tab', { name: 'খতম' }).click();
    await page.getByRole('button', { name: 'বিরতি দিন', exact: true }).click();
    const dialog = page.getByRole('dialog');
    assert.equal(await dialog.count(), 1);
    assert.equal((await store(page)).k.status, 'active', 'nothing changes before confirming');
    await dialog.getByRole('button', { name: 'বিরতি দিন', exact: true }).click();
    await page.waitForTimeout(300);
    let s = await store(page);
    assert.equal(s.k.status, 'paused');
    assert.equal(s.k.completedAyahs, 777);
    await page.getByRole('button', { name: 'চালু করুন' }).first().click();
    await page.waitForTimeout(300);
    s = await store(page);
    assert.equal(s.k.status, 'active');
    assert.equal(s.k.completedAyahs, 777);
  });
  await check('the reader’s own last-read position is untouched by the journey', async () => {
    assert.equal(JSON.parse((await store(page)).r).ayah, 10);
  });
  await ctx.close();
}

// ── error state ──────────────────────────────────────────────────────
{
  const { ctx, page } = await open(browser, { viewport: MOBILE });
  await page.route('**/quran/meta.json', (r) => r.abort());
  await page.goto(J, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  await check('dataset failure shows a clear error with retry, without losing saved progress', async () => {
    assert.ok(await page.getByRole('alert').getByText('লোড করা যায়নি').count());
    await page.unroute('**/quran/meta.json');
    await click(page, 'আবার চেষ্টা করো');
    await page.waitForTimeout(1500);
    assert.ok(await page.getByRole('tablist').count());
  });
  await ctx.close();
}

await browser.close();

const failed = results.filter(([s]) => s === 'FAIL');
const realErrors = errors.filter((e) => !/net::ERR_FAILED|Failed to fetch|AbortError/.test(e));
if (realErrors.length) console.log('\nUnexpected browser errors:\n' + realErrors.join('\n'));
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length || realErrors.length ? 1 : 0);
