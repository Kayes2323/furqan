'use client';
import { useEffect, useState } from 'react';
import { Check, Minus, X, CircleSlash, BookX, ExternalLink, ShieldAlert } from 'lucide-react';
import BackButton from './BackButton';
import { LIFE_AREAS, ROUTINE_SLOTS } from '../lib/sunnah-life-labels';
import { findPracticeById } from '../lib/sunnah-life-registry';
import {
  CLASSIFICATION_LABEL_BN,
  todayKey,
  setPracticeStatus,
  findPracticeRecord,
  isPublishableAsVerified,
  emptyTrackerData,
} from '../lib/sunnah-life-engine';
import { loadSunnahTrackerData, saveSunnahTrackerData } from '../lib/sunnah-life-storage';
import type { SunnahLifeTrackerData, PracticeTrackingStatus } from '../lib/sunnah-life-types';

interface Props {
  practiceId: string;
  onBack: () => void;
}

const STATUS_OPTIONS: { id: PracticeTrackingStatus; label: string; icon: typeof Check }[] = [
  { id: 'completed', label: 'সম্পন্ন', icon: Check },
  { id: 'partial', label: 'আংশিক', icon: Minus },
  { id: 'skipped', label: 'বাদ দেওয়া হয়েছে', icon: X },
  { id: 'not_applicable', label: 'প্রযোজ্য নয়', icon: CircleSlash },
];

const SOURCE_TYPE_LABEL_BN: Record<string, string> = {
  quran: 'কুরআন',
  hadith: 'হাদিস',
  scholarly_reference: 'সাধারণ ইসলামী শিক্ষা',
  general_habit: 'সাধারণ উপকারী অভ্যাস (ধর্মীয় বিধান নয়)',
};

