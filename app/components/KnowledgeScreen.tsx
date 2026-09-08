'use client';
import {
  FlaskConical, BookOpen, Scale, Users, Landmark, Compass, Heart, ArrowLeftRight, Library,
} from 'lucide-react';
import type { Screen } from '../types';

interface Props {
  onNavigate: (s: Screen) => void;
}

export default function KnowledgeScreen({ onNavigate }: Props) {
  return (
    <div style={{ paddingBottom: 20 }}>

      <div style={{ padding: '52px 20px 4px' }}>
        <div style={{ fontFamily: 'Amiri, serif', fontSize: 25, color: 'var(--accent)' }}>জ্ঞান</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>
          Knowledge Hub
        </div>
      </div>

      <p style={{ padding: '12px 20px 20px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
        কুরআন, সীরাত ও ইসলামী জ্ঞানের জগতে প্রবেশ করুন — প্রতিটি মডিউলের নিজস্ব পরিচয়, নিজস্ব রং।
      </p>

      <div style={{ padding: '0 20px 10px', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>
        এখনই অন্বেষণ করুন
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>

        {/* ── গবেষণা Card ── */}
        <div onClick={() => onNavigate('research')} style={{
          borderRadius: 22,
          overflow: 'hidden',
          cursor: 'pointer',
          minHeight: 150,
          padding: '18px 20px 20px',
          background: 'linear-gradient(135deg, #1A5F7A 0%, #2A7F9A 55%, #164d63 100%)',
          position: 'relative',
        }}>
          {/* Pattern overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 16px),
                               repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 16px)`,
          }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11, marginBottom: 10,
              background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><FlaskConical size={19} color="#fff" strokeWidth={1.8} /></div>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#fff', marginBottom: 4 }}>গবেষণা</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.78)', marginBottom: 12, maxWidth: 230, lineHeight: 1.5 }}>
              কুরআন থেকে গবেষণা করুন
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.28)',
              borderRadius: 100, padding: '6px 13px',
              fontSize: 11.5, fontWeight: 600, color: '#fff',
            }}>অন্বেষণ করুন →</div>
          </div>
        </div>

        {/* ── সীরাত Card ── */}
        <div onClick={() => onNavigate('sirah')} style={{
          borderRadius: 22,
          overflow: 'hidden',
          cursor: 'pointer',
          minHeight: 150,
          padding: '18px 20px 20px',
          backgroundImage: 'linear-gradient(0deg, rgba(12,8,2,0.82), rgba(12,8,2,0.28) 55%, rgba(12,8,2,0.15)), url(/images/sirah-dome.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11, marginBottom: 10,
              background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><BookOpen size={19} color="#fff" strokeWidth={1.8} /></div>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#fff', marginBottom: 4 }}>সীরাত</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.78)', marginBottom: 12, maxWidth: 230, lineHeight: 1.5 }}>
              রাসূলুল্লাহ ﷺ-এর জীবনকে ইতিহাস ও ঘটনাপ্রবাহের মাধ্যমে জানুন
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.28)',
              borderRadius: 100, padding: '6px 13px',
              fontSize: 11.5, fontWeight: 600, color: '#fff',
            }}>জীবনী শুরু করুন →</div>
          </div>
        </div>

      </div>

      <div style={{ padding: '0 20px 10px', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>
        শীঘ্রই আসছে
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {comingSoonModules.map((mod) => (
          <div key={mod.id} style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderLeft: `3px solid ${mod.color}`,
            borderRadius: 14, padding: '13px 15px',
            display: 'flex', alignItems: 'center', gap: 13,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 11, flexShrink: 0,
              background: `${mod.color}26`, color: mod.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><mod.icon size={19} strokeWidth={1.8} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{mod.name}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>{mod.desc}</div>
            </div>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
              padding: '3px 9px', borderRadius: 20, flexShrink: 0,
              background: `${mod.color}26`, color: mod.color,
            }}>শীঘ্রই</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const comingSoonModules = [
  { id: 'fiqh',          icon: Scale,          name: 'ফিকহ',              desc: 'ইসলামী বিধান ও দৈনন্দিন মাসআলা', color: '#3D4E7A' },
  { id: 'personalities', icon: Users,          name: 'ব্যক্তিত্ব',         desc: 'নবী, সাহাবী ও ইসলামের মহান ব্যক্তিদের জীবন', color: '#8C3B4A' },
  { id: 'history',       icon: Landmark,       name: 'ইসলামের ইতিহাস',    desc: 'খিলাফত, সাম্রাজ্য ও ঐতিহাসিক ঘটনাপ্রবাহ', color: '#8A5A2A' },
  { id: 'aqidah',        icon: Compass,        name: 'আকীদাহ',            desc: 'ঈমান, তাওহীদ ও ইসলামী বিশ্বাসের ভিত্তি', color: '#1D6E72' },
  { id: 'tazkiyah',      icon: Heart,          name: 'আখলাক ও তাযকিয়া',  desc: 'আত্মশুদ্ধি, চরিত্র গঠন ও হৃদয়ের পরিশুদ্ধি', color: '#6B3F6B' },
  { id: 'comparative',   icon: ArrowLeftRight, name: 'তুলনামূলক ধর্ম',    desc: 'বিভিন্ন ধর্ম নিয়ে নিরপেক্ষ আলোচনা', color: '#52606D' },
  { id: 'library',       icon: Library,        name: 'ইসলামিক লাইব্রেরি', desc: 'ক্লাসিক ও আধুনিক ইসলামিক বইয়ের সংগ্রহ', color: '#6B4423' },
];
