'use client';
import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import TafsirScreen from './components/TafsirScreen';
import NurScreen from './components/NurScreen';
import KnowledgeScreen from './components/KnowledgeScreen';
import ResearchScreen from './components/ResearchScreen';
import SirahJourneyScreen from './components/SirahJourneyScreen';
import SirahReadingScreen from './components/SirahReadingScreen';
import ProfileScreen from './components/ProfileScreen';
import BottomNav from './components/BottomNav';
import type { Screen } from './types';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [activeChapter, setActiveChapter] = useState<string>('ch-01');

  const openChapter = (chapterId: string) => {
    setActiveChapter(chapterId);
    setScreen('sirah-read');
  };

  const isReading = screen === 'sirah-read';

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
      <div style={{ flex: 1, overflowY: isReading ? 'hidden' : 'auto', overflowX: 'hidden' }}>
        {screen === 'home' && <HomeScreen onNavigate={setScreen} />}
        {screen === 'tafsir' && <TafsirScreen />}
        {screen === 'nur' && <NurScreen />}
        {screen === 'knowledge' && <KnowledgeScreen onNavigate={setScreen} />}
        {screen === 'research' && <ResearchScreen onNavigate={setScreen} />}
        {screen === 'sirah' && (
          <SirahJourneyScreen onNavigate={setScreen} onOpenChapter={openChapter} />
        )}
        {screen === 'sirah-read' && (
          <SirahReadingScreen
            chapterId={activeChapter}
            onBack={() => setScreen('sirah')}
            onOpenChapter={openChapter}
          />
        )}
        {screen === 'profile' && <ProfileScreen />}
      </div>

      {!isReading && <BottomNav current={screen} onNavigate={setScreen} />}
    </div>
  );
}
