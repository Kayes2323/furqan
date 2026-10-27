'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, CheckCircle2, Pause, Play, Undo2 } from 'lucide-react';
import { Card, PrimaryButton, ProgressBar, SecondaryButton, Skeleton, TextButton } from './ui';
import type { JourneyData, JourneySnapshot } from './useJourneyData';
import { todayItems, startPoint, overallStatus, type TodayItem } from '../../lib/journey-today';
import { completeSharedToday } from '../../lib/journey-apply';
import { markTodayComplete as markNazeraToday, markSessionComplete } from '../../lib/nazera-plan';
import { resumePlan, todayKey } from '../../lib/khatm-plan';
import { lettersInRange, formatDateBn } from '../../lib/journey-plan';
import { logSession } from '../../lib/journey-apply';
import type { AyahRange } from '../../lib/quran-index';

interface Props {
  data: JourneyData;
  onStart: (surah: number, ayah?: number) => void;
  onOpenPlanTab: () => void;
  onOpenPlanner: () => void;
  onDataChanged: () => void;
  /** The plan tab is already showing the plan, so its shortcut is dropped there. */
  hidePlanShortcut?: boolean;
  /** Slimmer variant for the other tabs, so their content stays near the top on phones. */
  compact?: boolean;
}

const KIND_LABEL = { khatm: 'খতম', nazera: 'নাযেরা', shared: 'খতম ও নাযেরা (একই পড়া)' } as const;

export function rangeText(range: AyahRange, names: Record<number, string>): string {
  const n = (s: number) => names[s] ?? String(s);
  if (range.start.surah === range.end.surah) {
    return range.start.ayah === range.end.ayah
      ? `${n(range.start.surah)} ${range.start.ayah}`
      : `${n(range.start.surah)} ${range.start.ayah}–${range.end.ayah}`;
  }
  return `${n(range.start.surah)} ${range.start.ayah} — ${n(range.end.surah)} ${range.end.ayah}`;
}

