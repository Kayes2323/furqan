'use client';

import { X, CheckCircle2, Circle, MinusCircle } from 'lucide-react';
import { buildDaySummary } from '../lib/zikr-tracker-engine';
import type { CustomZikr, DailyZikrRecord } from '../lib/zikr-tracker-types';

interface Props {
  date: string;
  zikrs: CustomZikr[];
  records: DailyZikrRecord[];
  today: string;
  onClose: () => void;
}

const MONTHS_BN = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

function formatFullDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTHS_BN[m - 1]} ${y}`;
}

export default function ZikrTrackerDayDetail({ date, zikrs, records, today, onClose }: Props) {
  const summary = buildDaySummary(zikrs, records, date, today);
  const isToday = date === today;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${formatFullDate(date)} এর বিস্তারিত`}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,20,15,0.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 430, maxHeight: '85vh', overflowY: 'auto',
          background: 'var(--card)', borderRadius: '20px 20px 0 0', padding: '18px 18px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{formatFullDate(date)}</div>
            {isToday && <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginTop: 2 }}>আজ — লাইভ গণনা</div>}
          </div>
          <button
            type="button" aria-label="বন্ধ করুন" onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
          ><X size={20} /></button>
        </div>

        {!isToday && (
          <div style={{ fontSize: 10.5, color: 'var(--text-light)', marginBottom: 14 }}>
            এটি একটি অতীত রেকর্ড — এখান থেকে পরিবর্তন করা যায় না।
          </div>
        )}

        {summary.zikrs.length === 0 && (
          <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>
            এই তারিখে কোনো যিকিরের তথ্য রেকর্ড করা হয়নি।
          </div>
        )}

        {summary.zikrs.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
            সর্বমোট: {summary.totalCount}/{summary.totalTarget} ({summary.percent}%)
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: summary.zikrs.length > 0 ? 0 : 12 }}>
          {summary.zikrs.map((z) => (
            <div
              key={z.zikrId}
              style={{
                background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14,
                padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              {z.status === 'complete' ? (
                <CheckCircle2 size={20} color="var(--accent)" />
              ) : z.status === 'partial' ? (
                <MinusCircle size={20} color="#B8831F" />
              ) : (
                <Circle size={20} color="var(--text-light)" />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{z.name}</div>
                {z.arabic && <div className="arabic" style={{ fontFamily: 'Amiri, serif', fontSize: 15, color: 'var(--text-muted)', marginTop: 2 }}>{z.arabic}</div>}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                  {z.count}/{z.target} · বাকি {z.remaining} · {z.percent}%
                  {z.excess > 0 && ` · +${z.excess} অতিরিক্ত`}
                  {!z.hasRecord && ' · এখনও গণনা করা হয়নি'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
