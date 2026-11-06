'use client';
import { useEffect, useState } from 'react';
import {
  BookOpen, BookMarked, Route, FlaskConical, Sparkles, Bookmark, Compass,
  ShieldCheck, LayoutGrid, Scroll, Sun, CalendarCheck, ChevronRight, ArrowRight,
} from 'lucide-react';
import type { Screen } from '../types';
import { getDailyAyah } from '../lib/daily-ayah';
import { getLastRead } from '../lib/reader-progress';
import { loadSurahMeta } from '../lib/reader-data';
import { researchCategories } from '../lib/research-data';

interface Props {
  onNavigate: (s: Screen) => void;
  onOpenReaderSurah: (surah: number, ayah?: number) => void;
  onOpenResearch: (categoryId?: string) => void;
}

interface SectionItem {
  icon: React.ElementType;
  title: string;
  sub: string;
  screen: Screen;
}

interface HomeSection {
  heading: string;
  /** One accent per section, so colour groups related destinations instead of
   *  cycling arbitrarily by position as it used to. */
  tint: { bg: string; fg: string };
  items: SectionItem[];
}

const SECTIONS: HomeSection[] = [
  {
    heading: 'কুরআন',
    tint: { bg: 'rgba(31,122,76,0.12)', fg: 'var(--accent)' },
    items: [
      { icon: BookMarked, title: 'কুরআন পড়ুন', sub: '১১৪টি সূরা, অনুবাদ ও তাফসিরসহ', screen: 'reader' },
      { icon: LayoutGrid, title: 'বিষয়ভিত্তিক', sub: 'সবর, দোয়া ও গুরুত্বপূর্ণ আয়াত', screen: 'quran-topics' },
      { icon: Route, title: 'কুরআন যাত্রা', sub: 'খতম ও নাযেরার পরিকল্পনা', screen: 'quran-journey' },
      { icon: Bookmark, title: 'বুকমার্ক', sub: 'সংরক্ষিত আয়াত', screen: 'reader-bookmarks' },
    ],
  },
  {
    heading: 'জ্ঞান ও গবেষণা',
    tint: { bg: 'rgba(150,112,42,0.16)', fg: 'var(--gold)' },
    items: [
      { icon: FlaskConical, title: 'গবেষণা', sub: 'বিজ্ঞান থেকে দর্শন — ৬টি বিষয়', screen: 'research' },
      { icon: Scroll, title: 'সীরাত', sub: 'নবীজির (ﷺ) জীবনী', screen: 'sirah' },
      { icon: Sun, title: 'সুন্নাহ জীবন', sub: 'প্রতিদিনের সুন্নাহ অনুশীলন', screen: 'sunnah-life' },
    ],
  },
  {
    heading: 'দৈনন্দিন আমল',
    tint: { bg: 'rgba(47,160,107,0.14)', fg: 'var(--green-light)' },
    items: [
      { icon: ShieldCheck, title: 'আমল', sub: 'তাসবিহ ও আত্মরক্ষার আমল', screen: 'zikr' },
      { icon: CalendarCheck, title: 'আমল ট্র্যাকার', sub: 'প্রতিদিনের হিসাব রাখুন', screen: 'zikr-tracker' },
      { icon: Compass, title: 'কিবলা', sub: 'কাবার দিক নির্ণয়', screen: 'qibla' },
    ],
  },
];

