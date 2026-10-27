'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Copy, Minimize2, RotateCw, ScrollText, WifiOff } from 'lucide-react';
import BackButton from './BackButton';
import ReaderToolbar from './ReaderToolbar';
import TafsirPanel from './TafsirPanel';
import { loadSurahMeta, loadSurah } from '../lib/reader-data';
import { loadSurahTranslations, type TranslationsResult } from '../lib/translation-tafsir-data';
import {
  saveLastRead,
  getBookmarks,
  toggleBookmark,
  saveBookmarks,
  isBookmarked,
} from '../lib/reader-progress';
import { splitOpeningBismillah } from '../lib/bismillah';
import {
  type ReaderPrefs,
  loadReaderPrefs,
  saveReaderPrefs,
  defaultReaderPrefs,
  resolveReaderPalette,
  toggleFocusMode,
  BASE_ARABIC_PX_MOBILE,
  BASE_ARABIC_PX_DESKTOP,
  READER_WIDTH_PX,
} from '../lib/reader-prefs';
import { useTheme } from '../lib/theme';
import type { SurahMeta, SurahDoc, ReaderBookmark } from '../lib/reader-types';

interface Props {
  surahNumber: number;
  targetAyah?: number;
  onBack: () => void;
  onOpenSurah: (surah: number, ayah?: number) => void;
  // When provided (desktop, via ReaderDesktopShell), reading preferences
  // are controlled from outside and this screen renders no toolbar of its
  // own. When omitted (mobile), the screen manages its own preferences
  // and shows a compact inline control row.
  prefs?: ReaderPrefs;
  onPrefsChange?: (next: ReaderPrefs) => void;
}

type LoadState = 'loading' | 'error' | 'ready';
type TranslationsState = { status: 'loading' } | TranslationsResult;

