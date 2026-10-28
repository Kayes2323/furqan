'use client';
import AudioPlayerCard from './AudioPlayerCard';
import type { ResearchArticleAudio } from '../lib/research-audio-data';

interface Props {
  article: ResearchArticleAudio;
  categoryLabel: string;
}

export default function ResearchAudioPlayer({ article, categoryLabel }: Props) {
  const remaining = article.totalChunksExpected - article.chunks.length;

  return (
    <AudioPlayerCard
      chunks={article.chunks}
      eyebrow={`${categoryLabel} · শুনছেন`}
      title={article.title}
      gapNotice={
        remaining > 0
          ? `এই আর্টিকেলের অডিও এখনো সম্পূর্ণ নয় (${article.chunks.length}/${article.totalChunksExpected} অংশ প্রস্তুত) — বাকি অংশ টেক্সট সংস্করণে পড়ুন।`
          : undefined
      }
    />
  );
}
