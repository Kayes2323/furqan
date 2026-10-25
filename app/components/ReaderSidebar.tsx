'use client';

import { useState } from 'react';
import { ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import type { SurahMeta } from '../lib/reader-types';

interface Props {
  allMeta: SurahMeta[];
  activeSurah?: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenSurah: (surah: number) => void;
  onOpenReaderHome: () => void;
}

export default function ReaderSidebar({
  allMeta, activeSurah, collapsed, onToggleCollapsed, onOpenSurah, onOpenReaderHome,
}: Props) {
  const [query, setQuery] = useState('');

  if (collapsed) {
    return (
      <div style={{
        width: 44, flexShrink: 0, borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 14,
        background: 'var(--card)',
      }}>
        <button
          type="button"
          aria-label="সূরা তালিকা প্রসারিত করুন"
          onClick={onToggleCollapsed}
          style={{
            width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--bg)', color: 'var(--accent)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        ><ChevronsRight size={15} /></button>
      </div>
    );
  }

  const filtered = query.trim()
    ? allMeta.filter((s) =>
        s.banglaName.includes(query.trim()) ||
        s.arabicName.includes(query.trim()) ||
        s.transliteratedName.toLowerCase().includes(query.trim().toLowerCase()) ||
        String(s.number).includes(query.trim())
      )
    : allMeta;

  return (
    <div style={{
      width: 260, flexShrink: 0, borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--card)',
    }}>
      <div style={{ padding: '14px 12px 10px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          onClick={onOpenReaderHome}
          style={{
            flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Noto Serif Bengali, serif', fontSize: 15, fontWeight: 700, color: 'var(--text)', padding: 0,
          }}
        >কুরআন — ১১৪ সূরা</button>
        <button
          type="button"
          aria-label="সূরা তালিকা সংকুচিত করুন"
          onClick={onToggleCollapsed}
          style={{
            width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--bg)', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        ><ChevronsLeft size={14} /></button>
      </div>

      <div style={{ padding: '0 12px 10px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg)',
          border: '1px solid var(--border)', borderRadius: 10, padding: '7px 10px',
        }}>
          <Search size={13} color="var(--text-muted)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="সূরা খুঁজুন..."
            aria-label="সূরা খুঁজুন"
            style={{
              border: 'none', background: 'none', outline: 'none', flex: 1, minWidth: 0,
              fontSize: 12.5, color: 'var(--text)', fontFamily: 'Hind Siliguri, sans-serif',
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 8px 12px' }}>
        {filtered.map((s) => {
          const active = s.number === activeSurah;
          return (
            <button
              key={s.number}
              type="button"
              onClick={() => onOpenSurah(s.number)}
              aria-current={active ? 'true' : undefined}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                background: active ? 'var(--accent)' : 'none', color: active ? '#fff' : 'var(--text)',
                border: 'none', borderRadius: 10, padding: '8px 8px', marginBottom: 2,
                cursor: 'pointer', textAlign: 'left', fontFamily: 'Hind Siliguri, sans-serif',
              }}
            >
              <span style={{
                width: 22, height: 22, flexShrink: 0, borderRadius: 7, fontSize: 10.5, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? 'rgba(255,255,255,0.22)' : 'var(--bg)',
                color: active ? '#fff' : 'var(--text-muted)',
              }}>{s.number}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.banglaName}
              </span>
              <span className="arabic" style={{ fontFamily: 'Amiri, serif', fontSize: 13.5, flexShrink: 0, opacity: active ? 0.9 : 0.75 }}>
                {s.arabicName}
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            কোনো সূরা পাওয়া যায়নি।
          </div>
        )}
      </div>
    </div>
  );
}
