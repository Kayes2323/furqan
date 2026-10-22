'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Target, Calendar, Pause, Play, RotateCcw, Pencil, PartyPopper,
  Sunrise, SunMedium, CloudSun, Sunset, MoonStar, CheckCircle2, Circle, RotateCw, WifiOff,
} from 'lucide-react';
import BackButton from './BackButton';
import { loadSurahMeta } from '../lib/reader-data';
import { loadPlan, savePlan } from '../lib/khatm-storage';
import {
  buildQuranIndex, ensureDayAnchor, summarize, slotRanges, todaysPortion,
  markSlotComplete, markTodayComplete, pausePlan, resumePlan, restartPlan, todayKey, daysBetween,
} from '../lib/khatm-plan';
import type { SurahMeta } from '../lib/reader-types';
import type { KhatmPlan, QuranIndex, AyahRange } from '../lib/khatm-types';
import { PRAYER_SLOTS } from '../lib/khatm-types';

interface Props {
  onBack: () => void;
  onOpenSetup: () => void;
  onOpenReaderSurah: (surah: number, ayah?: number) => void;
}

type LoadState = 'loading' | 'error' | 'ready';

const SLOT_META: Record<(typeof PRAYER_SLOTS)[number], { label: string; icon: React.ElementType }> = {
  fajr: { label: 'ফজর', icon: Sunrise },
  dhuhr: { label: 'যোহর', icon: SunMedium },
  asr: { label: 'আসর', icon: CloudSun },
  maghrib: { label: 'মাগরিব', icon: Sunset },
  isha: { label: 'এশা', icon: MoonStar },
};

function refLabel(ref: { surah: number; ayah: number }, meta: SurahMeta[]): string {
  const s = meta.find((m) => m.number === ref.surah);
  return s ? `${s.banglaName} ${ref.ayah}` : `${ref.surah}:${ref.ayah}`;
}

function rangeLabel(range: AyahRange, meta: SurahMeta[]): string {
  if (range.start.surah === range.end.surah && range.start.ayah === range.end.ayah) {
    return refLabel(range.start, meta);
  }
  if (range.start.surah === range.end.surah) {
    const s = meta.find((m) => m.number === range.start.surah);
    return `${s ? s.banglaName : range.start.surah} ${range.start.ayah}–${range.end.ayah}`;
  }
  return `${refLabel(range.start, meta)} — ${refLabel(range.end, meta)}`;
}

