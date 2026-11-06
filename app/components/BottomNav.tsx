'use client';
import { Home, BookMarked, LayoutGrid, User } from 'lucide-react';
import type { Screen } from '../types';

interface Props {
  current: Screen;
  onNavigate: (s: Screen) => void;
}

type NavSection = 'home' | 'quran' | 'nur' | 'knowledge' | 'profile';

/**
 * Which bottom-nav tab owns each screen. Declared as one exhaustive map
 * rather than a chain of `||` comparisons per tab: with the chains, every
 * screen added to the app had to be remembered in two separate places, and
 * several (the Zikr tracker, all four Sunnah-life screens) were missed — on
 * those screens no tab lit up at all, so the app looked like it had lost
 * track of where you were. `Record<Screen, …>` makes the compiler refuse a
 * new screen until it is filed under a tab.
 */
const SCREEN_SECTION: Record<Screen, NavSection> = {
  home: 'home',
  nur: 'nur',

  'quran-hub': 'quran',
  'quran-topics': 'quran',
  'topic-detail': 'quran',
  'important-detail': 'quran',
  reader: 'quran',
  'reader-surah': 'quran',
  'reader-search': 'quran',
  'reader-bookmarks': 'quran',
  'quran-journey': 'quran',
  'khatm-setup': 'quran',
  'nazera-setup': 'quran',
  recite: 'quran',

  knowledge: 'knowledge',
  research: 'knowledge',
  sirah: 'knowledge',
  'sirah-part': 'knowledge',
  'sirah-read': 'knowledge',
  qibla: 'knowledge',
  zikr: 'knowledge',
  'zikr-section': 'knowledge',
  'zikr-read': 'knowledge',
  'zikr-tracker': 'knowledge',
  'sunnah-life': 'knowledge',
  'sunnah-life-areas': 'knowledge',
  'sunnah-life-area-detail': 'knowledge',
  'sunnah-practice-detail': 'knowledge',

  profile: 'profile',
};

function sectionForScreen(screen: Screen): NavSection {
  return SCREEN_SECTION[screen];
}

export default function BottomNav({ current, onNavigate }: Props) {
  const section = sectionForScreen(current);

  return (
    <nav
      aria-label="প্রধান নেভিগেশন"
      style={{
        background: 'var(--card)',
        borderTop: '1px solid var(--border)',
        padding: '8px 0 max(20px, env(safe-area-inset-bottom))',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        flexShrink: 0,
        zIndex: 100,
      }}
    >
      <NavItem icon={Home} label="হোম" active={section === 'home'} onClick={() => onNavigate('home')} />
      <NavItem icon={BookMarked} label="কুরআন" active={section === 'quran'} onClick={() => onNavigate('quran-hub')} />

      <button onClick={() => onNavigate('nur')} style={{
        width: 58, height: 58, borderRadius: 19,
        background: 'linear-gradient(135deg, var(--green), var(--accent-light))',
        border: 'none', cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        marginTop: -20,
        boxShadow: section === 'nur'
          ? '0 0 0 3px rgba(31,122,76,0.3), 0 4px 20px rgba(31,122,76,0.5)'
          : '0 4px 20px rgba(31,122,76,0.4)',
      }}>
        <span style={{ fontFamily: 'Amiri, serif', fontSize: 20, color: 'white', lineHeight: 1 }}>ن</span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.85)', fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>NUR</span>
      </button>

      <NavItem icon={LayoutGrid} label="জ্ঞান" active={section === 'knowledge'} onClick={() => onNavigate('knowledge')} />
      <NavItem icon={User} label="প্রোফাইল" active={section === 'profile'} onClick={() => onNavigate('profile')} />
    </nav>
  );
}

function NavItem({ icon: Icon, label, active, onClick }: {
  icon: React.ElementType; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 3, cursor: 'pointer', padding: '4px 12px',
      borderRadius: 12, border: 'none', background: 'none',
      color: active ? 'var(--accent)' : 'var(--text-muted)',
    }}>
      <Icon size={20} strokeWidth={1.8} />
      <span style={{
        fontSize: 10, fontFamily: 'Hind Siliguri, sans-serif', fontWeight: 600,
        color: active ? 'var(--accent)' : 'var(--text-muted)',
      }}>
        {label}
      </span>
    </button>
  );
}
