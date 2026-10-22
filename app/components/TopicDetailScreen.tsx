'use client';
import { useEffect, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import { Bookmark, BookmarkCheck, ChevronRight, RotateCw, WifiOff } from 'lucide-react';
import BackButton from './BackButton';
import { loadSurahMeta, loadSurah } from '../lib/reader-data';
import { getBookmarks, toggleBookmark, saveBookmarks, isBookmarked } from '../lib/reader-progress';
import { TOPICS } from '../lib/topics-data';
import type { SurahMeta, SurahDoc, ReaderBookmark } from '../lib/reader-types';

interface Props {
  topicId: string;
  onBack: () => void;
  onOpenReaderSurah: (surah: number, ayah?: number) => void;
}

type LoadState = 'loading' | 'error' | 'ready';

function TopicIcon({ name, ...props }: { name: string; size?: number; strokeWidth?: number; color?: string }) {
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>>)[name];
  if (!IconComponent) return null;
  return <IconComponent {...props} />;
}

export default function TopicDetailScreen({ topicId, onBack, onOpenReaderSurah }: Props) {
  const topic = useMemo(() => TOPICS.find((t) => t.id === topicId) ?? TOPICS[0], [topicId]);

  const [metaList, setMetaList] = useState<SurahMeta[]>([]);
  const [docs, setDocs] = useState<Map<number, SurahDoc>>(new Map());
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [bookmarks, setBookmarks] = useState<ReaderBookmark[]>([]);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicking off a data fetch on mount/topic change (matches ReaderSurahScreen)
    setLoadState('loading');
    const surahNumbers = Array.from(new Set(topic.ayahs.map((r) => r.surah)));

    Promise.all([loadSurahMeta(), Promise.all(surahNumbers.map((n) => loadSurah(n)))])
      .then(([metaResult, surahDocs]) => {
        if (cancelled) return;
        setMetaList(metaResult);
        setDocs(new Map(surahDocs.map((d) => [d.number, d])));
        setLoadState('ready');
      })
      .catch(() => {
        if (!cancelled) setLoadState('error');
      });

    setBookmarks(getBookmarks());

    return () => {
      cancelled = true;
    };
  }, [topic, retryTick]);

  function handleToggleBookmark(surah: number, ayah: number) {
    const next = toggleBookmark(bookmarks, surah, ayah);
    setBookmarks(next);
    saveBookmarks(next);
  }

  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ padding: '44px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackButton onClick={onBack} variant="dark" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>{topic.nameBn}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>{topic.summaryBn}</div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 11, flexShrink: 0,
          background: 'rgba(31,122,76,0.12)', color: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><TopicIcon name={topic.icon} size={17} strokeWidth={1.8} /></div>
      </div>

      <div style={{ padding: '10px 16px 0' }}>
        {loadState === 'loading' && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RotateCw size={22} className="qibla-spin" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 13 }}>আয়াত লোড হচ্ছে...</div>
          </div>
        )}

        {loadState === 'error' && (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <WifiOff size={28} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 13, marginBottom: 14 }}>আয়াত লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।</div>
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

        {loadState === 'ready' && topic.ayahs.map((ref, idx) => {
          const doc = docs.get(ref.surah);
          const meta = metaList.find((m) => m.number === ref.surah);
          if (!doc || !meta) return null;
          const ayahsInRange = doc.ayahs.filter((a) => a.number >= ref.ayahStart && a.number <= ref.ayahEnd);
          const bookmarked = isBookmarked(bookmarks, ref.surah, ref.ayahStart);
          const refLabel = ref.ayahStart === ref.ayahEnd
            ? `${ref.surah}:${ref.ayahStart}`
            : `${ref.surah}:${ref.ayahStart}-${ref.ayahEnd}`;

          return (
            <div key={idx} style={{
              background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
              padding: '16px 16px 12px', marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>
                  সূরা {meta.banglaName} ({refLabel})
                </div>
                <button
                  onClick={() => handleToggleBookmark(ref.surah, ref.ayahStart)}
                  aria-label={bookmarked ? 'বুকমার্ক সরান' : 'বুকমার্ক করুন'}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                    color: bookmarked ? 'var(--gold)' : 'var(--text-light)',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                </button>
              </div>

              <div
                className="arabic"
                dir="rtl"
                style={{
                  fontFamily: 'Amiri, serif', fontSize: 21, lineHeight: 2, textAlign: 'right',
                  color: 'var(--text)', marginBottom: 12,
                }}
              >
                {ayahsInRange.map((a) => a.text).join(' ')}
              </div>

              <div style={{
                background: 'var(--bg)', borderRadius: 10, padding: '10px 12px',
                fontSize: 12.5, color: 'var(--text)', lineHeight: 1.7, marginBottom: 10,
              }}>
                {ref.glossBn}
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--text-light)', marginBottom: 10 }}>
                * এটি এই অ্যাপের নিজস্ব সারসংক্ষেপ — কোনো নির্দিষ্ট প্রকাশিত অনুবাদ নয়।
              </div>

              <button
                onClick={() => onOpenReaderSurah(ref.surah, ref.ayahStart)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 0', borderRadius: 10, border: '1px solid var(--border)',
                  background: 'var(--bg)', color: 'var(--accent)', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
                }}
              >রিডারে দেখুন<ChevronRight size={14} /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
