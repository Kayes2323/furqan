import type { SirahChapter } from './sirah-types';
import { ch01Chapter } from './sirah-content/part1/ch-01';
import { ch02Chapter } from './sirah-content/part1/ch-02';
import { ch03Chapter } from './sirah-content/part1/ch-03';
import { ch04Chapter } from './sirah-content/part1/ch-04';
import { ch05Chapter } from './sirah-content/part1/ch-05';

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

/** PART 1 — integrated from Ar-Raheeq Al-Makhtum PDF pp. 32–64 */
const part1Chapters: SirahChapter[] = [
  ch01Chapter,
  ch02Chapter,
  ch03Chapter,
  ch04Chapter,
  ch05Chapter,
];

/** PART 2–6 — structure ready, content pending */
const upcomingChapters: SirahChapter[] = [
  // PART 2
  placeholderChapter('ch-06', 6, 'জন্ম ও শৈশব', 'আল্লাহর রসূলের আবির্ভাব', 'part-2'),
  placeholderChapter('ch-07', 7, 'হালিমার কাছে লালন', 'বনি সা\'দ গোত্রে অবস্থান', 'part-2'),
  placeholderChapter('ch-08', 8, 'বুহাইরা পাদ্রীর ঘটনা', 'পাদ্রী বুহাইরা ও ফিজ্জারের যুদ্ধ', 'part-2'),
  placeholderChapter('ch-09', 9, 'ফুজ্জারের যুদ্ধ ও হিলফুল ফুজুল', 'হেলফুল ফুযুল ও সংগ্রামী জীবন', 'part-2'),
  placeholderChapter('ch-10', 10, 'খাদিজা (রা.)-এর সাথে বিবাহ', 'বিবি খাদিজার সাথে বিয়ে', 'part-2'),
  // PART 3
  placeholderChapter('ch-11', 11, 'হেরা গুহা ও প্রথম ওহী', 'রেসালাতের ছায়ায় হেরা গুহা', 'part-3'),
  placeholderChapter('ch-12', 12, 'গোপন দাওয়াহ', 'গোপনীয় দাওয়াতের তিন বছর', 'part-3'),
  placeholderChapter('ch-13', 13, 'প্রকাশ্য দাওয়াহ ও নির্যাতন', 'দ্বিতীয় পর্যায়: প্রকাশ্য তাবলীগ', 'part-3'),
  placeholderChapter('ch-14', 14, 'আবিসিনিয়ায় হিজরত', 'হাবশায় হিজরত', 'part-3'),
  placeholderChapter('ch-15', 15, 'সামাজিক বয়কট', 'বয়কট ও শিবে আবি তালিব', 'part-3'),
  placeholderChapter('ch-16', 16, 'দুঃখের বছর', 'শোকের বছর', 'part-3'),
  placeholderChapter('ch-17', 17, 'ইসরা ও মিরাজ', 'ইসরা ও মি\'রাজ', 'part-3'),
  placeholderChapter('ch-18', 18, 'আকাবার প্রথম ও দ্বিতীয় শপথ', 'আকাবার বাইয়াত', 'part-3'),
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

export const sirahChapters: SirahChapter[] = [...part1Chapters, ...upcomingChapters];

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
