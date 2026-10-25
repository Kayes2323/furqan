'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Bookmark, History, Navigation, Minimize2, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getLastRead } from '../lib/reader-progress';
import {
  type ReaderPrefs,
  type ReaderTheme,
  increaseFontScale,
  decreaseFontScale,
  setReaderTheme,
  setReaderWidth,
  toggleFocusMode,
  FONT_SCALE_MIN,
  FONT_SCALE_MAX,
} from '../lib/reader-prefs';
import type { SurahMeta, ReaderLastRead } from '../lib/reader-types';

interface Props {
  prefs: ReaderPrefs;
  onPrefsChange: (next: ReaderPrefs) => void;
  allMeta: SurahMeta[];
  onOpenSurah: (surah: number, ayah?: number) => void;
  onOpenSearch?: () => void;
  onOpenBookmarks?: () => void;
  currentSurah?: number;
  compact?: boolean;
}

const THEME_SWATCHES: { value: ReaderTheme; label: string; swatch: string }[] = [
  { value: 'light', label: 'লাইট থিম', swatch: '#F4F1E1' },
  { value: 'dark', label: 'ডার্ক থিম', swatch: '#173327' },
  { value: 'sepia', label: 'সেপিয়া থিম', swatch: '#F2E6CC' },
];

function btnStyle(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: active ? 'var(--accent)' : 'var(--card)',
    color: active ? '#fff' : 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: 10, padding: '7px 10px', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif', whiteSpace: 'nowrap',
  };
}

