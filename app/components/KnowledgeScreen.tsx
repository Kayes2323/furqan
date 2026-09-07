'use client';
import type { Screen } from '../types';

interface Props {
  onNavigate: (s: Screen) => void;
}

export default function KnowledgeScreen({ onNavigate }: Props) {
  return (
    <div style={{ paddingBottom: 20 }}>

      <div style={{ padding: '52px 20px 4px' }}>
        <div style={{ fontFamily: 'Amiri, serif', fontSize: 24, color: 'var(--accent)' }}>জ্ঞান</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>
          Knowledge Hub
        </div>
      </div>

      <p style={{ padding: '12px 20px 20px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
        কুরআন, সীরাত ও ইসলামী জ্ঞানের জগতে প্রবেশ করুন — প্রতিটি মডিউল একটি নতুন দরজা।
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
          height: 160,
          background: 'linear-gradient(135deg, #1A5F7A 0%, #2A7F9A 55%, #164d63 100%)',
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
        }}>
          {/* Pattern overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 16px),
                               repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 16px)`,
          }} />
          {/* Hex decoration */}
          <div style={{
            position: 'absolute', right: 16, top: 16,
            fontSize: 80, color: 'rgba(255,255,255,0.08)', lineHeight: 1,
          }}>⬡</div>

          <div style={{ position: 'relative', zIndex: 2, padding: '18px 20px', width: '100%' }}>
            <span style={{ fontSize: 26, display: 'block', marginBottom: 6 }}>🔬</span>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>গবেষণা</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 12, maxWidth: 220 }}>
              কুরআন ও হাদীসের আলোকে বিজ্ঞান, সমাজ, অর্থনীতি ও আরও অনেক কিছু
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 100, padding: '6px 14px',
              fontSize: 12, fontWeight: 600, color: '#fff',
            }}>অন্বেষণ করুন →</div>
          </div>
        </div>

        {/* ── সীরাত Card ── fixed design ── */}
        <div onClick={() => onNavigate('sirah')} style={{
          borderRadius: 22,
          overflow: 'hidden',
          cursor: 'pointer',
          height: 160,
          background: 'linear-gradient(135deg, #3D2008 0%, #7A5A1A 60%, #9A7A2A 100%)',
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
        }}>
          {/* Stars */}
          {['15% 25%', '75% 15%', '55% 35%', '30% 60%', '85% 45%'].map((pos, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: pos.split(' ')[0], top: pos.split(' ')[1],
              width: i % 2 === 0 ? 3 : 2, height: i % 2 === 0 ? 3 : 2,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.5)',
            }} />
          ))}
          {/* Moon decoration */}
          <div style={{
            position: 'absolute', right: 20, top: 16,
            fontSize: 48, color: 'rgba(201,168,76,0.25)', lineHeight: 1,
          }}>🌙</div>
          {/* Bottom gradient */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
            background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
          }} />

          <div style={{ position: 'relative', zIndex: 2, padding: '18px 20px', width: '100%' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>সীরাত</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 12, maxWidth: 220 }}>
              রাসূলুল্লাহ ﷺ-এর জীবনকে ইতিহাস ও ঘটনাপ্রবাহের মাধ্যমে জানুন
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 100, padding: '6px 14px',
              fontSize: 12, fontWeight: 600, color: '#fff',
            }}>জীবনী শুরু করুন →</div>
          </div>
        </div>

      </div>

      <div style={{ padding: '0 20px 10px', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>
        শীঘ্রই আসছে
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {comingSoonModules.map((mod) => (
          <div key={mod.id} style={{
            background: 'var(--card)',
            border: '1.5px solid var(--border)',
            borderRadius: 16, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(26,95,122,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}>{mod.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{mod.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>{mod.desc}</div>
            </div>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
              padding: '3px 9px', borderRadius: 20,
              background: 'rgba(26,95,122,0.07)', color: 'var(--accent)',
              flexShrink: 0,
            }}>শীঘ্রই</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const comingSoonModules = [
  { id: 'fiqh',         icon: '⚖️', name: 'ফিকহ',              desc: 'ইসলামী বিধান ও দৈনন্দিন মাসআলা' },
  { id: 'personalities', icon: '⭐', name: 'ব্যক্তিত্ব',         desc: 'নবী, সাহাবী ও ইসলামের মহান ব্যক্তিদের জীবন' },
  { id: 'history',      icon: '🏛️', name: 'ইসলামের ইতিহাস',    desc: 'খিলাফত, সাম্রাজ্য ও ঐতিহাসিক ঘটনাপ্রবাহ' },
  { id: 'aqidah',       icon: '☪️', name: 'আকীদাহ',            desc: 'ঈমান, তাওহীদ ও ইসলামী বিশ্বাসের ভিত্তি' },
  { id: 'tazkiyah',     icon: '❤️', name: 'আখলাক ও তাযকিয়া',  desc: 'আত্মশুদ্ধি, চরিত্র গঠন ও হৃদয়ের পরিশুদ্ধি' },
  { id: 'comparative',  icon: '📚', name: 'তুলনামূলক ধর্ম',    desc: 'বিভিন্ন ধর্ম নিয়ে নিরপেক্ষ আলোচনা' },
  { id: 'library',      icon: '📖', name: 'ইসলামিক লাইব্রেরি', desc: 'ক্লাসিক ও আধুনিক ইসলামিক বইয়ের সংগ্রহ' },
];
