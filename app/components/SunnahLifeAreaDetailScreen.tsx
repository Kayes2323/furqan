'use client';
import { useEffect, useState } from 'react';
import BackButton from './BackButton';
import SunnahPracticeCard from './SunnahPracticeCard';
import { LIFE_AREAS } from '../lib/sunnah-life-labels';
import { practicesForLifeArea } from '../lib/sunnah-life-registry';
import { todayKey, setPracticeStatus, findPracticeRecord, emptyTrackerData } from '../lib/sunnah-life-engine';
import { loadSunnahTrackerData, saveSunnahTrackerData } from '../lib/sunnah-life-storage';
import type { SunnahLifeTrackerData, PracticeTrackingStatus, LifeArea } from '../lib/sunnah-life-types';

interface Props {
  lifeAreaId: string;
  onBack: () => void;
  onOpenPractice: (practiceId: string) => void;
}

export default function SunnahLifeAreaDetailScreen({ lifeAreaId, onBack, onOpenPractice }: Props) {
  const area = LIFE_AREAS.find((a) => a.id === lifeAreaId) ?? LIFE_AREAS[0];
  const practices = practicesForLifeArea(area.id as LifeArea);
  const [data, setData] = useState<SunnahLifeTrackerData>(emptyTrackerData());
  const [loaded, setLoaded] = useState(false);
  const today = todayKey();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage progress on mount
    setData(loadSunnahTrackerData());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveSunnahTrackerData(data);
  }, [data, loaded]);

  function handleSetStatus(practiceId: string, status: PracticeTrackingStatus) {
    const practice = practices.find((p) => p.id === practiceId);
    if (!practice) return;
    setData((prev) => ({
      ...prev,
      records: setPracticeStatus(prev.records, practice, today, status, new Date().toISOString()),
    }));
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ padding: '44px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackButton onClick={onBack} variant="dark" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{area.labelBn}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{area.descriptionBn}</div>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {practices.length === 0 && (
          <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            এই বিভাগে এখনো কোনো আমল যুক্ত করা হয়নি।
          </div>
        )}
        {practices.map((practice) => (
          <SunnahPracticeCard
            key={practice.id}
            practice={practice}
            status={loaded ? findPracticeRecord(data.records, practice.id, today)?.status : undefined}
            onSetStatus={(status) => handleSetStatus(practice.id, status)}
            onOpenDetail={() => onOpenPractice(practice.id)}
          />
        ))}
      </div>
    </div>
  );
}
