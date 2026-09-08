'use client';
import { useState, useEffect } from 'react';
import { getPart } from '../lib/sirah-types';
import { getChaptersByPart, isChapterReady } from '../lib/sirah-data';
import { getLastRead, getScroll, type LastRead } from '../lib/sirah-progress';

interface Props {
  partId: string;
  onBack: () => void;
  onOpenChapter: (chapterId: string) => void;
}

export default function SirahChapterListScreen({ partId, onBack, onOpenChapter }: Props) {
  const part = getPart(partId);
  const chapters = getChaptersByPart(partId);

  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [scrollMap, setScrollMap] = useState<Record<string, number>>({});

  useEffect(() => {
    setLastRead(getLastRead());
    const map: Record<string, number> = {};
    chapters.forEach(ch => { map[ch.id] = getScroll(ch.id); });
    setScrollMap(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partId]);

  if (!part) {
    return (
      <div style={{ padding: '52px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        পর্ব পাওয়া যায়নি।
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 30 }}>
      <div style={{
        background: 'linear-gradient(160deg, #2A1A0A 0%, #5A3A10 40%, #7A5A1A 100%)',
        padding: '52px 20px 20px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -10, bottom: -20, fontFamily: 'Amiri, serif', fontSize: 110, color: 'rgba(201,168,76,.07)', lineHeight: 1 }}>سيرة</div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <button onClick={onBack} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)',
            color: '#fff', fontSize: 14, cursor: 'pointer', marginBottom: 16,
          }}>←</button>
          <div style={{ fontSize: 10, color: 'rgba(201,168,76,.8)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>পর্ব {part.number}</div>
          <div style={{ fontFamily: 'Amiri, serif', fontSize: 22, color: '#fff', marginBottom: 4 }}>{part.title}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{part.subtitle}</div>
        </div>
      </div>

      <div style={{ padding: '14px 16px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {chapters.map(ch => {
          const ready = isChapterReady(ch);
          const isCurrent = ch.id === lastRead?.chapterId;
          const scrollY = scrollMap[ch.id] || 0;
          const readPct = Math.min(Math.round((scrollY / 3000) * 100), 99);
          const hasStarted = scrollY > 50;

          return (
            <div
              key={ch.id}
              onClick={ready ? () => onOpenChapter(ch.id) : undefined}
              style={{
                background: 'var(--card)',
                border: isCurrent ? '1.5px solid rgba(201,168,76,0.5)' : '1.5px solid var(--border)',
                borderRadius: 14, padding: '12px 14px', cursor: ready ? 'pointer' : 'default',
                opacity: ready ? 1 : 0.5,
                display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: isCurrent ? '0 4px 18px rgba(201,168,76,0.12)' : '0 2px 8px rgba(26,95,122,0.05)',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13,
                background: isCurrent ? '#C9A84C' : 'rgba(122,90,26,0.1)',
                color: isCurrent ? '#1A1A2E' : '#7A5A1A',
              }}>{ch.number}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{ch.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {ready ? ch.subtitle : 'শীঘ্রই আসছে'}
                </div>
              </div>
              {ready ? (
                hasStarted ? (
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontSize: 15, color: '#C9A84C' }}>🔖</span>
                    <span style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 600 }}>{readPct}%</span>
                  </div>
                ) : (
                  <span style={{ fontSize: 15, color: 'var(--text-muted)', flexShrink: 0 }}>›</span>
                )
              ) : (
                <span style={{
                  fontSize: 8.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
                  padding: '3px 8px', borderRadius: 20, flexShrink: 0,
                  background: 'rgba(122,90,26,0.12)', color: '#7A5A1A',
                }}>শীঘ্রই</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
