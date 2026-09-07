'use client';
import { useState, useEffect } from 'react';
import { sirahChapters } from '../lib/sirah-data';
import { getLastRead, getCompleted, getProgressPercent, getScroll, type LastRead } from '../lib/sirah-progress';
import type { Screen } from '../types';

interface Props {
  onNavigate: (s: Screen) => void;
  onOpenChapter: (chapterId: string) => void;
}

export default function SirahJourneyScreen({ onNavigate, onOpenChapter }: Props) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [percent, setPercent] = useState(0);
  const [scrollMap, setScrollMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const done = getCompleted();
    setCompleted(done);
    setLastRead(getLastRead());
    setPercent(getProgressPercent(sirahChapters.length));

    // Chapter গুলোর scroll position থেকে reading progress বের করি
    const map: Record<string, number> = {};
    sirahChapters.forEach(ch => {
      const s = getScroll(ch.id);
      map[ch.id] = s;
    });
    setScrollMap(map);
  }, []);

  const currentId = lastRead?.chapterId ?? sirahChapters[0]?.id;

  // Part grouping
  const parts = [
    { label: 'Part 1 — প্রেক্ষাপট', ids: ['ch-01', 'ch-02', 'ch-03', 'ch-04'] },
    { label: 'Part 2 — নবুওয়াত ও মক্কী জীবন', ids: ['ch-05'] },
  ];

  return (
    <div style={{ paddingBottom: 30 }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #2A1A0A 0%, #5A3A10 40%, #7A5A1A 100%)',
        padding: '52px 20px 24px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(60deg, rgba(201,168,76,.06) 0, rgba(201,168,76,.06) 1px, transparent 1px, transparent 20px),
                            repeating-linear-gradient(-60deg, rgba(201,168,76,.06) 0, rgba(201,168,76,.06) 1px, transparent 1px, transparent 20px)`,
        }} />
        <div style={{ position: 'absolute', right: -10, bottom: -20, fontFamily: 'Amiri, serif', fontSize: 130, color: 'rgba(201,168,76,.07)', lineHeight: 1 }}>سيرة</div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <button onClick={() => onNavigate('knowledge')} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)',
            color: '#fff', fontSize: 14, cursor: 'pointer', marginBottom: 16,
          }}>←</button>

          <div style={{ fontSize: 10, color: 'rgba(201,168,76,.8)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>সীরাতুন্নবী ﷺ</div>
          <div style={{ fontFamily: 'Amiri, serif', fontSize: 28, color: '#fff', marginBottom: 4 }}>আপনার যাত্রা</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginBottom: 20 }}>আর রাহীকুল মাখতূম অনুসরণে</div>

          {/* Progress */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#C9A84C' }}>{percent}%</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>{completed.length} / {sirahChapters.length} অধ্যায়</div>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,.15)', borderRadius: 100 }}>
              <div style={{ height: '100%', borderRadius: 100, width: `${percent}%`, background: 'linear-gradient(90deg, #C9A84C, #E8C06A)', transition: 'width .6s ease' }} />
            </div>
          </div>

          {/* Continue */}
          {lastRead && (
            <div onClick={() => onOpenChapter(lastRead.chapterId)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)',
              borderRadius: 14, padding: '12px 16px', cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, background: '#C9A84C', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>▶</div>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 2 }}>যেখানে ছিলেন</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>অধ্যায় {lastRead.chapterNumber} — {lastRead.chapterTitle}</div>
                </div>
              </div>
              <span style={{ fontSize: 18, color: '#C9A84C' }}>→</span>
            </div>
          )}
        </div>
      </div>

      {/* Chapter list — banner card style */}
      {parts.map(part => {
        const chapters = sirahChapters.filter(ch => part.ids.includes(ch.id));
        if (chapters.length === 0) return null;
        return (
          <div key={part.label}>
            <div style={{
              padding: '20px 20px 10px',
              fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
              letterSpacing: 2, textTransform: 'uppercase',
            }}>
              {part.label}
            </div>

            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {chapters.map(ch => {
                const isCurrent = ch.id === currentId;
                const scrollY = scrollMap[ch.id] || 0;
                // Reading progress approximation from saved scroll (0-100)
                // We store raw scroll, estimate % from a rough max
                const readPct = Math.min(Math.round((scrollY / 3000) * 100), 99);
                const hasStarted = scrollY > 50;
                const isBookmarked = hasStarted;

                return (
                  <div key={ch.id} onClick={() => onOpenChapter(ch.id)} style={{
                    background: 'var(--card)',
                    border: isCurrent ? '1.5px solid rgba(201,168,76,0.5)' : '1.5px solid var(--border)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: isCurrent ? '0 4px 20px rgba(201,168,76,0.12)' : '0 2px 8px rgba(26,95,122,0.05)',
                  }}>
                    {/* Progress bar at top of card */}
                    {hasStarted && (
                      <div style={{ height: 3, background: 'var(--border)' }}>
                        <div style={{
                          height: '100%',
                          width: `${readPct}%`,
                          background: isCurrent
                            ? 'linear-gradient(90deg, #C9A84C, #E8C06A)'
                            : 'var(--accent)',
                          transition: 'width .4s',
                        }} />
                      </div>
                    )}

                    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Chapter number badge */}
                      <div style={{
                        width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 14,
                        background: isCurrent ? '#C9A84C' : 'rgba(26,95,122,0.08)',
                        color: isCurrent ? '#1A1A2E' : 'var(--accent)',
                      }}>
                        {ch.number}
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 14, fontWeight: 700,
                          color: 'var(--text)',
                          marginBottom: 3,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {ch.title}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {ch.subtitle}
                        </div>
                      </div>

                      {/* Right side — bookmark or arrow */}
                      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        {isBookmarked ? (
                          <>
                            <span style={{ fontSize: 16, color: '#C9A84C' }}>🔖</span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                              {readPct}%
                            </span>
                          </>
                        ) : (
                          <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>›</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Remaining chapters without part grouping */}
      {(() => {
        const groupedIds = parts.flatMap(p => p.ids);
        const remaining = sirahChapters.filter(ch => !groupedIds.includes(ch.id));
        if (remaining.length === 0) return null;
        return (
          <div>
            <div style={{ padding: '20px 20px 10px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
              আরও অধ্যায়
            </div>
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {remaining.map(ch => (
                <div key={ch.id} onClick={() => onOpenChapter(ch.id)} style={{
                  background: 'var(--card)', border: '1.5px solid var(--border)',
                  borderRadius: 16, padding: '14px 16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 14,
                    background: 'rgba(26,95,122,0.08)', color: 'var(--accent)',
                  }}>{ch.number}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{ch.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{ch.subtitle}</div>
                  </div>
                  <span style={{ fontSize: 16, color: 'var(--text-muted)', flexShrink: 0 }}>›</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
