'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { validateZikrInput } from '../lib/zikr-tracker-engine';
import type { CustomZikr, ZikrInput } from '../lib/zikr-tracker-types';

interface Props {
  /** When editing, the existing zikr; when adding, undefined. */
  existing?: CustomZikr;
  onSave: (input: ZikrInput) => void;
  onClose: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)',
  background: 'var(--bg)', color: 'var(--text)', fontSize: 13.5, boxSizing: 'border-box',
  fontFamily: 'Hind Siliguri, sans-serif',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 5,
};

export default function ZikrFormModal({ existing, onSave, onClose }: Props) {
  const [name, setName] = useState(existing?.name ?? '');
  const [arabic, setArabic] = useState(existing?.arabic ?? '');
  const [transliteration, setTransliteration] = useState(existing?.transliteration ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [dailyTarget, setDailyTarget] = useState(existing ? String(existing.dailyTarget) : '33');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [sourceRef, setSourceRef] = useState(existing?.sourceRef ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: ZikrInput = {
      name,
      arabic: arabic || undefined,
      transliteration: transliteration || undefined,
      notes: notes || undefined,
      dailyTarget: Number(dailyTarget),
      category: category || undefined,
      sourceRef: sourceRef || undefined,
    };
    const result = validateZikrInput(input);
    if (!result.valid) {
      setErrors(result.errors as Record<string, string>);
      return;
    }
    onSave(input);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={existing ? 'যিকির সম্পাদনা করুন' : 'নতুন যিকির যোগ করুন'}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,20,15,0.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 430, maxHeight: '88vh', overflowY: 'auto',
          background: 'var(--card)', borderRadius: '20px 20px 0 0', padding: '18px 18px 22px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
            {existing ? 'যিকির সম্পাদনা করুন' : 'নতুন কাস্টম যিকির'}
          </div>
          <button
            type="button"
            aria-label="বন্ধ করুন"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
          ><X size={20} /></button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle} htmlFor="zikr-name">নাম *</label>
          <input
            id="zikr-name" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="যেমন: আস্তাগফিরুল্লাহ" style={inputStyle} maxLength={120}
          />
          {errors.name && <div style={{ color: '#C85A4C', fontSize: 11, marginTop: 4 }}>{errors.name}</div>}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle} htmlFor="zikr-target">দৈনিক লক্ষ্য (সংখ্যা) *</label>
          <input
            id="zikr-target" type="number" min={1} inputMode="numeric"
            value={dailyTarget} onChange={(e) => setDailyTarget(e.target.value)}
            style={inputStyle}
          />
          {errors.dailyTarget && <div style={{ color: '#C85A4C', fontSize: 11, marginTop: 4 }}>{errors.dailyTarget}</div>}
          <div style={{ fontSize: 10.5, color: 'var(--text-light)', marginTop: 4, lineHeight: 1.5 }}>
            এটি আপনার নিজের নির্ধারিত লক্ষ্য — এটিকে কোনো নির্দিষ্ট ধর্মীয় সংখ্যা হিসেবে দাবি করা হচ্ছে না।
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle} htmlFor="zikr-arabic">আরবি লেখা (ঐচ্ছিক)</label>
          <input
            id="zikr-arabic" dir="rtl" className="arabic" value={arabic} onChange={(e) => setArabic(e.target.value)}
            style={{ ...inputStyle, fontFamily: 'Amiri, serif', fontSize: 16, textAlign: 'right' }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle} htmlFor="zikr-translit">উচ্চারণ (ঐচ্ছিক)</label>
          <input id="zikr-translit" value={transliteration} onChange={(e) => setTransliteration(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle} htmlFor="zikr-notes">অর্থ/নোট (ঐচ্ছিক)</label>
          <textarea
            id="zikr-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'Hind Siliguri, sans-serif' }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle} htmlFor="zikr-category">ক্যাটাগরি (ঐচ্ছিক)</label>
          <input id="zikr-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="যেমন: তাসবিহ, দরূদ" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle} htmlFor="zikr-source">সূত্র/রেফারেন্স (ঐচ্ছিক)</label>
          <input
            id="zikr-source" value={sourceRef} onChange={(e) => setSourceRef(e.target.value)}
            placeholder="যদি কোনো নির্দিষ্ট উৎস থাকে" style={inputStyle}
          />
          <div style={{ fontSize: 10.5, color: 'var(--text-light)', marginTop: 4, lineHeight: 1.5 }}>
            আপনি যা লিখবেন তা অপরিবর্তিতভাবে রাখা হবে — কোনো কুরআন/হাদিস রেফারেন্স নিজে থেকে তৈরি করা হয় না।
          </div>
        </div>

        <button
          type="submit"
          style={{
            width: '100%', background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 12, padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Hind Siliguri, sans-serif',
          }}
        >{existing ? 'সংরক্ষণ করুন' : 'যিকির যোগ করুন'}</button>
      </form>
    </div>
  );
}
