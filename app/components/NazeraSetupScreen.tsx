'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, ListChecks, Info, RotateCw, WifiOff } from 'lucide-react';
import BackButton from './BackButton';
import { loadSurahMeta } from '../lib/reader-data';
import { loadProfile, saveProfile } from '../lib/nazera-storage';
import { buildQuranIndex, createProfile, updateTargets, validateCreateParams, ensureDayAnchor, todayKey } from '../lib/nazera-plan';
import type { SurahMeta } from '../lib/reader-types';
import type { NazeraProfile, NazeraTargetMode } from '../lib/nazera-types';
import type { QuranIndex } from '../lib/quran-index';

interface Props {
  onBack: () => void;
  onDone: () => void;
}

type LoadState = 'loading' | 'error' | 'ready';

const AYAH_PRESETS = [5, 10, 20, 50];
const SESSION_PRESETS = [1, 2, 3];
const SESSION_LENGTH_PRESETS = [5, 10, 15, 20];

export default function NazeraSetupScreen({ onBack, onDone }: Props) {
  const [meta, setMeta] = useState<SurahMeta[]>([]);
  const [index, setIndex] = useState<QuranIndex | null>(null);
  const [existingProfile, setExistingProfile] = useState<NazeraProfile | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [retryTick, setRetryTick] = useState(0);

  const [targetMode, setTargetMode] = useState<NazeraTargetMode>('ayahs');
  const [dailyAyahTarget, setDailyAyahTarget] = useState(10);
  const [dailySessionTarget, setDailySessionTarget] = useState(1);
  const [ayahsPerSession, setAyahsPerSession] = useState(10);
  const [customStart, setCustomStart] = useState(false);
  const [startSurah, setStartSurah] = useState(1);
  const [startAyah, setStartAyah] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicking off a data fetch on mount/retry (matches app/lib/theme.tsx and the Sirah screens)
    setLoadState('loading');
    loadSurahMeta()
      .then((data) => {
        if (cancelled) return;
        setMeta(data);
        setIndex(buildQuranIndex(data));
        const profile = loadProfile();
        setExistingProfile(profile);
        if (profile) {
          setTargetMode(profile.targetMode);
          setDailyAyahTarget(profile.dailyAyahTarget);
          setDailySessionTarget(profile.dailySessionTarget);
          setAyahsPerSession(profile.ayahsPerSession);
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

  const maxAyahForStartSurah = useMemo(() => meta.find((s) => s.number === startSurah)?.ayahCount ?? 1, [meta, startSurah]);

  function handleSubmit() {
    if (!index) return;
    const params = {
      targetMode,
      dailyAyahTarget: targetMode === 'ayahs' ? dailyAyahTarget : undefined,
      dailySessionTarget: targetMode === 'sessions' ? dailySessionTarget : undefined,
      ayahsPerSession: targetMode === 'sessions' ? ayahsPerSession : undefined,
    };
    const validationErr = validateCreateParams(params);
    if (validationErr) {
      setError(validationErr.message);
      return;
    }
    setError(null);

    let profile: NazeraProfile;
    if (existingProfile) {
      profile = updateTargets(existingProfile, params);
      profile = ensureDayAnchor(profile, todayKey());
    } else {
      const startRef = customStart ? { surah: startSurah, ayah: startAyah } : undefined;
      profile = createProfile({ ...params, startRef }, index, todayKey());
    }
    saveProfile(profile);
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
          {existingProfile ? 'নাযেরা সম্পাদনা' : 'নাযেরা শুরু করুন'}
        </div>
      </div>

      {existingProfile && (
        <div style={{
          margin: '0 16px 16px', padding: '10px 14px', borderRadius: 12,
          background: 'rgba(31,122,76,0.08)', border: '1px solid rgba(31,122,76,0.18)',
          fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', gap: 8,
        }}>
          <Info size={14} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
          আপনার বর্তমান পাঠের অবস্থান ও ধারাবাহিকতা অক্ষুণ্ণ থাকবে — শুধু দৈনিক লক্ষ্য পরিবর্তিত হবে।
        </div>
      )}

      <div style={{ padding: '0 16px' }}>
        {/* target mode */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <ModeButton active={targetMode === 'ayahs'} icon={BookOpenCheck} label="আয়াত সংখ্যায়" onClick={() => setTargetMode('ayahs')} />
          <ModeButton active={targetMode === 'sessions'} icon={ListChecks} label="সেশন সংখ্যায়" onClick={() => setTargetMode('sessions')} />
        </div>

        {targetMode === 'ayahs' ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>দৈনিক আয়াতের লক্ষ্য</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {AYAH_PRESETS.map((n) => (
                <PresetChip key={n} active={dailyAyahTarget === n} label={`${n} আয়াত`} onClick={() => setDailyAyahTarget(n)} />
              ))}
            </div>
            <NumberField value={dailyAyahTarget} onChange={setDailyAyahTarget} />
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>দৈনিক সেশনের লক্ষ্য</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {SESSION_PRESETS.map((n) => (
                <PresetChip key={n} active={dailySessionTarget === n} label={`${n} সেশন`} onClick={() => setDailySessionTarget(n)} />
              ))}
            </div>
            <NumberField value={dailySessionTarget} onChange={setDailySessionTarget} />

            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', margin: '14px 0 8px' }}>প্রতি সেশনে আয়াত সংখ্যা</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {SESSION_LENGTH_PRESETS.map((n) => (
                <PresetChip key={n} active={ayahsPerSession === n} label={`${n} আয়াত`} onClick={() => setAyahsPerSession(n)} />
              ))}
            </div>
            <NumberField value={ayahsPerSession} onChange={setAyahsPerSession} />
          </div>
        )}

        {!existingProfile && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>কোথা থেকে শুরু করবেন?</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <PresetChip active={!customStart} label="শুরু থেকে (আল-ফাতিহা)" onClick={() => setCustomStart(false)} />
              <PresetChip active={customStart} label="নির্দিষ্ট স্থান থেকে" onClick={() => setCustomStart(true)} />
            </div>
            {customStart && (
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={startSurah}
                  onChange={(e) => { setStartSurah(Number(e.target.value)); setStartAyah(1); }}
                  style={{
                    flex: 2, padding: '10px 10px', borderRadius: 12, border: '1px solid var(--border)',
                    background: 'var(--card)', color: 'var(--text)', fontSize: 13,
                    fontFamily: 'Hind Siliguri, sans-serif', outline: 'none',
                  }}
                >
                  {meta.map((s) => (
                    <option key={s.number} value={s.number}>{s.number}. {s.banglaName}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={maxAyahForStartSurah}
                  value={startAyah}
                  onChange={(e) => setStartAyah(Math.min(maxAyahForStartSurah, Math.max(1, Number(e.target.value) || 1)))}
                  style={{
                    flex: 1, padding: '10px 10px', borderRadius: 12, border: '1px solid var(--border)',
                    background: 'var(--card)', color: 'var(--text)', fontSize: 13,
                    fontFamily: 'Hind Siliguri, sans-serif', outline: 'none',
                  }}
                />
              </div>
            )}
          </div>
        )}

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
        >{existingProfile ? 'আপডেট করুন' : 'শুরু করুন'}</button>
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

function PresetChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px', borderRadius: 100, border: '1px solid var(--border)',
        background: active ? 'var(--accent)' : 'var(--card)', color: active ? '#fff' : 'var(--text)',
        fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
      }}
    >{label}</button>
  );
}

function NumberField({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <input
      type="number"
      min={1}
      value={value}
      onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
      style={{
        width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid var(--border)',
        background: 'var(--card)', color: 'var(--text)', fontSize: 14,
        fontFamily: 'Hind Siliguri, sans-serif', outline: 'none',
      }}
    />
  );
}
