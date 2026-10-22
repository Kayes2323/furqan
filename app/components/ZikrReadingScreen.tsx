'use client';

import { useEffect, useRef, useState } from 'react';
import { X, RotateCcw, ChevronLeft, ChevronRight, Check, PartyPopper, ExternalLink, Info } from 'lucide-react';
import { getZikrSection } from '../lib/zikr-data';
import { recitationSequence } from '../lib/zikr-types';
import {
  loadSectionProgress,
  saveSectionProgress,
  withDailyReset,
  tapCounter,
  advanceToNext,
  resetItem,
  isSequenceComplete,
  getAutoAdvancePreference,
  setAutoAdvancePreference,
  todayKey,
  type SectionProgress,
} from '../lib/zikr-progress';

interface Props {
  sectionId: string;
  itemId?: string;
  onBack: () => void;
  onOpenSurah: (surah: number) => void;
}

const ADVANCE_DELAY_MS = 1300;

export default function ZikrReadingScreen({ sectionId, itemId, onBack, onOpenSurah }: Props) {
  const section = getZikrSection(sectionId);
  const sequence = section ? recitationSequence(section) : [];

  const [progress, setProgress] = useState<SectionProgress | null>(null);
  const [viewIndex, setViewIndex] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitioning = useRef(false);

  useEffect(() => {
    if (!section || sequence.length === 0) return;
    const today = todayKey();
    const raw = loadSectionProgress(sectionId);
    const fresh = raw
      ? withDailyReset(raw, sequence, today)
      : { sectionId, counts: {}, completedIds: [], activeItemId: sequence[0].id, lastActiveDate: today };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage progress/preferences on mount (matches app/lib/theme.tsx and the Sirah screens)
    setProgress(fresh);
    setAutoAdvance(getAutoAdvancePreference());

    const requested = itemId ? sequence.findIndex((i) => i.id === itemId) : -1;
    if (requested >= 0) {
      setViewIndex(requested);
    } else {
      const activeIdx = sequence.findIndex((i) => i.id === fresh.activeItemId);
      setViewIndex(activeIdx >= 0 ? activeIdx : 0);
    }
    setAllDone(isSequenceComplete(fresh, sequence));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, itemId]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  if (!section || sequence.length === 0) {
    return (
      <div style={{ padding: '52px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        এই বিভাগে কোনো গণনাযোগ্য আমল নেই।
      </div>
    );
  }

  const current = sequence[viewIndex];
  const count = progress?.counts[current.id] ?? 0;
  const atTarget = count >= current.targetCount;

  function persist(next: SectionProgress) {
    setProgress(next);
    saveSectionProgress(next);
  }

  function handleTap() {
    if (!progress || transitioning.current || atTarget) return;

    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(12);
    } catch {}

    const { progress: next, justCompletedItemId } = tapCounter(progress, sequence, current.id, todayKey());
    persist(next);

    if (justCompletedItemId) {
      transitioning.current = true;
      setJustCompleted(true);

      const sequenceNowComplete = isSequenceComplete(next, sequence);

      advanceTimer.current = setTimeout(() => {
        setJustCompleted(false);
        transitioning.current = false;

        if (sequenceNowComplete) {
          setAllDone(true);
          return;
        }

        if (autoAdvance) {
          const advanced = advanceToNext(next, sequence);
          persist(advanced);
          const nextIdx = sequence.findIndex((i) => i.id === advanced.activeItemId);
          if (nextIdx >= 0) setViewIndex(nextIdx);
        }
      }, ADVANCE_DELAY_MS);
    }
  }

  function goPrev() {
    if (transitioning.current) return;
    setViewIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    if (transitioning.current) return;
    setViewIndex((i) => Math.min(sequence.length - 1, i + 1));
  }

  function toggleAutoAdvance() {
    const next = !autoAdvance;
    setAutoAdvance(next);
    setAutoAdvancePreference(next);
  }

  function handleResetConfirmed() {
    if (!progress) return;
    const next = resetItem(progress, current.id, todayKey());
    persist(next);
    setAllDone(false);
    setConfirmingReset(false);
  }

  if (allDone) {
    return (
      <CompletionSummary
        sectionTitle={section.title}
        total={sequence.length}
        onBack={onBack}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <div style={{ padding: '44px 16px 10px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={onBack} aria-label="বন্ধ করুন" style={{
          width: 34, height: 34, borderRadius: '50%', background: 'var(--card)', border: '1px solid var(--border)',
          color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}><X size={16} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {section.title}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{viewIndex + 1} / {sequence.length}</div>
        </div>
        <button onClick={toggleAutoAdvance} style={{
          fontSize: 10, fontWeight: 700, padding: '5px 10px', borderRadius: 100, border: '1px solid var(--border)',
          background: autoAdvance ? 'rgba(31,122,76,0.12)' : 'var(--card)', color: autoAdvance ? 'var(--accent)' : 'var(--text-muted)',
          cursor: 'pointer', flexShrink: 0,
        }}>অটো {autoAdvance ? 'চালু' : 'বন্ধ'}</button>
        <button onClick={() => setConfirmingReset(true)} aria-label="রিসেট" style={{
          width: 34, height: 34, borderRadius: '50%', background: 'var(--card)', border: '1px solid var(--border)',
          color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}><RotateCcw size={14} /></button>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: '0 16px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', textAlign: 'center', marginBottom: 10 }}>
          {current.title}
        </div>

        {current.needsReview && (
          <div style={{
            background: 'rgba(150,112,42,0.1)', border: '1px solid rgba(150,112,42,0.22)',
            borderRadius: 12, padding: '10px 12px', fontSize: 11.5, color: 'var(--text-muted)',
            lineHeight: 1.6, marginBottom: 12, display: 'flex', gap: 8,
          }}>
            <Info size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              {current.reviewNote}
              {current.linkedSurahs && current.linkedSurahs.length > 0 && (
                <button
                  onClick={() => onOpenSurah(current.linkedSurahs![0])}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6,
                    background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700,
                    fontSize: 11.5, cursor: 'pointer', padding: 0,
                  }}
                >কুরআনে পড়ুন <ExternalLink size={11} /></button>
              )}
            </div>
          </div>
        )}

        {current.arabic && (
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
            padding: 18, marginBottom: 10,
          }}>
            <div className="arabic" style={{ fontFamily: 'Amiri, serif', fontSize: 22, lineHeight: 2, textAlign: 'right' }}>
              {current.arabic}
            </div>
          </div>
        )}

        {current.phonetic && (
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
            padding: '14px 16px', marginBottom: 10, fontSize: 13.5, lineHeight: 1.8, color: 'var(--text)',
          }}>{current.phonetic}</div>
        )}

        <div style={{ fontSize: 10, color: 'var(--text-light)', textAlign: 'center', padding: '2px 0 10px', lineHeight: 1.5 }}>
          {current.sourceRef} — উচ্চারণ উৎস নথি অনুযায়ী, যাচাই করে নেওয়ার পরামর্শ দেওয়া হচ্ছে।
        </div>
      </div>

      <div style={{ padding: '10px 16px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button onClick={goPrev} disabled={viewIndex === 0} aria-label="আগেরটি" style={{
            width: 38, height: 38, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--card)',
            color: viewIndex === 0 ? 'var(--text-light)' : 'var(--text)', cursor: viewIndex === 0 ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: viewIndex === 0 ? 0.4 : 1,
          }}><ChevronLeft size={18} /></button>

          <button
            onClick={handleTap}
            disabled={atTarget}
            className="zikr-counter"
            style={{
              width: 148, height: 148, borderRadius: '50%',
              border: 'none', cursor: atTarget ? 'default' : 'pointer',
              background: atTarget
                ? 'linear-gradient(160deg, var(--accent), var(--accent-light))'
                : 'linear-gradient(160deg, var(--card), var(--card))',
              boxShadow: atTarget
                ? '0 8px 26px rgba(31,122,76,0.4)'
                : '0 6px 22px rgba(15,42,25,0.14), inset 0 0 0 2px var(--border)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent', userSelect: 'none', touchAction: 'manipulation',
            }}
          >
            {justCompleted ? (
              <Check size={44} color={atTarget ? '#fff' : 'var(--accent)'} strokeWidth={2.4} />
            ) : (
              <>
                <div style={{
                  fontSize: 36, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                  color: atTarget ? '#fff' : 'var(--text)', lineHeight: 1,
                }}>{count}</div>
                <div style={{ fontSize: 13, color: atTarget ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)', marginTop: 4 }}>
                  / {current.targetCount}
                </div>
              </>
            )}
          </button>

          <button onClick={goNext} disabled={viewIndex === sequence.length - 1} aria-label="পরেরটি" style={{
            width: 38, height: 38, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--card)',
            color: viewIndex === sequence.length - 1 ? 'var(--text-light)' : 'var(--text)',
            cursor: viewIndex === sequence.length - 1 ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: viewIndex === sequence.length - 1 ? 0.4 : 1,
          }}><ChevronRight size={18} /></button>
        </div>

        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', minHeight: 16 }}>
          {justCompleted
            ? (autoAdvance ? 'সম্পন্ন! পরবর্তী আমলে যাচ্ছি…' : 'সম্পন্ন!')
            : atTarget
              ? 'সম্পন্ন হয়েছে'
              : 'ট্যাপ করে গণনা করুন'}
        </div>
      </div>

      {confirmingReset && (
        <ResetConfirmSheet
          itemTitle={current.title}
          onCancel={() => setConfirmingReset(false)}
          onConfirm={handleResetConfirmed}
        />
      )}
    </div>
  );
}

