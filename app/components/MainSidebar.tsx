'use client';
import { Home, BookMarked, LayoutGrid, User } from 'lucide-react';
import type { Screen } from '../types';

interface Props {
  current: Screen;
  onNavigate: (s: Screen) => void;
}

// Desktop-only persistent left sidebar — the wide-viewport counterpart to
// BottomNav (same 5 destinations, same active-screen grouping), used by
// page.tsx for every screen outside the Reader group (which already has
// its own dedicated ReaderDesktopShell + ReaderSidebar). Replaces, rather
// than supplements, BottomNav on desktop.
export default function MainSidebar({ current, onNavigate }: Props) {
  const isQuranActive =
    current === 'quran-hub' ||
    current === 'quran-topics' ||
    current === 'topic-detail' ||
    current === 'important-detail' ||
    current === 'reader' ||
    current === 'reader-surah' ||
    current === 'reader-search' ||
    current === 'reader-bookmarks' ||
    current === 'khatm' ||
    current === 'khatm-setup' ||
    current === 'nazera' ||
    current === 'nazera-setup';

  const isKnowledgeActive =
    current === 'knowledge' ||
    current === 'research' ||
    current === 'sirah' ||
    current === 'sirah-part' ||
    current === 'sirah-read' ||
    current === 'qibla' ||
    current === 'zikr' ||
    current === 'zikr-section' ||
    current === 'zikr-read' ||
    current === 'recite';

  return (
    <nav
      aria-label="প্রধান নেভিগেশন"
      style={{
        width: 230, flexShrink: 0, height: '100%',
        background: 'var(--card)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '20px 14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 6px', marginBottom: 24 }}>
        <span style={{ fontFamily: 'Amiri, serif', fontSize: 24, color: 'var(--accent)', lineHeight: 1 }}>ﻕ</span>
        <span style={{ fontFamily: 'Marcellus, serif', fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: 0.5 }}>FURQAN</span>
      </div>

      <SidebarItem icon={Home} label="হোম" active={current === 'home'} onClick={() => onNavigate('home')} />
      <SidebarItem icon={BookMarked} label="কুরআন" active={isQuranActive} onClick={() => onNavigate('quran-hub')} />

      <button
        onClick={() => onNavigate('nur')}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: current === 'nur' ? 'linear-gradient(135deg, var(--green), var(--accent-light))' : 'var(--bg)',
          border: current === 'nur' ? 'none' : '1px solid var(--border)',
          borderRadius: 12, padding: '10px 12px', margin: '4px 0', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{
          width: 26, height: 26, borderRadius: 8, flexShrink: 0,
          background: current === 'nur' ? 'rgba(255,255,255,0.2)' : 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: 'Amiri, serif', fontSize: 15, color: '#fff', lineHeight: 1 }}>ن</span>
        </span>
        <span style={{
          fontSize: 13, fontWeight: 700, fontFamily: 'Hind Siliguri, sans-serif',
          color: current === 'nur' ? '#fff' : 'var(--text)',
        }}>NUR-কে জিজ্ঞাসা করো</span>
      </button>

      <SidebarItem icon={LayoutGrid} label="জ্ঞান" active={isKnowledgeActive} onClick={() => onNavigate('knowledge')} />
      <SidebarItem icon={User} label="প্রোফাইল" active={current === 'profile'} onClick={() => onNavigate('profile')} />
    </nav>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }: {
  icon: React.ElementType; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 12px', margin: '2px 0', borderRadius: 12,
      border: 'none', cursor: 'pointer', textAlign: 'left',
      background: active ? 'rgba(31,122,76,0.1)' : 'none',
      color: active ? 'var(--accent)' : 'var(--text)',
    }}>
      <Icon size={19} strokeWidth={1.8} />
      <span style={{ fontSize: 13.5, fontWeight: 600, fontFamily: 'Hind Siliguri, sans-serif' }}>{label}</span>
    </button>
  );
}
