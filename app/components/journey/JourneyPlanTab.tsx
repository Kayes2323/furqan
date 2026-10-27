'use client';

import { useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, MessageCircle, Pause, Pencil, RefreshCw, Sparkles, PartyPopper } from 'lucide-react';
import { Card, ConfirmDialog, PrimaryButton, SecondaryButton, SectionTitle, TextButton } from './ui';
import { rangeText } from './JourneyHero';
import type { JourneyData } from './useJourneyData';
import { activeSlots, addDays, pausePlan, reschedulePlan, slotRanges, todayKey } from '../../lib/khatm-plan';
import { slotLabel } from '../../lib/journey-interview';
import { calibratedLpm, formatDateBn, buildProposal, WEEKDAYS_BN, formatRefBn } from '../../lib/journey-plan';
import { suggestAdjustment, lightSessionAyahs, type Suggestion } from '../../lib/journey-adapt';
import { globalToRef } from '../../lib/quran-index';
import { nextRef } from '../../lib/nazera-plan';
import { isShared } from '../../lib/journey-today';
import type { JourneyPlan } from '../../lib/journey-types';

interface Props {
  data: JourneyData;
  onPlan: (mode: 'new' | 'edit') => void;
  onOpenReader: (surah: number, ayah?: number) => void;
  onGotoTab: (t: 'khatm' | 'nazera') => void;
  onDataChanged: () => void;
}

