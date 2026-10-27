'use client';
import {
  FlaskConical, BookOpen, Scale, Users, Landmark, Compass, Heart, ArrowLeftRight, Library, ShieldCheck, Mic, Sunrise,
} from 'lucide-react';
import type { Screen } from '../types';

interface Props {
  onNavigate: (s: Screen) => void;
}

export default function KnowledgeScreen({ onNavigate }: Props) {
  return (
    <div style={{ paddingBottom: 20 }}>

      <div style={{ padding: '52px 20px 4px' }}>
        <div style={{ fontFamily: 'Amiri, serif', fontSize: 25, lineHeight: 1.2, color: 'var(--accent)' }}>জ্ঞান</div>
        <div style={{ fontSize: 10, lineHeight: 1.3, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>
          Practice & Learn
        </div>
      </div>

      <p style={{ padding: '12px 20px 20px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
        ইবাদত, সীরাত ও ইসলামী জ্ঞানের জগতে প্রবেশ করুন। কুরআন রিডার, বিষয়ভিত্তিক কুরআন, তাফসির, নাযেরা ও খতম পরিকল্পনা এখন নিচের &ldquo;কুরআন&rdquo; ট্যাবে পাবেন।
      </p>

      <div style={{ padding: '0 20px 10px', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>
        ইবাদত ও চর্চা
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>

        {/* ── কিবলা Card ── */}
        <div onClick={() => onNavigate('qibla')} style={{
          borderRadius: 22,
          overflow: 'hidden',
          cursor: 'pointer',
          aspectRatio: '3 / 2',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '16px 18px 16px',
          backgroundImage: 'linear-gradient(155deg, #0A2233 0%, #164A66 55%, #1D6E8A 130%)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', right: -14, bottom: -24, pointerEvents: 'none', opacity: 0.1,
          }}><Compass size={150} color="#fff" strokeWidth={1} /></div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, marginBottom: 8,
              background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Compass size={16} color="#fff" strokeWidth={1.8} /></div>
            <div style={{ fontSize: 17, lineHeight: 1.25, fontWeight: 700, color: '#fff', marginBottom: 3 }}>কিবলা</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.78)', marginBottom: 10, maxWidth: 230, lineHeight: 1.4 }}>
              আপনার অবস্থান থেকে কাবার দিক নির্ণয় করুন
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.28)',
              borderRadius: 100, padding: '5px 12px',
              fontSize: 11, lineHeight: 1.3, fontWeight: 600, color: '#fff',
            }}>দিক নির্ণয় করুন →</div>
          </div>
        </div>

        {/* ── সুন্নাহ লাইফ Card ── */}
        <div onClick={() => onNavigate('sunnah-life')} style={{
          borderRadius: 22,
          overflow: 'hidden',
          cursor: 'pointer',
          aspectRatio: '3 / 2',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '16px 18px 16px',
          backgroundImage: 'linear-gradient(155deg, #0E2A1C 0%, #1F7A4C 55%, #4FAE7E 130%)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', right: -14, bottom: -24, pointerEvents: 'none', opacity: 0.1,
          }}><Sunrise size={150} color="#fff" strokeWidth={1} /></div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, marginBottom: 8,
              background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Sunrise size={16} color="#fff" strokeWidth={1.8} /></div>
            <div style={{ fontSize: 17, lineHeight: 1.25, fontWeight: 700, color: '#fff', marginBottom: 3 }}>সুন্নাহ লাইফ</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.78)', marginBottom: 10, maxWidth: 230, lineHeight: 1.4 }}>
              দৈনিক রুটিন ও জীবনক্ষেত্র অনুযায়ী সুন্নাহ শিখুন
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.28)',
              borderRadius: 100, padding: '5px 12px',
              fontSize: 11, lineHeight: 1.3, fontWeight: 600, color: '#fff',
            }}>রুটিন দেখুন →</div>
          </div>
        </div>

        {/* ── আমল (যিকির) Card ── */}
        <div onClick={() => onNavigate('zikr')} style={{
          borderRadius: 22,
          overflow: 'hidden',
          cursor: 'pointer',
          aspectRatio: '3 / 2',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '16px 18px 16px',
          backgroundImage: 'linear-gradient(155deg, #2A1A0A 0%, #5A3A10 45%, #96702A 130%)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', right: -16, bottom: -24, fontSize: 140,
            opacity: 0.08, lineHeight: 1, pointerEvents: 'none',
          }}>🕋</div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, marginBottom: 8,
              background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><ShieldCheck size={16} color="#fff" strokeWidth={1.8} /></div>
            <div style={{ fontSize: 17, lineHeight: 1.25, fontWeight: 700, color: '#fff', marginBottom: 3 }}>আমল</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.78)', marginBottom: 10, maxWidth: 230, lineHeight: 1.4 }}>
              সকাল-সন্ধ্যা ও রাতের তাসবিহ, আত্মরক্ষার আমল
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.28)',
              borderRadius: 100, padding: '5px 12px',
              fontSize: 11, lineHeight: 1.3, fontWeight: 600, color: '#fff',
            }}>আমল শুরু করুন →</div>
          </div>
        </div>

      </div>

      <div style={{ padding: '0 20px 10px', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>
        শিক্ষা
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>

        {/* ── গবেষণা Card ── */}
        <div onClick={() => onNavigate('research')} style={{
          borderRadius: 22,
          overflow: 'hidden',
          cursor: 'pointer',
          aspectRatio: '3 / 2',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '16px 18px 16px',
          backgroundImage: 'linear-gradient(0deg, rgba(6,14,20,0.85), rgba(6,14,20,0.15) 50%, rgba(10,30,42,0.2)), linear-gradient(160deg, rgba(26,95,122,0.5), rgba(22,77,99,0.32)), url(/images/research-quran.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, marginBottom: 8,
              background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><FlaskConical size={16} color="#fff" strokeWidth={1.8} /></div>
            <div style={{ fontSize: 17, lineHeight: 1.25, fontWeight: 700, color: '#fff', marginBottom: 3 }}>গবেষণা</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.78)', marginBottom: 10, maxWidth: 230, lineHeight: 1.4 }}>
              কুরআন থেকে গবেষণা করুন
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.28)',
              borderRadius: 100, padding: '5px 12px',
              fontSize: 11, lineHeight: 1.3, fontWeight: 600, color: '#fff',
            }}>অন্বেষণ করুন →</div>
          </div>
        </div>

        {/* ── সীরাত Card ── */}
        <div onClick={() => onNavigate('sirah')} style={{
          borderRadius: 22,
          overflow: 'hidden',
          cursor: 'pointer',
          aspectRatio: '3 / 2',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '16px 18px 16px',
          backgroundImage: 'linear-gradient(0deg, rgba(12,8,2,0.82), rgba(12,8,2,0.15) 50%, rgba(12,8,2,0.1)), url(/images/sirah-dome.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, marginBottom: 8,
              background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><BookOpen size={16} color="#fff" strokeWidth={1.8} /></div>
            <div style={{ fontSize: 17, lineHeight: 1.25, fontWeight: 700, color: '#fff', marginBottom: 3 }}>সীরাত</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.78)', marginBottom: 10, maxWidth: 230, lineHeight: 1.4 }}>
              রাসূলুল্লাহ ﷺ-এর জীবনকে ইতিহাস ও ঘটনাপ্রবাহের মাধ্যমে জানুন
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.28)',
              borderRadius: 100, padding: '5px 12px',
              fontSize: 11, lineHeight: 1.3, fontWeight: 600, color: '#fff',
            }}>জীবনী শুরু করুন →</div>
          </div>
        </div>

      </div>

      <div style={{ padding: '0 20px 10px', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>
        পরীক্ষামূলক ফিচার
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 28 }}>
        <div
          onClick={() => onNavigate('recite')}
          style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderLeft: '3px solid #C85A4C',
            borderRadius: 14, padding: '13px 15px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 13,
          }}
        >
          <div style={{
            width: 42, height: 42, borderRadius: 11, flexShrink: 0,
            background: 'rgba(200,90,76,0.12)', color: '#C85A4C',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Mic size={19} strokeWidth={1.8} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, lineHeight: 1.3, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>তিলাওয়াত যাচাই</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.35 }}>
              সূরা আল-কাউসার প্রোটোটাইপ — নির্ভরযোগ্যভাবে তিলাওয়াত শনাক্ত করে না, শুধু পরীক্ষার জন্য
            </div>
          </div>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
            padding: '3px 9px', borderRadius: 20, flexShrink: 0,
            background: 'rgba(200,90,76,0.15)', color: '#C85A4C',
          }}>পরীক্ষামূলক</span>
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
              <div style={{ fontSize: 13, lineHeight: 1.3, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{mod.name}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.35 }}>{mod.desc}</div>
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
