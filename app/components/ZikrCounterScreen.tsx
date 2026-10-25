'use client';

import { useEffect, useRef, useState } from 'react';
import { Minus, Check } from 'lucide-react';
import BackButton from './BackButton';
import type { CustomZikr, DayZikrDetail } from '../lib/zikr-tracker-types';

interface Props {
  zikr: CustomZikr;
  detail: DayZikrDetail;
  onIncrement: () => void;
  onDecrement: () => void;
  onBack: () => void;
}

// A dedicated, focused counting experience for one custom zikr — visually
// and behaviorally modeled on the existing ZikrReadingScreen tap-counter
// (same big circular "zikr-counter" button, same Arabic/transliteration
// card styling, same tap-feedback pattern) so the two counting
// experiences in the app feel like one family. The one deliberate
// difference: a custom zikr's target is a personal goal, not a fixed
// daily checklist item, so the button here never disables at target —
// the user can keep reciting past it, and the screen shows that as a
// quiet "complete" accent rather than stopping them.
export default function ZikrCounterScreen({ zikr, detail, onIncrement, onDecrement, onBack }: Props) {
  const [justCompleted, setJustCompleted] = useState(false);
  const prevCountRef = useRef(detail.count);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevCountRef.current;
    const crossedTarget = prev < detail.target && detail.count >= detail.target;
    if (crossedTarget) {
      setJustCompleted(true);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
      completeTimerRef.current = setTimeout(() => setJustCompleted(false), 900);
    }
    prevCountRef.current = detail.count;
  }, [detail.count, detail.target]);

  useEffect(() => {
    return () => {
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, []);

  const atOrAboveTarget = detail.count >= detail.target;

  function handleTap() {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(12);
    } catch {}
    onIncrement();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <div style={{ padding: '44px 16px 10px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <BackButton onClick={onBack} variant="dark" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 700, color: 'var(--text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{zikr.name}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>আজকের গণনা</div>
        </div>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: '6px 16px' }}>
        {zikr.arabic && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, marginBottom: 10 }}>
            <div className="arabic" dir="rtl" style={{ fontFamily: 'Amiri, serif', fontSize: 24, lineHeight: 2, textAlign: 'right', color: 'var(--text)' }}>
              {zikr.arabic}
            </div>
          </div>
        )}
        {zikr.transliteration && (
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
            padding: '14px 16px', marginBottom: 10, fontSize: 13.5, lineHeight: 1.8, color: 'var(--text)',
          }}>{zikr.transliteration}</div>
        )}
      </div>

      <div style={{ padding: '10px 16px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ width: '100%', maxWidth: 280, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--card)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{
              width: `${detail.percent}%`, height: '100%',
              background: atOrAboveTarget ? 'var(--accent)' : '#B8831F',
              borderRadius: 3, transition: 'width 0.25s ease',
            }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>{detail.percent}%</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <button
            type="button"
            onClick={onDecrement}
            aria-label="এক কমান (ভুল গণনা ঠিক করুন)"
            disabled={detail.count === 0}
            style={{
              width: 42, height: 42, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--card)',
              color: detail.count === 0 ? 'var(--text-light)' : 'var(--text)', cursor: detail.count === 0 ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: detail.count === 0 ? 0.4 : 1, flexShrink: 0,
            }}
          ><Minus size={18} /></button>

          <button
            type="button"
            onClick={handleTap}
            aria-label={`${zikr.name} গণনা করুন — বর্তমানে ${detail.count}, লক্ষ্য ${detail.target}`}
            className="zikr-counter"
            style={{
              width: 164, height: 164, borderRadius: '50%',
              border: 'none', cursor: 'pointer',
              background: atOrAboveTarget
                ? 'linear-gradient(160deg, var(--accent), var(--accent-light))'
                : 'linear-gradient(160deg, var(--card), var(--card))',
              boxShadow: atOrAboveTarget
                ? '0 8px 26px rgba(31,122,76,0.4)'
                : '0 6px 22px rgba(15,42,25,0.14), inset 0 0 0 2px var(--border)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent', userSelect: 'none', touchAction: 'manipulation', flexShrink: 0,
            }}
          >
            {justCompleted ? (
              <Check size={48} color={atOrAboveTarget ? '#fff' : 'var(--accent)'} strokeWidth={2.4} />
            ) : (
              <>
                <div style={{
                  fontSize: 40, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                  color: atOrAboveTarget ? '#fff' : 'var(--text)', lineHeight: 1,
                }}>{detail.count}</div>
                <div style={{ fontSize: 13.5, color: atOrAboveTarget ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)', marginTop: 4 }}>
                  / {detail.target}
                </div>
              </>
            )}
          </button>

          <div style={{ width: 42, flexShrink: 0 }} aria-hidden="true" />
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', minHeight: 16, textAlign: 'center' }}>
          {justCompleted
            ? 'মাশাআল্লাহ! লক্ষ্য সম্পন্ন হয়েছে'
            : atOrAboveTarget
              ? `লক্ষ্য সম্পন্ন হয়েছে${detail.excess > 0 ? ` · +${detail.excess} অতিরিক্ত` : ''}`
              : `ট্যাপ করে গণনা করুন · বাকি ${detail.remaining}`}
        </div>
      </div>
    </div>
  );
}
