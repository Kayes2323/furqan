export type BlockType = 'para' | 'heading' | 'subheading';

export interface ContentBlock {
  type: BlockType;
  text: string;
  /** Internal traceability — PDF page number in Ar-Raheeq Al-Makhtum Bangla edition */
  sourcePdfPage?: number;
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
  { id: 'part-1', number: 1, title: 'প্রেক্ষাপট' },
  { id: 'part-2', number: 2, title: 'জন্ম থেকে নবুওয়াত (৪০ বছর)' },
  { id: 'part-3', number: 3, title: 'নবুওয়াত ও মক্কী জীবন' },
  { id: 'part-4', number: 4, title: 'হিজরত ও মাদানী জীবন' },
  { id: 'part-5', number: 5, title: 'বিজয়ের পথে' },
  { id: 'part-6', number: 6, title: 'সমাপ্তি' },
];

export function getPart(id: string): SirahPart | undefined {
  return sirahParts.find((p) => p.id === id);
}
