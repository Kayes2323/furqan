'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, Info, RotateCw, WifiOff } from 'lucide-react';
import BackButton from './BackButton';
import { loadSurahMeta } from '../lib/reader-data';
import { loadPlan, savePlan } from '../lib/khatm-storage';
import {
  buildQuranIndex, createPlan, reschedulePlan, validateCreateParams,
  ensureDayAnchor, todayKey, addDays,
} from '../lib/khatm-plan';
import type { KhatmPlan, PlanMode, ScheduleStyle, QuranIndex } from '../lib/khatm-types';

interface Props {
  onBack: () => void;
  onDone: () => void;
}

type LoadState = 'loading' | 'error' | 'ready';

const DURATION_PRESETS = [30, 60, 90, 180, 365];
const AGGRESSIVE_THRESHOLD = 250; // advisory only — roughly faster than a 25-day khatm

export default function KhatmSetupScreen({ onBack, onDone }: Props) {
  const [index, setIndex] = useState<QuranIndex | null>(null);
  const [existingPlan, setExistingPlan] = useState<KhatmPlan | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [retryTick, setRetryTick] = useState(0);

  const today = todayKey();
  const [mode, setMode] = useState<PlanMode>('duration');
  const [targetDate, setTargetDate] = useState(addDays(today, 29));
  const [durationDays, setDurationDays] = useState(30);
  const [scheduleStyle, setScheduleStyle] = useState<ScheduleStyle>('fivePrayers');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicking off a data fetch on mount/retry (matches app/lib/theme.tsx and the Sirah screens)
    setLoadState('loading');
    loadSurahMeta()
      .then((data) => {
        if (cancelled) return;
        setIndex(buildQuranIndex(data));
        const plan = loadPlan();
        setExistingPlan(plan);
        if (plan) {
          setMode(plan.mode);
          setTargetDate(plan.targetDate);
          setScheduleStyle(plan.scheduleStyle);
          setDurationDays(Math.max(1, (new Date(plan.targetDate).getTime() - new Date(plan.startDate).getTime()) / 86400000 + 1));
        }
        setLoadState('ready');
      })
      .catch(() => {
        if (!cancelled) setLoadState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [retryTick]);

  const resolvedTargetDate = mode === 'targetDate' ? targetDate : addDays(today, Math.max(0, durationDays - 1));

  const previewTarget = useMemo(() => {
    if (!index) return 0;
    const remaining = existingPlan ? index.totalAyahs - existingPlan.completedAyahs : index.totalAyahs;
    const daysRemaining = Math.max(1, (new Date(resolvedTargetDate).getTime() - new Date(today).getTime()) / 86400000 + 1);
    return Math.ceil(remaining / daysRemaining);
  }, [index, existingPlan, resolvedTargetDate, today]);

  function handleSubmit() {
    if (!index) return;
    const params = { mode, targetDate: mode === 'targetDate' ? targetDate : undefined, durationDays: mode === 'duration' ? durationDays : undefined, scheduleStyle };
    const validationErr = validateCreateParams(params, today);
    if (validationErr) {
      setError(validationErr.message);
      return;
    }
    setError(null);

    let plan: KhatmPlan;
    if (existingPlan) {
      plan = reschedulePlan(existingPlan, params, today, 'user-adjusted');
      if (plan.status === 'active') plan = ensureDayAnchor(index, plan, today);
    } else {
      plan = createPlan(params, today);
      plan = ensureDayAnchor(index, plan, today);
    }
    savePlan(plan);
    onDone();
  }

  if (loadState === 'loading') {
    return (
      <div style={{ padding: '44px 16px 12px' }}>
        <BackButton onClick={onBack} variant="dark" />
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RotateCw size={22} className="qibla-spin" style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 13 }}>লোড হচ্ছে...</div>
        </div>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div style={{ padding: '44px 16px 12px' }}>
        <BackButton onClick={onBack} variant="dark" />
        <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <WifiOff size={28} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 13, marginBottom: 14 }}>কুরআনের তথ্য লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।</div>
          <button
            onClick={() => setRetryTick((t) => t + 1)}
            style={{
              background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 100,
              padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Hind Siliguri, sans-serif',
            }}
          >আবার চেষ্টা করুন</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 30 }}>
      <div style={{ padding: '44px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackButton onClick={onBack} variant="dark" />
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
          {existingPlan ? 'পরিকল্পনা সম্পাদনা' : 'নতুন খতম পরিকল্পনা'}
        </div>
      </div>

      {existingPlan && (
        <div style={{
          margin: '0 16px 16px', padding: '10px 14px', borderRadius: 12,
          background: 'rgba(31,122,76,0.08)', border: '1px solid rgba(31,122,76,0.18)',
          fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', gap: 8,
        }}>
          <Info size={14} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
          আপনার বর্তমান অগ্রগতি ({existingPlan.completedAyahs} আয়াত সম্পন্ন) অক্ষুণ্ণ থাকবে — শুধু সময়সূচি পরিবর্তিত হবে।
        </div>
      )}

      <div style={{ padding: '0 16px' }}>
        {/* mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <ModeButton active={mode === 'duration'} icon={Clock} label="কত দিনে" onClick={() => setMode('duration')} />
          <ModeButton active={mode === 'targetDate'} icon={Calendar} label="লক্ষ্য তারিখ" onClick={() => setMode('targetDate')} />
        </div>

        {mode === 'duration' ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDurationDays(d)}
                  style={{
                    padding: '8px 14px', borderRadius: 100, border: '1px solid var(--border)',
                    background: durationDays === d ? 'var(--accent)' : 'var(--card)',
                    color: durationDays === d ? '#fff' : 'var(--text)',
                    fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
                  }}
                >{d} দিন</button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              value={durationDays}
              onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value) || 1))}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid var(--border)',
                background: 'var(--card)', color: 'var(--text)', fontSize: 14,
                fontFamily: 'Hind Siliguri, sans-serif', outline: 'none',
              }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <input
              type="date"
              min={today}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid var(--border)',
                background: 'var(--card)', color: 'var(--text)', fontSize: 14,
                fontFamily: 'Hind Siliguri, sans-serif', outline: 'none',
              }}
            />
          </div>
        )}

        {/* schedule style */}
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>দৈনিক লক্ষ্য ভাগ করবেন কীভাবে?</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <button
            onClick={() => setScheduleStyle('fivePrayers')}
            style={{
              flex: 1, padding: '11px 10px', borderRadius: 12, border: '1px solid var(--border)',
              background: scheduleStyle === 'fivePrayers' ? 'var(--accent)' : 'var(--card)',
              color: scheduleStyle === 'fivePrayers' ? '#fff' : 'var(--text)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
            }}
          >৫ ওয়াক্তে ভাগ করে</button>
          <button
            onClick={() => setScheduleStyle('single')}
            style={{
              flex: 1, padding: '11px 10px', borderRadius: 12, border: '1px solid var(--border)',
              background: scheduleStyle === 'single' ? 'var(--accent)' : 'var(--card)',
              color: scheduleStyle === 'single' ? '#fff' : 'var(--text)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
            }}
          >একবারে</button>
        </div>

        {/* live preview */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>দৈনিক পড়ার লক্ষ্য (আনুমানিক)</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>{previewTarget} আয়াত/দিন</div>
          {previewTarget > AGGRESSIVE_THRESHOLD && (
            <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 8, lineHeight: 1.5 }}>
              এটি বেশ দ্রুতগতির একটি পরিকল্পনা। প্রয়োজনে সময়কাল বাড়িয়ে নিন।
            </div>
          )}
        </div>

        {error && (
          <div style={{ fontSize: 12.5, color: '#B3362C', marginBottom: 14, textAlign: 'center' }}>{error}</div>
        )}

        <button
          onClick={handleSubmit}
          style={{
            width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 100,
            padding: '13px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Hind Siliguri, sans-serif', boxShadow: '0 4px 16px rgba(31,122,76,0.3)',
          }}
        >{existingPlan ? 'আপডেট করুন' : 'পরিকল্পনা শুরু করুন'}</button>
      </div>
    </div>
  );
}

function ModeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '11px 0', borderRadius: 12, border: '1px solid var(--border)',
        background: active ? 'var(--accent)' : 'var(--card)', color: active ? '#fff' : 'var(--text)',
        fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
      }}
    ><Icon size={14} />{label}</button>
  );
}