export default function JourneyPlanTab({ data, onPlan, onOpenReader, onGotoTab, onDataChanged }: Props) {
  const { index, khatm, nazera, journey, surahNames, today } = data;
  const [dismissed, setDismissed] = useState(false);
  const [dialog, setDialog] = useState<null | 'pause' | 'extend' | 'suggestion'>(null);

  const suggestion: Suggestion | null = useMemo(
    () => (index && !dismissed ? suggestAdjustment({ index, khatm, journey, today }) : null),
    [index, khatm, journey, today, dismissed],
  );

  const live = useMemo(() => {
    if (!index || !journey) return null;
    const useDate = journey.pace === 'deadline' && journey.targetDate && journey.targetDate >= today ? journey.targetDate : null;
    const cal = calibratedLpm(journey.sessionLog);
    return buildProposal({
      goal: journey.goal, sharedReading: journey.sharedReading, pace: useDate ? 'deadline' : 'sustainable', requestedDate: useDate,
      dailyMinutes: journey.dailyMinutes, lpm: cal ?? journey.lettersPerMinute, speedSource: cal ? 'calibrated' : journey.speedSource,
      slots: journey.slots, lightDays: journey.lightDays, khatmCompleted: khatm?.completedAyahs ?? 0, nazeraPosition: nazera?.position ?? 0, today,
    }, index);
  }, [index, journey, khatm, nazera, today]);

  if (!index) return null;

  // ── no personal plan yet ──
  if (!journey) {
    const have = [khatm ? 'খতম' : null, nazera ? 'নাযেরা' : null].filter(Boolean).join(' ও ');
    return (
      <div style={{ padding: '0 16px' }}>
        <Card style={{ padding: '22px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div aria-hidden style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(31,122,76,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} color="var(--accent)" />
            </div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text)' }}>তোমার নিজের পরিকল্পনা</div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: have ? 16 : 12 }}>
            {have
              ? `তোমার চলমান ${have}-এর অগ্রগতি যেমন আছে তেমনই থাকবে। NUR কয়েকটি প্রশ্ন করে সময়সূচি আরও সহজ করে দিতে পারে।`
              : 'পরিকল্পনায় থাকবে: তোমার লক্ষ্য, দৈনিক পড়ার পরিমাণ, পড়ার সময়, আর আনুমানিক শেষ তারিখ — সবই তোমার সময়ের সঙ্গে মিলিয়ে, বদলানো যায়।'}
          </div>
          {have && <PrimaryButton onClick={() => onPlan('new')}><MessageCircle size={17} aria-hidden />NUR-এর সঙ্গে পরিকল্পনা বানাও</PrimaryButton>}
        </Card>
        {!have && (
          <div style={{ marginTop: 14, textAlign: 'center', fontSize: 12.5, color: 'var(--text-muted)' }}>
            নিজে ঠিক করতে চাও? <TextButton onClick={() => onGotoTab('khatm')}>খতম</TextButton> বা <TextButton onClick={() => onGotoTab('nazera')}>নাযেরা</TextButton> ট্যাব দেখো।
          </div>
        )}
      </div>
    );
  }

  const shared = isShared(journey, khatm, nazera);
  const goalLabel = journey.goal === 'both' ? 'খতম ও নাযেরা' : journey.goal === 'khatm' ? 'খতম' : 'নাযেরা';
  const khatmDone = khatm?.status === 'completed';
  const paused = khatm?.status === 'paused';
  const slots = khatm && khatm.status === 'active' ? slotRanges(index, khatm) : [];
  const slotNames = khatm ? activeSlots(khatm) : [];
  const khatmNext = khatm && khatm.completedAyahs < index.totalAyahs ? globalToRef(index, khatm.completedAyahs + 1) : null;
  const nazeraNext = nazera ? nextRef(index, nazera) : null;
  const lightN = khatm ? lightSessionAyahs(index, khatm.completedAyahs, journey.lettersPerMinute) : 0;

  function writeJourney(patch: Partial<JourneyPlan>, note: string) {
    const next: JourneyPlan = {
      ...journey!, ...patch, updatedAt: new Date().toISOString(),
      adjustments: [...journey!.adjustments, { date: todayKey(), note }].slice(-30),
    };
    return next;
  }

  function applySuggestion() {
    if (!suggestion || !khatm) return;
    const t = todayKey();
    const nextKhatm = reschedulePlan(khatm, { mode: 'targetDate', targetDate: suggestion.proposal.targetDate }, t, 'user-adjusted');
    const nextJourney = writeJourney(
      { dailyMinutes: suggestion.proposal.dailyMinutes, assumptions: { ...journey!.assumptions, estimatedKhatmCompletion: suggestion.proposal.targetDate } },
      `NUR-এর পরামর্শে তারিখ ${suggestion.proposal.targetDate} করা হয়েছে`,
    );
    data.commit({ khatm: nextKhatm, journey: nextJourney });
    onDataChanged();
    setDialog(null);
  }

  function extendWeek() {
    if (!khatm) return;
    const t = todayKey();
    const date = addDays(khatm.targetDate, 7);
    data.commit({
      khatm: reschedulePlan(khatm, { mode: 'targetDate', targetDate: date }, t, 'user-adjusted'),
      journey: writeJourney({ assumptions: { ...journey!.assumptions, estimatedKhatmCompletion: date } }, 'ব্যস্ত সপ্তাহের জন্য তারিখ 7 দিন বাড়ানো হয়েছে'),
    });
    onDataChanged();
    setDialog(null);
  }

  function pauseNow() {
    if (!khatm) return;
    data.commit({ khatm: pausePlan(khatm, todayKey()), journey: writeJourney({}, 'খতম বিরতিতে রাখা হয়েছে') });
    onDataChanged();
    setDialog(null);
  }

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {khatmDone && (
        <Card style={{ textAlign: 'center' }}>
          <PartyPopper size={30} color="var(--accent)" aria-hidden />
          <div style={{ fontSize: 15, fontWeight: 700, margin: '8px 0 4px', color: 'var(--text)' }}>আলহামদুলিল্লাহ! খতম সম্পন্ন হয়েছে</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 14 }}>চাইলে নতুন একটি যাত্রার পরিকল্পনা করতে পারো।</div>
          <PrimaryButton onClick={() => onPlan('new')}>নতুন পরিকল্পনা বানাও</PrimaryButton>
        </Card>
      )}

      {paused && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: 'rgba(150,112,42,0.1)', border: '1px solid rgba(150,112,42,0.22)', fontSize: 12.5, color: 'var(--text)' }}>
          <Pause size={16} color="var(--gold)" aria-hidden />
          <span style={{ flex: 1 }}>পরিকল্পনা বিরতিতে আছে। আবার শুরু করলে লক্ষ্য তারিখ বিরতির দিনসংখ্যা অনুযায়ী পিছিয়ে যাবে।</span>
        </div>
      )}

      {suggestion && (
        <Card label="NUR-এর পরামর্শ" style={{ borderColor: 'rgba(31,122,76,0.35)', background: 'rgba(31,122,76,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Sparkles size={15} color="var(--accent)" aria-hidden />
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{suggestion.title}</div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 14 }}>{suggestion.body}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <PrimaryButton full={false} style={{ flex: 1 }} onClick={() => setDialog('suggestion')}>এভাবে বদলাও</PrimaryButton>
            <SecondaryButton full={false} style={{ flex: 1 }} onClick={() => setDismissed(true)}>এখন নয়</SecondaryButton>
          </div>
        </Card>
      )}

      <Card label="তোমার লক্ষ্য">
        <SectionTitle>তোমার লক্ষ্য</SectionTitle>
        <dl style={{ margin: 0 }}>
          <Row k="কী পড়ছো" v={goalLabel + (journey.goal === 'both' ? (shared ? ' — একই পড়া দুটোতেই গণনা' : ' — আলাদা সেশন') : '')} />
          <Row k="গতি" v={journey.pace === 'deadline' && journey.targetDate ? `${formatDateBn(journey.targetDate)}-এর মধ্যে` : 'নিজের গতিতে, টেকসই হারে'} />
          {khatm && !khatmDone && <Row k="খতম — লক্ষ্য তারিখ (আনুমানিক)" v={formatDateBn(khatm.targetDate)} />}
          {journey.assumptions.requestedTargetDate && khatm && journey.assumptions.requestedTargetDate !== khatm.targetDate && journey.pace === 'deadline' && (
            <Row k="তুমি চেয়েছিলে" v={`${formatDateBn(journey.assumptions.requestedTargetDate)} (সময়ে কুলোত না, তাই বদলানো)`} />
          )}
        </dl>
      </Card>

      <Card label="আজ কী করবে">
        <SectionTitle hint={khatm?.scheduleStyle === 'fivePrayers' ? 'আজকের অংশ ওয়াক্ত অনুযায়ী ভাগ করা' : undefined}>আজ কী করবে</SectionTitle>
        {khatm && khatm.status === 'active' && slots.length > 0 && khatm.scheduleStyle === 'fivePrayers' ? (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {slots.map((r, i) => {
              const done = i < (khatm.dayAnchor?.slotsCompleted ?? 0);
              return (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: done ? 'rgba(31,122,76,0.07)' : 'var(--bg)' }}>
                  {done ? <CheckCircle2 size={17} color="var(--accent)" aria-label="সম্পন্ন" /> : <span aria-hidden style={{ width: 17, height: 17, borderRadius: '50%', border: '1.5px solid var(--text-light)' }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>{slotLabel(slotNames[i] ?? 'fajr')}-এর পর</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rangeText(r, surahNames)} · {r.count} আয়াত</div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            {khatm && khatm.status === 'active' && slots[0]
              ? <>খতম: <b style={{ color: 'var(--text)' }}>{rangeText({ ...slots[0], end: slots[slots.length - 1].end, endGlobal: slots[slots.length - 1].endGlobal, count: slots.reduce((a, s) => a + s.count, 0) }, surahNames)}</b></>
              : khatm ? 'খতমের আজকের অংশ নেই।' : null}
            {nazera && !shared && nazeraNext && <div>নাযেরা: পরের জায়গা <b style={{ color: 'var(--text)' }}>{formatRefBn(nazeraNext, surahNames)}</b> থেকে</div>}
            {shared && <div>একই পড়া নাযেরাতেও গণনা হবে।</div>}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: 12 }}>
          {khatm && <TextButton onClick={() => onGotoTab('khatm')} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}>খতমের বিস্তারিত →</TextButton>}
          {nazera && <TextButton onClick={() => onGotoTab('nazera')} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}>নাযেরার বিস্তারিত →</TextButton>}
        </div>
      </Card>

      <Card label="পরিকল্পনার বিবরণ">
        <SectionTitle>পরিকল্পনার বিবরণ</SectionTitle>
        <dl style={{ margin: 0 }}>
          {khatmNext && <Row k="খতম — শুরুর অবস্থান" v={`${formatRefBn(khatmNext, surahNames)} থেকে`} />}
          {nazeraNext && <Row k="নাযেরা — শুরুর অবস্থান" v={`${formatRefBn(nazeraNext, surahNames)} থেকে`} />}
          <Row k="দৈনিক সময়" v={`প্রায় ${journey.dailyMinutes} মিনিট`} />
          {journey.assumptions.khatmDailyAyahs !== null && <Row k="খতম — দৈনিক লক্ষ্য" v={`≈ ${journey.assumptions.khatmDailyAyahs} আয়াত`} />}
          {journey.assumptions.nazeraDailyAyahs !== null && <Row k="নাযেরা — দৈনিক লক্ষ্য" v={`≈ ${journey.assumptions.nazeraDailyAyahs} আয়াত`} />}
          <Row k="পড়ার সময়" v={journey.slots === 'single' ? 'একবারে একটি সেশন' : journey.slots.map(slotLabel).join(' · ') + '-এর পর'} />
          <Row k="ব্যস্ত দিন" v={journey.lightDays.length ? journey.lightDays.map((d) => WEEKDAYS_BN[d]).join(', ') : 'নির্দিষ্ট করা নেই'} />
        </dl>
        <details style={{ marginTop: 10 }}>
          <summary style={{ minHeight: 44, display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>হিসাবের অনুমানগুলো দেখো</summary>
          <ul style={{ margin: '0 0 6px', paddingLeft: 18, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            {(live?.assumptions ?? []).map((a, i) => <li key={i}>{a}</li>)}
            <li>এই পরিকল্পনা ও অগ্রগতি শুধু এই ডিভাইসে সংরক্ষিত — অ্যাকাউন্ট বা ক্লাউড সিঙ্ক নেই।</li>
          </ul>
        </details>
      </Card>

      {!khatmDone && (
        <Card label="ব্যস্ত হলে কী করবে">
          <SectionTitle hint="ছুটে যাওয়া দিনের পড়া পরের দিনে চাপিয়ে দেওয়া হয় না — বাকিটুকু সামনের দিনগুলোয় সমানভাবে ছড়িয়ে যায়।">ব্যস্ত হলে কী করবে</SectionTitle>
          {khatm && khatm.status === 'active' && lightN > 0 && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 12 }}>
              খুব ব্যস্ত দিনে মাত্র প্রায় 5 মিনিট (≈ {lightN} আয়াত) পড়লেও অভ্যাস বেঁচে থাকে। এটি ঐচ্ছিক — লক্ষ্যে যোগ হয় না।
              <div style={{ marginTop: 8 }}>
                <SecondaryButton full={false} onClick={() => khatmNext && onOpenReader(khatmNext.surah, khatmNext.ayah)}>হালকা সেশন পড়ো</SecondaryButton>
              </div>
            </div>
          )}
          {khatm && khatm.status === 'active' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <SecondaryButton full={false} style={{ flex: '1 1 150px' }} onClick={() => setDialog('extend')}><CalendarClock size={15} aria-hidden />তারিখ 7 দিন বাড়াও</SecondaryButton>
              <SecondaryButton full={false} style={{ flex: '1 1 150px' }} onClick={() => setDialog('pause')}><Pause size={15} aria-hidden />বিরতি দাও</SecondaryButton>
            </div>
          )}
          {!khatm && <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>নাযেরা নমনীয় — কোনো দিন না পারলে পরের দিন আবার শুরু করো; কিছু জমে থাকে না।</div>}
        </Card>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <SecondaryButton full={false} style={{ flex: 1 }} onClick={() => onPlan('edit')}><Pencil size={15} aria-hidden />পরিকল্পনা সম্পাদনা</SecondaryButton>
        <SecondaryButton full={false} style={{ flex: 1 }} onClick={() => onPlan('new')}><RefreshCw size={15} aria-hidden />নতুন করে বানাও</SecondaryButton>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6, padding: '0 8px' }}>
        নতুন করে বানালে আগে তোমার অনুমতি চাওয়া হবে — অগ্রগতি, বুকমার্ক ও ইতিহাস অক্ষুণ্ণ থাকবে।
      </div>

      {dialog === 'suggestion' && suggestion && (
        <ConfirmDialog
          title="পরিকল্পনা বদলাবে?"
          body={<>লক্ষ্য তারিখ হবে <b>{formatDateBn(suggestion.proposal.targetDate)}</b> (আনুমানিক), দৈনিক সময় প্রায় {suggestion.proposal.dailyMinutes} মিনিট। তোমার অগ্রগতি অপরিবর্তিত থাকবে।</>}
          confirmLabel="হ্যাঁ, বদলাও" onCancel={() => setDialog(null)} onConfirm={applySuggestion}
        />
      )}
      {dialog === 'extend' && khatm && (
        <ConfirmDialog
          title="তারিখ 7 দিন বাড়াবে?"
          body={<>খতমের লক্ষ্য তারিখ {formatDateBn(khatm.targetDate)} থেকে <b>{formatDateBn(addDays(khatm.targetDate, 7))}</b> হবে এবং দৈনিক পড়া একটু কমে যাবে। অগ্রগতি অপরিবর্তিত।</>}
          confirmLabel="তারিখ বাড়াও" onCancel={() => setDialog(null)} onConfirm={extendWeek}
        />
      )}
      {dialog === 'pause' && (
        <ConfirmDialog
          title="খতম বিরতি দেবে?"
          body="অগ্রগতি সংরক্ষিত থাকবে। আবার শুরু করলে লক্ষ্য তারিখ বিরতির দিনসংখ্যা অনুযায়ী পিছিয়ে যাবে — কোনো বাড়তি চাপ পড়বে না।"
          confirmLabel="বিরতি দাও" onCancel={() => setDialog(null)} onConfirm={pauseNow}
        />
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <dt style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{k}</dt>
      <dd style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--text)', textAlign: 'right' }}>{v}</dd>
    </div>
  );
}
