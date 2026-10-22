'use client';

import { useEffect, useState } from 'react';
import { Sunrise, ListChecks, MoonStar, ChevronRight, ShieldCheck } from 'lucide-react';
import { ZIKR_COLLECTION } from '../lib/zikr-data';
import { recitationSequence } from '../lib/zikr-types';
import { loadSectionProgress, withDailyReset, todayKey } from '../lib/zikr-progress';

interface Props {
  onOpenSection: (sectionId: string) => void;
}

const SECTION_VISUALS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  'morning-evening': { icon: Sunrise, color: '#B8831F', bg: 'rgba(184,131,31,0.12)' },
  'other-practices': { icon: ListChecks, color: '#1F7A4C', bg: 'rgba(31,122,76,0.12)' },
  'before-sleep': { icon: MoonStar, color: '#3B4C8A', bg: 'rgba(59,76,138,0.12)' },
};

export default function ZikrScreen({ onOpenSection }: Props) {
  const [progressTick, setProgressTick] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage progress on mount (matches app/lib/theme.tsx and the Sirah screens)
    setProgressTick((t) => t + 1);
  }, []);

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ padding: '52px 20px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={20} color="var(--accent)" strokeWidth={1.8} />
          <div style={{ fontFamily: 'Noto Serif Bengali, serif', fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>
            {ZIKR_COLLECTION.title}
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
          {ZIKR_COLLECTION.subtitle}
        </div>
      </div>

      <div style={{ padding: '18px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ZIKR_COLLECTION.sections.map((section) => {
          const visual = SECTION_VISUALS[section.id] ?? SECTION_VISUALS['other-practices'];
          const Icon = visual.icon;
          const sequence = recitationSequence(section);
          const checklistCount = section.items.length - sequence.length;

          let doneToday = 0;
          if (progressTick > 0 && sequence.length > 0) {
            const raw = loadSectionProgress(section.id);
            const progress = raw ? withDailyReset(raw, sequence, todayKey()) : null;
            doneToday = progress?.completedIds.length ?? 0;
          }

          return (
            <div
              key={section.id}
              onClick={() => onOpenSection(section.id)}
              style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 18, padding: '16px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: '0 3px 14px rgba(15,42,25,0.07)',
              }}
            >
              <div style={{
                width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                background: visual.bg, color: visual.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon size={22} strokeWidth={1.8} /></div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{section.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                  {sequence.length > 0 && `${sequence.length}টি আমল`}
                  {sequence.length > 0 && checklistCount > 0 && ' · '}
                  {checklistCount > 0 && `${checklistCount}টি অভ্যাস`}
                </div>
                {sequence.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.round((doneToday / sequence.length) * 100)}%`,
                        height: '100%', background: visual.color, borderRadius: 3,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>
                      {doneToday}/{sequence.length}
                    </span>
                  </div>
                )}
              </div>

              <ChevronRight size={18} color="var(--text-light)" strokeWidth={1.8} />
            </div>
          );
        })}
      </div>

      <div style={{
        margin: '20px 16px 0', padding: '12px 14px', borderRadius: 14,
        background: 'rgba(150,112,42,0.08)', border: '1px solid rgba(150,112,42,0.18)',
        fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6,
      }}>
        উৎস: আপলোডকৃত “{ZIKR_COLLECTION.title}” নথি। উচ্চারণ ও অর্থ কোনো নির্ভরযোগ্য আলেম বা উৎসের সাথে মিলিয়ে নেওয়ার পরামর্শ দেওয়া হচ্ছে।
      </div>
    </div>
  );
}
