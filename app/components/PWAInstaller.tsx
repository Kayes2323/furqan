'use client';
import { useEffect, useState } from 'react';

export default function PWAInstaller() {
  const [prompt, setPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    // Capture install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler as any);
    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, []);

  async function install() {
    if (!prompt) return;
    prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === 'accepted') setShow(false);
  }

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 90, left: 16, right: 16, zIndex: 999,
      background: 'linear-gradient(135deg, #1A3A4A, #1A5F7A)',
      borderRadius: 18, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(26,95,122,0.4)',
      animation: 'slideUp 0.3s ease',
    }}>
      <img src="/icon-72.png" style={{ width: 44, height: 44, borderRadius: 12 }} alt="icon" />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'white', fontFamily: 'Hind Siliguri' }}>
          FURQAN ইনস্টল করো
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontFamily: 'Hind Siliguri' }}>
          Home screen এ রাখো — offline এও চলবে
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setShow(false)} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none',
          color: 'white', padding: '6px 12px', borderRadius: 12,
          fontSize: 12, cursor: 'pointer', fontFamily: 'Hind Siliguri',
        }}>পরে</button>
        <button onClick={install} style={{
          background: 'white', border: 'none',
          color: '#1A5F7A', padding: '6px 14px', borderRadius: 12,
          fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Hind Siliguri',
        }}>ইনস্টল</button>
      </div>
    </div>
  );
}