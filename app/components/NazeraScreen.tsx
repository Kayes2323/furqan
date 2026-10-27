'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BookOpenCheck, Sprout, CalendarCheck, Pencil, MapPin, CircleCheck, Circle, RotateCw, WifiOff,
} from 'lucide-react';
import BackButton from './BackButton';
import { loadSurahMeta } from '../lib/reader-data';
import { loadProfile, saveProfile } from '../lib/nazera-storage';
import {
  buildQuranIndex, ensureDayAnchor, todaysPortion, markTodayComplete, markSessionComplete,
  currentRef, nextRef, consistency, todayKey,
} from '../lib/nazera-plan';
import type { SurahMeta } from '../lib/reader-types';
import type { NazeraProfile } from '../lib/nazera-types';
import type { QuranIndex, AyahRange } from '../lib/quran-index';

interface Props {
  onBack?: () => void;
  onOpenSetup: () => void;
  onOpenReaderSurah: (surah: number, ayah?: number) => void;
  /** Rendered inside Quran Journey: no page header/back button of its own. */
  embedded?: boolean;
  /** Called after any change is persisted, so the Journey dashboard can refresh. */
  onChange?: () => void;
  /** Reading is logged through the Khatm plan and mirrored here, so this
   *  view is read-only to keep the two pointers from drifting apart. */
  sharedWithKhatm?: boolean;
  onOpenKhatm?: () => void;
  onOpenPlanner?: () => void;
}

type LoadState = 'loading' | 'error' | 'ready';

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