export default function KhatmScreen({ onBack, onOpenSetup, onOpenReaderSurah }: Props) {
  const [meta, setMeta] = useState<SurahMeta[]>([]);
  const [index, setIndex] = useState<QuranIndex | null>(null);
  const [plan, setPlan] = useState<KhatmPlan | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [retryTick, setRetryTick] = useState(0);
  const [confirmAction, setConfirmAction] = useState<'pause' | 'restart' | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicking off a data fetch on mount/retry (matches app/lib/theme.tsx and the Sirah screens)
    setLoadState('loading');
    loadSurahMeta()
      .then((data) => {
        if (cancelled) return;
        const idx = buildQuranIndex(data);
        setMeta(data);
        setIndex(idx);

        const stored = loadPlan();
        if (stored && stored.status === 'active') {
          const withAnchor = ensureDayAnchor(idx, stored, todayKey());
          if (withAnchor !== stored) savePlan(withAnchor);
          setPlan(withAnchor);
        } else {
          setPlan(stored);
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

  const summary = useMemo(() => (index && plan ? summarize(index, plan, todayKey()) : null), [index, plan]);
  const slots = useMemo(() => (index && plan ? slotRanges(index, plan) : []), [index, plan]);
  const portion = useMemo(() => (index && plan ? todaysPortion(index, plan) : null), [index, plan]);

  function persist(next: KhatmPlan) {
    setPlan(next);
    savePlan(next);
  }

  function handleSlotTap(slotIdx: number) {
    if (!index || !plan) return;
    persist(markSlotComplete(index, plan, slotIdx));
  }

  function handleMarkTodayComplete() {
    if (!index || !plan) return;
    persist(markTodayComplete(index, plan));
  }

  function handlePauseConfirmed() {
    if (!plan) return;
    persist(pausePlan(plan, todayKey()));
    setConfirmAction(null);
  }

  function handleResume() {
    if (!plan) return;
    persist(resumePlan(plan, todayKey()));
  }

  function handleRestartConfirmed() {
    if (!plan || !index) return;
    const today = todayKey();
    // Restart keeps the plan's own pace (same number of days it originally
    // spanned), just starting fresh from today — not arbitrary defaults.
    const originalSpanDays = Math.max(1, daysBetween(plan.startDate, plan.targetDate) + 1);
    const restarted = restartPlan(
      plan,
      { mode: 'duration', durationDays: originalSpanDays, scheduleStyle: plan.scheduleStyle },
      today,
    );
    persist(ensureDayAnchor(index, restarted, today));
    setConfirmAction(null);
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

  if (!plan || !index) {
    return (
      <div>
        <div style={{ padding: '44px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <BackButton onClick={onBack} variant="dark" />
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>খতম পরিকল্পনা</div>
        </div>
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
            background: 'rgba(31,122,76,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Target size={28} color="var(--accent)" /></div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
            সম্পূর্ণ কুরআন খতম করার পরিকল্পনা
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
            একটি লক্ষ্য তারিখ বা সময়কাল বেছে নিন — আমরা প্রতিদিনের পড়ার লক্ষ্য হিসাব করে দেব।
          </div>
          <button
            onClick={onOpenSetup}
            style={{
              background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 100,
              padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Hind Siliguri, sans-serif', boxShadow: '0 4px 16px rgba(31,122,76,0.3)',
            }}
          >নতুন পরিকল্পনা শুরু করুন</button>
        </div>
      </div>
    );
  }

  if (plan.status === 'completed') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 30px', textAlign: 'center' }}>
        <div style={{
          width: 84, height: 84, borderRadius: 26, background: 'rgba(31,122,76,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
        }}><PartyPopper size={38} color="var(--accent)" /></div>
        <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>আলহামদুলিল্লাহ! খতম সম্পন্ন হয়েছে</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 28 }}>
          আপনি সম্পূর্ণ কুরআন ({index.totalAyahs} আয়াত) পড়া সম্পন্ন করেছেন।
        </div>
        <button onClick={onOpenSetup} style={{
          background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 100,
          padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'Hind Siliguri, sans-serif', boxShadow: '0 4px 16px rgba(31,122,76,0.3)',
        }}>নতুন খতম শুরু করুন</button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ padding: '44px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackButton onClick={onBack} variant="dark" />
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', flex: 1 }}>খতম পরিকল্পনা</div>
        <button onClick={onOpenSetup} aria-label="সম্পাদনা" style={{
          width: 34, height: 34, borderRadius: '50%', background: 'var(--card)', border: '1px solid var(--border)',
          color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Pencil size={14} /></button>
      </div>

      {plan.status === 'paused' && (
        <div style={{
          margin: '0 16px 14px', padding: '12px 14px', borderRadius: 14,
          background: 'rgba(150,112,42,0.1)', border: '1px solid rgba(150,112,42,0.22)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Pause size={16} color="var(--gold)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>আপনার পরিকল্পনা বিরতিতে আছে।</div>
          <button onClick={handleResume} style={{
            background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 100,
            padding: '7px 14px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Hind Siliguri, sans-serif', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
          }}><Play size={12} />চালু করুন</button>
        </div>
      )}

      {/* progress overview */}
      <div style={{ margin: '0 16px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>{summary!.percent}%</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>সম্পন্ন</div>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--bg)', overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ width: `${summary!.percent}%`, height: '100%', background: 'var(--accent)', borderRadius: 4, transition: 'width 0.3s ease' }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <StatTile label="সম্পন্ন" value={summary!.completedAyahs} />
          <StatTile label="বাকি" value={summary!.remainingAyahs} />
          {summary!.overdueAyahs > 0 && <StatTile label="পিছিয়ে আছেন" value={summary!.overdueAyahs} accent="#B3362C" />}
        </div>
      </div>

      {plan.status === 'active' && (
        <>
          {/* today's target */}
          <div style={{ margin: '0 16px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Target size={16} color="var(--accent)" />
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>আজকের লক্ষ্য</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              {plan.dayAnchor?.target ?? 0} আয়াত · {summary!.daysRemaining} দিন বাকি · লক্ষ্য তারিখ {plan.targetDate}
            </div>

            {portion ? (
              <>
                {plan.scheduleStyle === 'fivePrayers' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {slots.map((range, idx) => {
                      const slotKey = PRAYER_SLOTS[idx];
                      const slotInfo = SLOT_META[slotKey];
                      const done = idx < (plan.dayAnchor?.slotsCompleted ?? 0);
                      const Icon = slotInfo.icon;
                      return (
                        <div key={slotKey} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
                          borderRadius: 12, background: done ? 'rgba(31,122,76,0.06)' : 'var(--bg)',
                        }}>
                          <Icon size={15} color={done ? 'var(--accent)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)' }}>{slotInfo.label}</div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{rangeLabel(range, meta)} ({range.count} আয়াত)</div>
                          </div>
                          {!done && (
                            <button
                              onClick={() => onOpenReaderSurah(range.start.surah, range.start.ayah)}
                              style={{
                                fontSize: 10.5, fontWeight: 700, color: 'var(--accent)', background: 'none',
                                border: '1px solid var(--border)', borderRadius: 100, padding: '4px 10px', cursor: 'pointer',
                                fontFamily: 'Hind Siliguri, sans-serif', flexShrink: 0,
                              }}
                            >পড়ুন</button>
                          )}
                          <button
                            onClick={() => handleSlotTap(idx)}
                            aria-label={done ? 'সম্পন্ন হয়েছে' : 'সম্পন্ন করুন'}
                            style={{ background: 'none', border: 'none', cursor: done ? 'default' : 'pointer', padding: 2, flexShrink: 0 }}
                          >
                            {done ? <CheckCircle2 size={19} color="var(--accent)" /> : <Circle size={19} color="var(--text-light)" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 12, background: 'var(--bg)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{rangeLabel(portion, meta)}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{portion.count} আয়াত</div>
                    </div>
                    <button
                      onClick={() => onOpenReaderSurah(portion.start.surah, portion.start.ayah)}
                      style={{
                        fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'none',
                        border: '1px solid var(--border)', borderRadius: 100, padding: '5px 12px', cursor: 'pointer',
                        fontFamily: 'Hind Siliguri, sans-serif', flexShrink: 0,
                      }}
                    >পড়ুন</button>
                  </div>
                )}

                <button
                  onClick={handleMarkTodayComplete}
                  style={{
                    width: '100%', marginTop: 14, background: 'var(--accent)', color: '#fff', border: 'none',
                    borderRadius: 12, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Hind Siliguri, sans-serif',
                  }}
                >আজকের অংশ সম্পন্ন করুন</button>
              </>
            ) : (
              <div style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 700, textAlign: 'center', padding: '10px 0' }}>
                আজকের লক্ষ্য সম্পন্ন হয়েছে — মাশাআল্লাহ!
              </div>
            )}
          </div>

          <div style={{ margin: '0 16px', display: 'flex', gap: 10 }}>
            <button onClick={() => setConfirmAction('pause')} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 0', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)',
              color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
            }}><Pause size={13} />বিরতি দিন</button>
            <button onClick={() => setConfirmAction('restart')} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 0', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)',
              color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
            }}><RotateCcw size={13} />পুনরায় শুরু</button>
          </div>
        </>
      )}

      <div style={{
        margin: '20px 16px 0', padding: '10px 14px', borderRadius: 14,
        background: 'rgba(150,112,42,0.08)', border: '1px solid rgba(150,112,42,0.18)',
        fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Calendar size={13} color="var(--gold)" style={{ flexShrink: 0 }} />
        শুরুর তারিখ {plan.startDate}
      </div>

      {confirmAction === 'pause' && (
        <ConfirmSheet
          title="পরিকল্পনা বিরতি দেবেন?"
          body="আপনার অগ্রগতি সংরক্ষিত থাকবে। আবার শুরু করলে লক্ষ্য তারিখ বিরতির দিনসংখ্যা অনুযায়ী স্বয়ংক্রিয়ভাবে পিছিয়ে যাবে।"
          confirmLabel="বিরতি দিন"
          onCancel={() => setConfirmAction(null)}
          onConfirm={handlePauseConfirmed}
        />
      )}
      {confirmAction === 'restart' && (
        <ConfirmSheet
          title="পরিকল্পনা পুনরায় শুরু করবেন?"
          body="বর্তমান অগ্রগতি (সম্পন্ন আয়াত) শূন্য থেকে শুরু হবে। পূর্বের ইতিহাস মুছে ফেলা হবে না।"
          confirmLabel="পুনরায় শুরু করুন"
          danger
          onCancel={() => setConfirmAction(null)}
          onConfirm={handleRestartConfirmed}
        />
      )}
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: accent ?? 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function ConfirmSheet({ title, body, confirmLabel, danger, onCancel, onConfirm }: {
  title: string; body: string; confirmLabel: string; danger?: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 998,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onCancel}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 430, background: 'var(--card)', borderRadius: '20px 20px 0 0',
          padding: '20px 20px max(20px, env(safe-area-inset-bottom))',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>{body}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '11px 0', borderRadius: 12, border: '1px solid var(--border)',
            background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>বাতিল</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '11px 0', borderRadius: 12, border: 'none',
            background: danger ? '#B3362C' : 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
