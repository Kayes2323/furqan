'use client';
import { useState, useEffect } from 'react';
import { sirahParts } from '../lib/sirah-types';
import { sirahChapters, getChaptersByPart, isPartReady } from '../lib/sirah-data';
import { getLastRead, getCompleted, getProgressPercent, type LastRead } from '../lib/sirah-progress';

interface Props {
  onBack: () => void;
  onOpenPart: (partId: string) => void;
  onOpenChapter: (chapterId: string) => void;
}

export default function SirahJourneyScreen({ onBack, onOpenPart, onOpenChapter }: Props) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    setCompleted(getCompleted());
    setLastRead(getLastRead());
    setPercent(getProgressPercent(sirahChapters.length));
  }, []);

  return (
    <div style={{ paddingBottom: 30 }}>
      <div style={{
        background: 'linear-gradient(160deg, #2A1A0A 0%, #5A3A10 40%, #7A5A1A 100%)',
        padding: '52px 20px 24px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(60deg, rgba(201,168,76,.06) 0, rgba(201,168,76,.06) 1px, transparent 1px, transparent 20px),
                            repeating-linear-gradient(-60deg, rgba(201,168,76,.06) 0, rgba(201,168,76,.06) 1px, transparent 1px, transparent 20px)`,
        }} />
        <div style={{ position: 'absolute', right: -10, bottom: -20, fontFamily: 'Amiri, serif', fontSize: 130, color: 'rgba(201,168,76,.07)', lineHeight: 1 }}>سيرة</div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <button onClick={onBack} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)',
            color: '#fff', fontSize: 14, cursor: 'pointer', marginBottom: 16,
          }}>←</button>

          <div style={{ fontSize: 10, color: 'rgba(201,168,76,.8)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>সীরাতুন্নবী ﷺ</div>
          <div style={{ fontFamily: 'Amiri, serif', fontSize: 28, color: '#fff', marginBottom: 4 }}>আপনার যাত্রা</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginBottom: 20 }}>আর রাহীকুল মাখতূম অনুসরণে · ৬টি পর্ব</div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#C9A84C' }}>{percent}%</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>{completed.length} / {sirahChapters.length} অধ্যায়</div>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,.15)', borderRadius: 100 }}>
              <div style={{ height: '100%', borderRadius: 100, width: `${percent}%`, background: 'linear-gradient(90deg, #C9A84C, #E8C06A)', transition: 'width .6s ease' }} />
            </div>
          </div>

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

      <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sirahParts.map(part => {
          const chapters = getChaptersByPart(part.id);
          const ready = isPartReady(part.id);
          const doneInPart = chapters.filter(ch => completed.includes(ch.id)).length;
          const partPct = chapters.length > 0 ? Math.round((doneInPart / chapters.length) * 100) : 0;

          return (
            <div
              key={part.id}
              onClick={ready ? () => onOpenPart(part.id) : undefined}
              style={{
                borderRadius: 18, padding: 16, color: '#fff', position: 'relative', overflow: 'hidden',
                cursor: ready ? 'pointer' : 'default',
                opacity: ready ? 1 : 0.5,
                display: 'flex', alignItems: 'center', gap: 14,
                background: ready
                  ? 'linear-gradient(150deg, #2A1A0A, #7A5A1A)'
                  : 'linear-gradient(150deg, #2A1A0A, #5A3A10)',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Amiri, serif', fontSize: 17,
              }}>{part.number}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{part.title}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{part.subtitle}</div>
                <div style={{ fontSize: 9.5, opacity: 0.6, marginTop: 4 }}>
                  {chapters.length}টি অধ্যায় {ready ? `· ${doneInPart}/${chapters.length} পড়া হয়েছে` : '· শীঘ্রই আসছে'}
                </div>
                {ready && (
                  <div style={{ height: 3, background: 'rgba(255,255,255,.15)', borderRadius: 10, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${partPct}%`, background: 'linear-gradient(90deg, #C9A84C, #E8C06A)' }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
