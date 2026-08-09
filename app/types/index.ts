export type Screen = 'home' | 'tafsir' | 'nur' | 'research' | 'profile';

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  banglaName: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Ayah {
  number: number;
  text: string; // Arabic
  translation: string; // Bangla
  tafsir?: string; // Ibn Kathir simplified Bangla
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

export interface ChatMessage {
  role: 'user' | 'nur';
  content: string;
  refs?: string[];
}
