'use client';
import { BookMarked, LayoutGrid, BookOpen, Target, BookOpenCheck } from 'lucide-react';
import BackButton from './BackButton';
import type { Screen } from '../types';

interface Props {
  onNavigate: (s: Screen) => void;
  onBack: () => void;
}

const ITEMS = [
  {
    icon: BookMarked, title: 'কুরআন রিডার', sub: '১১৪টি সূরা — সম্পূর্ণ আরবি মুসহাফ, বুকমার্ক ও পঠন অগ্রগতিসহ',
    screen: 'reader' as Screen, tint: { bg: 'rgba(31,122,76,0.12)', fg: 'var(--accent)' },
  },
  {
    icon: LayoutGrid, title: 'বিষয়ভিত্তিক কুরআন', sub: 'সবর, দোয়া, তাওয়াক্কুল ও গুরুত্বপূর্ণ সূরা-আয়াত বিষয়ভিত্তিকভাবে জানুন',
    screen: 'quran-topics' as Screen, tint: { bg: 'rgba(150,112,42,0.16)', fg: 'var(--gold)' },
  },
  {
    icon: BookOpen, title: 'তাফসির', sub: '১১৪টি সূরার তাফসির',
    screen: 'tafsir' as Screen, tint: { bg: 'rgba(47,160,107,0.14)', fg: 'var(--green-light)' },
  },
  {
    icon: BookOpenCheck, title: 'নাযেরা', sub: 'মুসহাফ দেখে নিয়মিত তিলাওয়াতের অভ্যাস গড়ুন',
    screen: 'nazera' as Screen, tint: { bg: 'rgba(31,122,76,0.12)', fg: 'var(--accent)' },
  },
  {
    icon: Target, title: 'খতম পরিকল্পনা', sub: 'লক্ষ্য তারিখ অনুযায়ী সম্পূর্ণ কুরআন পড়া সম্পন্ন করুন',
    screen: 'khatm' as Screen, tint: { bg: 'rgba(150,112,42,0.16)', fg: 'var(--gold)' },
  },
];

export default function QuranHubScreen({ onNavigate, onBack }: Props) {
  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ padding: '44px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackButton onClick={onBack} variant="dark" />
        <div>
          <div style={{ fontFamily: 'Amiri, serif', fontSize: 21, color: 'var(--accent)' }}>কুরআন</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>পড়ুন, বুঝুন, অভ্যাস গড়ুন</div>
        </div>
      </div>

      <div style={{ padding: '8px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ITEMS.map((item) => (
          <div
            key={item.screen}
            onClick={() => onNavigate(item.screen)}
            style={{
              background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
              padding: 14, display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer',
              boxShadow: '0 3px 14px rgba(15,42,25,0.06)',
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: item.tint.bg, color: item.tint.fg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><item.icon size={20} strokeWidth={1.8} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