export default function ReaderToolbar({
  prefs, onPrefsChange, allMeta, onOpenSurah, onOpenSearch, onOpenBookmarks, currentSurah, compact,
}: Props) {
  const [lastRead, setLastRead] = useState<ReaderLastRead | null>(null);
  const [goToOpen, setGoToOpen] = useState(false);
  const [goToSurah, setGoToSurah] = useState(currentSurah ?? 1);
  const [goToAyah, setGoToAyah] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage last-read position on mount (matches app/lib/theme.tsx and the Sirah screens)
    setLastRead(getLastRead());
  }, []);

  useEffect(() => {
    if (!goToOpen) return;
    function onDocClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setGoToOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setGoToOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [goToOpen]);

  const currentMeta = allMeta.find((s) => s.number === goToSurah);
  const prevSurah = currentSurah && currentSurah > 1 ? currentSurah - 1 : null;
  const nextSurah = currentSurah && currentSurah < 114 ? currentSurah + 1 : null;

  function handleGoTo() {
    const ayah = goToAyah.trim() ? parseInt(goToAyah, 10) : undefined;
    const maxAyah = currentMeta?.ayahCount;
    const clampedAyah = ayah && maxAyah ? Math.min(Math.max(1, ayah), maxAyah) : ayah;
    onOpenSurah(goToSurah, clampedAyah);
    setGoToOpen(false);
    setGoToAyah('');
  }

  const fontSize = compact ? 11 : 12;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: compact ? 6 : 8, fontSize }}>
      {/* Font size */}
      <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <button
          type="button"
          aria-label="আরবি লেখা ছোট করুন"
          disabled={prefs.fontScale <= FONT_SCALE_MIN}
          onClick={() => onPrefsChange(decreaseFontScale(prefs))}
          style={{
            background: 'var(--card)', color: 'var(--text)', border: 'none',
            padding: '7px 11px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Hind Siliguri, sans-serif', opacity: prefs.fontScale <= FONT_SCALE_MIN ? 0.4 : 1,
          }}
        >অ−</button>
        <button
          type="button"
          aria-label="আরবি লেখা বড় করুন"
          disabled={prefs.fontScale >= FONT_SCALE_MAX}
          onClick={() => onPrefsChange(increaseFontScale(prefs))}
          style={{
            background: 'var(--card)', color: 'var(--text)', border: 'none', borderLeft: '1px solid var(--border)',
            padding: '7px 11px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Hind Siliguri, sans-serif', opacity: prefs.fontScale >= FONT_SCALE_MAX ? 0.4 : 1,
          }}
        >অ+</button>
      </div>

      {/* Reading theme */}
      <div style={{ display: 'inline-flex', gap: 4, border: '1px solid var(--border)', borderRadius: 10, padding: 3 }}>
        {THEME_SWATCHES.map((t) => (
          <button
            key={t.value}
            type="button"
            aria-label={t.label}
            aria-pressed={prefs.theme === t.value}
            onClick={() => onPrefsChange(setReaderTheme(prefs, t.value))}
            style={{
              width: compact ? 20 : 22, height: compact ? 20 : 22, borderRadius: '50%',
              background: t.swatch, cursor: 'pointer',
              border: prefs.theme === t.value ? '2px solid var(--accent)' : '1px solid var(--border)',
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* Reading width */}
      {!compact && (
        <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <button
            type="button"
            aria-pressed={prefs.width === 'comfortable'}
            onClick={() => onPrefsChange(setReaderWidth(prefs, 'comfortable'))}
            style={{ ...btnStyle(prefs.width === 'comfortable'), border: 'none', borderRadius: 0 }}
          >স্বাভাবিক প্রস্থ</button>
          <button
            type="button"
            aria-pressed={prefs.width === 'wide'}
            onClick={() => onPrefsChange(setReaderWidth(prefs, 'wide'))}
            style={{ ...btnStyle(prefs.width === 'wide'), border: 'none', borderLeft: '1px solid var(--border)', borderRadius: 0 }}
          >প্রশস্ত</button>
        </div>
      )}

      {/* Go to surah/ayah */}
      {!compact && (
        <div style={{ position: 'relative' }} ref={popoverRef}>
          <button type="button" aria-label="সূরা ও আয়াতে যান" onClick={() => setGoToOpen((o) => !o)} style={btnStyle(goToOpen)}>
            <Navigation size={13} />সূরা/আয়াত
          </button>
          {goToOpen && (
            <div style={{
              position: 'absolute', top: '110%', left: 0, zIndex: 50,
              background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
              padding: 12, width: 220, boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>সূরা</label>
              <select
                value={goToSurah}
                onChange={(e) => setGoToSurah(Number(e.target.value))}
                style={{
                  width: '100%', padding: '7px 8px', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--bg)', color: 'var(--text)', fontSize: 12.5, marginBottom: 8,
                  fontFamily: 'Hind Siliguri, sans-serif',
                }}
              >
                {allMeta.map((s) => (
                  <option key={s.number} value={s.number}>{s.number}. {s.banglaName}</option>
                ))}
              </select>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>আয়াত (ঐচ্ছিক)</label>
              <input
                type="number"
                min={1}
                max={currentMeta?.ayahCount}
                value={goToAyah}
                onChange={(e) => setGoToAyah(e.target.value)}
                placeholder={currentMeta ? `১-${currentMeta.ayahCount}` : ''}
                style={{
                  width: '100%', padding: '7px 8px', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--bg)', color: 'var(--text)', fontSize: 12.5, marginBottom: 10,
                  fontFamily: 'Hind Siliguri, sans-serif', boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={handleGoTo}
                style={{
                  width: '100%', background: 'var(--accent)', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '8px 0', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'Hind Siliguri, sans-serif',
                }}
              >যান</button>
            </div>
          )}
        </div>
      )}

      {/* Search / Bookmarks / Continue reading */}
      {!compact && onOpenSearch && (
        <button type="button" aria-label="আয়াত খুঁজুন" onClick={onOpenSearch} style={btnStyle(false)}>
          <Search size={13} />খুঁজুন
        </button>
      )}
      {!compact && onOpenBookmarks && (
        <button type="button" aria-label="বুকমার্ক তালিকা" onClick={onOpenBookmarks} style={btnStyle(false)}>
          <Bookmark size={13} />বুকমার্ক
        </button>
      )}
      {!compact && lastRead && (
        <button
          type="button"
          aria-label="সর্বশেষ পঠিত স্থানে যান"
          onClick={() => onOpenSurah(lastRead.surah, lastRead.ayah)}
          style={btnStyle(false)}
        >
          <History size={13} />সর্বশেষ পঠিত
        </button>
      )}

      {/* Focus mode */}
      <button
        type="button"
        aria-label={prefs.focusMode ? 'ফোকাস মোড বন্ধ করুন' : 'ফোকাস মোড চালু করুন'}
        aria-pressed={prefs.focusMode}
        onClick={() => onPrefsChange(toggleFocusMode(prefs))}
        style={btnStyle(prefs.focusMode)}
      >
        {prefs.focusMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        {!compact && 'ফোকাস মোড'}
      </button>

      {/* Prev/next surah */}
      {!compact && currentSurah && (
        <div style={{ display: 'inline-flex', gap: 6, marginLeft: 'auto' }}>
          <button
            type="button"
            aria-label="পূর্ববর্তী সূরা"
            disabled={!prevSurah}
            onClick={() => prevSurah && onOpenSurah(prevSurah)}
            style={{ ...btnStyle(false), opacity: prevSurah ? 1 : 0.4, cursor: prevSurah ? 'pointer' : 'default' }}
          ><ChevronLeft size={13} />পূর্ববর্তী</button>
          <button
            type="button"
            aria-label="পরবর্তী সূরা"
            disabled={!nextSurah}
            onClick={() => nextSurah && onOpenSurah(nextSurah)}
            style={{ ...btnStyle(false), opacity: nextSurah ? 1 : 0.4, cursor: nextSurah ? 'pointer' : 'default' }}
          >পরবর্তী<ChevronRight size={13} /></button>
        </div>
      )}
    </div>
  );
}