function ResetConfirmSheet({ itemTitle, onCancel, onConfirm }: { itemTitle: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 998,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onCancel}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 430, background: 'var(--card)', borderRadius: '20px 20px 0 0',
          padding: '20px 20px max(20px, env(safe-area-inset-bottom))',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>গণনা রিসেট করবেন?</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
          “{itemTitle}”-এর বর্তমান গণনা মুছে ০ থেকে আবার শুরু হবে।
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '11px 0', borderRadius: 12, border: '1px solid var(--border)',
            background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>বাতিল</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '11px 0', borderRadius: 12, border: 'none',
            background: '#B3362C', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>রিসেট করুন</button>
        </div>
      </div>
    </div>
  );
}

function CompletionSummary({ sectionTitle, total, onBack }: { sectionTitle: string; total: number; onBack: () => void }) {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '20px 30px', textAlign: 'center', background: 'var(--bg)',
    }}>
      <div style={{
        width: 84, height: 84, borderRadius: 26, background: 'rgba(31,122,76,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
      }}><PartyPopper size={38} color="var(--accent)" /></div>
      <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>মাশাআল্লাহ!</div>
      <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 28 }}>
        আপনি “{sectionTitle}”-এর সবগুলো আমল ({total}টি) আজকের জন্য সম্পন্ন করেছেন।
      </div>
      <button onClick={onBack} style={{
        background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 100,
        padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
        fontFamily: 'Hind Siliguri, sans-serif', boxShadow: '0 4px 16px rgba(31,122,76,0.3)',
      }}>তালিকায় ফিরে যান</button>
    </div>
  );
}
