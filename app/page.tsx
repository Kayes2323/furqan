'use client';

import { Suspense, useRef } from 'react';
import HomeScreen from './components/HomeScreen';
import TafsirScreen from './components/TafsirScreen';
import NurScreen from './components/NurScreen';
import KnowledgeScreen from './components/KnowledgeScreen';
import ResearchScreen from './components/ResearchScreen';
import SirahJourneyScreen from './components/SirahJourneyScreen';
import SirahReadingScreen from './components/SirahReadingScreen';
import ProfileScreen from './components/ProfileScreen';
import BottomNav from './components/BottomNav';
import { useAppNavigation } from './hooks/useAppNavigation';

function AppShell() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    screen,
    surahNumber,
    chapterId,
    navigateScreen,
    back,
    openSurah,
    openChapter,
  } = useAppNavigation(scrollRef);

  const isReading = screen === 'sirah-read';

  return (
    <div style={{
      maxWidth: 430,
      width: '100%',
      margin: '0 auto',
      height: '100dvh',
      maxHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: isReading ? 'hidden' : 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {screen === 'home' && <HomeScreen onNavigate={navigateScreen} />}
        {screen === 'tafsir' && (
          <TafsirScreen
            surahNumber={surahNumber}
            onOpenSurah={openSurah}
            onBack={back}
          />
        )}
        {screen === 'nur' && <NurScreen />}
        {screen === 'knowledge' && <KnowledgeScreen onNavigate={navigateScreen} />}
        {screen === 'research' && <ResearchScreen onBack={back} />}
        {screen === 'sirah' && (
          <SirahJourneyScreen onBack={back} onOpenChapter={openChapter} />
        )}
        {screen === 'sirah-read' && (
          <SirahReadingScreen
            chapterId={chapterId}
            onBack={back}
            onOpenChapter={openChapter}
          />
        )}
        {screen === 'profile' && <ProfileScreen />}
      </div>

      {!isReading && <BottomNav current={screen} onNavigate={navigateScreen} />}
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={null}>
      <AppShell />
    </Suspense>
  );
}
