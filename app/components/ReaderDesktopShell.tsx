'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Home } from 'lucide-react';
import BackButton from './BackButton';
import ReaderSidebar from './ReaderSidebar';
import ReaderToolbar from './ReaderToolbar';
import { loadSurahMeta } from '../lib/reader-data';
import {
  type ReaderPrefs,
  loadReaderPrefs,
  saveReaderPrefs,
  defaultReaderPrefs,
  resolveReaderPalette,
  toggleSidebarCollapsed,
} from '../lib/reader-prefs';
import { useTheme } from '../lib/theme';
import type { SurahMeta } from '../lib/reader-types';
import type { Screen } from '../types';

interface Props {
  screen: Screen;
  readerSurahNumber?: number;
  onBack: () => void;
  onHome: () => void;
  onOpenReaderHome: () => void;
  onOpenSurah: (surah: number, ayah?: number) => void;
  onOpenSearch: () => void;
  onOpenBookmarks: () => void;
  children: (ctx: { prefs: ReaderPrefs; onPrefsChange: (next: ReaderPrefs) => void }) => ReactNode;
}

// Desktop-only two-pane reading layout: a collapsible surah sidebar + a
// reading-controls toolbar, wrapped around the same screen components the
// mobile layout already renders (page.tsx decides when to use this; the
// mobile card layout is untouched). Only used for the 4 reader-* screens.
export default function ReaderDesktopShell({
  screen, readerSurahNumber, onBack, onHome, onOpenReaderHome, onOpenSurah, onOpenSearch, onOpenBookmarks, children,
}: Props) {
  const { theme: appTheme } = useTheme();
  const [prefs, setPrefs] = useState<ReaderPrefs>(() => defaultReaderPrefs());
  const [allMeta, setAllMeta] = useState<SurahMeta[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage reading-prefs on mount (matches app/lib/theme.tsx and the Sirah screens)
    setPrefs(loadReaderPrefs(appTheme === 'dark' ? 'dark' : 'light'));
    loadSurahMeta().then(setAllMeta).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePrefsChange(next: ReaderPrefs) {
    setPrefs(next);
    saveReaderPrefs(next);
  }

  const isSurahScreen = screen === 'reader-surah';
  const focusHidden = isSurahScreen && prefs.focusMode;

  // The reading palette only re-skins the actual Surah reading screen
  // (and its surrounding chrome here, so there's no jarring seam) —
  // browsing/searching/bookmarks keep the app's normal theme.
  const palette = isSurahScreen ? resolveReaderPalette(prefs.theme) : null;
  const paletteVars = palette
    ? ({
        '--bg': palette.bg,
        '--card': palette.card,
        '--text': palette.text,
        '--text-muted': palette.textMuted,
        '--text-light': palette.textLight,
        '--border': palette.border,
        '--accent': palette.accent,
        '--accent-light': palette.accentLight,
        '--gold': palette.gold,
        '--gold-light': palette.goldLight,
      } as CSSProperties)
    : undefined;

  return (
    <div style={{ height: '100dvh', width: '100%', display: 'flex', background: 'var(--bg)', ...paletteVars }}>
      {!focusHidden && (
        <ReaderSidebar
          allMeta={allMeta}
          activeSurah={isSurahScreen ? readerSurahNumber : undefined}
          collapsed={prefs.sidebarCollapsed}
          onToggleCollapsed={() => handlePrefsChange(toggleSidebarCollapsed(prefs))}
          onOpenSurah={onOpenSurah}
          onOpenReaderHome={onOpenReaderHome}
        />
      )}

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {!focusHidden && (
          <div style={{
            flexShrink: 0, borderBottom: '1px solid var(--border)', padding: '14px 24px',
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <button
              type="button"
              onClick={onHome}
              aria-label="হোমে যান"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10,
                padding: '7px 11px', fontSize: 12, fontWeight: 600, color: 'var(--text)', cursor: 'pointer',
                fontFamily: 'Hind Siliguri, sans-serif',
              }}
            ><Home size={13} />হোম</button>
            <BackButton onClick={onBack} variant="dark" />
            <div style={{ width: 1, height: 22, background: 'var(--border)', flexShrink: 0 }} />
            <ReaderToolbar
              prefs={prefs}
              onPrefsChange={handlePrefsChange}
              allMeta={allMeta}
              onOpenSurah={onOpenSurah}
              onOpenSearch={onOpenSearch}
              onOpenBookmarks={onOpenBookmarks}
              currentSurah={isSurahScreen ? readerSurahNumber : undefined}
            />
          </div>
        )}

        <div style={{
          flex: 1, minHeight: 0, overflowY: isSurahScreen ? 'hidden' : 'auto', overflowX: 'hidden',
          width: '100%', maxWidth: isSurahScreen ? undefined : 760, margin: isSurahScreen ? undefined : '0 auto',
        }}>
          {children({ prefs, onPrefsChange: handlePrefsChange })}
        </div>
      </div>
    </div>
  );
}
