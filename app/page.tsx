'use client';
import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import TafsirScreen from './components/TafsirScreen';
import NurScreen from './components/NurScreen';
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
        {screen === 'research' && <ResearchScreen />}
        {screen === 'profile' && <ProfileScreen />}
      </div>
      <BottomNav current={screen} onNavigate={setScreen} />
    </div>
  );
}
