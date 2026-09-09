import type { SirahChapter } from './sirah-types';
import { ch01Chapter } from './sirah-content/part1/ch-01';
import { ch02Chapter } from './sirah-content/part1/ch-02';
import { ch03Chapter } from './sirah-content/part1/ch-03';
import { ch04Chapter } from './sirah-content/part1/ch-04';
import { ch05Chapter } from './sirah-content/part1/ch-05';
import { ch06Chapter } from './sirah-content/part2/ch-06';
import { ch07Chapter } from './sirah-content/part2/ch-07';
import { ch08Chapter } from './sirah-content/part2/ch-08';
import { ch09Chapter } from './sirah-content/part2/ch-09';
import { ch10Chapter } from './sirah-content/part2/ch-10';
import { ch11Chapter } from './sirah-content/part3/ch-11';
import { ch12Chapter } from './sirah-content/part3/ch-12';
import { ch13Chapter } from './sirah-content/part3/ch-13';
import { ch14Chapter } from './sirah-content/part3/ch-14';
import { ch16Chapter } from './sirah-content/part3/ch-16';
import { ch17Chapter } from './sirah-content/part3/ch-17';
import { ch18Chapter } from './sirah-content/part3/ch-18';

export type { BlockType, ContentBlock, SirahSection, SirahChapter, SirahPart } from './sirah-types';
export { sirahParts, getPart } from './sirah-types';

const PLACEHOLDER = 'এই অধ্যায়ের মূল পাঠ্য এখনো সংযোজন করা হয়নি।';

function placeholderChapter(
  id: string,
  number: number,
  title: string,
  subtitle: string,
  partId: string,
): SirahChapter {
  return {
    id,
    number,
    title,
    subtitle,
    partId,
    sections: [{
      id: `${id}-s-01`,
      title: 'শীঘ্রই আসছে',
      blocks: [{ type: 'para', text: PLACEHOLDER }],
    }],
  };
}

/** PART 1 — integrated from Ar-Raheeq Al-Makhtum PDF pp. 32–70 (chapter 5 now extends through Abdullah's death, p. 70) */
const part1Chapters: SirahChapter[] = [
  ch01Chapter,
  ch02Chapter,
  ch03Chapter,
  ch04Chapter,
  ch05Chapter,
];

/** PART 2 — integrated from Ar-Raheeq Al-Makhtum PDF pp. 71–80 (birth through the eve of prophethood) */
const part2Chapters: SirahChapter[] = [
  ch06Chapter,
  ch07Chapter,
  ch08Chapter,
  ch09Chapter,
  ch10Chapter,
];

/** PART 3 — integrated from Ar-Raheeq Al-Makhtum PDF pp. 82–166 (Hira cave through the Second Pledge of Aqaba and the start of the Hijrah); ch-15 (social boycott, pp. 122–129) is not yet written */
const part3Chapters: SirahChapter[] = [
  ch11Chapter,
  ch12Chapter,
  ch13Chapter,
  ch14Chapter,
  placeholderChapter('ch-15', 15, 'সামাজিক বয়কট', 'বয়কট ও শিবে আবি তালিব', 'part-3'),
  ch16Chapter,
  ch17Chapter,
  ch18Chapter,
];

/** PART 4–6 — structure ready, content pending */
const upcomingChapters: SirahChapter[] = [
  // PART 4
  placeholderChapter('ch-19', 19, 'হিজরত', 'আল্লাহর রসূলের হিজরত', 'part-4'),
  placeholderChapter('ch-20', 20, 'মদিনায় নতুন সমাজ', 'নতুন সমাজ ব্যবস্থার রূপায়ন', 'part-4'),
  placeholderChapter('ch-21', 21, 'বদরের যুদ্ধ', 'বদরের যুদ্ধ', 'part-4'),
  placeholderChapter('ch-22', 22, 'উহুদের যুদ্ধ', 'উহুদের যুদ্ধ', 'part-4'),
  placeholderChapter('ch-23', 23, 'বনু নাযির', 'বনু নাযীরের যুদ্ধ', 'part-4'),
  placeholderChapter('ch-24', 24, 'খন্দকের যুদ্ধ', 'খন্দকের যুদ্ধ', 'part-4'),
  placeholderChapter('ch-25', 25, 'বনু কুরাইজা', 'বনু কুরাইযার যুদ্ধ', 'part-4'),
  placeholderChapter('ch-26', 26, 'হুদায়বিয়ার সন্ধি', 'হোদায়বিয়ার সন্ধি', 'part-4'),
  placeholderChapter('ch-27', 27, 'বিশ্বনেতাদের কাছে চিঠি', 'বাদশাহ ও আমীরদের নামে চিঠি', 'part-4'),
  // PART 5
  placeholderChapter('ch-28', 28, 'খাইবার', 'খয়বরের যুদ্ধ', 'part-5'),
  placeholderChapter('ch-29', 29, 'মুতার যুদ্ধ', 'মুতায় যুদ্ধ', 'part-5'),
  placeholderChapter('ch-30', 30, 'মক্কা বিজয়', 'মহাবিজয়ের দ্বার প্রান্তে', 'part-5'),
  placeholderChapter('ch-31', 31, 'হুনাইনের যুদ্ধ', 'হোনাইনের যুদ্ধ', 'part-5'),
  placeholderChapter('ch-32', 32, 'তাবুকের অভিযান', 'তবুকের যুদ্ধ', 'part-5'),
  // PART 6
  placeholderChapter('ch-33', 33, 'বিদায় হজ্জ', 'বিদায় হজ্জ', 'part-6'),
  placeholderChapter('ch-34', 34, 'শেষ দিনগুলো', 'অন্তিম যাত্রার পথে মহানবী', 'part-6'),
  placeholderChapter('ch-35', 35, 'ইন্তেকাল', 'ইন্তেকাল ও কবর', 'part-6'),
];

export const sirahChapters: SirahChapter[] = [...part1Chapters, ...part2Chapters, ...part3Chapters, ...upcomingChapters];

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

export function getChaptersByPart(partId: string): SirahChapter[] {
  return sirahChapters.filter((c) => c.partId === partId);
}

/** True when a chapter is still the auto-generated "coming soon" stub, not real content. */
export function isChapterReady(chapter: SirahChapter): boolean {
  const blocks = chapter.sections[0]?.blocks;
  return !(chapter.sections.length === 1 && blocks?.length === 1 && blocks[0].text === PLACEHOLDER);
}

/** True when at least one chapter in a part has real content. */
export function isPartReady(partId: string): boolean {
  return getChaptersByPart(partId).some(isChapterReady);
}
