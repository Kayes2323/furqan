// ═══════════════════════════════════════════
// FURQAN — Sirah Content Data
// Source: Ar-Raheeq Al-Makhtum
// ═══════════════════════════════════════════

export type BlockType = 'para' | 'heading' | 'subheading';

export interface ContentBlock {
  type: BlockType;
  text: string;
}

export interface SirahSection {
  id: string;
  title: string;
  blocks: ContentBlock[];
}

export interface SirahChapter {
  id: string;
  number: number;
  title: string;
  subtitle?: string;
  sections: SirahSection[];
}

export const sirahChapters: SirahChapter[] = [
  {
    id: 'ch-01',
    number: 1,
    title: 'আরবের ভৌগোলিক ও সামাজিক প্রেক্ষাপট',
    subtitle: 'আরব জাতি, গোত্র ও তাদের অবস্থান',
    sections: [
      {
        id: 'ch-01-s-01',
        title: 'আরব গোত্রসমূহের অবস্থান',
        blocks: [
          { type: 'para', text: 'এই অধ্যায়ের content এখনো যোগ করা হয়নি।' },
        ],
      },
    ],
  },
  {
    id: 'ch-02',
    number: 2,
    title: 'আরবের শাসনব্যবস্থা',
    subtitle: 'বাদশাহী ও গোত্রীয় নেতৃত্ব',
    sections: [
      {
        id: 'ch-02-s-01',
        title: 'আরবের প্রশাসনিক অবস্থা',
        blocks: [
          { type: 'para', text: 'এই অধ্যায়ের content এখনো যোগ করা হয়নি।' },
        ],
      },
    ],
  },
  {
    id: 'ch-03',
    number: 3,
    title: 'নবী পরিবারের পরিচয়',
    subtitle: 'বংশধারা ও পূর্বপুরুষ',
    sections: [
      {
        id: 'ch-03-s-01',
        title: 'বংশ পরিচয়',
        blocks: [
          { type: 'para', text: 'এই অধ্যায়ের content এখনো যোগ করা হয়নি।' },
        ],
      },
    ],
  },
  {
    id: 'ch-04',
    number: 4,
    title: 'জন্ম ও শৈশব',
    subtitle: 'চল্লিশ বছর পর্যন্ত জীবন',
    sections: [
      {
        id: 'ch-04-s-01',
        title: 'জন্ম',
        blocks: [
          { type: 'para', text: 'এই অধ্যায়ের content এখনো যোগ করা হয়নি।' },
        ],
      },
    ],
  },
  {
    id: 'ch-05',
    number: 5,
    title: 'নবুওয়াতের সূচনা',
    subtitle: 'হেরা গুহা ও প্রথম ওহী',
    sections: [
      {
        id: 'ch-05-s-01',
        title: 'হেরা গুহায়',
        blocks: [
          { type: 'para', text: 'এই অধ্যায়ের content এখনো যোগ করা হয়নি।' },
        ],
      },
    ],
  },
];

export function getChapter(id: string): SirahChapter | undefined {
  return sirahChapters.find((c) => c.id === id);
}

export function getChapterIndex(id: string): number {
  return sirahChapters.findIndex((c) => c.id === id);
}

export function getNextChapter(id: string): SirahChapter | undefined {
  const i = getChapterIndex(id);
  return i >= 0 && i < sirahChapters.length - 1 ? sirahChapters[i + 1] : undefined;
}

export function getPrevChapter(id: string): SirahChapter | undefined {
  const i = getChapterIndex(id);
  return i > 0 ? sirahChapters[i - 1] : undefined;
}
