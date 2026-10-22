'use client';

import { useEffect, useState } from 'react';
import { Search, Bookmark, ChevronRight, RotateCw, WifiOff } from 'lucide-react';
import BackButton from './BackButton';
import { loadSurahMeta } from '../lib/reader-data';
import { getLastRead } from '../lib/reader-progress';
import type { SurahMeta, ReaderLastRead } from '../lib/reader-types';

interface Props {
  onBack: () => void;
  onOpenSurah: (surah: number, ayah?: number) => void;
  onOpenSearch: () => void;
  onOpenBookmarks: () => void;
}

type LoadState = 'loading' | 'error' | 'ready';

export default function ReaderScreen({ onBack, onOpenSurah, onOpenSearch, onOpenBookmarks }: Props) {
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [query, setQuery] = useState('');
  const [lastRead, setLastRead] = useState<ReaderLastRead | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicking off a data fetch on mount/retry (matches app/lib/theme.tsx and the Sirah screens)
    setLoadState('loading');
    loadSurahMeta()
      .then((data) => {
        if (cancelled) return;
        setSurahs(data);
        setLoadState('ready');
      })
      .catch(() => {
        if (!cancelled) setLoadState('error');
      });
    setLastRead(getLastRead());
    return () => {
      cancelled = true;
    };
  }, [retryTick]);

  const filtered = query.trim()
    ? surahs.filter((s) => {
        const q = query.trim();
        return (
          s.banglaName.includes(q) ||
          s.arabicName.includes(q) ||
          s.transliteratedName.toLowerCase().includes(q.toLowerCase()) ||
          String(s.number).includes(q)
        );
      })
    : surahs;

  const lastReadSurah = lastRead ? surahs.find((s) => s.number === lastRead.surah) : null;

  return (
    <div>
      <div style={{
        padding: '44px 16px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BackButton onClick={onBack} variant="dark" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Noto Serif Bengali, serif', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
              কুরআন
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>১১৪টি সূরা — উসমানি রসম</div>
          </div>
          <button
            onClick={onOpenBookmarks}
            aria-label="বুকমার্ক"
            style={{
              width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--card)', color: 'var(--accent)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          ><Bookmark size={16} /></button>
        </div>
      </div>

      {loadState === 'ready' && (
        <div style={{ margin: '14px 16px 0', display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1, background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Search size={16} color="var(--text-muted)" strokeWidth={1.8} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="সূরা নাম বা নম্বর দিয়ে খুঁজুন..."
              style={{
                border: 'none', background: 'none', outline: 'none',
                fontFamily: 'Hind Siliguri, sans-serif', fontSize: 13.5,
                color: 'var(--text)', flex: 1, minWidth: 0,
              }}
            />
          </div>
          <button
            onClick={onOpenSearch}
            style={{
              flexShrink: 0, padding: '0 14px', borderRadius: 14, border: '1px solid var(--border)',
              background: 'var(--card)', color: 'var(--accent)', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
            }}
          >আয়াত খুঁজুন</button>
        </div>
      )}

      {loadState === 'ready' && lastReadSurah && !query.trim() && (
        <div
          onClick={() => onOpenSurah(lastReadSurah.number, lastRead!.ayah)}
          style={{
            margin: '14px 16px 0', borderRadius: 16, padding: '14px 16px', cursor: 'pointer',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
            color: '#fff', display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 4px 16px rgba(31,122,76,0.28)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, opacity: 0.85 }}>পড়া চালিয়ে যান</div>
            <div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 2 }}>
              {lastReadSurah.banglaName} — আয়াত {lastRead!.ayah}
            </div>
          </div>
          <ChevronRight size={18} />
        </div>
      )}

      {loadState === 'loading' && (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RotateCw size={22} className="qibla-spin" style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 13 }}>সূরার তালিকা লোড হচ্ছে...</div>
        </div>
      )}

      {loadState === 'error' && (
        <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <WifiOff size={28} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 13, marginBottom: 14 }}>সূরার তালিকা লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।</div>
          <button
            onClick={() => setRetryTick((t) => t + 1)}
            style={{
              background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 100,
              padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Hind Siliguri, sans-serif',
            }}
          >আবার চেষ্টা করুন</button>
        </div>
      )}

      {loadState === 'ready' && (
        <div style={{ padding: '14px 16px 0' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              কোনো সূরা পাওয়া যায়নি।
            </div>
          )}
          {filtered.map((s) => (
            <div
              key={s.number}
              onClick={() => onOpenSurah(s.number)}
              style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '12px 14px', marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(15,42,25,0.06)',
              }}
            >
              <div style={{
                width: 34, height: 34, flexShrink: 0,
                background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                color: 'white', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
              }}>{s.number}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{s.banglaName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {s.ayahCount} আয়াত • {s.revelationType === 'Meccan' ? 'মক্কি' : 'মাদানি'}
                </div>
              </div>
              <div className="arabic" style={{ fontFamily: 'Amiri, serif', fontSize: 19, color: 'var(--accent)' }}>{s.arabicName}</div>
            </div>
          ))}

          <div style={{
            margin: '12px 0 20px', padding: '12px 14px', borderRadius: 14,
            background: 'rgba(150,112,42,0.08)', border: '1px solid rgba(150,112,42,0.18)',
            fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.6,
          }}>
            আরবি লেখা উসমানি রসমে, <a href="https://tanzil.net/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 700 }}>Tanzil Project</a> থেকে যাচাইকৃত ও অপরিবর্তিত উৎস হিসেবে নেওয়া (Creative Commons Attribution 3.0)।
          </div>
        </div>
      )}
    </div>
  );
}
