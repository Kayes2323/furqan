'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Route, WifiOff, CheckCircle2 } from 'lucide-react';
import BackButton from '../BackButton';
import KhatmScreen from '../KhatmScreen';
import NazeraScreen from '../NazeraScreen';
import { PrimaryButton } from './ui';
import JourneyHero from './JourneyHero';
import JourneyPlanTab from './JourneyPlanTab';
import JourneyProgressTab from './JourneyProgressTab';
import JourneyInterview from './JourneyInterview';
import { useJourneyData } from './useJourneyData';
import { useIsDesktop } from '../../hooks/useViewport';
import { JOURNEY_TABS, type JourneyTab } from '../../lib/journey-types';
import { applyProposal, mirrorKhatmAdvance } from '../../lib/journey-apply';
import { isShared } from '../../lib/journey-today';
import type { Proposal } from '../../lib/journey-plan';

interface Props {
  tab: JourneyTab;
  onTabChange: (tab: JourneyTab) => void;
  onBack: () => void;
  onOpenReaderSurah: (surah: number, ayah?: number) => void;
  onOpenKhatmSetup: () => void;
  onOpenNazeraSetup: () => void;
}

const TAB_LABEL: Record<JourneyTab, string> = { plan: 'আমার পরিকল্পনা', khatm: 'খতম', nazera: 'নাযেরা', progress: 'অগ্রগতি' };

