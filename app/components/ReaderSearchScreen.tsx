'use client';

import { useEffect, useState } from 'react';
import { Search, RotateCw, WifiOff } from 'lucide-react';
import BackButton from './BackButton';
import { loadSurahMeta, loadSearchIndex, normalizeArabic } from '../lib/reader-data';
import type { SurahMeta, SearchIndexEntry } from '../lib/reader-types';

interface Props {
  onBack: () => void;
  onOpenSurah: (surah: number, ayah?: number) => void;
}

type IndexState = 'idle' | 'loading' | 'error' | 'ready';

const MIN_QUERY_LEN = 2;
const MAX_RESULTS = 60;

export default function ReaderSearchScreen({ onBack, onOpenSurah }: Props) {
  const [query, setQuery] = useState('');
  const [meta, setMeta] = useState<SurahMeta[]>([]);
  const [index, setIndex] = useState<SearchIndexEntry[] | null>(null);
  const [indexState, setIndexState] = useState<IndexState>('idle');

  useEffect(() => {
    loadSurahMeta().then(setMeta).catch(() => {});
  }, []);

  function ensureIndexLoaded() {
    if (indexState === 'ready' || indexState === 'loading') return;
    setIndexState('loading');
    loadSearchIndex()
      .then((data) => {
        setIndex(data);
        setIndexState('ready');
      })
      .catch(() => setIndexState('error'));
  }

  const trimmed = query.trim();
  const normalizedQuery = normalizeArabic(trimmed);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicking off the search-index fetch as the query changes (matches app/lib/theme.tsx and the Sirah screens)
    if (trimmed.length >= MIN_QUERY_LEN) ensureIndexLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed]);

  const surahMatches = trimmed.length >= 1
    ? meta.filter((s) =>
        s.banglaName.includes(trimmed) ||
        s.arabicName.includes(trimmed) ||
        s.transliteratedName.toLowerCase().includes(trimmed.toLowerCase()) ||
        String(s.number) === trimmed
      ).slice(0, 8)
    : [];

  const verseMatches = index && normalizedQuery.length >= MIN_QUERY_LEN
    ? index.filter((e) => e.n.includes(normalizedQuery)).slice(0, MAX_RESULTS)
    : [];

  function metaFor(surah: number) {
    return meta.find((s) => s.number === surah);
  }

  return (
    <div>
      <div style={{
        padding: '44px 16px 12px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BackButton onClick={onBack} variant="dark" />
          <div style={{
            flex: 1, background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Search size={16} color="var(--text-muted)" strokeWidth={1.8} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="আরবি আয়াত বা সূরা নাম লিখুন..."
              dir="auto"
              style={{
                border: 'none', background: 'none', outline: 'none',
                fontFamily: 'Hind Siliguri, sans-serif', fontSize: 13.5,
                color: 'var(--text)', flex: 1, minWidth: 0,
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px 24px' }}>
        {trimmed.length < MIN_QUERY_LEN && (
          <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.7 }}>
            অন্তত ২ অক্ষর লিখুন। সূরার নাম (বাংলা/আরবি) বা আরবি আয়াতের অংশ দিয়ে খুঁজতে পারবেন।
          </div>
        )}

        {surahMatches.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>সূরা</div>
            {surahMatches.map((s) => (
              <div
                key={s.number}
                onClick={() => onOpenSurah(s.number)}
                style={{
                  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
                  padding: '10px 14px', marginBottom: 6, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{s.number}</div>
                <div style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>{s.banglaName}</div>
                <div className="arabic" style={{ fontFamily: 'Amiri, serif', fontSize: 16, color: 'var(--accent)' }}>{s.arabicName}</div>
              </div>
            ))}
          </div>
        )}

        {normalizedQuery.length >= MIN_QUERY_LEN && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>আয়াত</div>
            <div style={{ fontSize: 10, color: 'var(--text-light)', marginBottom: 8 }}>
              দ্রুত অনুসন্ধানের জন্য হারাকাত ছাড়া দেখানো হচ্ছে — সম্পূর্ণ সঠিক আয়াত পড়তে ট্যাপ করুন
            </div>

            {indexState === 'loading' && (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RotateCw size={18} className="qibla-spin" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 12.5 }}>আয়াতের সূচি লোড হচ্ছে...</div>
              </div>
            )}

            {indexState === 'error' && (
              <div style={{ padding: '24px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <WifiOff size={22} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 12.5, marginBottom: 10 }}>আয়াত অনুসন্ধান লোড করা যায়নি।</div>
                <button
                  onClick={ensureIndexLoaded}
                  style={{
                    background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 100,
                    padding: '8px 18px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Hind Siliguri, sans-serif',
                  }}
                >আবার চেষ্টা করুন</button>
              </div>
            )}

            {indexState === 'ready' && verseMatches.length === 0 && (
              <div style={{ padding: '24px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>
                কোনো আয়াত পাওয়া যায়নি।
              </div>
            )}

            {indexState === 'ready' && verseMatches.map((m) => {
              const sm = metaFor(m.s);
              return (
                <div
                  key={`${m.s}:${m.a}`}
                  onClick={() => onOpenSurah(m.s, m.a)}
                  style={{
                    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
                    padding: '12px 14px', marginBottom: 8, cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>
                    {sm ? sm.banglaName : `সূরা ${m.s}`} — {m.s}:{m.a}
                  </div>
                  <div className="arabic" style={{ fontFamily: 'Amiri, serif', fontSize: 17, lineHeight: 1.8, textAlign: 'right', color: 'var(--text)' }}>
                    {m.n}
                  </div>
                </div>
              );
            })}

            {indexState === 'ready' && verseMatches.length === MAX_RESULTS && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>
                প্রথম {MAX_RESULTS}টি ফলাফল দেখানো হচ্ছে — আরও নির্দিষ্টভাবে লিখুন।
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
