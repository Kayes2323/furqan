'use client';

import { useEffect, useState } from 'react';
import { BookmarkX, Bookmark as BookmarkIcon } from 'lucide-react';
import BackButton from './BackButton';
import { loadSurahMeta } from '../lib/reader-data';
import { getBookmarks, sortedBookmarks, toggleBookmark, saveBookmarks } from '../lib/reader-progress';
import type { SurahMeta, ReaderBookmark } from '../lib/reader-types';

interface Props {
  onBack: () => void;
  onOpenSurah: (surah: number, ayah?: number) => void;
}

export default function ReaderBookmarksScreen({ onBack, onOpenSurah }: Props) {
  const [bookmarks, setBookmarks] = useState<ReaderBookmark[]>([]);
  const [meta, setMeta] = useState<SurahMeta[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage bookmarks on mount (matches app/lib/theme.tsx and the Sirah screens)
    setBookmarks(getBookmarks());
    loadSurahMeta().then(setMeta).catch(() => {});
  }, []);

  function handleRemove(surah: number, ayah: number, e: React.MouseEvent) {
    e.stopPropagation();
    const next = toggleBookmark(bookmarks, surah, ayah);
    setBookmarks(next);
    saveBookmarks(next);
  }

  const sorted = sortedBookmarks(bookmarks);

  return (
    <div>
      <div style={{
        padding: '44px 16px 12px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <BackButton onClick={onBack} variant="dark" />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>বুকমার্ক</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>সংরক্ষিত আয়াতসমূহ</div>
        </div>
      </div>

      <div style={{ padding: '14px 16px 24px' }}>
        {sorted.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <BookmarkIcon size={28} style={{ marginBottom: 10, opacity: 0.5 }} />
            <div style={{ fontSize: 13 }}>এখনও কোনো বুকমার্ক নেই।</div>
            <div style={{ fontSize: 11.5, marginTop: 4 }}>কুরআন পড়ার সময় যেকোনো আয়াত বুকমার্ক করুন।</div>
          </div>
        )}

        {sorted.map((b) => {
          const sm = meta.find((s) => s.number === b.surah);
          return (
            <div
              key={`${b.surah}:${b.ayah}`}
              onClick={() => onOpenSurah(b.surah, b.ayah)}
              style={{
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
                padding: '12px 14px', marginBottom: 8, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <div style={{
                width: 34, height: 34, flexShrink: 0, borderRadius: 10,
                background: 'rgba(150,112,42,0.12)', color: 'var(--gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><BookmarkIcon size={16} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>
                  {sm ? sm.banglaName : `সূরা ${b.surah}`}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>আয়াত {b.ayah}</div>
              </div>
              <button
                onClick={(e) => handleRemove(b.surah, b.ayah, e)}
                aria-label="বুকমার্ক সরান"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  color: 'var(--text-light)', flexShrink: 0,
                }}
              ><BookmarkX size={17} /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
