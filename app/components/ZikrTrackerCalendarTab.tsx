'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildCalendarWindow, buildDaySummary } from '../lib/zikr-tracker-engine';
import type { CustomZikr, DailyZikrRecord, DayState } from '../lib/zikr-tracker-types';

interface Props {
  zikrs: CustomZikr[];
  records: DailyZikrRecord[];
  today: string;
  offset: number;
  onOffsetChange: (next: number) => void;
  onSelectDate: (date: string) => void;
}

const WEEKDAY_LABELS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];

const STATE_VISUAL: Record<DayState, { bg: string; fg: string; label: string }> = {
  'no-data': { bg: 'var(--bg)', fg: 'var(--text-light)', label: 'কোনো তথ্য নেই' },
  zero: { bg: 'rgba(200,90,76,0.14)', fg: '#C85A4C', label: '০% — কিছুই গণনা হয়নি' },
  partial: { bg: 'rgba(184,131,31,0.18)', fg: '#8A5A20', label: 'আংশিক সম্পন্ন' },
  complete: { bg: 'var(--accent)', fg: '#fff', label: '১০০% সম্পন্ন' },
};

function localWeekday(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

function formatDayLabel(dateStr: string): string {
  const [, , d] = dateStr.split('-');
  return String(Number(d));
}

function formatMonthRangeLabel(dates: string[]): string {
  const MONTHS_BN = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
  const first = dates[0];
  const last = dates[dates.length - 1];
  const [fy, fm] = first.split('-').map(Number);
  const [ly, lm] = last.split('-').map(Number);
  const a = `${MONTHS_BN[fm - 1]} ${fy}`;
  const b = `${MONTHS_BN[lm - 1]} ${ly}`;
  return a === b ? a : `${a} – ${b}`;
}

export default function ZikrTrackerCalendarTab({ zikrs, records, today, offset, onOffsetChange, onSelectDate }: Props) {
  const dates = buildCalendarWindow(today, offset);
  const leadingBlanks = localWeekday(dates[0]);
  const summaries = dates.map((d) => buildDaySummary(zikrs, records, d, today));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          type="button"
          aria-label="পূর্ববর্তী ৩০ দিন দেখুন"
          onClick={() => onOffsetChange(offset + 1)}
          style={{
            width: 34, height: 34, borderRadius: 10, border: '1px solid var(--border)',
            background: 'var(--card)', color: 'var(--text)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        ><ChevronLeft size={16} /></button>

        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{formatMonthRangeLabel(dates)}</div>

        <button
          type="button"
          aria-label="পরবর্তী ৩০ দিন দেখুন"
          disabled={offset === 0}
          onClick={() => offset > 0 && onOffsetChange(offset - 1)}
          style={{
            width: 34, height: 34, borderRadius: 10, border: '1px solid var(--border)',
            background: 'var(--card)', color: offset === 0 ? 'var(--text-light)' : 'var(--text)',
            cursor: offset === 0 ? 'default' : 'pointer', opacity: offset === 0 ? 0.5 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        ><ChevronRight size={16} /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, marginBottom: 6 }}>
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>{w}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
        {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`blank-${i}`} />)}
        {summaries.map((summary) => {
          const visual = STATE_VISUAL[summary.state];
          const isToday = summary.date === today;
          return (
            <button
              key={summary.date}
              type="button"
              onClick={() => onSelectDate(summary.date)}
              aria-label={`${summary.date} — ${visual.label}${summary.state !== 'no-data' ? `, ${summary.percent}%` : ''}`}
              title={summary.date}
              style={{
                aspectRatio: '1 / 1', borderRadius: 10, border: isToday ? '2px solid var(--gold)' : '1px solid var(--border)',
                background: visual.bg, color: visual.fg, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Hind Siliguri, sans-serif', padding: 0,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700 }}>{formatDayLabel(summary.date)}</span>
              {summary.state !== 'no-data' && (
                <span style={{ fontSize: 8.5, fontWeight: 600, opacity: 0.9 }}>{summary.percent}%</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14, padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}>
        {(Object.entries(STATE_VISUAL) as [DayState, typeof STATE_VISUAL['no-data']][]).map(([state, visual]) => (
          <div key={state} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--text-muted)' }}>
            <span style={{ width: 12, height: 12, borderRadius: 4, background: visual.bg, border: '1px solid var(--border)', display: 'inline-block' }} />
            {visual.label}
          </div>
        ))}
      </div>
    </div>
  );
}
