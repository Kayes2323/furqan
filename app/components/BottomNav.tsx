'use client';
import type { Screen } from '../types';

interface Props {
  current: Screen;
  onNavigate: (s: Screen) => void;
}

export default function BottomNav({ current, onNavigate }: Props) {
  return (
    <div style={{
      background: 'var(--card)',
      borderTop: '1px solid var(--border)',
      padding: '8px 0 20px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      flexShrink: 0,
    }}>
      <NavItem icon="🏠" label="হোম" active={current === 'home'} onClick={() => onNavigate('home')} />
      <NavItem icon="📖" label="তাফসির" active={current === 'tafsir'} onClick={() => onNavigate('tafsir')} />

      {/* NUR center button */}
      <button onClick={() => onNavigate('nur')} style={{
        width: 60, height: 60,
        borderRadius: 20,
        background: 'linear-gradient(135deg, #1B7A4A, #2EA864, #1A5F7A)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -20,
        boxShadow: current === 'nur'
          ? '0 0 0 3px rgba(27,122,74,0.3), 0 4px 20px rgba(27,122,74,0.5)'
          : '0 4px 20px rgba(27,122,74,0.4)',
      }}>
        <span style={{ fontFamily: 'Amiri, serif', fontSize: 22, color: 'white', lineHeight: 1 }}>ن</span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.85)', fontWeight: 700, letterSpacing: 0.5 }}>NUR</span>
      </button>

      <NavItem icon="🔬" label="গবেষণা" active={current === 'research'} onClick={() => onNavigate('research')} />
      <NavItem icon="👤" label="প্রোফাইল" active={current === 'profile'} onClick={() => onNavigate('profile')} />
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 3, cursor: 'pointer', padding: '4px 12px',
      borderRadius: 12, border: 'none', background: 'none',
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 10, fontFamily: 'Hind Siliguri, sans-serif', fontWeight: 600, color: active ? 'var(--accent)' : 'var(--text-muted)' }}>
        {label}
      </span>
    </button>
  );
}
