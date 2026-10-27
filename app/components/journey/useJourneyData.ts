'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadSurahMeta } from '../../lib/reader-data';
import { getLastRead } from '../../lib/reader-progress';
import { loadPlan, savePlan } from '../../lib/khatm-storage';
import { loadProfile, saveProfile } from '../../lib/nazera-storage';
import { loadJourneyPlan, saveJourneyPlan } from '../../lib/journey-storage';
import { buildQuranIndex, ensureDayAnchor as ensureKhatmAnchor, todayKey } from '../../lib/khatm-plan';
import { ensureDayAnchor as ensureNazeraAnchor } from '../../lib/nazera-plan';
import { pointersAligned, syncSharedNazera } from '../../lib/journey-apply';
import type { SurahMeta } from '../../lib/reader-types';
import type { QuranIndex } from '../../lib/quran-index';
import type { KhatmPlan } from '../../lib/khatm-types';
import type { NazeraProfile } from '../../lib/nazera-types';
import type { JourneyPlan } from '../../lib/journey-types';

export type LoadState = 'loading' | 'error' | 'ready';

export interface JourneySnapshot {
  khatm: KhatmPlan | null;
  nazera: NazeraProfile | null;
  journey: JourneyPlan | null;
}

export interface JourneyData extends JourneySnapshot {
  loadState: LoadState;
  index: QuranIndex | null;
  meta: SurahMeta[];
  surahNames: Record<number, string>;
  readerLast: { surah: number; ayah: number } | null;
  today: string;
  /** Re-read the three records from storage (after a child screen saved). */
  refresh: () => void;
  retry: () => void;
  /** Persist the given records and update state. A key left undefined is untouched. */
  commit: (next: Partial<JourneySnapshot>) => void;
  /** Persist an exact earlier snapshot (undo). */
  restore: (snap: JourneySnapshot) => void;
}

function readAll(index: QuranIndex, today: string): JourneySnapshot {
  const journey = loadJourneyPlan();
  let khatm = loadPlan();
  if (khatm && khatm.status === 'active') {
    const anchored = ensureKhatmAnchor(index, khatm, today);
    if (anchored !== khatm) savePlan(anchored);
    khatm = anchored;
  }
  let nazera = loadProfile();
  if (nazera) {
    let next = nazera;
    if (journey?.sharedReading && pointersAligned(khatm, nazera)) {
      next = syncSharedNazera(index, khatm, nazera, today) ?? nazera;
    } else {
      next = ensureNazeraAnchor(nazera, today);
    }
    if (next !== nazera) saveProfile(next);
    nazera = next;
  }
  return { khatm, nazera, journey };
}

export function useJourneyData(): JourneyData {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [meta, setMeta] = useState<SurahMeta[]>([]);
  const [index, setIndex] = useState<QuranIndex | null>(null);
  const [snap, setSnap] = useState<JourneySnapshot>({ khatm: null, nazera: null, journey: null });
  const [readerLast, setReaderLast] = useState<{ surah: number; ayah: number } | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const today = todayKey();

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicking off a data fetch on mount/retry (matches app/lib/theme.tsx and the Sirah screens)
    setLoadState('loading');
    loadSurahMeta()
      .then((data) => {
        if (cancelled) return;
        const idx = buildQuranIndex(data);
        setMeta(data);
        setIndex(idx);
        setSnap(readAll(idx, todayKey()));
        const last = getLastRead();
        setReaderLast(last ? { surah: last.surah, ayah: last.ayah } : null);
        setLoadState('ready');
      })
      .catch(() => {
        if (!cancelled) setLoadState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [retryTick]);

  const refresh = useCallback(() => {
    if (!index) return;
    setSnap(readAll(index, todayKey()));
  }, [index]);

  const retry = useCallback(() => setRetryTick((t) => t + 1), []);

  const commit = useCallback((next: Partial<JourneySnapshot>) => {
    if (next.khatm) savePlan(next.khatm);
    if (next.nazera) saveProfile(next.nazera);
    if (next.journey) saveJourneyPlan(next.journey);
    setSnap((prev) => ({
      khatm: next.khatm !== undefined ? next.khatm : prev.khatm,
      nazera: next.nazera !== undefined ? next.nazera : prev.nazera,
      journey: next.journey !== undefined ? next.journey : prev.journey,
    }));
  }, []);

  const restore = useCallback((s: JourneySnapshot) => {
    if (s.khatm) savePlan(s.khatm);
    if (s.nazera) saveProfile(s.nazera);
    if (s.journey) saveJourneyPlan(s.journey);
    setSnap(s);
  }, []);

  const surahNames: Record<number, string> = {};
  for (const s of meta) surahNames[s.number] = s.banglaName;

  return { loadState, index, meta, surahNames, readerLast, today, refresh, retry, commit, restore, ...snap };
}