export default function ReaderSurahScreen({ surahNumber, targetAyah, onBack, onOpenSurah, prefs: prefsProp, onPrefsChange: onPrefsChangeProp }: Props) {
  const { theme: appTheme } = useTheme();
  const [allMeta, setAllMeta] = useState<SurahMeta[]>([]);
  const [doc, setDoc] = useState<SurahDoc | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [bookmarks, setBookmarks] = useState<ReaderBookmark[]>([]);
  const [retryTick, setRetryTick] = useState(0);
  const [localPrefs, setLocalPrefs] = useState<ReaderPrefs>(() => defaultReaderPrefs());
  const [translations, setTranslations] = useState<TranslationsState>({ status: 'loading' });
  const [selectedAyah, setSelectedAyah] = useState<number | null>(null);
  const [tafsirAyah, setTafsirAyah] = useState<number | null>(null);
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);

  const isControlled = prefsProp !== undefined;
  const prefs = prefsProp ?? localPrefs;

  useEffect(() => {
    if (isControlled) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage reading-prefs on mount (matches app/lib/theme.tsx and the Sirah screens)
    setLocalPrefs(loadReaderPrefs(appTheme === 'dark' ? 'dark' : 'light'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePrefsChange(next: ReaderPrefs) {
    if (onPrefsChangeProp) {
      onPrefsChangeProp(next);
      return;
    }
    setLocalPrefs(next);
    saveReaderPrefs(next);
  }

  const palette = resolveReaderPalette(prefs.theme);
  const paletteVars = {
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
  } as CSSProperties;

  const baseArabicPx = isControlled ? BASE_ARABIC_PX_DESKTOP : BASE_ARABIC_PX_MOBILE;
  const arabicFontSize = Math.round(baseArabicPx * prefs.fontScale);
  const bismillahFontSize = Math.round((baseArabicPx - 2) * prefs.fontScale);
  const columnMaxWidth = READER_WIDTH_PX[prefs.width];

  const ayahRefs = useRef(new Map<number, HTMLDivElement>());
  const visibleAyahRef = useRef<number>(targetAyah ?? 1);
  const scrolledRef = useRef(false);

  const meta = allMeta.find((s) => s.number === surahNumber);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicking off a data fetch on mount/surah change (matches app/lib/theme.tsx and the Sirah screens)
    setLoadState('loading');
    scrolledRef.current = false;
    visibleAyahRef.current = targetAyah ?? 1;

    Promise.all([loadSurahMeta(), loadSurah(surahNumber)])
      .then(([metaList, surahDoc]) => {
        if (cancelled) return;
        setAllMeta(metaList);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahNumber, retryTick]);

  // Bengali translation loads independently of the Arabic text/dataset —
  // its own loading/failure never blocks or alters canonical reading.
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicking off a data fetch on mount/surah change (matches the surah-load effect above)
    setTranslations({ status: 'loading' });
    loadSurahTranslations(surahNumber).then((result) => {
      if (!cancelled) setTranslations(result);
    });
    setSelectedAyah(null);
    return () => {
      cancelled = true;
    };
  }, [surahNumber, retryTick]);

  // Scroll to the deep-linked ayah once content is ready.
  useEffect(() => {
    if (loadState !== 'ready' || !targetAyah || scrolledRef.current) return;
    const el = ayahRefs.current.get(targetAyah);
    if (el) {
      el.scrollIntoView({ block: 'center' });
      scrolledRef.current = true;
    }
  }, [loadState, targetAyah]);

  // Track the most-visible ayah while reading, and persist it as the
  // last-read position periodically (not on every scroll tick) and on
  // unmount, to avoid excessive localStorage writes.
  useEffect(() => {
    if (loadState !== 'ready') return;
    const observer = new IntersectionObserver(
      (entries) => {
        let best: { num: number; ratio: number } | null = null;
        for (const entry of entries) {
          const num = Number((entry.target as HTMLElement).dataset.ayah);
          if (entry.isIntersecting && (!best || entry.intersectionRatio > best.ratio)) {
            best = { num, ratio: entry.intersectionRatio };
          }
        }
        if (best) visibleAyahRef.current = best.num;
      },
      { threshold: [0.3, 0.6, 0.9] }
    );
    for (const el of ayahRefs.current.values()) observer.observe(el);

    const persist = () => saveLastRead({ surah: surahNumber, ayah: visibleAyahRef.current, updatedAt: new Date().toISOString() });
    const interval = setInterval(persist, 4000);

    // Also persist immediately when the tab is backgrounded/closed, so a
    // quick visit isn't lost waiting on the next 4s tick.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') persist();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', persist);

    return () => {
      observer.disconnect();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', persist);
      persist();
    };
  }, [loadState, surahNumber]);

  function handleToggleBookmark(ayah: number) {
    const next = toggleBookmark(bookmarks, surahNumber, ayah);
    setBookmarks(next);
    saveBookmarks(next);
  }

  function handleSelectAyah(ayah: number) {
    setSelectedAyah((prev) => (prev === ayah ? null : ayah));
  }

  async function handleCopyAyah(ayah: number, arabicText: string) {
    const translation = 'ok' in translations && translations.ok ? translations.data.get(ayah) : undefined;
    const parts = [arabicText];
    if (translation) parts.push(translation.text);
    parts.push(`— সূরা ${surahNumber}:${ayah}`);
    try {
      await navigator.clipboard.writeText(parts.join('\n\n'));
      setCopiedAyah(ayah);
      setTimeout(() => setCopiedAyah((prev) => (prev === ayah ? null : prev)), 1600);
    } catch {
      // Clipboard access can be denied (permissions, insecure context); no
      // further fallback is attempted — the UI simply doesn't show "copied".
    }
  }

  const prevSurah = surahNumber > 1 ? surahNumber - 1 : null;
  const nextSurah = surahNumber < 114 ? surahNumber + 1 : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', ...paletteVars }}>
      {prefs.focusMode && (
        <button
          type="button"
          aria-label="ফোকাস মোড থেকে বের হন"
          onClick={() => handlePrefsChange(toggleFocusMode(prefs))}
          style={{
            position: 'fixed', top: 14, right: 14, zIndex: 40,
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--accent)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.14)',
          }}
        ><Minimize2 size={16} /></button>
      )}

      {!prefs.focusMode && (
        <div style={{
          padding: '44px 16px 12px', flexShrink: 0,
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          <BackButton onClick={onBack} variant="dark" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>
              {meta ? `${meta.number}. ${meta.banglaName}` : `সূরা ${surahNumber}`}
            </div>
            {meta && (
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>
                {meta.ayahCount} আয়াত • {meta.revelationType === 'Meccan' ? 'মক্কি' : 'মাদানি'}
              </div>
            )}
          </div>
          {meta && (
            <div className="arabic" style={{ fontFamily: 'Amiri, serif', fontSize: 20, color: 'var(--accent)', flexShrink: 0 }}>
              {meta.arabicName}
            </div>
          )}
          {!isControlled && (
            <div style={{ width: '100%' }}>
              <ReaderToolbar
                compact
                prefs={prefs}
                onPrefsChange={handlePrefsChange}
                allMeta={allMeta}
                onOpenSurah={onOpenSurah}
                currentSurah={surahNumber}
              />
            </div>
          )}
        </div>
      )}

      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: '14px 16px 10px' }}>
        <div style={{ maxWidth: columnMaxWidth, margin: '0 auto', width: '100%' }}>
        {loadState === 'loading' && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RotateCw size={22} className="qibla-spin" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 13 }}>সূরা লোড হচ্ছে...</div>
          </div>
        )}

        {loadState === 'error' && (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <WifiOff size={28} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 13, marginBottom: 14 }}>এই সূরা লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।</div>
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

        {loadState === 'ready' && doc && doc.ayahs.map((a) => {
          const bookmarked = isBookmarked(bookmarks, surahNumber, a.number);
          const isSelected = selectedAyah === a.number;
          const translation = 'ok' in translations && translations.ok ? translations.data.get(a.number) : undefined;
          // Display-only: the opening Bismillah embedded in ayah 1's
          // text (Tanzil's own source convention) is shown as its own
          // header, separate from the ayah card. The canonical ayah
          // text/number below is never altered — only `bodyText` (what
          // the ayah card renders) changes, and only for ayah 1.
          const bismillahSplit = splitOpeningBismillah(a.number, a.text);
          const bodyText = bismillahSplit ? bismillahSplit.body : a.text;
          return (
            <div key={a.number}>
              {bismillahSplit && (
                <div
                  className="arabic"
                  style={{
                    fontFamily: 'Amiri, serif', fontSize: bismillahFontSize, lineHeight: 1.9,
                    textAlign: 'center', color: 'var(--accent)',
                    padding: '10px 16px', marginBottom: 10,
                  }}
                >
                  {bismillahSplit.bismillah}
                </div>
              )}
              <div
                data-ayah={a.number}
                ref={(el) => {
                  if (el) ayahRefs.current.set(a.number, el);
                  else ayahRefs.current.delete(a.number);
                }}
                onClick={() => handleSelectAyah(a.number)}
                role="button"
                tabIndex={0}
                aria-label={`আয়াত ${surahNumber}:${a.number} নির্বাচন করুন`}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectAyah(a.number); } }}
                style={{
                  background: 'var(--card)',
                  border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: 16, padding: '16px 16px 12px', marginBottom: 10,
                  cursor: 'pointer',
                }}
              >
                <div
                  className="arabic"
                  style={{
                    fontFamily: 'Amiri, serif', fontSize: arabicFontSize, lineHeight: 2.1,
                    textAlign: 'right', color: 'var(--text)',
                  }}
                >
                  {bodyText}
                </div>

                {translation && (
                  <div style={{ fontSize: 15.5, lineHeight: 2, color: 'var(--text)', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    {translation.text}
                  </div>
                )}
                {!translation && 'status' in translations && translations.status === 'loading' && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <div style={{ height: 11, width: '90%', borderRadius: 4, background: 'var(--border)', opacity: 0.5 }} />
                  </div>
                )}
                {!translation && 'ok' in translations && !translations.ok && translations.reason === 'not_configured' && (
                  <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    বাংলা অনুবাদ এখনো যুক্ত করা হয়নি
                  </div>
                )}
                {!translation && 'ok' in translations && !translations.ok && (translations.reason === 'offline' || translations.reason === 'error') && (
                  <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    অনুবাদ লোড করা যায়নি
                  </div>
                )}

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)',
                }}>
                  <div style={{
                    fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)',
                    background: 'var(--bg)', borderRadius: 100, padding: '3px 10px',
                  }}>
                    {surahNumber}:{a.number}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleBookmark(a.number); }}
                    aria-label={bookmarked ? 'বুকমার্ক সরান' : 'বুকমার্ক করুন'}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                      color: bookmarked ? 'var(--gold)' : 'var(--text-light)',
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    {bookmarked ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
                  </button>
                </div>

                {isSelected && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: 'flex', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border)' }}
                  >
                    <button
                      onClick={() => setTafsirAyah(a.number)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '9px 0', borderRadius: 10, border: 'none', background: 'var(--accent)',
                        color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'Hind Siliguri, sans-serif',
                      }}
                    ><ScrollText size={14} />তাফসির পড়ুন</button>
                    <button
                      onClick={() => handleCopyAyah(a.number, bodyText)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '9px 14px', borderRadius: 10, border: '1px solid var(--border)',
                        background: 'var(--bg)', color: 'var(--text)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'Hind Siliguri, sans-serif',
                      }}
                    ><Copy size={14} />{copiedAyah === a.number ? 'কপি হয়েছে' : 'কপি'}</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loadState === 'ready' && (
          <div style={{ display: 'flex', gap: 10, marginTop: 6, marginBottom: 10 }}>
            <button
              onClick={() => prevSurah && onOpenSurah(prevSurah)}
              disabled={!prevSurah}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '11px 0', borderRadius: 12, border: '1px solid var(--border)',
                background: 'var(--card)', color: prevSurah ? 'var(--text)' : 'var(--text-light)',
                fontSize: 12.5, fontWeight: 700, cursor: prevSurah ? 'pointer' : 'default',
                fontFamily: 'Hind Siliguri, sans-serif', opacity: prevSurah ? 1 : 0.5,
              }}
            ><ChevronLeft size={15} />পূর্ববর্তী সূরা</button>
            <button
              onClick={() => nextSurah && onOpenSurah(nextSurah)}
              disabled={!nextSurah}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '11px 0', borderRadius: 12, border: '1px solid var(--border)',
                background: 'var(--card)', color: nextSurah ? 'var(--text)' : 'var(--text-light)',
                fontSize: 12.5, fontWeight: 700, cursor: nextSurah ? 'pointer' : 'default',
                fontFamily: 'Hind Siliguri, sans-serif', opacity: nextSurah ? 1 : 0.5,
              }}
            >পরবর্তী সূরা<ChevronRight size={15} /></button>
          </div>
        )}
        </div>
      </div>

      {tafsirAyah != null && (
        <TafsirPanel
          surah={surahNumber}
          ayah={tafsirAyah}
          meta={meta}
          onClose={() => setTafsirAyah(null)}
          onNavigate={(ayah) => setTafsirAyah(ayah)}
        />
      )}
    </div>
  );
}
