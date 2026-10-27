'use client';

import { Suspense, useRef, useState } from 'react';
import HomeScreen from './components/HomeScreen';
import NurScreen from './components/NurScreen';
import KnowledgeScreen from './components/KnowledgeScreen';
import ResearchScreen from './components/ResearchScreen';
import SirahJourneyScreen from './components/SirahJourneyScreen';
import SirahChapterListScreen from './components/SirahChapterListScreen';
import SirahReadingScreen from './components/SirahReadingScreen';
import QiblaScreen from './components/QiblaScreen';
import ZikrScreen from './components/ZikrScreen';
import ZikrSectionScreen from './components/ZikrSectionScreen';
import ZikrReadingScreen from './components/ZikrReadingScreen';
import ZikrTrackerScreen from './components/ZikrTrackerScreen';
import ReaderScreen from './components/ReaderScreen';
import ReaderSurahScreen from './components/ReaderSurahScreen';
import ReaderSearchScreen from './components/ReaderSearchScreen';
import ReaderBookmarksScreen from './components/ReaderBookmarksScreen';
import KhatmScreen from './components/KhatmScreen';
import KhatmSetupScreen from './components/KhatmSetupScreen';
import NazeraScreen from './components/NazeraScreen';
import NazeraSetupScreen from './components/NazeraSetupScreen';
import ReciteScreen from './components/ReciteScreen';
import QuranHubScreen from './components/QuranHubScreen';
import QuranTopicsScreen from './components/QuranTopicsScreen';
import TopicDetailScreen from './components/TopicDetailScreen';
import ImportantSurahDetailScreen from './components/ImportantSurahDetailScreen';
import ProfileScreen from './components/ProfileScreen';
import BottomNav from './components/BottomNav';
import SplashScreen from './components/SplashScreen';
import ReaderDesktopShell from './components/ReaderDesktopShell';
import { ThemeProvider } from './lib/theme';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useIsDesktop } from './hooks/useViewport';

const READER_GROUP_SCREENS = ['reader', 'reader-surah', 'reader-search', 'reader-bookmarks'];

