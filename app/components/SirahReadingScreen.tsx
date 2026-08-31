'use client';
import { useEffect, useRef, useState } from 'react';
import { getChapter, getNextChapter, getPrevChapter } from '../lib/sirah-data';
import { saveLastRead, markCompleted, saveScroll, getScroll } from '../lib/sirah-progress';
import BackButton from './BackButton';

interface Props {
  chapterId: string;
  onBack: () => void;
  onOpenChapter: (chapterId: string) => void;
}

const FONT_SIZES = [15, 16.5, 18, 20];

export default function SirahReadingScreen({ chapterId, onBack, onOpenChapter }: Props) {
  const chapter = getChapter(chapterId);
  const next = getNextChapter(chapterId);
  const prev = getPrevChapter(chapterId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [fontIdx, setFontIdx] = useState(1);

  useEffect(() => {
    if (!chapter) return;
    saveLastRead({
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      chapterNumber: chapter.number,
    });
  }, [chapter]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const saved = getScroll(chapterId);
    if (saved > 0) {
      requestAnimationFrame(() => { el.scrollTop = saved; });
    } else {
      el.scrollTop = 0;
    }
  }, [chapterId]);

  useEffect(() => {
    const saved = localStorage.getItem('furqan_sirah_font');
    if (saved) setFontIdx(parseInt(saved, 10));
  }, []);

  const cycleFont = () => {
    const nextIdx = (fontIdx + 1) % FONT_SIZES.length;
    setFontIdx(nextIdx);
    localStorage.setItem('furqan_sirah_font', String(nextIdx));
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const pct = max > 0 ? (el.scrollTop / max) * 100 : 0;
    setProgress(pct);
    saveScroll(chapterId, el.scrollTop);
    if (pct > 92) markCompleted(chapterId);
  };

  if (!chapter) {
    return (
      <div style={{ padding: '52px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        অধ্যায় পাওয়া যায়নি।
      </div>
    );
  }

  const fontSize = FONT_SIZES[fontIdx];

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>

      <div style={{
        height: 3, background: 'var(--border)',
        position: 'sticky', top: 0, zIndex: 50, flexShrink: 0,
      }}>
        <div style={{
          height: '100%', background: '#C9A84C',
          width: `${progress}%`, transition: 'width .1s',
        }} />
      </div>

      <div ref={scrollRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto' }}>

        <div style={{
          background: 'linear-gradient(160deg, #2A1A0A 0%, #7A5A1A 100%)',
          padding: '48px 22px 30px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -10, bottom: -30,
            fontFamily: 'Amiri, serif', fontSize: 150,
            color: 'rgba(201,168,76,.06)', lineHeight: 1,
          }}>سيرة</div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <BackButton onClick={onBack} variant="light" style={{ marginBottom: 20 }} />

            <div style={{
              fontSize: 11, color: 'rgba(201,168,76,.85)',
              letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8,
            }}>
              সীরাতুন্নবী ﷺ · অধ্যায় {chapter.number}
            </div>
            <h1 style={{
              fontFamily: 'Amiri, serif', fontSize: 28, color: '#fff',
              lineHeight: 1.3, marginBottom: 10, fontWeight: 700,
            }}>
              {chapter.title}
            </h1>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}>
              আর রাহীকুল মাখতূম
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 22px 40px' }}>
          {chapter.sections.map((section, si) => (
            <div key={section.id}>
              <h2 style={{
                fontFamily: 'Amiri, serif', fontSize: 21, color: 'var(--accent)',
                margin: si === 0 ? '0 0 18px' : '42px 0 18px',
                paddingBottom: 12, borderBottom: '2px solid rgba(26,95,122,.12)',
                fontWeight: 700,
              }}>
                {section.title}
              </h2>

              {section.blocks.map((block, bi) => {
                if (block.type === 'heading') {
                  return (
                    <h3 key={bi} style={{
                      fontSize: 18, fontWeight: 700, color: 'var(--text)',
                      margin: '30px 0 12px',
                    }}>{block.text}</h3>
                  );
                }
                if (block.type === 'subheading') {
                  return (
                    <h4 key={bi} style={{
                      fontSize: 16, fontWeight: 700, color: 'var(--text)',
                      margin: '24px 0 10px',
                    }}>{block.text}</h4>
                  );
                }
                return (
                  <p key={bi} style={{
                    fontSize, lineHeight: 2, color: 'var(--text-dim, #3D4757)',
                    marginBottom: 20, letterSpacing: '.1px',
                  }}>
                    {block.text}
                  </p>
                );
              })}
            </div>
          ))}

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '44px 0 28px', color: 'var(--text-muted)',
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontFamily: 'Amiri, serif', fontSize: 20, color: '#C9A84C' }}>۝</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
        </div>

        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 22px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {next && (
            <div onClick={() => onOpenChapter(next.id)} style={{
              background: 'var(--card)', border: '1.5px solid var(--border)',
              borderRadius: 16, padding: '16px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
            }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                  পরবর্তী অধ্যায়
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  {next.title}
                </div>
              </div>
              <span style={{ fontSize: 18, color: 'var(--accent)' }}>→</span>
            </div>
          )}

          {prev && (
            <div onClick={() => onOpenChapter(prev.id)} style={{
              textAlign: 'center', fontSize: 12, color: 'var(--accent)',
              fontWeight: 600, cursor: 'pointer', padding: 8,
            }}>
              ← আগের অধ্যায়: {prev.title}
            </div>
          )}

          <div onClick={onBack} style={{
            textAlign: 'center', fontSize: 12, color: 'var(--text-muted)',
            fontWeight: 600, cursor: 'pointer', padding: 8,
          }}>
            সীরাত যাত্রায় ফিরে যান
          </div>
        </div>
      </div>

      <button onClick={cycleFont} style={{
        position: 'absolute', bottom: 20, right: 18,
        width: 44, height: 44, borderRadius: '50%',
        background: 'var(--card)', border: '1.5px solid var(--border)',
        boxShadow: '0 4px 16px rgba(26,95,122,.15)',
        fontSize: 15, cursor: 'pointer', zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--accent)', fontWeight: 700,
      }}>
        Aa
      </button>
    </div>
  );
}
