// ═══════════════════════════════════════════
// FURQAN — Sunnah Life: display labels for routine slots and life areas
//
// Purely presentational/navigational metadata — not religious claims.
// Order here is the display order in Today's Routine / Learn by Life Area.
// ═══════════════════════════════════════════

import type { RoutineSlot, LifeArea } from './sunnah-life-types';

export interface RoutineSlotMeta {
  id: RoutineSlot;
  labelBn: string;
  descriptionBn: string;
}

export const ROUTINE_SLOTS: RoutineSlotMeta[] = [
  { id: 'waking', labelBn: 'ঘুম থেকে ওঠা', descriptionBn: 'দিনের শুরু' },
  { id: 'cleanliness-dressing', labelBn: 'পরিচ্ছন্নতা ও পোশাক', descriptionBn: 'প্রস্তুতি' },
  { id: 'fajr-morning', labelBn: 'ফজর ও সকালের আমল', descriptionBn: 'ভোরের ইবাদত' },
  { id: 'morning-adhkar-quran', labelBn: 'সকালের আযকার ও কুরআন', descriptionBn: 'সকালের চর্চা' },
  { id: 'work-family-manners', labelBn: 'কাজ, পরিবার ও আচরণ', descriptionBn: 'দিনের কাজকর্ম' },
  { id: 'daily-prayers', labelBn: 'দৈনিক নামাজ', descriptionBn: 'যোহর, আসর, মাগরিব' },
  { id: 'evening-adhkar', labelBn: 'সন্ধ্যার আযকার', descriptionBn: 'সন্ধ্যার চর্চা' },
  { id: 'isha-night', labelBn: 'ইশা ও রাতের আমল', descriptionBn: 'রাতের ইবাদত' },
  { id: 'before-sleep', labelBn: 'ঘুমানোর আগে', descriptionBn: 'দিনের শেষ' },
];

export interface LifeAreaMeta {
  id: LifeArea;
  labelBn: string;
  descriptionBn: string;
}

export const LIFE_AREAS: LifeAreaMeta[] = [
  { id: 'relationship-with-allah', labelBn: 'আল্লাহর সাথে সম্পর্ক', descriptionBn: 'ইবাদত ও বিশ্বাস' },
  { id: 'relationship-with-self', labelBn: 'নিজের সাথে সম্পর্ক', descriptionBn: 'আত্মশুদ্ধি ও জবাবদিহিতা' },
  { id: 'parents', labelBn: 'পিতা-মাতা', descriptionBn: 'সদ্ব্যবহার ও খেদমত' },
  { id: 'marriage-and-spouse', labelBn: 'বিবাহ ও জীবনসঙ্গী', descriptionBn: 'যাদের জীবনসঙ্গী আছে, তাদের জন্য' },
  { id: 'children-and-parenting', labelBn: 'সন্তান ও অভিভাবকত্ব', descriptionBn: 'যাদের সন্তান আছে, তাদের জন্য' },
  { id: 'relatives-and-kinship', labelBn: 'আত্মীয়তা', descriptionBn: 'আত্মীয়-স্বজনের হক' },
  { id: 'neighbours', labelBn: 'প্রতিবেশী', descriptionBn: 'প্রতিবেশীর হক' },
  { id: 'friends-and-community', labelBn: 'বন্ধু ও মুসলিম সমাজ', descriptionBn: 'সঙ্গ ও ভ্রাতৃত্ব' },
  { id: 'society-and-social-responsibility', labelBn: 'সমাজ ও সামাজিক দায়িত্ব', descriptionBn: 'সততা ও সামাজিক দায়বদ্ধতা' },
];

export function routineSlotLabel(slot: RoutineSlot): string {
  return ROUTINE_SLOTS.find((s) => s.id === slot)?.labelBn ?? slot;
}

export function lifeAreaLabel(area: LifeArea): string {
  return LIFE_AREAS.find((a) => a.id === area)?.labelBn ?? area;
}
