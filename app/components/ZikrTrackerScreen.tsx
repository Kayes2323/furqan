'use client';

import { useEffect, useState } from 'react';
import { Plus, MoreHorizontal, Minus, CalendarDays, BarChart3, ListTodo, X } from 'lucide-react';
import BackButton from './BackButton';
import ZikrFormModal from './ZikrFormModal';
import ZikrTrackerCalendarTab from './ZikrTrackerCalendarTab';
import ZikrTrackerStatsTab from './ZikrTrackerStatsTab';
import ZikrTrackerDayDetail from './ZikrTrackerDayDetail';
import { loadTrackerData, saveTrackerData } from '../lib/zikr-tracker-storage';
import {
  todayKey,
  addZikr,
  createCustomZikr,
  updateZikr,
  setZikrStatus,
  findZikr,
  incrementRecordCount,
  correctRecordCount,
  findRecord,
  buildDayZikrDetail,
  emptyTrackerData,
} from '../lib/zikr-tracker-engine';
import type { ZikrTrackerData, ZikrInput, ZikrStatus } from '../lib/zikr-tracker-types';

interface Props {
  onBack: () => void;
}

type Tab = 'today' | 'calendar' | 'stats';

export default function ZikrTrackerScreen({ onBack }: Props) {
  const [data, setData] = useState<ZikrTrackerData>(emptyTrackerData());
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>('today');
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionSheetId, setActionSheetId] = useState<string | null>(null);
  const [correcting, setCorrecting] = useState(false);
  const [correctionValue, setCorrectionValue] = useState('');
  const [, forceTick] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage progress on mount (matches app/lib/theme.tsx and the Sirah screens)
    setData(loadTrackerData());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveTrackerData(data);
  }, [data, loaded]);

  // Catches a midnight rollover while the screen stays open: the "today"
  // value below is always recomputed fresh from the real clock on every
  // render, so correctness never depends on this timer firing — it only
  // nudges React to re-render so a long-open tab notices the new day.
  useEffect(() => {
    const bump = () => forceTick((t) => t + 1);
    const interval = setInterval(bump, 60000);
    document.addEventListener('visibilitychange', bump);
    window.addEventListener('focus', bump);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', bump);
      window.removeEventListener('focus', bump);
    };
  }, []);

  const today = todayKey();

  function handleAddZikr(input: ZikrInput) {
    setData((prev) => ({ ...prev, zikrs: addZikr(prev.zikrs, createCustomZikr(input, new Date().toISOString())) }));
    setFormOpen(false);
  }

  function handleEditZikr(id: string, input: ZikrInput) {
    setData((prev) => ({ ...prev, zikrs: updateZikr(prev.zikrs, id, input, new Date().toISOString()) }));
    setFormOpen(false);
    setEditingId(null);
  }

  function handleSetStatus(id: string, status: ZikrStatus) {
    setData((prev) => ({ ...prev, zikrs: setZikrStatus(prev.zikrs, id, status, new Date().toISOString()) }));
    setActionSheetId(null);
  }

  function handleIncrement(zikrId: string, delta: number) {
    setData((prev) => {
      const zikr = findZikr(prev.zikrs, zikrId);
      if (!zikr) return prev;
      return { ...prev, records: incrementRecordCount(prev.records, zikr, today, delta, new Date().toISOString()) };
    });
  }

  function handleCorrect(zikrId: string, newCount: number) {
    setData((prev) => {
      const zikr = findZikr(prev.zikrs, zikrId);
      if (!zikr) return prev;
      return { ...prev, records: correctRecordCount(prev.records, zikr, today, newCount, new Date().toISOString()) };
    });
    setCorrecting(false);
    setActionSheetId(null);
  }

  const activeZikrs = data.zikrs.filter((z) => z.status === 'active');
  const inactiveZikrs = data.zikrs.filter((z) => z.status !== 'active');
  const editingZikr = editingId ? findZikr(data.zikrs, editingId) : undefined;
  const actionSheetZikr = actionSheetId ? findZikr(data.zikrs, actionSheetId) : undefined;

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ padding: '44px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackButton onClick={onBack} variant="dark" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>আমার কাস্টম যিকির</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>দৈনিক গণনা ও ইতিহাস</div>
        </div>
      </div>

      <div style={{ padding: '0 16px 14px', display: 'flex', gap: 6 }}>
        {([
          { id: 'today' as Tab, label: 'আজকের তালিকা', icon: ListTodo },
          { id: 'calendar' as Tab, label: 'ক্যালেন্ডার', icon: CalendarDays },
          { id: 'stats' as Tab, label: 'পরিসংখ্যান', icon: BarChart3 },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? 'true' : undefined}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '9px 6px', borderRadius: 11, border: '1px solid var(--border)',
              background: tab === id ? 'var(--accent)' : 'var(--card)',
              color: tab === id ? '#fff' : 'var(--text-muted)',
              fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
            }}
          ><Icon size={14} />{label}</button>
        ))}
      </div>

      <div style={{ padding: '0 16px' }}>
        {tab === 'today' && (
          <div>
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                background: 'var(--card)', border: '1.5px dashed var(--border)', borderRadius: 14,
                padding: '12px 0', fontSize: 13, fontWeight: 700, color: 'var(--accent)', cursor: 'pointer',
                fontFamily: 'Hind Siliguri, sans-serif', marginBottom: 14,
              }}
            ><Plus size={16} />নতুন কাস্টম যিকির যোগ করুন</button>

            {data.zikrs.length === 0 && (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.7 }}>
                এখনও কোনো যিকির যোগ করা হয়নি। উদাহরণ হিসেবে আয়াতুল কুরসি, আস্তাগফিরুল্লাহ, সুবহানাল্লাহ বা দরূদ যোগ করে শুরু করতে পারেন — এগুলো কেবল উদাহরণ, কোনো ধর্মীয়ভাবে নির্ধারিত সংখ্যা নয়।
              </div>
            )}

            {activeZikrs.length === 0 && data.zikrs.length > 0 && (
              <div style={{ padding: '16px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                কোনো সক্রিয় যিকির নেই। নিচে বিরতিতে থাকা/আর্কাইভড তালিকা থেকে পুনরায় চালু করতে পারেন।
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeZikrs.map((zikr) => {
                const record = findRecord(data.records, zikr.id, today);
                const detail = buildDayZikrDetail(zikr, today, today, record)!;
                return (
                  <div key={zikr.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{zikr.name}</div>
                        {zikr.arabic && <div className="arabic" style={{ fontFamily: 'Amiri, serif', fontSize: 16, color: 'var(--text-muted)', marginTop: 2 }}>{zikr.arabic}</div>}
                      </div>
                      <button
                        type="button"
                        aria-label="আরও অপশন"
                        onClick={() => { setActionSheetId(zikr.id); setCorrecting(false); setCorrectionValue(String(detail.count)); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: 4, flexShrink: 0 }}
                      ><MoreHorizontal size={18} /></button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg)', overflow: 'hidden' }}>
                        <div style={{ width: `${detail.percent}%`, height: '100%', background: detail.percent >= 100 ? 'var(--accent)' : '#B8831F', borderRadius: 3, transition: 'width 0.25s ease' }} />
                      </div>
                      <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>{detail.percent}%</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        {detail.count}/{detail.target} · বাকি {detail.remaining}
                        {detail.excess > 0 && <span style={{ color: 'var(--accent)' }}> · +{detail.excess} অতিরিক্ত</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          aria-label={`${zikr.name} এক কমান`}
                          onClick={() => handleIncrement(zikr.id, -1)}
                          style={{
                            width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--border)',
                            background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        ><Minus size={15} /></button>
                        <button
                          type="button"
                          aria-label={`${zikr.name} এক বাড়ান`}
                          onClick={() => handleIncrement(zikr.id, 1)}
                          style={{
                            minWidth: 56, height: 40, borderRadius: 12, border: 'none',
                            background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 700,
                          }}
                        >+১</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {inactiveZikrs.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>বিরতি ও আর্কাইভড</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {inactiveZikrs.map((zikr) => (
                    <div key={zikr.id} style={{
                      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
                      padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, opacity: 0.85,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>{zikr.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                          {zikr.status === 'paused' ? 'বিরতিতে' : 'আর্কাইভড'} · দৈনিক লক্ষ্য {zikr.dailyTarget}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSetStatus(zikr.id, 'active')}
                        style={{
                          flexShrink: 0, background: 'none', border: '1px solid var(--border)', borderRadius: 100,
                          padding: '5px 12px', fontSize: 11, fontWeight: 700, color: 'var(--accent)', cursor: 'pointer',
                          fontFamily: 'Hind Siliguri, sans-serif',
                        }}
                      >পুনরায় চালু করুন</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'calendar' && (
          <ZikrTrackerCalendarTab
            zikrs={data.zikrs}
            records={data.records}
            today={today}
            offset={calendarOffset}
            onOffsetChange={setCalendarOffset}
            onSelectDate={setSelectedDate}
          />
        )}

        {tab === 'stats' && (
          <ZikrTrackerStatsTab zikrs={data.zikrs} records={data.records} today={today} />
        )}
      </div>

      {formOpen && (
        <ZikrFormModal
          existing={editingZikr}
          onClose={() => { setFormOpen(false); setEditingId(null); }}
          onSave={(input) => (editingId ? handleEditZikr(editingId, input) : handleAddZikr(input))}
        />
      )}

      {selectedDate && (
        <ZikrTrackerDayDetail
          date={selectedDate}
          zikrs={data.zikrs}
          records={data.records}
          today={today}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {actionSheetZikr && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${actionSheetZikr.name} এর অপশন`}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,20,15,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => { setActionSheetId(null); setCorrecting(false); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 430, background: 'var(--card)', borderRadius: '20px 20px 0 0', padding: '18px 18px 24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{actionSheetZikr.name}</div>
              <button
                type="button" aria-label="বন্ধ করুন"
                onClick={() => { setActionSheetId(null); setCorrecting(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
              ><X size={20} /></button>
            </div>

            {!correcting ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <ActionButton label="আজকের গণনা সংশোধন করুন" onClick={() => setCorrecting(true)} />
                <ActionButton label="সম্পাদনা করুন" onClick={() => { setEditingId(actionSheetZikr.id); setActionSheetId(null); setFormOpen(true); }} />
                {actionSheetZikr.status === 'active' && (
                  <ActionButton label="বিরতি দিন" onClick={() => handleSetStatus(actionSheetZikr.id, 'paused')} />
                )}
                {actionSheetZikr.status === 'paused' && (
                  <ActionButton label="পুনরায় চালু করুন" onClick={() => handleSetStatus(actionSheetZikr.id, 'active')} />
                )}
                {actionSheetZikr.status !== 'archived' && (
                  <ActionButton label="আর্কাইভ করুন" tone="danger" onClick={() => handleSetStatus(actionSheetZikr.id, 'archived')} />
                )}
                {actionSheetZikr.status === 'archived' && (
                  <ActionButton label="সক্রিয় করুন" onClick={() => handleSetStatus(actionSheetZikr.id, 'active')} />
                )}
              </div>
            ) : (
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  আজকের সঠিক গণনা লিখুন
                </label>
                <input
                  type="number" min={0} inputMode="numeric" autoFocus
                  value={correctionValue}
                  onChange={(e) => setCorrectionValue(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)',
                    background: 'var(--bg)', color: 'var(--text)', fontSize: 15, fontWeight: 700,
                    boxSizing: 'border-box', marginBottom: 12, fontFamily: 'Hind Siliguri, sans-serif',
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setCorrecting(false)}
                    style={{
                      flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10,
                      padding: '10px 0', fontSize: 13, fontWeight: 700, color: 'var(--text)', cursor: 'pointer',
                      fontFamily: 'Hind Siliguri, sans-serif',
                    }}
                  >বাতিল</button>
                  <button
                    type="button"
                    onClick={() => handleCorrect(actionSheetZikr.id, Number(correctionValue))}
                    disabled={correctionValue.trim() === '' || Number.isNaN(Number(correctionValue))}
                    style={{
                      flex: 1, background: 'var(--accent)', border: 'none', borderRadius: 10,
                      padding: '10px 0', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
                      fontFamily: 'Hind Siliguri, sans-serif',
                    }}
                  >নিশ্চিত করুন</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({ label, onClick, tone }: { label: string; onClick: () => void; tone?: 'danger' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 11, padding: '12px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        color: tone === 'danger' ? '#C85A4C' : 'var(--text)', fontFamily: 'Hind Siliguri, sans-serif',
      }}
    >{label}</button>
  );
}
