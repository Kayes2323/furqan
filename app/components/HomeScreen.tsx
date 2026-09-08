'use client';
import { BookOpen, FlaskConical, Sparkles, Bookmark } from 'lucide-react';
import type { Screen } from '../types';

interface Props {
  onNavigate: (s: Screen) => void;
}

const DAILY_AYAH = {
  arabic: 'أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ',
  bangla: 'তারা কি কুরআন নিয়ে গভীরভাবে চিন্তা করে না?',
  ref: 'সূরা মুহাম্মদ ৪৭:২৪',
};

const QUICK = [
  { icon: BookOpen, title: 'তাফসির', sub: '১১৪টি সূরা', screen: 'tafsir' as Screen },
  { icon: FlaskConical, title: 'গবেষণা', sub: 'বিজ্ঞান থেকে রাজনীতি', screen: 'research' as Screen },
  { icon: Sparkles, title: 'NUR কে জিজ্ঞেস করো', sub: 'যেকোনো প্রশ্ন', screen: 'nur' as Screen },
  { icon: Bookmark, title: 'বুকমার্ক', sub: 'শীঘ্রই আসছে', screen: 'profile' as Screen },
];

const CHIPS = ['🔬 বিজ্ঞান', '💰 অর্থনীতি', '🧠 মনোবিজ্ঞান', '⚖️ রাজনীতি', '👥 সমাজ', '🌌 দর্শন'];

export default function HomeScreen({ onNavigate }: Props) {
  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 12px' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>আস-সালামু আলাইকুম 👋</div>
        <div style={{ fontFamily: 'Noto Serif Bengali, serif', fontSize: 25, fontWeight: 600, color: 'var(--text)', letterSpacing: 0.2 }}>
          FUR<span style={{ color: 'var(--accent)' }}>QAN</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>الفرقان — কুরআন পড়ো না, বোঝো</div>
      </div>

      {/* Daily Ayah Hero */}
      <div style={{
        margin: '0 16px 20px',
        background: 'linear-gradient(160deg, #0E2A19 0%, #12532F 55%, #1F7A4C 130%)',
        borderRadius: 20,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -20, right: -10,
          fontFamily: 'Amiri, serif', fontSize: 130,
          color: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
        }}>٩</div>

        <div style={{
          background: 'rgba(201,168,76,0.2)',
          border: '1px solid rgba(201,168,76,0.4)',
          color: '#E4C878',
          fontSize: 10, fontWeight: 700,
          padding: '3px 10px', borderRadius: 20,
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12,
          letterSpacing: 0.5,
        }}><Sparkles size={11} />আজকের আয়াত</div>

        <div style={{ fontFamily: 'Amiri, serif', fontSize: 24, color: 'white', textAlign: 'right', direction: 'rtl', lineHeight: 1.8, marginBottom: 10 }}>
          {DAILY_AYAH.arabic}
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 8 }}>
          {DAILY_AYAH.bangla}
        </div>
        <div style={{ fontSize: 11, color: '#E4C878', opacity: 0.8, marginBottom: 14 }}>
          {DAILY_AYAH.ref}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'NUR কে জিজ্ঞেস করো', icon: Sparkles, target: 'nur' as Screen },
            { label: 'তাফসির দেখো', icon: BookOpen, target: 'tafsir' as Screen },
          ].map(btn => (
            <button key={btn.label} onClick={() => onNavigate(btn.target)} style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', fontSize: 11,
              padding: '7px 14px', borderRadius: 20,
              cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}><btn.icon size={13} />{btn.label}</button>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', padding: '0 20px', marginBottom: 10 }}>
        দ্রুত অ্যাক্সেস
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px 16px' }}>
        {QUICK.map((q, i) => {
          const tint = [
            { bg: 'rgba(31,122,76,0.12)', fg: 'var(--accent)' },
            { bg: 'rgba(150,112,42,0.16)', fg: 'var(--gold)' },
            { bg: 'rgba(47,160,107,0.14)', fg: 'var(--green-light)' },
            { bg: 'rgba(31,122,76,0.12)', fg: 'var(--accent)' },
          ][i];
          return (
            <div key={q.title} onClick={() => onNavigate(q.screen)} style={{
              background: 'var(--card)',
              borderRadius: 16, padding: 16, cursor: 'pointer',
              boxShadow: '0 3px 14px rgba(15,42,25,0.08)',
              border: '1px solid var(--border)',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11, marginBottom: 10,
                background: tint.bg, color: tint.fg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><q.icon size={19} strokeWidth={1.8} /></div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{q.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{q.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Research chips */}
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', padding: '0 20px', marginBottom: 10 }}>
        বিষয়ভিত্তিক অন্বেষণ
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 4px', scrollbarWidth: 'none' }}>
        {CHIPS.map(c => (
          <div key={c} onClick={() => onNavigate('research')} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '10px 14px', whiteSpace: 'nowrap',
            cursor: 'pointer', fontSize: 12, color: 'var(--text)',
            fontWeight: 500, boxShadow: '0 2px 8px rgba(15,42,25,0.06)',
            flexShrink: 0,
          }}>{c}</div>
        ))}
      </div>
    </div>
  );
}
