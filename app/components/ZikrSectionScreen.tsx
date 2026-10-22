'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import BackButton from './BackButton';
import { getZikrSection } from '../lib/zikr-data';
import { isRecitation, recitationSequence, type ZikrItem } from '../lib/zikr-types';
import {
  loadSectionProgress,
  saveSectionProgress,
  withDailyReset,
  togglePracticeDone,
  todayKey,
  type SectionProgress,
} from '../lib/zikr-progress';

interface Props {
  sectionId: string;
  onBack: () => void;
  onOpenReading: (sectionId: string, itemId?: string) => void;
}

export default function ZikrSectionScreen({ sectionId, onBack, onOpenReading }: Props) {
  const section = getZikrSection(sectionId);
  const sequence = section ? recitationSequence(section) : [];
  const [progress, setProgress] = useState<SectionProgress | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!section) return;
    const today = todayKey();
    const raw = loadSectionProgress(sectionId);
    const fresh = raw
      ? withDailyReset(raw, sequence, today)
      : { sectionId, counts: {}, completedIds: [], activeItemId: sequence[0]?.id ?? null, lastActiveDate: today };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage progress on mount (matches app/lib/theme.tsx and the Sirah screens)
    setProgress(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  if (!section) {
    return (
      <div style={{ padding: '52px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        এই বিভাগটি পাওয়া যায়নি।
      </div>
    );
  }

  function handleTogglePractice(itemId: string) {
    if (!progress) return;
    const next = togglePracticeDone(progress, sequence, itemId, todayKey());
    setProgress(next);
    saveSectionProgress(next);
  }

  const items = [...section.items].sort((a, b) => a.order - b.order);

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{
        padding: '44px 16px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <BackButton onClick={onBack} variant="dark" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{section.title}</div>
          {section.description && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{section.description}</div>
          )}
        </div>
      </div>

      {sequence.length > 0 && (
        <div style={{ padding: '0 16px 14px' }}>
          <button
            onClick={() => onOpenReading(sectionId)}
            style={{
              width: '100%', background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: 14, padding: '13px 18px', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
              boxShadow: '0 4px 16px rgba(31,122,76,0.28)',
            }}
          >
            {progress && progress.completedIds.filter((id) => sequence.some((s) => s.id === id)).length > 0
              ? 'চালিয়ে যান' : 'শুরু করুন'}
          </button>
        </div>
      )}

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {items.map((item) => (
          <ZikrItemRow
            key={item.id}
            item={item}
            done={progress?.completedIds.includes(item.id) ?? false}
            count={progress?.counts[item.id] ?? 0}
            expanded={expandedId === item.id}
            onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
            onTogglePractice={() => handleTogglePractice(item.id)}
            onOpenReading={() => onOpenReading(sectionId, item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ZikrItemRow({
  item,
  done,
  count,
  expanded,
  onToggleExpand,
  onTogglePractice,
  onOpenReading,
}: {
  item: ZikrItem;
  done: boolean;
  count: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onTogglePractice: () => void;
  onOpenReading: () => void;
}) {
  if (isRecitation(item)) {
    return (
      <div
        onClick={onOpenReading}
        style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '12px 14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12,
          opacity: done ? 0.75 : 1,
        }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: done ? 'rgba(31,122,76,0.14)' : 'rgba(150,112,42,0.1)',
          color: done ? 'var(--accent)' : '#7A5A1A', fontSize: 12, fontWeight: 700,
        }}>{item.order}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{item.title}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {item.sourceRef} · লক্ষ্য {item.targetCount} বার
            {item.needsReview && ' · পাঠ্য যাচাইযোগ্য'}
          </div>
        </div>
        {done ? (
          <CheckCircle2 size={20} color="var(--accent)" />
        ) : count > 0 ? (
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>{count}/{item.targetCount}</span>
        ) : (
          <Circle size={18} color="var(--text-light)" />
        )}
      </div>
    );
  }

  const hasReference = Boolean(item.phonetic);

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          onClick={onTogglePractice}
          role="checkbox"
          aria-checked={done}
          style={{ cursor: 'pointer', flexShrink: 0, display: 'flex' }}
        >
          {done ? <CheckCircle2 size={22} color="var(--accent)" /> : <Circle size={20} color="var(--text-light)" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }} onClick={hasReference ? onToggleExpand : undefined} role={hasReference ? 'button' : undefined}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>
            {item.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{item.instruction}</div>
          {item.duplicatesItemId && (
            <div style={{ fontSize: 10, color: 'var(--gold)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Info size={11} />সকাল-সন্ধ্যা/রাতের তালিকায় গোনা হয়েছে
            </div>
          )}
        </div>
        {hasReference && (
          <button onClick={onToggleExpand} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: 4, flexShrink: 0 }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>
      {expanded && item.phonetic && (
        <div style={{
          padding: '10px 14px 14px', borderTop: '1px solid var(--border)',
          fontSize: 13, color: 'var(--text)', lineHeight: 1.7, background: 'rgba(31,122,76,0.04)',
        }}>{item.phonetic}</div>
      )}
    </div>
  );
}
