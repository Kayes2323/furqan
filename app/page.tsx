'use client';
import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import TafsirScreen from './components/TafsirScreen';
import NurScreen from './components/NurScreen';
import KnowledgeScreen from './components/KnowledgeScreen';
import ResearchScreen from './components/ResearchScreen';
import ProfileScreen from './components/ProfileScreen';
import BottomNav from './components/BottomNav';
import type { Screen } from './types';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');

  return (
    <div style={{
      maxWidth: 430,
      margin: '0 auto',
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {screen === 'home' && <HomeScreen onNavigate={setScreen} />}
        {screen === 'tafsir' && <TafsirScreen />}
        {screen === 'nur' && <NurScreen />}
        {screen === 'knowledge' && <KnowledgeScreen onNavigate={setScreen} />}
        {screen === 'research' && <ResearchScreen />}
        {screen === 'sirah' && (
          <div style={{ padding: '52px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌙</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>সীরাত শীঘ্রই আসছে</div>
            <div style={{ fontSize: 13 }}>রাসূলুল্লাহ ﷺ-এর জীবনী নিয়ে কাজ চলছে</div>
          </div>
        )}
        {screen === 'profile' && <ProfileScreen />}
      </div>
      <BottomNav current={screen} onNavigate={setScreen} />
    </div>
  );
}