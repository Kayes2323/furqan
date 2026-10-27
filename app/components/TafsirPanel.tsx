'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, WifiOff, BookX } from 'lucide-react';
import BackButton from './BackButton';
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

// Dedicated tafsir reading experience — a full page (not a sheet/modal),
// matching the visual language of the Reader itself (same header padding,
// BackButton, border pattern) so opening tafsir feels like navigating to
// a proper page rather than popping up a small overlay. Closing always
// hands control back to the Reader via onClose; it never touches the
// Reader's own scroll position itself (the caller already knows where it
// was — closing just unmounts this page and the Reader reappears as-is).
export default function TafsirPanel({ surah, ayah, meta, onClose, onNavigate }: Props) {
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
        position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{
        padding: '44px 16px 14px', flexShrink: 0,
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <BackButton onClick={onClose} variant="dark" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>তাফসির</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {meta ? `${meta.banglaName} · ` : ''}
            {isReady ? result.data.verseKey : `${surah}:${ayah}`}
          </div>
        </div>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: '18px 16px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
          {isLoading && (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RotateCw size={22} className="qibla-spin" style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 13 }}>তাফসির লোড হচ্ছে...</div>
            </div>
          )}

          {!isLoading && 'ok' in result && !result.ok && result.reason === 'not_configured' && (
            <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BookX size={28} style={{ marginBottom: 10, opacity: 0.6 }} />
              <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                তাফসির সংযোগ এখনো সম্পন্ন হয়নি।<br />
                বাংলা তাফসির যুক্ত হলে এখানে দেখানো হবে।
              </div>
            </div>
          )}

          {!isLoading && 'ok' in result && !result.ok && result.reason === 'not_found' && (
            <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BookX size={28} style={{ marginBottom: 10, opacity: 0.6 }} />
              <div style={{ fontSize: 14, lineHeight: 1.8 }}>এই আয়াতের জন্য তাফসির পাওয়া যায়নি।</div>
            </div>
          )}

          {!isLoading && 'ok' in result && !result.ok && (result.reason === 'offline' || result.reason === 'error') && (
            <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <WifiOff size={28} style={{ marginBottom: 10, opacity: 0.6 }} />
              <div style={{ fontSize: 14, marginBottom: 16 }}>
                {result.reason === 'offline' ? 'ইন্টারনেট সংযোগ নেই।' : 'তাফসির লোড করা যায়নি।'}
              </div>
              <button
                onClick={() => setRetryTick((t) => t + 1)}
                style={{
                  background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 100,
                  padding: '10px 22px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'Hind Siliguri, sans-serif',
                }}
              >আবার চেষ্টা করুন</button>
            </div>
          )}

          {isReady && (
            <>
              <div style={{
                fontSize: 12, color: 'var(--text-muted)', marginBottom: 18,
                paddingBottom: 12, borderBottom: '1px dashed var(--border)',
              }}>
                উৎস: {result.data.resourceName}
              </div>
              {result.data.blocks.length === 0 && (
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>এই আয়াতের জন্য তাফসির খালি এসেছে।</div>
              )}
              {result.data.blocks.map((block, i) => {
                if (block.type === 'heading') {
                  return (
                    <div key={i} style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: '18px 0 10px' }}>
                      {block.text}
                    </div>
                  );
                }
                if (block.type === 'footnote') {
                  return (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13.5, color: 'var(--text-muted)', marginTop: 10, lineHeight: 2 }}>
                      <span style={{ flexShrink: 0, fontWeight: 700 }}>{block.number}.</span>
                      <span>{block.text}</span>
                    </div>
                  );
                }
                return (
                  <p key={i} style={{ fontSize: 16.5, lineHeight: 2, color: 'var(--text)', margin: '0 0 16px' }}>
                    {block.text}
                  </p>
                );
              })}
            </>
          )}
        </div>
      </div>

      <div style={{
        padding: '10px 16px', borderTop: '1px solid var(--border)', flexShrink: 0,
        display: 'flex', gap: 10, maxWidth: 640, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      }}>
        <button
          onClick={() => prevAyah && onNavigate(prevAyah)}
          disabled={!prevAyah}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '11px 0', borderRadius: 12, border: '1px solid var(--border)',
            background: 'var(--card)', color: prevAyah ? 'var(--text)' : 'var(--text-light)',
            fontSize: 12.5, fontWeight: 700, cursor: prevAyah ? 'pointer' : 'default',
            fontFamily: 'Hind Siliguri, sans-serif', opacity: prevAyah ? 1 : 0.5,
          }}
        ><ChevronLeft size={15} />পূর্ববর্তী আয়াত</button>
        <button
          onClick={() => nextAyah && onNavigate(nextAyah)}
          disabled={!nextAyah}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '11px 0', borderRadius: 12, border: '1px solid var(--border)',
            background: 'var(--card)', color: nextAyah ? 'var(--text)' : 'var(--text-light)',
            fontSize: 12.5, fontWeight: 700, cursor: nextAyah ? 'pointer' : 'default',
            fontFamily: 'Hind Siliguri, sans-serif', opacity: nextAyah ? 1 : 0.5,
          }}
        >পরবর্তী আয়াত<ChevronRight size={15} /></button>
      </div>
    </div>
  );
}