export default function JourneyHero({ data, onStart, onOpenPlanTab, onOpenPlanner, onDataChanged, hidePlanShortcut, compact }: Props) {
  const { index, khatm, nazera, journey, surahNames } = data;
  const [undo, setUndo] = useState<{ snap: JourneySnapshot; label: string } | null>(null);
  const [askMinutes, setAskMinutes] = useState<{ letters: number; ayahs: number } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);

  const items = useMemo(() => (index ? todayItems(index, khatm, nazera, journey) : []), [index, khatm, nazera, journey]);
  const status = overallStatus(khatm, nazera, index);

  if (data.loadState === 'loading') {
    return (
      <Card label="আজকের পড়া লোড হচ্ছে" style={{ margin: '0 16px 14px' }}>
        <Skeleton h={14} w="55%" />
        <Skeleton h={22} w="80%" style={{ marginTop: 14 }} />
        <Skeleton h={8} style={{ marginTop: 14 }} />
        <Skeleton h={46} style={{ marginTop: 18 }} />
      </Card>
    );
  }
  if (data.loadState === 'error' || !index) return null; // the shell shows the error state

  if (compact && status === 'none') return null; // the tab's own empty state already offers setup

  function remember(label: string) {
    setUndo({ snap: { khatm, nazera, journey }, label });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 10000);
  }

  function completeItem(item: TodayItem) {
    if (!index || !item.portion) return;
    const portion = item.portion;
    remember(item.kind === 'khatm' ? 'খতমের আজকের অংশ সম্পন্ন করা হয়েছে' : item.kind === 'nazera' ? 'নাযেরার আজকের অংশ সম্পন্ন করা হয়েছে' : 'আজকের পড়া সম্পন্ন করা হয়েছে');
    if ((item.kind === 'khatm' || item.kind === 'shared') && khatm) {
      const res = completeSharedToday(index, khatm, nazera, item.kind === 'shared');
      data.commit({ khatm: res.khatm, nazera: res.nazera ?? undefined });
    } else if (item.kind === 'nazera' && nazera) {
      data.commit({ nazera: nazera.targetMode === 'sessions' ? markSessionComplete(index, nazera) : markNazeraToday(index, nazera) });
    }
    if (journey) setAskMinutes({ letters: lettersInRange(portion.startGlobal, portion.endGlobal), ayahs: portion.count });
    onDataChanged();
  }

  function saveMinutes(minutes: number | null) {
    const pending = askMinutes;
    setAskMinutes(null);
    if (!pending || minutes === null || !journey) return;
    data.commit({ journey: logSession(journey, { date: todayKey(), ayahs: pending.ayahs, letters: pending.letters, minutes }) });
  }

  function undoLast() {
    if (!undo) return;
    data.restore(undo.snap);
    setUndo(null);
    setAskMinutes(null);
    onDataChanged();
  }

  const start = startPoint(items);
  const allDone = items.length > 0 && items.every((i) => i.complete || i.finished);
  const pausedKhatm = khatm?.status === 'paused';

  // ── plan summary line ──
  let summary: string;
  if (journey) {
    const goal = journey.goal === 'both' ? 'খতম ও নাযেরা' : journey.goal === 'khatm' ? 'খতম' : 'নাযেরা';
    const eta = journey.assumptions.estimatedKhatmCompletion;
    summary = `${goal} · দিনে প্রায় ${journey.dailyMinutes} মিনিট${eta && khatm && khatm.status !== 'completed' ? ` · আনুমানিক শেষ ${formatDateBn(khatm.targetDate)}` : ''}`;
  } else if (status === 'none') {
    summary = 'এখনও কোনো পরিকল্পনা নেই';
  } else {
    summary = [khatm ? 'চলমান খতম' : null, nazera ? 'চলমান নাযেরা' : null].filter(Boolean).join(' · ');
  }

  return (
    <div style={{ margin: '0 16px 14px' }}>
      <Card label="আজকের পড়া" style={{ padding: compact ? 14 : 20, background: 'linear-gradient(165deg, var(--card) 0%, var(--card) 60%, rgba(31,122,76,0.07) 100%)' }}>
        {!compact && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 12 }}>{summary}</div>}

        {status === 'none' ? (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>তোমার যাত্রা শুরু হোক</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
              কয়েকটি ছোট প্রশ্নের উত্তরে NUR তোমার সময়ের সঙ্গে মানানসই একটি পরিকল্পনা বানিয়ে দেবে।
            </div>
            <PrimaryButton onClick={onOpenPlanner}>পরিকল্পনা তৈরি করো</PrimaryButton>
            <div style={{ marginTop: 10 }}>
              <SecondaryButton onClick={() => onStart(1, 1)}><BookOpen size={16} />কুরআন রিডার খোলো</SecondaryButton>
            </div>
          </>
        ) : (
          <>
            {pausedKhatm && (
              <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '10px 12px', borderRadius: 12, background: 'rgba(150,112,42,0.1)', border: '1px solid rgba(150,112,42,0.22)' }}>
                <Pause size={16} color="var(--gold)" aria-hidden />
                <div style={{ flex: 1, fontSize: 12.5, color: 'var(--text)' }}>খতম বিরতিতে আছে — অগ্রগতি সংরক্ষিত।</div>
                <button type="button" onClick={() => { if (khatm) { data.commit({ khatm: resumePlan(khatm, todayKey()) }); onDataChanged(); } }} style={{
                  minHeight: 44, padding: '0 14px', borderRadius: 100, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12.5,
                  background: 'var(--accent)', color: 'var(--on-accent)', display: 'inline-flex', alignItems: 'center', gap: 6,
                }}><Play size={13} aria-hidden />আবার শুরু</button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 10 : 14, marginBottom: compact ? 12 : 16 }}>
              {items.map((item) => (
                <TodayRow key={item.kind} item={item} names={surahNames} compact={compact} onComplete={() => completeItem(item)} />
              ))}
            </div>

            {allDone ? (
              <>
                <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, color: 'var(--accent)', marginBottom: 12 }}>
                  <CheckCircle2 size={18} aria-hidden />আজকের পড়া সম্পন্ন — আলহামদুলিল্লাহ
                </div>
                {!hidePlanShortcut && !compact && <SecondaryButton onClick={() => onOpenPlanTab()}>আমার পরিকল্পনা দেখো</SecondaryButton>}
              </>
            ) : (
              <>
                <PrimaryButton disabled={!start} onClick={() => start && onStart(start.start.surah, start.start.ayah)}>
                  <BookOpen size={17} aria-hidden />আজকের পড়া শুরু করো
                </PrimaryButton>
                {!compact && !hidePlanShortcut && (
                  <div style={{ marginTop: 10 }}>
                    <SecondaryButton onClick={journey ? onOpenPlanTab : onOpenPlanner}>
                      {journey ? 'আমার পরিকল্পনা দেখো' : 'পরিকল্পনা তৈরি করো'}
                    </SecondaryButton>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Card>

      {askMinutes && (
        <Card style={{ marginTop: 10, padding: 14 }} label="পড়তে কতক্ষণ লাগল">
          <div style={{ fontSize: 12.5, color: 'var(--text)', marginBottom: 4, fontWeight: 600 }}>পড়তে কত মিনিট লাগল? (ঐচ্ছিক)</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>এতে তোমার আসল গতি অনুযায়ী ভবিষ্যৎ হিসাব আরও নির্ভুল হবে।</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[5, 10, 15, 20, 30, 45].map((m) => (
              <button key={m} type="button" className="qj-chip" onClick={() => saveMinutes(m)}>{m} মিনিট</button>
            ))}
            <TextButton onClick={() => saveMinutes(null)}>এড়িয়ে যাও</TextButton>
          </div>
        </Card>
      )}

      {undo && (
        <div role="status" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', padding: '0 4px' }}>
          <span style={{ flex: 1 }}>{undo.label}</span>
          <button type="button" onClick={undoLast} style={{ minHeight: 44, padding: '0 12px', borderRadius: 100, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--accent)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Undo2 size={14} aria-hidden />ভুল হলে ফিরিয়ে আনো
          </button>
        </div>
      )}
    </div>
  );
}

function TodayRow({ item, names, onComplete, compact }: { item: TodayItem; names: Record<number, string>; onComplete: () => void; compact?: boolean }) {
  const unit = item.unit === 'session' ? 'সেশন' : 'আয়াত';
  const label = KIND_LABEL[item.kind];
  if (item.finished) {
    return (
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', marginTop: 2 }}>সম্পূর্ণ কুরআন পড়া হয়েছে — মাশাআল্লাহ</div>
      </div>
    );
  }
  if (item.paused) {
    return (
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>বিরতিতে আছে</div>
      </div>
    );
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{item.done}/{item.target} {unit}</div>
      </div>
      <div style={{ fontSize: compact ? 14 : 15.5, fontWeight: 700, color: 'var(--text)', margin: compact ? '2px 0 6px' : '3px 0 8px' }}>
        {item.complete ? 'আজকের লক্ষ্য পূর্ণ' : item.portion ? rangeText(item.portion, names) : '—'}
      </div>
      <ProgressBar value={item.done} max={Math.max(1, item.target)} label={`${label}: আজকের অগ্রগতি`} />
      {!compact && !item.complete && item.portion && (
        <div style={{ marginTop: 6 }}>
          <TextButton onClick={onComplete} style={{ color: 'var(--accent)', textDecoration: 'none', padding: '0 0', fontWeight: 700 }}>
            পড়া শেষ — সম্পন্ন করো
          </TextButton>
        </div>
      )}
    </div>
  );
}