export default function NazeraScreen({ onBack, onOpenSetup, onOpenReaderSurah, embedded, onChange, sharedWithKhatm, onOpenKhatm, onOpenPlanner }: Props) {
  const [meta, setMeta] = useState<SurahMeta[]>([]);
  const [index, setIndex] = useState<QuranIndex | null>(null);
  const [profile, setProfile] = useState<NazeraProfile | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [retryTick, setRetryTick] = useState(0);

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

        const stored = loadProfile();
        if (stored) {
          const withAnchor = ensureDayAnchor(stored, todayKey());
          if (withAnchor !== stored) saveProfile(withAnchor);
          setProfile(withAnchor);
        } else {
          setProfile(null);
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

  const portion = useMemo(() => (index && profile ? todaysPortion(index, profile) : null), [index, profile]);
  const cons = useMemo(() => (profile ? consistency(profile, todayKey()) : null), [profile]);
  const next = useMemo(() => (index && profile ? nextRef(index, profile) : null), [index, profile]);
  const current = useMemo(() => (index && profile ? currentRef(index, profile) : null), [index, profile]);

  function persist(next: NazeraProfile) {
    setProfile(next);
    saveProfile(next);
    onChange?.();
  }

  function handleMarkComplete() {
    if (!index || !profile) return;
    if (profile.targetMode === 'ayahs') {
      persist(markTodayComplete(index, profile));
    } else {
      persist(markSessionComplete(index, profile));
    }
  }

  const pageTop = embedded ? '4px 16px 0' : '44px 16px 12px';
  const backBtn = !embedded && onBack ? <BackButton onClick={onBack} variant="dark" /> : null;

  if (loadState === 'loading') {
    return (
      <div style={{ padding: pageTop }}>
        {backBtn}
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RotateCw size={22} className="qibla-spin" style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 13 }}>লোড হচ্ছে...</div>
        </div>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div style={{ padding: pageTop }}>
        {backBtn}
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

  if (!profile || !index) {
    return (
      <div>
        {!embedded && (
          <div style={{ padding: '44px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            {backBtn}
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>নাযেরা</div>
          </div>
        )}
        <div style={{ padding: embedded ? '24px 24px' : '40px 24px', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
            background: 'rgba(31,122,76,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><BookOpenCheck size={28} color="var(--accent)" /></div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
            নিয়মিত কুরআন তিলাওয়াতের অভ্যাস গড়ুন
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
            মুসহাফ দেখে নিয়মিত পড়ার অভ্যাস — মুখস্থ নয়। প্রতিদিনের লক্ষ্য ঠিক করুন, আমরা ধারাবাহিকতা মনে রাখব।
          </div>
          <button
            onClick={onOpenSetup}
            style={{
              background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 100,
              padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Hind Siliguri, sans-serif', boxShadow: '0 4px 16px rgba(31,122,76,0.3)',
            }}
          >নাযেরা শুরু করুন</button>
          {onOpenPlanner && (
            <div>
              <button onClick={onOpenPlanner} style={{
                marginTop: 12, background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12.5, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif', textDecoration: 'underline', padding: 8,
              }}>অথবা NUR-এর সঙ্গে কথা বলে পরিকল্পনা বানাও</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const atTargetToday = !portion;
  const sessionsLabel = profile.targetMode === 'sessions'
    ? `সেশন ${profile.dayAnchor?.progressToday ?? 0}/${profile.dayAnchor?.target ?? 0}`
    : null;

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ padding: embedded ? '0 16px 10px' : '44px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {backBtn}
        <div style={{ fontSize: embedded ? 13 : 16, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{embedded ? 'নাযেরার বিস্তারিত' : 'নাযেরা'}</div>
        <button onClick={onOpenSetup} aria-label="নাযেরা পরিকল্পনা সম্পাদনা" style={{
          width: 34, height: 34, borderRadius: '50%', background: 'var(--card)', border: '1px solid var(--border)',
          color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Pencil size={14} /></button>
      </div>

      {sharedWithKhatm && (
        <div style={{
          margin: '0 16px 14px', padding: '12px 14px', borderRadius: 14,
          background: 'rgba(31,122,76,0.08)', border: '1px solid rgba(31,122,76,0.2)',
          fontSize: 12, color: 'var(--text)', lineHeight: 1.6,
        }}>
          তোমার পরিকল্পনায় <b>একই পড়া খতম ও নাযেরা — দুটোতেই</b> গণনা হচ্ছে। পড়া সম্পন্ন করার বোতাম খতম ট্যাবে; এখানে তার প্রতিফলন দেখা যাবে।
          {onOpenKhatm && (
            <button onClick={onOpenKhatm} style={{
              display: 'block', marginTop: 8, background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer',
              color: 'var(--accent)', fontWeight: 700, fontSize: 12, fontFamily: 'Hind Siliguri, sans-serif', textDecoration: 'underline',
            }}>খতম ট্যাবে যাও</button>
          )}
        </div>
      )}

      {/* consistency */}
      <div style={{ margin: '0 16px 14px', display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 12px', textAlign: 'center' }}>
          <Sprout size={18} color="var(--gold)" style={{ marginBottom: 4 }} />
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{cons!.currentStreak}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>টানা দিন</div>
        </div>
        <div style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 12px', textAlign: 'center' }}>
          <CalendarCheck size={18} color="var(--accent)" style={{ marginBottom: 4 }} />
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{cons!.last7DaysMet}/৭</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>গত ৭ দিনে</div>
        </div>
      </div>

      {/* current position */}
      <div style={{
        margin: '0 16px 14px', padding: '12px 14px', borderRadius: 14,
        background: 'var(--card)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <MapPin size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>বর্তমান অবস্থান</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
            {current ? refLabel(current, meta) : 'এখনও শুরু হয়নি'}
          </div>
        </div>
      </div>

      {/* today's target */}
      <div style={{ margin: '0 16px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <BookOpenCheck size={16} color="var(--accent)" />
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>আজকের লক্ষ্য</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          {profile.targetMode === 'ayahs'
            ? `${profile.dailyAyahTarget} আয়াত/দিন`
            : `${profile.dailySessionTarget} সেশন/দিন (প্রতি সেশনে ${profile.ayahsPerSession} আয়াত)`}
        </div>

        {atTargetToday ? (
          next === null ? (
            <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, textAlign: 'center', padding: '10px 0' }}>
              মাশাআল্লাহ! সম্পূর্ণ কুরআন পড়া শেষ হয়েছে।
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 700, textAlign: 'center', padding: '10px 0' }}>
              আজকের লক্ষ্য সম্পন্ন হয়েছে — মাশাআল্লাহ!
            </div>
          )
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 12, background: 'var(--bg)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{rangeLabel(portion!, meta)}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                  {portion!.count} আয়াত{sessionsLabel ? ` · ${sessionsLabel}` : ''}
                </div>
              </div>
              <button
                onClick={() => onOpenReaderSurah(portion!.start.surah, portion!.start.ayah)}
                style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'none',
                  border: '1px solid var(--border)', borderRadius: 100, padding: '5px 12px', cursor: 'pointer',
                  fontFamily: 'Hind Siliguri, sans-serif', flexShrink: 0,
                }}
              >পড়ুন</button>
            </div>

            {!sharedWithKhatm && <button
              onClick={handleMarkComplete}
              style={{
                width: '100%', marginTop: 14, background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: 12, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'Hind Siliguri, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {profile.targetMode === 'sessions' ? <CircleCheck size={15} /> : <Circle size={15} />}
              {profile.targetMode === 'sessions' ? 'এই সেশন সম্পন্ন করুন' : 'আজকের অংশ সম্পন্ন করুন'}
            </button>}
          </>
        )}
      </div>

      <div style={{
        margin: '0 16px', padding: '10px 14px', borderRadius: 14,
        background: 'rgba(150,112,42,0.08)', border: '1px solid rgba(150,112,42,0.18)',
        fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.6,
      }}>
        নাযেরা একটি নিয়মিত পাঠাভ্যাস — এটি মুখস্থকরণ (হিফয) নয়।
      </div>
    </div>
  );
}
