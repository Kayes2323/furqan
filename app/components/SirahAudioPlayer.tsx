'use client';
import { useMemo } from 'react';
import AudioPlayerCard from './AudioPlayerCard';
import { getAllChunks, getMissingSectionIds } from '../lib/sirah-audio-data';
import type { SirahChapter } from '../lib/sirah-types';

interface Props {
  chapter: SirahChapter;
}

export default function SirahAudioPlayer({ chapter }: Props) {
  const chunks = useMemo(() => getAllChunks(chapter.id), [chapter.id]);
  const missingSectionTitles = useMemo(
    () => getMissingSectionIds(chapter.id).map((id) => chapter.sections.find((s) => s.id === id)?.title ?? id),
    [chapter.id, chapter.sections],
  );

  return (
    <AudioPlayerCard
      chunks={chunks}
      eyebrow={`অধ্যায় ${chapter.number} · শুনছেন`}
      title={chapter.title}
      nowPlayingLabel={(i) => chapter.sections.find((s) => s.id === chunks[i]?.sectionId)?.title ?? chapter.title}
      gapNotice={
        missingSectionTitles.length > 0
          ? `এই পাইলটে এখনো অডিও নেই: ${missingSectionTitles.join(', ')} — টেক্সট সংস্করণে সম্পূর্ণ পড়া যাবে।`
          : undefined
      }
    />
  );
}