export default function SunnahPracticeDetailScreen({ practiceId, onBack }: Props) {
  const practice = findPracticeById(practiceId);
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

  if (!practice) {
    return (
      <div style={{ paddingBottom: 24 }}>
        <div style={{ padding: '44px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <BackButton onClick={onBack} variant="dark" />
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>আমল পাওয়া যায়নি</div>
        </div>
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <BookX size={28} style={{ marginBottom: 10, opacity: 0.6 }} />
          <div style={{ fontSize: 13.5, lineHeight: 1.7 }}>এই আমলের তথ্য খুঁজে পাওয়া যায়নি। এটি সরানো বা পরিবর্তিত হয়ে থাকতে পারে।</div>
        </div>
      </div>
    );
  }

  const currentStatus = findPracticeRecord(data.records, practice.id, today)?.status;
  const verified = isPublishableAsVerified(practice);
  const slot = practice.routineSlot ? ROUTINE_SLOTS.find((s) => s.id === practice.routineSlot) : undefined;

  function handleSetStatus(status: PracticeTrackingStatus) {
    setData((prev) => ({
      ...prev,
      records: setPracticeStatus(prev.records, practice!, today, status, new Date().toISOString()),
    }));
  }

  return (
    <div style={{ paddingBottom: 28 }}>
      <div style={{ padding: '44px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackButton onClick={onBack} variant="dark" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{practice.titleBn}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
            {slot ? slot.labelBn : practice.lifeAreas.map((a) => LIFE_AREAS.find((la) => la.id === a)?.labelBn).join(' · ')}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* ── Classification + verification banner ── */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 20,
            background: 'rgba(31,122,76,0.1)', color: 'var(--accent)',
          }}>{CLASSIFICATION_LABEL_BN[practice.classification]}</span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 20,
            background: verified ? 'rgba(31,122,76,0.1)' : 'rgba(200,90,76,0.12)',
            color: verified ? 'var(--accent)' : '#C85A4C',
          }}>{verified ? 'ধর্মীয় বিশেষজ্ঞ কর্তৃক যাচাইকৃত' : 'পর্যালোচনাধীন — এখনো ধর্মীয় বিশেষজ্ঞ কর্তৃক যাচাই হয়নি'}</span>
        </div>

        {!verified && (
          <div style={{
            display: 'flex', gap: 8, background: 'rgba(200,90,76,0.08)', border: '1px solid rgba(200,90,76,0.25)',
            borderRadius: 12, padding: '10px 12px', marginBottom: 14,
          }}>
            <ShieldAlert size={16} color="#C85A4C" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 11.5, lineHeight: 1.6, color: 'var(--text-muted)' }}>
              এই তথ্য এখনো কোনো যোগ্য ধর্মীয় পর্যালোচকের অনুমোদন পায়নি। নিচের উৎস তথ্যকে একটি &quot;যাচাই করার দাবি&quot; হিসেবে বিবেচনা করুন, প্রতিষ্ঠিত সিদ্ধান্ত হিসেবে নয়।
            </div>
          </div>
        )}

        {/* ── Instructions ── */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 16px', marginBottom: 14,
        }}>
          <div style={{ fontSize: 14.5, lineHeight: 1.9, color: 'var(--text)' }}>{practice.instructionsBn}</div>

          {practice.arabicOriginal && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--border)' }}>
              <div style={{ fontFamily: 'Amiri, serif', fontSize: 22, textAlign: 'right', color: 'var(--text)', lineHeight: 1.9 }}>
                {practice.arabicOriginal}
              </div>
              {practice.transliterationBn && (
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 8 }}>{practice.transliterationBn}</div>
              )}
              {practice.meaningBn && (
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>অর্থ: {practice.meaningBn}</div>
              )}
            </div>
          )}
        </div>

        {practice.classificationNotes && (
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 14px', marginBottom: 14,
          }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: 0.3 }}>শ্রেণিবিন্যাস নোট</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--text)' }}>{practice.classificationNotes}</div>
          </div>
        )}

        {practice.evidencedVirtue && practice.virtueNoteBn && (
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 14px', marginBottom: 14,
          }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: 0.3 }}>ফযিলত</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--text)' }}>{practice.virtueNoteBn}</div>
          </div>
        )}

        {/* ── Evidence / source panel ── */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px', marginBottom: 14,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>উৎস তথ্য</div>

          <SourceRow label="উৎসের ধরন" value={SOURCE_TYPE_LABEL_BN[practice.sourceType]} />
          {practice.sourceReference.collection && (
            <SourceRow label="সংকলন" value={practice.sourceReference.collection} />
          )}
          {practice.sourceReference.bookOrChapter && (
            <SourceRow label="অধ্যায়" value={practice.sourceReference.bookOrChapter} />
          )}
          <SourceRow
            label="নির্দিষ্ট রেফারেন্স নম্বর"
            value={practice.sourceReference.identifier ?? 'এখনো নিশ্চিত করা হয়নি'}
            muted={!practice.sourceReference.identifierConfirmed}
          />
          {practice.sourceReference.identifierNote && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.6 }}>
              {practice.sourceReference.identifierNote}
            </div>
          )}
          {practice.sourceReference.url && (
            <a
              href={practice.sourceReference.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8,
                fontSize: 11.5, fontWeight: 700, color: 'var(--accent)', textDecoration: 'none',
              }}
            >উৎস দেখুন <ExternalLink size={12} /></a>
          )}

          {practice.grading && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
              <SourceRow label="গ্রেডিং" value={practice.grading.label ?? 'এখনো নিশ্চিত করা হয়নি'} muted={!practice.grading.confirmed} />
              {practice.grading.gradingAuthority && (
                <SourceRow label="গ্রেডিং কর্তৃপক্ষ" value={practice.grading.gradingAuthority} />
              )}
            </div>
          )}

          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <EvidenceChip label="সংখ্যা" evidenced={practice.evidencedCount} />
            <EvidenceChip label="সময়" evidenced={practice.evidencedTime} />
            <EvidenceChip label="ফযিলত" evidenced={practice.evidencedVirtue} />
          </div>
        </div>

        {/* ── Tracking control ── */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>আজকের অবস্থা</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {STATUS_OPTIONS.map(({ id, label, icon: Icon }) => {
              const active = currentStatus === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSetStatus(id)}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    padding: '10px 4px', borderRadius: 12, cursor: 'pointer',
                    border: active ? 'none' : '1px solid var(--border)',
                    background: active ? 'var(--accent)' : 'var(--bg)',
                    color: active ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  <Icon size={15} strokeWidth={2.2} />
                  <span style={{ fontSize: 9.5, fontWeight: 700, textAlign: 'center' }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
      <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: muted ? 'var(--text-muted)' : 'var(--text)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function EvidenceChip({ label, evidenced }: { label: string; evidenced: boolean }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
      background: evidenced ? 'rgba(31,122,76,0.1)' : 'rgba(82,96,109,0.12)',
      color: evidenced ? 'var(--accent)' : 'var(--text-muted)',
    }}>{label}: {evidenced ? 'সুনির্দিষ্টভাবে প্রমাণিত' : 'অনুল্লেখিত/অনিশ্চিত'}</span>
  );
}
