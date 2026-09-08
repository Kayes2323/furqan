'use client';
import { User, Key, Moon, Globe, BookOpen, Sparkles, Heart } from 'lucide-react';
import { useTheme } from '../lib/theme';

export default function ProfileScreen() {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';

  return (
    <div>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #0E2A19, #12532F 60%, #1F7A4C)',
        padding: '52px 20px 24px', textAlign: 'center', color: '#F4EFDD',
      }}>
        <div style={{
          width: 70, height: 70, background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.22)',
          borderRadius: 24, margin: '0 auto 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><User size={32} color="#fff" strokeWidth={1.6} /></div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>অতিথি ব্যবহারকারী</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Google দিয়ে লগিন করুন (ঐচ্ছিক)</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 30, marginTop: 16 }}>
          {[['০', 'বুকমার্ক'], ['১', 'দিন'], ['৭', 'আয়াত']].map(([num, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#E4C878', fontVariantNumeric: 'tabular-nums' }}>{num}</div>
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Account */}
        <Section title="অ্যাকাউন্ট">
          <Item icon={Key} title="Google দিয়ে লগিন" sub="বুকমার্ক ও ইতিহাস সংরক্ষণ করুন" />
        </Section>

        <Section title="সেটিংস">
          <div style={itemStyle}>
            <IconBadge icon={Moon} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>ডার্ক মোড</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>চোখের আরাম</div>
            </div>
            <div onClick={toggle} style={{
              width: 44, height: 24, background: dark ? 'var(--accent)' : 'var(--border)',
              borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'background 0.3s',
            }}>
              <div style={{
                width: 20, height: 20, background: 'white', borderRadius: '50%',
                position: 'absolute', top: 2, left: dark ? 22 : 2,
                transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>
          <Item icon={Globe} title="ভাষা" sub="বাংলা" />
          <Item icon={BookOpen} title="আরবি ফন্ট সাইজ" sub="মাঝারি" />
        </Section>

        <Section title="অ্যাপ সম্পর্কে">
          <Item icon={Sparkles} title="FURQAN v1.0" sub="الفرقان — কুরআন পড়ো না, বোঝো" />
          <Item icon={Heart} title="তৈরি করেছেন" sub="Kayes — সকলের কল্যাণে" />
        </Section>
      </div>
    </div>
  );
}

const itemStyle: React.CSSProperties = {
  background: 'var(--card)', border: '1px solid var(--border)',
  borderRadius: 12, padding: '14px 16px', marginBottom: 8,
  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(15,42,25,0.05)',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function IconBadge({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
      background: 'rgba(31,122,76,0.1)', color: 'var(--accent)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}><Icon size={17} strokeWidth={1.8} /></div>
  );
}

function Item({ icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div style={itemStyle}>
      <IconBadge icon={icon} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>
      </div>
      <div style={{ color: 'var(--text-light)' }}>›</div>
    </div>
  );
}
