'use client';

import {
  periodStatsForAllZikr,
  countFullyCompletedDays,
  firstOfMonthKey,
  addDaysToKey,
} from '../lib/zikr-tracker-engine';
import type { CustomZikr, DailyZikrRecord } from '../lib/zikr-tracker-types';

interface Props {
  zikrs: CustomZikr[];
  records: DailyZikrRecord[];
  today: string;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 14px', flex: 1, minWidth: 120 }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function ZikrTrackerStatsTab({ zikrs, records, today }: Props) {
  if (zikrs.length === 0) {
    return (
      <div style={{ padding: '50px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 13.5, marginBottom: 6 }}>এখনও কোনো যিকির যোগ করা হয়নি।</div>
        <div style={{ fontSize: 11.5, lineHeight: 1.6 }}>প্রথম যিকির যোগ করার পর এখানে আপনার পরিসংখ্যান দেখা যাবে।</div>
      </div>
    );
  }

  const last7Start = addDaysToKey(today, -6);
  const last30Start = addDaysToKey(today, -29);
  const monthStart = firstOfMonthKey(today);

  const todayStats = periodStatsForAllZikr(zikrs, records, today, today);
  const last7Stats = periodStatsForAllZikr(zikrs, records, last7Start, today);
  const last30Stats = periodStatsForAllZikr(zikrs, records, last30Start, today);
  // "All time" per zikr: starting far enough back that periodStatsForZikr's
  // own clamp to each zikr's creation date takes over (see engine docs).
  const allTimeStart = '1970-01-01';
  const allTimeStats = periodStatsForAllZikr(zikrs, records, allTimeStart, today);

  const activeZikrs = zikrs.filter((z) => z.status === 'active');
  const completedToday = activeZikrs.filter((z) => {
    const row = todayStats.perZikr.find((p) => p.zikrId === z.id);
    return row && row.totalTarget > 0 && row.totalCount >= row.totalTarget;
  }).length;

  const monthFullyCompletedDays = countFullyCompletedDays(zikrs, records, monthStart, today);
  const monthStats = periodStatsForAllZikr(zikrs, records, monthStart, today);

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>আজকের অবস্থা</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <StatCard label="আজকের মোট গণনা" value={String(todayStats.overall.totalCount)} />
        <StatCard label="সম্পন্ন লক্ষ্য" value={`${completedToday}/${activeZikrs.length}`} />
        <StatCard label="আজকের সামগ্রিক অগ্রগতি" value={`${todayStats.overall.percent}%`} />
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>এই মাসের অগ্রগতি</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <StatCard label="মাসের অগ্রগতি" value={`${monthStats.overall.percent}%`} />
        <StatCard label="সব লক্ষ্য সম্পন্ন দিন" value={String(monthFullyCompletedDays)} />
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>মোট রিসাইটেশন (গণনা)</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatCard label="গত ৭ দিন" value={last7Stats.overall.totalCount.toLocaleString('en-US')} />
        <StatCard label="গত ৩০ দিন" value={last30Stats.overall.totalCount.toLocaleString('en-US')} />
        <StatCard label="সর্বমোট (সব সময়)" value={allTimeStats.overall.totalCount.toLocaleString('en-US')} />
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>প্রতিটি যিকিরের বিস্তারিত</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
        {allTimeStats.perZikr
          .slice()
          .sort((a, b) => b.totalCount - a.totalCount)
          .map((row) => {
            const l7 = last7Stats.perZikr.find((p) => p.zikrId === row.zikrId);
            const l30 = last30Stats.perZikr.find((p) => p.zikrId === row.zikrId);
            return (
              <div key={row.zikrId} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{row.name}</div>
                  <div style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                    background: row.status === 'active' ? 'rgba(31,122,76,0.12)' : row.status === 'paused' ? 'rgba(184,131,31,0.14)' : 'rgba(150,150,150,0.14)',
                    color: row.status === 'active' ? 'var(--accent)' : row.status === 'paused' ? '#B8831F' : 'var(--text-muted)',
                  }}>
                    {row.status === 'active' ? 'সক্রিয়' : row.status === 'paused' ? 'বিরতি' : 'আর্কাইভড'}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  সর্বমোট: {row.totalCount.toLocaleString('en-US')} বার · {row.percent}%<br />
                  গত ৭ দিন: {l7?.totalCount.toLocaleString('en-US') ?? 0} বার · গত ৩০ দিন: {l30?.totalCount.toLocaleString('en-US') ?? 0} বার
                </div>
              </div>
            );
          })}
      </div>

      <div style={{
        marginTop: 10, padding: '10px 12px', borderRadius: 12,
        background: 'rgba(150,112,42,0.08)', border: '1px solid rgba(150,112,42,0.18)',
        fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6,
      }}>
        সামগ্রিক অগ্রগতি গণনা করা হয় সব যোগ্য যিকিরের মোট সম্পন্ন গণনাকে মোট নির্ধারিত লক্ষ্যের দ্বারা ভাগ করে — নতুন তৈরি, বিরতিতে রাখা বা আর্কাইভ করা যিকিরের জন্য তৈরির তারিখ ও বর্তমান অবস্থা অনুযায়ী হিসাব করা হয়, যাতে ভবিষ্যতের তারিখ বা তৈরির আগের দিনগুলো কখনো গণনায় না আসে।
      </div>
    </div>
  );
}
