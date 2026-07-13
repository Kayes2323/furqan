'use client';
import { useTheme } from '../lib/theme';

export default function ProfileScreen() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div>
      <div style={{
        background: isDark ? '#1A1D27' : 'linear-gradient(135deg, #1A1A2E, #1A5F7A)',
        padding: '52px 20px 24px', textAlign: 'center', color: 'white',
      }}>
        <div style={{
          width: 70, height: 70, background: 'rgba(255,255,255,0.12)',
          borderRadius: 24, margin: '0 auto 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
        }}>👤</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>অতিথি ব্যবহারকারী</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Google দিয়ে লগিন করুন (ঐচ্ছিক)</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 30, marginTop: 16 }}>
          {[['০', 'বুকমার্ক'], ['১', 'দিন'], ['৭', 'আয়াত']].map(([num, label]) => (
            <div key={label}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#F0D080' }}>{num}</div>
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <Section title="অ্যাকাউন্ট">
          <Item icon="🔑" title="Google দিয়ে লগিন" sub="বুকমার্ক ও ইতিহাস সংরক্ষণ" />
        </Section>

        <Section title="সেটিংস">
          {/* Dark mode toggle */}
          <div style={itemStyle}>
            <div style={{ fontSize: 20 }}>{isDark ? '☀️' : '🌙'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                {isDark ? 'লাইট মোড' : 'ডার্ক মোড'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                {isDark ? 'এখন ডার্ক মোড চালু' : 'চোখের আরামের জন্য'}
              </div>
            </div>
            <div onClick={toggle} style={{
              width: 48, height: 26,
              background: isDark ? 'var(--accent)' : 'var(--border)',
              borderRadius: 13, position: 'relative', cursor: 'pointer',
              transition: 'background 0.3s',
            }}>
              <div style={{
                width: 22, height: 22, background: 'white', borderRadius: '50%',
                position: 'absolute', top: 2,
                left: isDark ? 24 : 2,
                transition: 'left 0.3s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              }} />
            </div>
          </div>
          <Item icon="🔤" title="ভাষা" sub="বাংলা" />
          <Item icon="📖" title="আরবি ফন্ট সাইজ" sub="মাঝারি" />
        </Section>

        <Section title="অ্যাপ সম্পর্কে">
          <Item icon="🌙" title="FURQAN v1.0" sub="الفرقان — কুরআন পড়ো না, বোঝো" />
          <Item icon="❤️" title="তৈরি করেছেন" sub="Kayes — সকলের কল্যাণে" />
        </Section>
      </div>
    </div>
  );
}

const itemStyle: React.CSSProperties = {
  background: 'var(--card)', border: '1px solid var(--border)',
  borderRadius: 12, padding: '14px 16px', marginBottom: 8,
  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(26,95,122,0.04)',
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

function Item({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={itemStyle}>
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>
      </div>
      <div style={{ color: 'var(--text-light)' }}>›</div>
    </div>
  );
}