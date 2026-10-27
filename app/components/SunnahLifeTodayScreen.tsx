'use client';
import { useEffect, useState } from 'react';
import { ListChecks, LayoutGrid } from 'lucide-react';
import BackButton from './BackButton';
import SunnahPracticeCard from './SunnahPracticeCard';
import { ROUTINE_SLOTS } from '../lib/sunnah-life-labels';
import { SUNNAH_PRACTICES, practicesForRoutineSlot } from '../lib/sunnah-life-registry';
import {
  todayKey,
  setPracticeStatus,
  findPracticeRecord,
  buildDayProgress,
  emptyTrackerData,
} from '../lib/sunnah-life-engine';
import { loadSunnahTrackerData, saveSunnahTrackerData } from '../lib/sunnah-life-storage';
import type { SunnahLifeTrackerData, PracticeTrackingStatus } from '../lib/sunnah-life-types';

interface Props {
  onBack: () => void;
  onOpenAreas: () => void;
  onOpenPractice: (practiceId: string) => void;
}

export default function SunnahLifeTodayScreen({ onBack, onOpenAreas, onOpenPractice }: Props) {
  const [data, setData] = useState<SunnahLifeTrackerData>(emptyTrackerData());
  const [loaded, setLoaded] = useState(false);
  const today = todayKey();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage progress on mount (matches zikr-tracker-screen's own pattern)
    setData(loadSunnahTrackerData());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveSunnahTrackerData(data);
  }, [data, loaded]);

  function handleSetStatus(practiceId: string, status: PracticeTrackingStatus) {
    const practice = SUNNAH_PRACTICES.find((p) => p.id === practiceId);
    if (!practice) return;
    setData((prev) => ({
      ...prev,
      records: setPracticeStatus(prev.records, practice, today, status, new Date().toISOString()),
    }));
  }

  const progress = buildDayProgress(SUNNAH_PRACTICES, data.records, today);

  if (!loaded) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ padding: '44px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackButton onClick={onBack} variant="dark" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>সুন্নাহ লাইফ — আজকের রুটিন</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>একটি নমনীয় দৈনিক রুটিন, কোনো কঠোর সময়সূচি নয়</div>
        </div>
        <button
          type="button"
          onClick={onOpenAreas}
          aria-label="জীবনক্ষেত্র অনুযায়ী শিখুন"
          style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        ><LayoutGrid size={17} strokeWidth={1.8} /></button>
      </div>

      <div style={{ padding: '0 16px 16px', display: 'flex', gap: 10 }}>
        <ProgressTile label="ইবাদত ও সুন্নাহ" progress={progress.religious} />
        <ProgressTile label="সাধারণ অভ্যাস" progress={progress.generalHabits} />
      </div>

      <div style={{ padding: '0 16px' }}>
        {ROUTINE_SLOTS.map((slot) => {
          const items = practicesForRoutineSlot(slot.id);
          if (items.length === 0) return null;
          return (
            <div key={slot.id} style={{ marginBottom: 18 }}>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>{slot.labelBn}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{slot.descriptionBn}</div>
              </div>
              {items.map((practice) => (
                <SunnahPracticeCard
                  key={practice.id}
                  practice={practice}
                  status={findPracticeRecord(data.records, practice.id, today)?.status}
                  onSetStatus={(status) => handleSetStatus(practice.id, status)}
                  onOpenDetail={() => onOpenPractice(practice.id)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProgressTile({ label, progress }: { label: string; progress: { total: number; completed: number; remaining: number } }) {
  const percent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
  return (
    <div style={{
      flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: 'var(--text-muted)' }}>
        <ListChecks size={13} strokeWidth={1.8} />
        <span style={{ fontSize: 10.5, fontWeight: 700 }}>{label}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{progress.completed}/{progress.total}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>আজ বাকি {progress.remaining}টি · {percent}%</div>
    </div>
  );
}
