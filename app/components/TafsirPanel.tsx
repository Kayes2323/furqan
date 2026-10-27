'use client';

import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, RotateCw, WifiOff, BookX } from 'lucide-react';
import { useIsDesktop } from '../hooks/useViewport';
import { loadAyahTafsir, type TafsirResult } from '../lib/translation-tafsir-data';
import type { SurahMeta } from '../lib/reader-types';

type PanelState = { status: 'loading' } | TafsirResult;

interface Props {
  surah: number;
  ayah: number;
  meta?: SurahMeta;
  onClose: () => void;
  onNavigate: (ayah: number) => void;
}

// Dedicated tafsir detail experience — a bottom sheet on mobile, a
// centered modal on desktop (useIsDesktop), reused as the single
// component for both per the task's "panel/bottom sheet/page for
// mobile+desktop" requirement. Closing always hands control back to the
// Reader via onClose; it never touches the Reader's own scroll position
// itself (the caller already knows where it was).
export default function TafsirPanel({ surah, ayah, meta, onClose, onNavigate }: Props) {
  const isDesktop = useIsDesktop();
  const [result, setResult] = useState<PanelState>({ status: 'loading' });
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicking off a data fetch when the target ayah changes (matches ReaderSurahScreen's own pattern)
    setResult({ status: 'loading' });
    loadAyahTafsir(surah, ayah).then((r) => {
      if (!cancelled) setResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [surah, ayah, retryTick]);

  const ayahCount = meta?.ayahCount ?? null;
  const prevAyah = ayah > 1 ? ayah - 1 : null;
  const nextAyah = ayahCount && ayah < ayahCount ? ayah + 1 : null;

  const isLoading = 'status' in result && result.status === 'loading';
  const isReady = 'ok' in result && result.ok;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="তাফসির"
      style={{
        position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,20,15,0.5)',
        display: 'flex', alignItems: isDesktop ? 'center' : 'flex-end', justifyContent: 'center',
        padding: isDesktop ? 20 : 0,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: isDesktop ? 560 : 480,
          maxHeight: isDesktop ? '82vh' : '85vh',
          display: 'flex', flexDirection: 'column',
          background: 'var(--card)',
          borderRadius: isDesktop ? 20 : '20px 20px 0 0',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{
          padding: '16px 18px 12px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>তাফসির</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
              {meta ? `${meta.banglaName} · ` : ''}
              {isReady ? result.data.verseKey : `${surah}:${ayah}`}
            </div>
          </div>
          <button
            type="button"
            aria-label="বন্ধ করুন"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
          ><X size={20} /></button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: '16px 18px' }}>
          {isLoading && (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RotateCw size={20} className="qibla-spin" style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 12.5 }}>তাফসির লোড হচ্ছে...</div>
            </div>
          )}

          {!isLoading && 'ok' in result && !result.ok && result.reason === 'not_configured' && (
            <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BookX size={26} style={{ marginBottom: 10, opacity: 0.6 }} />
              <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                তাফসির সংযোগ এখনো সম্পন্ন হয়নি।<br />
                বাংলা তাফসির যুক্ত হলে এখানে দেখানো হবে।
              </div>
            </div>
          )}

          {!isLoading && 'ok' in result && !result.ok && result.reason === 'not_found' && (
            <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BookX size={26} style={{ marginBottom: 10, opacity: 0.6 }} />
              <div style={{ fontSize: 13, lineHeight: 1.7 }}>এই আয়াতের জন্য তাফসির পাওয়া যায়নি।</div>
            </div>
          )}

          {!isLoading && 'ok' in result && !result.ok && (result.reason === 'offline' || result.reason === 'error') && (
            <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <WifiOff size={26} style={{ marginBottom: 10, opacity: 0.6 }} />
              <div style={{ fontSize: 13, marginBottom: 14 }}>
                {result.reason === 'offline' ? 'ইন্টারনেট সংযোগ নেই।' : 'তাফসির লোড করা যায়নি।'}
              </div>
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

          {isReady && (
            <>
              <div style={{
                fontSize: 11, color: 'var(--text-muted)', marginBottom: 14,
                paddingBottom: 10, borderBottom: '1px dashed var(--border)',
              }}>
                উৎস: {result.data.resourceName}
              </div>
              {result.data.blocks.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>এই আয়াতের জন্য তাফসির খালি এসেছে।</div>
              )}
              {result.data.blocks.map((block, i) => {
                if (block.type === 'heading') {
                  return (
                    <div key={i} style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)', margin: '14px 0 8px' }}>
                      {block.text}
                    </div>
                  );
                }
                if (block.type === 'footnote') {
                  return (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                      <span style={{ flexShrink: 0, fontWeight: 700 }}>{block.number}.</span>
                      <span style={{ lineHeight: 1.8 }}>{block.text}</span>
                    </div>
                  );
                }
                return (
                  <p key={i} style={{ fontSize: 13.5, lineHeight: 1.9, color: 'var(--text)', margin: '0 0 12px' }}>
                    {block.text}
                  </p>
                );
              })}
            </>
          )}
        </div>

        <div style={{
          padding: '10px 18px', borderTop: '1px solid var(--border)', flexShrink: 0,
          display: 'flex', gap: 10,
        }}>
          <button
            onClick={() => prevAyah && onNavigate(prevAyah)}
            disabled={!prevAyah}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 0', borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--bg)', color: prevAyah ? 'var(--text)' : 'var(--text-light)',
              fontSize: 12, fontWeight: 700, cursor: prevAyah ? 'pointer' : 'default',
              fontFamily: 'Hind Siliguri, sans-serif', opacity: prevAyah ? 1 : 0.5,
            }}
          ><ChevronLeft size={14} />পূর্ববর্তী আয়াত</button>
          <button
            onClick={() => nextAyah && onNavigate(nextAyah)}
            disabled={!nextAyah}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 0', borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--bg)', color: nextAyah ? 'var(--text)' : 'var(--text-light)',
              fontSize: 12, fontWeight: 700, cursor: nextAyah ? 'pointer' : 'default',
              fontFamily: 'Hind Siliguri, sans-serif', opacity: nextAyah ? 1 : 0.5,
            }}
          >পরবর্তী আয়াত<ChevronRight size={14} /></button>
        </div>
      </div>
    </div>
  );
}
