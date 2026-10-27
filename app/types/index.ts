export type Screen =
  | 'home'
  | 'nur'
  | 'knowledge'
  | 'research'
  | 'sirah'
  | 'sirah-part'
  | 'sirah-read'
  | 'qibla'
  | 'zikr'
  | 'zikr-section'
  | 'zikr-read'
  | 'zikr-tracker'
  | 'reader'
  | 'reader-surah'
  | 'reader-search'
  | 'reader-bookmarks'
  | 'quran-journey'
  | 'khatm-setup'
  | 'nazera-setup'
  | 'recite'
  | 'quran-hub'
  | 'quran-topics'
  | 'topic-detail'
  | 'important-detail'
  | 'sunnah-life'
  | 'sunnah-life-areas'
  | 'sunnah-life-area-detail'
  | 'sunnah-practice-detail'
  | 'profile';

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  banglaName: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface ResearchCategory {
  id: string;
  icon: string;
  name: string;
  featuredAyah: {
    arabic: string;
    bangla: string;
    ref: string;
  };
  topics: string[];
}

export interface NurRef {
  surah: number;
  ayah: number;
  label: string; // e.g. "সূরা আল-বাকারা ২:২৫৫"
}

export interface NurSource {
  id: string;
  title: string;
  authorAttribution: string;
  translatorEditorPublisher: string;
  language: 'ar' | 'bn';
}

export interface ChatMessage {
  role: 'user' | 'nur';
  content: string;
  refs?: NurRef[];
  sources?: NurSource[];
}
