export type BlockType = 'para' | 'heading' | 'subheading' | 'image';

export interface ContentBlock {
  type: BlockType;
  /** Body text for para/heading/subheading; caption text for image */
  text: string;
  /** Internal traceability — PDF page number in Ar-Raheeq Al-Makhtum Bangla edition */
  sourcePdfPage?: number;
  /** image blocks only — path under /public, e.g. '/images/sirah/genealogy-ismail-adnan-muhammad.jpg' */
  src?: string;
  /** image blocks only — accessible alt text, distinct from the visible caption */
  alt?: string;
}

export interface SirahSection {
  id: string;
  title: string;
  blocks: ContentBlock[];
  /** First PDF page this section draws from */
  sourcePdfStart?: number;
  /** Last PDF page this section draws from */
  sourcePdfEnd?: number;
}

export interface SirahPart {
  id: string;
  number: number;
  title: string;
  subtitle: string;
}

export interface SirahChapter {
  id: string;
  number: number;
  title: string;
  subtitle?: string;
  partId: string;
  sections: SirahSection[];
  /** Source attribution */
  source?: {
    book: string;
    edition: string;
    pdfPageStart: number;
    pdfPageEnd: number;
  };
}

export const sirahParts: SirahPart[] = [
  { id: 'part-1', number: 1, title: 'প্রেক্ষাপট', subtitle: 'ইসলামপূর্ব আরবের ভূগোল, রাজনীতি ও সমাজ' },
  { id: 'part-2', number: 2, title: 'জন্ম থেকে নবুওয়াত (৪০ বছর)', subtitle: 'শৈশব থেকে নবুওয়াতপ্রাপ্তি পর্যন্ত' },
  { id: 'part-3', number: 3, title: 'নবুওয়াত ও মক্কী জীবন', subtitle: 'ওহী থেকে হিজরত পর্যন্ত মক্কার জীবন' },
  { id: 'part-4', number: 4, title: 'হিজরত ও মাদানী জীবন', subtitle: 'মদিনায় নতুন সমাজ ও প্রতিরক্ষা যুদ্ধসমূহ' },
  { id: 'part-5', number: 5, title: 'বিজয়ের পথে', subtitle: 'খাইবার থেকে মক্কা বিজয় পর্যন্ত' },
  { id: 'part-6', number: 6, title: 'সমাপ্তি', subtitle: 'বিদায় হজ্জ থেকে ইন্তেকাল পর্যন্ত' },
];

export function getPart(id: string): SirahPart | undefined {
  return sirahParts.find((p) => p.id === id);
}
