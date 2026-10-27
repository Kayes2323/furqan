'use client';
import { Check, Minus, X, CircleSlash } from 'lucide-react';
import { CLASSIFICATION_LABEL_BN } from '../lib/sunnah-life-engine';
import type { SunnahPractice, PracticeTrackingStatus } from '../lib/sunnah-life-types';

const CLASSIFICATION_COLOR: Record<SunnahPractice['classification'], string> = {
  obligatory: '#1F7A4C',
  wajib: '#1D6E72',
  emphasized_sunnah: '#8A5A2A',
  sunnah: '#3D4E7A',
  nafl: '#6B4423',
  adab: '#6B3F6B',
  general_habit: '#52606D',
};

const STATUS_OPTIONS: { id: PracticeTrackingStatus; label: string; icon: typeof Check }[] = [
  { id: 'completed', label: 'সম্পন্ন', icon: Check },
  { id: 'partial', label: 'আংশিক', icon: Minus },
  { id: 'skipped', label: 'বাদ', icon: X },
  { id: 'not_applicable', label: 'প্রযোজ্য নয়', icon: CircleSlash },
];

interface Props {
  practice: SunnahPractice;
  status?: PracticeTrackingStatus;
  onSetStatus: (status: PracticeTrackingStatus) => void;
  onOpenDetail: () => void;
  compact?: boolean;
}

export default function SunnahPracticeCard({ practice, status, onSetStatus, onOpenDetail, compact }: Props) {
  const color = CLASSIFICATION_COLOR[practice.classification];
  const isPending = practice.review.status === 'pending_review';

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)', borderLeft: `3px solid ${color}`,
      borderRadius: 14, padding: '12px 14px', marginBottom: 10,
    }}>
      <div onClick={onOpenDetail} style={{ cursor: 'pointer', marginBottom: compact ? 8 : 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>{practice.titleBn}</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          <span style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: 0.3, padding: '2.5px 8px', borderRadius: 20,
            background: `${color}1f`, color,
          }}>{CLASSIFICATION_LABEL_BN[practice.classification]}</span>
          {isPending && (
            <span style={{
              fontSize: 9.5, fontWeight: 700, letterSpacing: 0.3, padding: '2.5px 8px', borderRadius: 20,
              background: 'rgba(200,90,76,0.12)', color: '#C85A4C',
            }}>পর্যালোচনাধীন</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 5 }}>
        {STATUS_OPTIONS.map(({ id, label, icon: Icon }) => {
          const active = status === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => onSetStatus(id)}
              title={label}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                padding: '7px 4px', borderRadius: 10, cursor: 'pointer',
                border: active ? 'none' : '1px solid var(--border)',
                background: active ? color : 'var(--bg)',
                color: active ? '#fff' : 'var(--text-muted)',
              }}
            ><Icon size={13} strokeWidth={2.2} /></button>
          );
        })}
      </div>
    </div>
  );
}
