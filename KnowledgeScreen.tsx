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

      <p style={{ padding: '12px 20px 20px', fontSize: 13, color: 'var(--text-dim, var(--text-muted))', lineHeight: 1.7 }}>
        কুরআন, সীরাত ও ইসলামী জ্ঞানের জগতে প্রবেশ করুন — প্রতিটি মডিউল একটি নতুন দরজা।
      </p>

      <div style={{ padding: '0 20px 8px', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>
        এখনই অন্বেষণ করুন
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>

        {/* Research Card */}
        <div
          onClick={() => onNavigate('research')}
          style={{
            position: 'relative',
            borderRadius: 24,
            overflow: 'hidden',
            cursor: 'pointer',
            height: 156,
            display: 'flex',
            alignItems: 'flex-end',
            background: 'linear-gradient(135deg, #1A5F7A 0%, #2A7F9A 55%, #164d63 100%)',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 16px),
                               repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 16px)`,
          }} />
          <div style={{
            position: 'absolute', right: -10, top: -20,
            fontSize: 160, color: 'rgba(255,255,255,0.06)', lineHeight: 1,
          }}>⬡</div>

          <div style={{ position: 'relative', zIndex: 2, padding: '20px 22px', width: '100%' }}>
            <span style={{ fontSize: 30, marginBottom: 8, display: 'block' }}>🔬</span>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>গবেষণা</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, maxWidth: 240, marginBottom: 14 }}>
              কুরআন ও হাদীসের আলোকে বিজ্ঞান, সমাজ, অর্থনীতি ও আরও অনেক কিছু
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.25)', borderRadius: 100,
              padding: '7px 16px', fontSize: 12, fontWeight: 600, color: '#fff',
            }}>অন্বেষণ করুন →</div>
          </div>
        </div>

        {/* Sirah Card */}
        <div
          onClick={() => onNavigate('sirah')}
          style={{
            position: 'relative',
            borderRadius: 24,
            overflow: 'hidden',
            cursor: 'pointer',
            height: 156,
            display: 'flex',
            alignItems: 'flex-end',
            background: 'linear-gradient(135deg, #7A5A1A 0%, #9A6F2A 45%, #4A3712 100%)',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 200px 60px at 75% 100%, rgba(255,255,255,0.08), transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 70,
            background: `linear-gradient(180deg, transparent, rgba(0,0,0,0.25)),
                         radial-gradient(circle 8px at 20% 30%, rgba(255,255,255,0.35), transparent 70%)`,
            clipPath: 'polygon(0% 100%, 0% 60%, 8% 55%, 18% 65%, 30% 40%, 42% 62%, 55% 35%, 68% 58%, 80% 45%, 92% 60%, 100% 50%, 100% 100%)',
          }} />

          <div style={{ position: 'relative', zIndex: 2, padding: '20px 22px', width: '100%' }}>
            <span style={{ fontSize: 30, marginBottom: 8, display: 'block' }}>🌙</span>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>সীরাত</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, maxWidth: 240, marginBottom: 14 }}>
              রাসূলুল্লাহ ﷺ-এর জীবনকে ইতিহাস, মানচিত্র ও ঘটনাপ্রবাহের মাধ্যমে জানুন
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.25)', borderRadius: 100,
              padding: '7px 16px', fontSize: 12, fontWeight: 600, color: '#fff',
            }}>জীবনী শুরু করুন →</div>
          </div>
        </div>

      </div>

      <div style={{ padding: '0 20px 8px', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>
        শীঘ্রই আসছে
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {comingSoonModules.map((mod) => (
          <div
            key={mod.id}
            style={{
              background: 'var(--card)',
              border: '1.5px solid var(--border)',
              borderRadius: 18,
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(26,95,122,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>{mod.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{mod.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{mod.desc}</div>
            </div>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: 20,
              background: 'rgba(26,95,122,0.08)', color: 'var(--accent)',
              flexShrink: 0, whiteSpace: 'nowrap',
            }}>শীঘ্রই</span>
          </div>
        ))}
      </div>

    </div>
  );
}

const comingSoonModules = [
  { id: 'fiqh', icon: '⚖️', name: 'ফিকহ', desc: 'ইসলামী বিধান ও দৈনন্দিন মাসআলা' },
  { id: 'personalities', icon: '⭐', name: 'ব্যক্তিত্ব', desc: 'নবী, সাহাবী ও ইসলামের মহান ব্যক্তিদের জীবন' },
  { id: 'history', icon: '🏛️', name: 'ইসলামের ইতিহাস', desc: 'খিলাফত, সাম্রাজ্য, সভ্যতা ও ঐতিহাসিক ঘটনাপ্রবাহ' },
  { id: 'aqidah', icon: '☪️', name: 'আকীদাহ', desc: 'ঈমান, তাওহীদ ও ইসলামী বিশ্বাসের ভিত্তি' },
  { id: 'tazkiyah', icon: '❤️', name: 'আখলাক ও তাযকিয়া', desc: 'আত্মশুদ্ধি, চরিত্র গঠন ও হৃদয়ের পরিশুদ্ধি' },
  { id: 'comparative', icon: '📚', name: 'তুলনামূলক ধর্ম', desc: 'বিভিন্ন ধর্ম সম্পর্কে নিরপেক্ষ ও দলিলভিত্তিক আলোচনা' },
  { id: 'library', icon: '📖', name: 'ইসলামিক লাইব্রেরি', desc: 'ক্লাসিক ও আধুনিক ইসলামিক বইয়ের সংগ্রহ' },
];
