'use client';
import { useEffect, useState } from 'react';

const DURATION = 3000;

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [hide, setHide] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const startTimer = requestAnimationFrame(() => setLoaded(true));
    const hideTimer = setTimeout(() => setHide(true), DURATION);
    const doneTimer = setTimeout(onDone, DURATION + 500);
    return () => {
      cancelAnimationFrame(startTimer);
      clearTimeout(hideTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1000,
        overflow: 'hidden',
        color: '#fff',
        opacity: hide ? 0 : 1,
        pointerEvents: hide ? 'none' : 'auto',
        transition: 'opacity 0.6s ease',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/images/splash-madina.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 38%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(8,18,12,0.4) 0%, rgba(8,18,12,0.05) 24%, rgba(8,18,12,0.22) 56%, rgba(6,14,10,0.9) 100%)',
        }}
      />
      <div style={{ position: 'absolute', top: '29%', left: 0, right: 0, zIndex: 2, textAlign: 'center', padding: '0 20px' }}>
        <div style={{ fontFamily: 'Marcellus, serif', fontSize: 37, letterSpacing: 7, textShadow: '0 2px 20px rgba(0,0,0,0.45)' }}>
          FURQAN
        </div>
        <div style={{ fontFamily: 'Hind Siliguri, sans-serif', fontSize: 13.5, fontWeight: 500, color: '#E4C878', marginTop: 10, textShadow: '0 1px 10px rgba(0,0,0,0.5)' }}>
          সত্য মিথ্যার পার্থক্যকারী
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 36, zIndex: 2, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Hind Siliguri, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: 2, color: 'rgba(255,255,255,0.88)', marginBottom: 16 }}>
          জ্ঞান &nbsp;·&nbsp; অন্বেষণ &nbsp;·&nbsp; আমল
        </div>
        <div style={{ width: 110, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.22)', margin: '0 auto', overflow: 'hidden' }}>
          <div
            style={{
              display: 'block',
              height: '100%',
              width: loaded ? '100%' : '0%',
              background: 'linear-gradient(90deg, #E4C878, #fff)',
              borderRadius: 2,
              transition: `width ${DURATION - 100}ms ease`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