export default function QuranJourneyScreen({ tab, onTabChange, onBack, onOpenReaderSurah, onOpenKhatmSetup, onOpenNazeraSetup }: Props) {
  const data = useJourneyData();
  const isDesktop = useIsDesktop();
  const [planner, setPlanner] = useState<null | 'new' | 'edit'>(null);
  const [version, setVersion] = useState(0);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (noticeTimer.current) clearTimeout(noticeTimer.current); }, []);

  const flash = useCallback((kind: 'ok' | 'error', text: string) => {
    setNotice({ kind, text });
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 6000);
  }, []);

  const { index, khatm, nazera, journey, today, refresh, commit } = data;
  const sharedActive = isShared(journey, khatm, nazera);

  const openPlanner = useCallback((mode: 'new' | 'edit') => setPlanner(mode), []);
  const remountTabs = useCallback(() => { refresh(); setVersion((v) => v + 1); }, [refresh]);

  function confirmPlan(proposal: Proposal, note: string) {
    if (!index) return;
    try {
      const res = applyProposal({ proposal, index, today, existingKhatm: khatm, existingNazera: nazera, existingJourney: journey, note });
      commit({ khatm: res.khatm ?? undefined, nazera: res.nazera ?? undefined, journey: res.journey });
      setPlanner(null);
      setVersion((v) => v + 1);
      onTabChange('plan');
      flash('ok', 'পরিকল্পনা সংরক্ষিত হয়েছে। তোমার অগ্রগতি অক্ষুণ্ণ আছে।');
    } catch (e) {
      flash('error', e instanceof Error ? e.message : 'পরিকল্পনা সংরক্ষণ করা যায়নি। আবার চেষ্টা করো।');
    }
  }

  function onTabKey(e: React.KeyboardEvent, i: number) {
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % JOURNEY_TABS.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + JOURNEY_TABS.length) % JOURNEY_TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = JOURNEY_TABS.length - 1;
    if (next >= 0) {
      e.preventDefault();
      onTabChange(JOURNEY_TABS[next]);
      tabRefs.current[JOURNEY_TABS[next]]?.focus();
    }
  }

  const rootStyle = { paddingBottom: 28 } as React.CSSProperties;

  const header = (
    <header style={{ padding: isDesktop ? '32px 16px 14px' : '44px 16px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <BackButton onClick={onBack} variant="dark" label={undefined} />
      <div aria-hidden style={{ width: 42, height: 42, borderRadius: 14, flexShrink: 0, background: 'rgba(31,122,76,0.12)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Route size={21} strokeWidth={1.8} />
      </div>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ margin: 0, fontFamily: 'Noto Serif Bengali, serif', fontSize: 22, fontWeight: 600, color: 'var(--text)', lineHeight: 1.25 }}>কুরআন যাত্রা</h1>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>তোমার সময়, তোমার লক্ষ্য, তোমার গতিতে কুরআনের সঙ্গে এগিয়ে চলো।</p>
      </div>
    </header>
  );

  if (data.loadState === 'error') {
    return (
      <div className="qj-root" style={rootStyle}>
        {header}
        <div role="alert" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <WifiOff size={28} aria-hidden style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 13.5, marginBottom: 16, lineHeight: 1.7 }}>কুরআনের তথ্য লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করো। তোমার সংরক্ষিত অগ্রগতি অক্ষত আছে।</div>
          <PrimaryButton full={false} onClick={data.retry}>আবার চেষ্টা করো</PrimaryButton>
        </div>
      </div>
    );
  }

  if (planner && data.loadState === 'ready' && index) {
    return (
      <div className="qj-root" style={rootStyle}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {header}
          <JourneyInterview data={data} mode={planner} onClose={() => setPlanner(null)} onConfirm={confirmPlan} />
        </div>
      </div>
    );
  }

  const tabs = (
    <div role="tablist" aria-label="কুরআন যাত্রার বিভাগ" className="qj-tabs">
      {JOURNEY_TABS.map((t, i) => (
        <button
          key={t} ref={(el) => { tabRefs.current[t] = el; }}
          role="tab" id={`qj-tab-${t}`} aria-selected={tab === t} aria-controls={`qj-panel-${t}`}
          tabIndex={tab === t ? 0 : -1} className="qj-tab"
          onClick={() => onTabChange(t)} onKeyDown={(e) => onTabKey(e, i)}
        >{TAB_LABEL[t]}</button>
      ))}
    </div>
  );

  const ready = data.loadState === 'ready' && !!index;

  const panel = (
    <div role="tabpanel" id={`qj-panel-${tab}`} aria-labelledby={`qj-tab-${tab}`} tabIndex={0} style={{ outline: 'none' }}>
      {!ready ? (
        <div style={{ padding: '0 16px' }} aria-busy="true"><div className="qj-skeleton" style={{ height: 160 }} /></div>
      ) : tab === 'plan' ? (
        <JourneyPlanTab key={`plan-${version}`} data={data} onPlan={openPlanner} onOpenReader={onOpenReaderSurah} onGotoTab={onTabChange} onDataChanged={remountTabs} />
      ) : tab === 'khatm' ? (
        <KhatmScreen
          key={`khatm-${version}`} embedded onOpenSetup={onOpenKhatmSetup} onOpenReaderSurah={onOpenReaderSurah}
          onChange={refresh} sharedWithNazera={sharedActive} onOpenPlanner={() => openPlanner(journey ? 'edit' : 'new')}
          onAdvance={(prev, next) => {
            if (sharedActive && index) {
              const mirrored = mirrorKhatmAdvance(index, nazera, prev, next);
              if (mirrored && mirrored !== nazera) commit({ nazera: mirrored });
            }
          }}
        />
      ) : tab === 'nazera' ? (
        <NazeraScreen
          key={`nazera-${version}`} embedded onOpenSetup={onOpenNazeraSetup} onOpenReaderSurah={onOpenReaderSurah}
          onChange={refresh} sharedWithKhatm={sharedActive} onOpenKhatm={() => onTabChange('khatm')}
          onOpenPlanner={() => openPlanner(journey ? 'edit' : 'new')}
        />
      ) : (
        <JourneyProgressTab key={`progress-${version}`} data={data} />
      )}
    </div>
  );

  const hero = (
    <JourneyHero
      data={data} onStart={onOpenReaderSurah}
      hidePlanShortcut={tab === 'plan'} compact={!isDesktop && tab !== 'plan'} onOpenPlanTab={() => onTabChange('plan')} onOpenPlanner={() => openPlanner('new')} onDataChanged={remountTabs}
    />
  );

  const noticeEl = notice && (
    <div role={notice.kind === 'error' ? 'alert' : 'status'} style={{
      margin: '0 16px 12px', padding: '12px 14px', borderRadius: 14, fontSize: 13, lineHeight: 1.6, display: 'flex', gap: 8, alignItems: 'center',
      background: notice.kind === 'ok' ? 'rgba(31,122,76,0.1)' : 'rgba(179,54,44,0.1)',
      border: `1px solid ${notice.kind === 'ok' ? 'rgba(31,122,76,0.3)' : 'rgba(179,54,44,0.3)'}`, color: 'var(--text)',
    }}>
      {notice.kind === 'ok' && <CheckCircle2 size={16} color="var(--accent)" aria-hidden />}{notice.text}
    </div>
  );

  if (isDesktop) {
    return (
      <div className="qj-root" style={rootStyle}>
        {header}
        {noticeEl}
        <div style={{ display: 'grid', gridTemplateColumns: '340px minmax(0, 1fr)', gap: 8, alignItems: 'start' }}>
          <div style={{ position: 'sticky', top: 16 }}>{hero}</div>
          <div>{tabs}{panel}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="qj-root" style={rootStyle}>
      {header}
      {noticeEl}
      {hero}
      {tabs}
      {panel}
    </div>
  );
}
