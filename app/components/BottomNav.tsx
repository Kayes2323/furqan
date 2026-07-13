'use client';
import type { Screen } from '../types';

interface Props {
  current: Screen;
  onNavigate: (s: Screen) => void;
}

// Premium SVG Icons
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
      fill={active ? 'var(--accent)' : 'none'}
      stroke={active ? 'var(--accent)' : '#9CA3AF'}
      strokeWidth="1.8" strokeLinejoin="round"/>
  </svg>
);

const TafsirIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20" stroke={active ? 'var(--accent)' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M6.5 2H20V22H6.5C5.11929 22 4 20.8807 4 19.5V4.5C4 3.11929 5.11929 2 6.5 2Z"
      fill={active ? 'rgba(26,95,122,0.1)' : 'none'}
      stroke={active ? 'var(--accent)' : '#9CA3AF'} strokeWidth="1.8"/>
    <path d="M8 7H16M8 11H13" stroke={active ? 'var(--accent)' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const ResearchIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7"
      fill={active ? 'rgba(26,95,122,0.1)' : 'none'}
      stroke={active ? 'var(--accent)' : '#9CA3AF'} strokeWidth="1.8"/>
    <path d="M16.5 16.5L21 21" stroke={active ? 'var(--accent)' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M8 11H14M11 8V14" stroke={active ? 'var(--accent)' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4"
      fill={active ? 'rgba(26,95,122,0.1)' : 'none'}
      stroke={active ? 'var(--accent)' : '#9CA3AF'} strokeWidth="1.8"/>
    <path d="M4 20C4 17.7909 7.58172 16 12 16C16.4183 16 20 17.7909 20 20"
      stroke={active ? 'var(--accent)' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

export default function BottomNav({ current, onNavigate }: Props) {
  return (
    <div style={{
      background: 'var(--card)',
      borderTop: '1px solid var(--border)',
      padding: '10px 8px 24px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      flexShrink: 0,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
    }}>
      <NavItem
        icon={<HomeIcon active={current === 'home'} />}
        label="হোম"
        active={current === 'home'}
        onClick={() => onNavigate('home')}
      />
      <NavItem
        icon={<TafsirIcon active={current === 'tafsir'} />}
        label="তাফসির"
        active={current === 'tafsir'}
        onClick={() => onNavigate('tafsir')}
      />

      {/* NUR Center Button */}
      <button onClick={() => onNavigate('nur')} style={{
        width: 58, height: 58,
        borderRadius: 18,
        background: 'linear-gradient(145deg, #1B7A4A, #2EA864, #1A5F7A)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -22,
        boxShadow: current === 'nur'
          ? '0 0 0 3px rgba(27,122,74,0.25), 0 8px 24px rgba(27,122,74,0.5)'
          : '0 6px 20px rgba(27,122,74,0.45)',
        transition: 'all 0.2s',
      }}>
        <span style={{
          fontFamily: 'Amiri, serif',
          fontSize: 24,
          color: 'white',
          lineHeight: 1,
          marginBottom: 1,
        }}>ن</span>
        <span style={{
          fontSize: 7,
          color: 'rgba(255,255,255,0.9)',
          fontWeight: 700,
          letterSpacing: 1.5,
          fontFamily: 'Inter, sans-serif',
        }}>NUR</span>
      </button>

      <NavItem
        icon={<ResearchIcon active={current === 'research'} />}
        label="গবেষণা"
        active={current === 'research'}
        onClick={() => onNavigate('research')}
      />
      <NavItem
        icon={<ProfileIcon active={current === 'profile'} />}
        label="প্রোফাইল"
        active={current === 'profile'}
        onClick={() => onNavigate('profile')}
      />
    </div>
  );
}

function NavItem({
  icon, label, active, onClick
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      cursor: 'pointer',
      padding: '4px 14px',
      borderRadius: 14,
      border: 'none',
      background: active ? 'rgba(26,95,122,0.06)' : 'none',
      transition: 'all 0.2s',
    }}>
      {icon}
      <span style={{
        fontSize: 10,
        fontFamily: 'Hind Siliguri, sans-serif',
        fontWeight: 600,
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        transition: 'color 0.2s',
      }}>
        {label}
      </span>
    </button>
  );
}