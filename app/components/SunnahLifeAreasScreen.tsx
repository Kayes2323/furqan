'use client';
import BackButton from './BackButton';
import { LIFE_AREAS } from '../lib/sunnah-life-labels';
import { practicesForLifeArea } from '../lib/sunnah-life-registry';

interface Props {
  onBack: () => void;
  onOpenArea: (areaId: string) => void;
}

export default function SunnahLifeAreasScreen({ onBack, onOpenArea }: Props) {
  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ padding: '44px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackButton onClick={onBack} variant="dark" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>জীবনক্ষেত্র অনুযায়ী শিখুন</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
            এটি একটি নেভিগেশন কাঠামো — কোনো নির্দিষ্ট বইয়ের প্রতিলিপি নয়
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {LIFE_AREAS.map((area) => {
          const count = practicesForLifeArea(area.id).length;
          return (
            <div
              key={area.id}
              onClick={() => onOpenArea(area.id)}
              style={{
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
                padding: '14px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{area.labelBn}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{area.descriptionBn}</div>
              </div>
              <span style={{
                fontSize: 10.5, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
                background: 'rgba(31,122,76,0.1)', borderRadius: 20, padding: '4px 10px',
              }}>{count}টি আমল</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
