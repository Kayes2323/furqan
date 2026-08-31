'use client';
import { useState, useEffect } from 'react';
import { sirahChapters } from '../lib/sirah-data';
import { getLastRead, getCompleted, getProgressPercent, type LastRead } from '../lib/sirah-progress';
import type { Screen } from '../types';

interface Props {
  onNavigate: (s: Screen) => void;
  onOpenChapter: (chapterId: string) => void;
}

export default function SirahJourneyScreen({ onNavigate, onOpenChapter }: Props) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    setCompleted(getCompleted());
    setLastRead(getLastRead());
    setPercent(getProgressPercent(sirahChapters.length));
  }, []);

  const currentId = lastRead?.chapterId ?? sirahChapters[0]?.id;

  return (
    <div style={{ paddingBottom: 20 }}>

      <div style={{
        background: 'linear-gradient(160deg, #2A1A0A 0%, #5A3A10 40%, #7A5A1A 100%)',
        padding: '52px 20px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(60deg, rgba(201,168,76,.06) 0, rgba(201,168,76,.06) 1px, transparent 1px, transparent 20px),
                            repeating-linear-gradient(-60deg, rgba(201,168,76,.06) 0, rgba(201,168,76,.06) 1px, transparent 1px, transparent 20px)`,
        }} />
        <div style={{
          position: 'absolute', right: -10, bottom: -20,
          fontFamily: 'Amiri, serif', fontSize: 130,
          color: 'rgba(201,168,76,.07)', lineHeight: 1,
        }}>سيرة</div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <button onClick={() => onNavigate('knowledge')} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)',
            color: '#fff', fontSize: 14, cursor: 'pointer', marginBottom: 16,
          }}>←</button>

          <div style={{ fontSize: 10, color: 'rgba(201,168,76,.8)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>
            সীরাতুন্নবী ﷺ
          </div>
          <div style={{ fontFamily: 'Amiri, serif', fontSize: 28, color: '#fff', marginBottom: 4 }}>
            আপনার যাত্রা
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginBottom: 20 }}>
            আর রাহীকুল মাখতূম অনুসরণে
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#C9A84C' }}>{percent}%</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
                {completed.length} / {sirahChapters.length} অধ্যায় সম্পন্ন
              </div>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,.15)', borderRadius: 100 }}>
              <div style={{
                height: '100%', borderRadius: 100, width: `${percent}%`,
                background: 'linear-gradient(90deg, #C9A84C, #E8C06A)',
                transition: 'width .6s ease',
              }} />
            </div>
          </div>

          {lastRead && (
            <div onClick={() => onOpenChapter(lastRead.chapterId)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)',
              borderRadius: 14, padding: '12px 16px', cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, background: '#C9A84C', borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                }}>▶</div>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 2 }}>
                    যেখানে ছিলেন
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                    অধ্যায় {lastRead.chapterNumber} — {lastRead.chapterTitle}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: 18, color: '#C9A84C' }}>→</span>
            </div>
          )}
        </div>
      </div>

      <div style={{
        padding: '20px 20px 10px', fontSize: 10, fontWeight: 700,
        color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase',
      }}>
        অধ্যায়সমূহ
      </div>

      <div style={{ padding: '0 20px' }}>
        {sirahChapters.map((ch, idx) => {
          const done = completed.includes(ch.id);
          const isCurrent = ch.id === currentId && !done;
          const isLast = idx === sirahChapters.length - 1;

          return (
            <div key={ch.id} onClick={() => onOpenChapter(ch.id)}
              style={{ display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer' }}>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40, flexShrink: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, border: '2px solid transparent',
                  background: done ? '#1B7A4A' : isCurrent ? '#C9A84C' : 'var(--card)',
                  color: done ? '#fff' : isCurrent ? '#1A1A2E' : 'var(--text-muted)',
                  borderColor: done ? '#1B7A4A' : isCurrent ? '#C9A84C' : 'var(--border)',
                  boxShadow: isCurrent ? '0 0 0 4px rgba(201,168,76,.2)' : 'none',
                }}>
                  {done ? '✓' : ch.number}
                </div>
                {!isLast && (
                  <div style={{
                    width: 2, flex: 1, minHeight: 20, margin: '4px 0',
                    background: done ? 'rgba(27,122,74,.3)' : 'var(--border)',
                  }} />
                )}
              </div>

              <div style={{ flex: 1, paddingBottom: 18, paddingTop: 8 }}>
                <div style={{
                  fontSize: 10, color: 'var(--text-muted)',
                  letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2,
                }}>
                  অধ্যায় {ch.number}{isCurrent ? ' · আপনি এখানে' : ''}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                  {ch.title}
                </div>
                {ch.subtitle && (
                  <div style={{ fontSize: 12, color: 'var(--text-dim, #4A5568)', lineHeight: 1.5, marginBottom: 8 }}>
                    {ch.subtitle}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {ch.sections.length}টি অংশ
                  </span>
                  <span style={{
                    fontSize: 9, padding: '2px 8px', borderRadius: 20,
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px',
                    background: done ? 'rgba(27,122,74,.10)' : isCurrent ? 'rgba(201,168,76,.12)' : 'rgba(26,95,122,.08)',
                    color: done ? '#1B7A4A' : isCurrent ? '#8B6914' : 'var(--accent)',
                  }}>
                    {done ? 'সম্পন্ন' : isCurrent ? 'চলমান' : 'পড়ুন'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