function AppShell() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showSplash, setShowSplash] = useState(true);
  const {
    screen,
    chapterId,
    partId,
    zikrSectionId,
    zikrItemId,
    readerSurahNumber,
    readerAyahNumber,
    topicId,
    importantId,
    navigateScreen,
    back,
    openChapter,
    openPart,
    openZikrSection,
    openZikrReading,
    openZikrTracker,
    openReader,
    openReaderSurah,
    openReaderSearch,
    openReaderBookmarks,
    openKhatm,
    openKhatmSetup,
    openNazera,
    openNazeraSetup,
    openTopicDetail,
    openImportantDetail,
  } = useAppNavigation(scrollRef);

  const isDesktop = useIsDesktop();
  const isReading = screen === 'sirah-read' || screen === 'zikr-read' || screen === 'reader-surah';

  if (isDesktop && READER_GROUP_SCREENS.includes(screen)) {
    return (
      <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <ReaderDesktopShell
        screen={screen}
        readerSurahNumber={readerSurahNumber}
        onBack={back}
        onHome={() => navigateScreen('home')}
        onOpenReaderHome={openReader}
        onOpenSurah={openReaderSurah}
        onOpenSearch={openReaderSearch}
        onOpenBookmarks={openReaderBookmarks}
      >
        {({ prefs, onPrefsChange }) => (
          <>
            {screen === 'reader' && (
              <ReaderScreen
                onBack={back}
                onOpenSurah={openReaderSurah}
                onOpenSearch={openReaderSearch}
                onOpenBookmarks={openReaderBookmarks}
              />
            )}
            {screen === 'reader-surah' && (
              <ReaderSurahScreen
                surahNumber={readerSurahNumber}
                targetAyah={readerAyahNumber}
                onBack={back}
                onOpenSurah={openReaderSurah}
                prefs={prefs}
                onPrefsChange={onPrefsChange}
              />
            )}
            {screen === 'reader-search' && (
              <ReaderSearchScreen onBack={back} onOpenSurah={openReaderSurah} />
            )}
            {screen === 'reader-bookmarks' && (
              <ReaderBookmarksScreen onBack={back} onOpenSurah={openReaderSurah} />
            )}
          </>
        )}
      </ReaderDesktopShell>
      </>
    );
  }

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
        {screen === 'nur' && <NurScreen />}
        {screen === 'knowledge' && <KnowledgeScreen onNavigate={navigateScreen} />}
        {screen === 'research' && <ResearchScreen onBack={back} />}
        {screen === 'sirah' && (
          <SirahJourneyScreen onBack={back} onOpenPart={openPart} onOpenChapter={openChapter} />
        )}
        {screen === 'sirah-part' && (
          <SirahChapterListScreen partId={partId} onBack={back} onOpenChapter={openChapter} />
        )}
        {screen === 'sirah-read' && (
          <SirahReadingScreen
            chapterId={chapterId}
            onBack={back}
            onOpenChapter={openChapter}
            onOpenPart={openPart}
          />
        )}
        {screen === 'qibla' && <QiblaScreen onBack={back} />}
        {screen === 'zikr' && <ZikrScreen onOpenSection={openZikrSection} onOpenTracker={openZikrTracker} />}
        {screen === 'zikr-section' && (
          <ZikrSectionScreen sectionId={zikrSectionId} onBack={back} onOpenReading={openZikrReading} onOpenSurah={openReaderSurah} />
        )}
        {screen === 'zikr-read' && (
          <ZikrReadingScreen sectionId={zikrSectionId} itemId={zikrItemId} onBack={back} onOpenSurah={openReaderSurah} />
        )}
        {screen === 'zikr-tracker' && <ZikrTrackerScreen onBack={back} />}
        {screen === 'reader' && (
          <ReaderScreen
            onBack={back}
            onOpenSurah={openReaderSurah}
            onOpenSearch={openReaderSearch}
            onOpenBookmarks={openReaderBookmarks}
          />
        )}
        {screen === 'reader-surah' && (
          <ReaderSurahScreen
            surahNumber={readerSurahNumber}
            targetAyah={readerAyahNumber}
            onBack={back}
            onOpenSurah={openReaderSurah}
          />
        )}
        {screen === 'reader-search' && (
          <ReaderSearchScreen onBack={back} onOpenSurah={openReaderSurah} />
        )}
        {screen === 'reader-bookmarks' && (
          <ReaderBookmarksScreen onBack={back} onOpenSurah={openReaderSurah} />
        )}
        {screen === 'khatm' && (
          <KhatmScreen onBack={back} onOpenSetup={openKhatmSetup} onOpenReaderSurah={openReaderSurah} />
        )}
        {screen === 'khatm-setup' && (
          <KhatmSetupScreen onBack={openKhatm} onDone={openKhatm} />
        )}
        {screen === 'nazera' && (
          <NazeraScreen onBack={back} onOpenSetup={openNazeraSetup} onOpenReaderSurah={openReaderSurah} />
        )}
        {screen === 'nazera-setup' && (
          <NazeraSetupScreen onBack={openNazera} onDone={openNazera} />
        )}
        {screen === 'recite' && <ReciteScreen onBack={back} />}
        {screen === 'quran-hub' && <QuranHubScreen onNavigate={navigateScreen} onBack={back} />}
        {screen === 'quran-topics' && (
          <QuranTopicsScreen onBack={back} onOpenTopic={openTopicDetail} onOpenImportant={openImportantDetail} />
        )}
        {screen === 'topic-detail' && (
          <TopicDetailScreen topicId={topicId} onBack={back} onOpenReaderSurah={openReaderSurah} />
        )}
        {screen === 'important-detail' && (
          <ImportantSurahDetailScreen importantId={importantId} onBack={back} onOpenReaderSurah={openReaderSurah} />
        )}
        {screen === 'profile' && <ProfileScreen />}
      </div>

      {!isReading && <BottomNav current={screen} onNavigate={navigateScreen} />}

      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Suspense fallback={null}>
        <AppShell />
      </Suspense>
    </ThemeProvider>
  );
}