export default function HomeScreen({ onNavigate, onOpenReaderSurah, onOpenResearch }: Props) {
  const [ayah] = useState(() => getDailyAyah());
  const [lastRead, setLastRead] = useState<ReturnType<typeof getLastRead>>(null);
  const [lastReadName, setLastReadName] = useState<string | null>(null);

  useEffect(() => {
    const saved = getLastRead();
    if (!saved) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading saved progress on mount is the intended pattern here (matches ReaderScreen)
    setLastRead(saved);
    let cancelled = false;
    loadSurahMeta()
      .then((metas) => {
        if (cancelled) return;
        const match = metas.find((m) => m.number === saved.surah);
        if (match) setLastReadName(match.banglaName);
      })
      // The card still works without the name — it falls back to the number.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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

      {/* Continue where you left off — only when there is real progress */}
      {lastRead && (
        <button
          onClick={() => onOpenReaderSurah(lastRead.surah, lastRead.ayah)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, width: 'calc(100% - 32px)',
            margin: '0 16px 14px', padding: '14px 16px', textAlign: 'left',
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 16, cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
            boxShadow: '0 3px 14px rgba(15,42,25,0.08)',
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: 'rgba(31,122,76,0.12)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><BookMarked size={20} strokeWidth={1.8} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>যেখানে ছিলেন</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
              {lastReadName ? `সূরা ${lastReadName}` : `সূরা ${lastRead.surah}`} — আয়াত {lastRead.ayah}
            </div>
          </div>
          <ArrowRight size={18} color="var(--accent)" />
        </button>
      )}

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
          {ayah.arabic}
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 8 }}>
          {ayah.bangla}
        </div>
        <div style={{ fontSize: 11, color: '#E4C878', opacity: 0.8, marginBottom: 14 }}>
          {ayah.ref}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <HeroButton
            icon={BookOpen}
            label="আয়াতটি পড়ুন"
            onClick={() => onOpenReaderSurah(ayah.surah, ayah.ayah)}
          />
          <HeroButton
            icon={Sparkles}
            label="NUR কে জিজ্ঞেস করো"
            onClick={() => onNavigate('nur')}
          />
        </div>
      </div>

      {/* Grouped sections */}
      {SECTIONS.map((section) => (
        <div key={section.heading}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: 'var(--text)',
            padding: '0 20px', marginBottom: 10,
          }}>{section.heading}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px 18px' }}>
            {section.items.map((item) => (
              <button key={item.title} onClick={() => onNavigate(item.screen)} style={{
                background: 'var(--card)', textAlign: 'left',
                borderRadius: 16, padding: 16, cursor: 'pointer',
                boxShadow: '0 3px 14px rgba(15,42,25,0.08)',
                border: '1px solid var(--border)',
                fontFamily: 'Hind Siliguri, sans-serif',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11, marginBottom: 10,
                  background: section.tint.bg, color: section.tint.fg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><item.icon size={19} strokeWidth={1.8} /></div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.45 }}>{item.sub}</div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Research categories — each chip opens that category, not the generic list */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', marginBottom: 10,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>গবেষণার বিষয়</div>
        <button onClick={() => onOpenResearch()} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontSize: 11.5, color: 'var(--accent)', fontWeight: 600,
          fontFamily: 'Hind Siliguri, sans-serif',
          display: 'inline-flex', alignItems: 'center', gap: 2,
        }}>সবগুলো<ChevronRight size={13} /></button>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 4px', scrollbarWidth: 'none' }}>
        {researchCategories.map((c) => (
          <button key={c.id} onClick={() => onOpenResearch(c.id)} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '10px 14px', whiteSpace: 'nowrap',
            cursor: 'pointer', fontSize: 12, color: 'var(--text)',
            fontWeight: 500, boxShadow: '0 2px 8px rgba(15,42,25,0.06)',
            flexShrink: 0, fontFamily: 'Hind Siliguri, sans-serif',
          }}>{c.icon} {c.name}</button>
        ))}
      </div>
    </div>
  );
}

function HeroButton({ icon: Icon, label, onClick }: {
  icon: React.ElementType; label: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      background: 'rgba(255,255,255,0.12)',
      border: '1px solid rgba(255,255,255,0.2)',
      color: 'white', fontSize: 11,
      padding: '7px 14px', borderRadius: 20,
      cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
      display: 'inline-flex', alignItems: 'center', gap: 6,
    }}><Icon size={13} />{label}</button>
  );
}
