'use client';
import { useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck, ChevronRight, ExternalLink, RotateCw, WifiOff } from 'lucide-react';
import BackButton from './BackButton';
import { loadSurahMeta, loadSurah } from '../lib/reader-data';
import { getBookmarks, toggleBookmark, saveBookmarks, isBookmarked } from '../lib/reader-progress';
import { IMPORTANT_SURAHS } from '../lib/topics-data';
import type { EvidenceKind } from '../lib/topics-types';
import type { SurahMeta, SurahDoc, ReaderBookmark } from '../lib/reader-types';

interface Props {
  importantId: string;
  onBack: () => void;
  onOpenReaderSurah: (surah: number, ayah?: number) => void;
}

type LoadState = 'loading' | 'error' | 'ready';

const KIND_LABEL: Record<EvidenceKind, { label: string; color: string }> = {
  'quran': { label: 'কুরআনের সুস্পষ্ট বর্ণনা', color: 'var(--accent)' },
  'hadith-authentic': { label: 'সহীহ হাদিস', color: 'var(--accent)' },
  'hadith-hasan': { label: 'হাসান হাদিস', color: 'var(--gold)' },
  'hadith-disputed': { label: 'দুর্বল/মতভেদপূর্ণ বর্ণনা', color: '#C85A4C' },
  'scholarly': { label: 'আলেমদের ব্যাখ্যা', color: 'var(--text-muted)' },
  'popular-unverified': { label: 'অযাচাইকৃত জনশ্রুতি', color: '#C85A4C' },
};

export default function ImportantSurahDetailScreen({ importantId, onBack, onOpenReaderSurah }: Props) {
  const item = IMPORTANT_SURAHS.find((s) => s.id === importantId) ?? IMPORTANT_SURAHS[0];

  const [meta, setMeta] = useState<SurahMeta | null>(null);
  const [doc, setDoc] = useState<SurahDoc | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [bookmarks, setBookmarks] = useState<ReaderBookmark[]>([]);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicking off a data fetch on mount/item change (matches ReaderSurahScreen)
    setLoadState('loading');

    Promise.all([loadSurahMeta(), loadSurah(item.surahNumber)])
      .then(([metaList, surahDoc]) => {
        if (cancelled) return;
        setMeta(metaList.find((s) => s.number === item.surahNumber) ?? null);
        setDoc(surahDoc);
        setLoadState('ready');
      })
      .catch(() => {
        if (!cancelled) setLoadState('error');
      });

    setBookmarks(getBookmarks());

    return () => {
      cancelled = true;
    };
  }, [item, retryTick]);

  const highlightAyahNum = item.highlightAyah?.ayahStart ?? 1;
  const bookmarked = isBookmarked(bookmarks, item.surahNumber, highlightAyahNum);

  function handleToggleBookmark() {
    const next = toggleBookmark(bookmarks, item.surahNumber, highlightAyahNum);
    setBookmarks(next);
    saveBookmarks(next);
  }

  const highlightAyahs = doc && item.highlightAyah
    ? doc.ayahs.filter((a) => a.number >= item.highlightAyah!.ayahStart && a.number <= item.highlightAyah!.ayahEnd)
    : [];

  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ padding: '44px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackButton onClick={onBack} variant="dark" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>{item.nameBn}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>
            {meta ? `সূরা ${meta.banglaName} • ${meta.ayahCount} আয়াত` : 'লোড হচ্ছে...'}
          </div>
        </div>
      </div>

      <div style={{ padding: '10px 16px 0' }}>
        {loadState === 'loading' && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RotateCw size={22} className="qibla-spin" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 13 }}>লোড হচ্ছে...</div>
          </div>
        )}

        {loadState === 'error' && (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <WifiOff size={28} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 13, marginBottom: 14 }}>লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।</div>
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
          <>
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
              padding: '13px 15px', marginBottom: 14, fontSize: 12.5, color: 'var(--text)', lineHeight: 1.7,
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                এটি কেন অন্তর্ভুক্ত
              </div>
              {item.whySelectedBn}
            </div>

            {highlightAyahs.length > 0 && (
              <div style={{
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
                padding: '16px 16px 12px', marginBottom: 14,
              }}>
                <div style={{
                  fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10,
                }}>{item.surahNumber}:{item.highlightAyah!.ayahStart}{item.highlightAyah!.ayahEnd !== item.highlightAyah!.ayahStart ? `-${item.highlightAyah!.ayahEnd}` : ''}</div>
                <div
                  className="arabic"
                  dir="rtl"
                  style={{
                    fontFamily: 'Amiri, serif', fontSize: 21, lineHeight: 2, textAlign: 'right',
                    color: 'var(--text)', marginBottom: 12,
                  }}
                >
                  {highlightAyahs.map((a) => a.text).join(' ')}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => onOpenReaderSurah(item.surahNumber, highlightAyahNum)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '9px 0', borderRadius: 10, border: '1px solid var(--border)',
                      background: 'var(--bg)', color: 'var(--accent)', fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
                    }}
                  >রিডারে দেখুন<ChevronRight size={14} /></button>
                  <button
                    onClick={handleToggleBookmark}
                    aria-label={bookmarked ? 'বুকমার্ক সরান' : 'বুকমার্ক করুন'}
                    style={{
                      width: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 10, border: '1px solid var(--border)',
                      background: 'var(--bg)', color: bookmarked ? 'var(--gold)' : 'var(--text-light)', cursor: 'pointer',
                    }}
                  >{bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}</button>
                </div>
              </div>
            )}

            {!item.highlightAyah && (
              <button
                onClick={() => onOpenReaderSurah(item.surahNumber, 1)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '11px 0', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 14,
                  background: 'var(--card)', color: 'var(--accent)', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
                }}
              >সম্পূর্ণ সূরা রিডারে পড়ুন<ChevronRight size={15} /></button>
            )}

            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              প্রমাণ ও সূত্র
            </div>
            {item.evidence.map((ev, idx) => {
              const kindInfo = KIND_LABEL[ev.kind];
              return (
                <div key={idx} style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderLeft: `3px solid ${kindInfo.color}`,
                  borderRadius: 14, padding: '13px 15px', marginBottom: 10,
                }}>
                  <div style={{
                    display: 'inline-block', fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4,
                    color: kindInfo.color, background: `${kindInfo.color}1A`, borderRadius: 20,
                    padding: '3px 9px', marginBottom: 8,
                  }}>{kindInfo.label}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.7, marginBottom: 8 }}>
                    {ev.summaryBn}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    <strong>সূত্র:</strong> {ev.sourceLabel}
                    {ev.narrator ? ` • বর্ণনাকারী: ${ev.narrator}` : ''}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-light)', lineHeight: 1.5, marginTop: 4 }}>
                    {ev.gradingNoteBn}
                  </div>
                  {ev.sourceUrl && (
                    <a
                      href={ev.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8,
                        fontSize: 11, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600,
                      }}
                    >মূল সূত্র যাচাই করুন<ExternalLink size={11} /></a>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
