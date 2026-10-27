'use client';

import { BookMarked, BookOpenCheck, Target, History } from 'lucide-react';
import { Card, ProgressBar, SectionTitle } from './ui';
import type { JourneyData } from './useJourneyData';
import { addDays, daysBetween } from '../../lib/khatm-plan';
import { khatmWeek } from '../../lib/journey-progress';
import { globalToRef } from '../../lib/quran-index';
import { formatDateBn, formatRefBn } from '../../lib/journey-plan';

export default function JourneyProgressTab({ data }: { data: JourneyData }) {
  const { index, khatm, nazera, journey, readerLast, surahNames, today } = data;
  if (!index) return null;

  if (!khatm && !nazera) {
    return (
      <div style={{ padding: '0 16px' }}>
        <Card style={{ textAlign: 'center', padding: '28px 20px' }}>
          <History size={28} color="var(--text-light)" aria-hidden />
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)', margin: '10px 0 4px' }}>এখনও দেখানোর মতো অগ্রগতি নেই</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.7 }}>পরিকল্পনা শুরু করে প্রথম পড়া সম্পন্ন করলেই এখানে তোমার যাত্রা ফুটে উঠবে।</div>
        </Card>
      </div>
    );
  }

  const khatmPct = khatm ? Math.floor((khatm.completedAyahs / index.totalAyahs) * 100) : 0;
  const week = khatm
    ? khatmWeek(khatm.history, khatm.dayAnchor && khatm.dayAnchor.date === today ? { date: today, read: Math.max(0, khatm.completedAyahs - khatm.dayAnchor.startCompletedAyahs) } : null, today)
    : [];
  const maxV = Math.max(1, ...week.map((c) => c.value));
  const daysRead = week.filter((c) => c.met).length;

  const nazeraPct = nazera ? Math.floor((nazera.position / index.totalAyahs) * 100) : 0;
  const nz: { date: string; state: 'met' | 'some' | 'none' }[] = [];
  if (nazera) {
    const byDate = new Map(nazera.history.map((h) => [h.date, h]));
    if (nazera.dayAnchor && nazera.dayAnchor.date === today) {
      byDate.set(today, { date: today, progress: nazera.dayAnchor.progressToday, target: nazera.dayAnchor.target, metTarget: nazera.dayAnchor.progressToday >= nazera.dayAnchor.target });
    }
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i);
      const e = byDate.get(d);
      nz.push({ date: d, state: e?.metTarget ? 'met' : e && e.progress > 0 ? 'some' : 'none' });
    }
  }
  const nzMet = nz.filter((c) => c.state === 'met').length;
  const khatmNext = khatm && khatm.completedAyahs < index.totalAyahs ? globalToRef(index, khatm.completedAyahs + 1) : null;
  const nazeraNext = nazera && nazera.position < index.totalAyahs ? globalToRef(index, nazera.position + 1) : null;

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {khatm && (
        <Card label="খতমের অগ্রগতি">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Target size={16} color="var(--accent)" aria-hidden />
            <SectionTitle>খতম</SectionTitle>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{khatmPct}%</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{khatm.completedAyahs} / {index.totalAyahs} আয়াত</span>
          </div>
          <ProgressBar value={khatm.completedAyahs} max={index.totalAyahs} label="খতমের মোট অগ্রগতি" />
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.7 }}>
            {khatm.status === 'completed' ? 'খতম সম্পন্ন হয়েছে — আলহামদুলিল্লাহ।' : (
              <>
                {khatmNext && <>পরের জায়গা: <b style={{ color: 'var(--text)' }}>{formatRefBn(khatmNext, surahNames)}</b>। </>}
                লক্ষ্য তারিখ (আনুমানিক) {formatDateBn(khatm.targetDate)}{khatm.status === 'paused' ? ' · বিরতিতে' : ''}
                {daysBetween(today, khatm.targetDate) >= 0 ? ` · ${daysBetween(today, khatm.targetDate) + 1} দিন বাকি` : ''}।
              </>
            )}
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>গত 14 দিন — {daysRead} দিন পড়া হয়েছে</div>
            <div role="img" aria-label={`গত 14 দিনে ${daysRead} দিন খতমের পড়া হয়েছে`} style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 44 }}>
              {week.map((c) => (
                <div key={c.date} title={`${c.date}: ${c.value} আয়াত`} style={{
                  flex: 1, borderRadius: 3, minHeight: 4,
                  height: c.value > 0 ? `${Math.max(14, (c.value / maxV) * 100)}%` : 4,
                  background: c.value > 0 ? 'var(--accent)' : 'var(--border)',
                }} />
              ))}
            </div>
          </div>
        </Card>
      )}

      {nazera && (
        <Card label="নাযেরার অগ্রগতি">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <BookOpenCheck size={16} color="var(--accent)" aria-hidden />
            <SectionTitle>নাযেরা</SectionTitle>
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--text)', marginBottom: 8 }}>
            {nazeraNext ? <>পরের জায়গা: <b>{formatRefBn(nazeraNext, surahNames)}</b></> : 'সম্পূর্ণ কুরআন পড়া হয়েছে'}
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> · কুরআনের {nazeraPct}% পর্যন্ত</span>
          </div>
          <ProgressBar value={nazera.position} max={index.totalAyahs} label="নাযেরার কুরআনে অবস্থান" />
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>গত 7 দিনে {nzMet} দিন লক্ষ্য পূর্ণ হয়েছে</div>
            <div role="img" aria-label={`গত 7 দিনে ${nzMet} দিন নাযেরার লক্ষ্য পূর্ণ হয়েছে`} style={{ display: 'flex', gap: 8 }}>
              {nz.map((c) => (
                <span key={c.date} title={c.date} style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: c.state === 'met' ? 'var(--accent)' : c.state === 'some' ? 'rgba(31,122,76,0.35)' : 'transparent',
                  border: `1.5px solid ${c.state === 'none' ? 'var(--border)' : 'var(--accent)'}`,
                }} />
              ))}
            </div>
          </div>
        </Card>
      )}

      {readerLast && (
        <Card label="রিডারের শেষ পড়া" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookMarked size={16} color="var(--text-muted)" aria-hidden />
            <div style={{ flex: 1, fontSize: 12.5, color: 'var(--text-muted)' }}>
              রিডারে শেষ পড়া: <b style={{ color: 'var(--text)' }}>{formatRefBn({ surah: readerLast.surah, ayah: readerLast.ayah }, surahNames)}</b>
              <div style={{ fontSize: 11.5 }}>এটি আলাদা — খতম বা নাযেরার অগ্রগতিতে প্রভাব ফেলে না।</div>
            </div>
          </div>
        </Card>
      )}

      {journey && journey.adjustments.length > 0 && (
        <details style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '2px 16px' }}>
          <summary style={{ minHeight: 44, display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>পরিকল্পনার পরিবর্তনের ইতিহাস</summary>
          <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            {[...journey.adjustments].reverse().slice(0, 8).map((a, i) => <li key={i}>{formatDateBn(a.date)} — {a.note}</li>)}
          </ul>
        </details>
      )}

      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.7, padding: '0 4px' }}>
        খতম ও নাযেরার অগ্রগতি আলাদা রেকর্ডে রাখা হয়, আর রিডারের শেষ পড়ার জায়গা আরেকটি আলাদা বিষয়। সব তথ্য শুধু এই ডিভাইসে সংরক্ষিত — অন্য ডিভাইসে স্বয়ংক্রিয়ভাবে যায় না।
      </div>
    </div>
  );
}
