// ═══════════════════════════════════════════
// FURQAN — turns a RetrievedContext into (a) a clearly-labeled text
// block to inject into NUR's prompt, and (b) the structured refs/sources
// sent back to the client for the "সূত্র" UI and deep links.
//
// The model is NEVER asked to produce refs/sources itself — those are
// always built here, directly from what retrieval.ts actually fetched.
// This is what guarantees a displayed reference is never hallucinated:
// it exists because the server looked it up, not because the model said so.
// ═══════════════════════════════════════════

import type { RetrievedContext, RetrievedAyah } from './retrieval.ts';

export interface NurRefOut {
  surah: number;
  ayah: number;
  label: string; // e.g. "সূরা আল-বাকারা ২:২৫৫"
}

export interface NurSourceOut {
  id: string;
  title: string;
  authorAttribution: string;
  translatorEditorPublisher: string;
  language: 'ar' | 'bn';
}

function ayahLabel(a: RetrievedAyah): string {
  return `সূরা ${a.surahBanglaName} ${a.surah}:${a.ayah}`;
}

export function buildRefsOut(ctx: RetrievedContext): NurRefOut[] {
  return ctx.ayahs.map((a) => ({ surah: a.surah, ayah: a.ayah, label: ayahLabel(a) }));
}

export function buildSourcesOut(ctx: RetrievedContext): NurSourceOut[] {
  return ctx.sourcesUsed.map((s) => ({
    id: s.id,
    title: s.title,
    authorAttribution: s.authorAttribution,
    translatorEditorPublisher: s.translatorEditorPublisher,
    language: s.language,
  }));
}

/**
 * Renders the retrieved context as a plain-text block for the model.
 * Every section is explicitly labeled by kind (canonical Arabic /
 * published translation + its named source / a named scholar's tafsir /
 * this app's own gloss / this app's own hadith-evidence summary) so the
 * model can keep them distinct in its answer rather than blending them
 * into one undifferentiated "the Quran says". Returns an empty string
 * when nothing was retrieved — callers should tell the model plainly
 * that no verified context was found for this question.
 */
export function formatContextForPrompt(ctx: RetrievedContext): string {
  const parts: string[] = [];

  for (const a of ctx.ayahs) {
    const lines: string[] = [`### আয়াত ${a.surah}:${a.ayah} (${a.surahBanglaName})`];
    if (a.arabic) lines.push(`আরবি (কুরআনের মূল পাঠ, হুবহু — কখনো পরিবর্তন করবে না): ${a.arabic}`);
    if (a.translation) {
      lines.push(`অনুবাদ [উৎস: ${a.translation.source.title}, ${a.translation.source.authorAttribution}]: ${a.translation.text}`);
    }
    if (a.tafsir && a.tafsir !== 'not_found' && a.tafsir !== 'not_configured') {
      const text = a.tafsir.blocks.map((b) => b.text).join(' ');
      lines.push(
        `তাফসির [উৎস: ${a.tafsir.source.title}, ${a.tafsir.source.authorAttribution} — রেফারেন্স ${a.tafsir.verseKey}]: ${text}`
      );
    } else if (a.tafsir === 'not_found') {
      lines.push('তাফসির: এই আয়াতের জন্য আমাদের ডেটাবেজে তাফসির পাওয়া যায়নি।');
    }
    parts.push(lines.join('\n'));
  }

  if (ctx.surahOverview) {
    const o = ctx.surahOverview;
    parts.push(
      `### সূরা তথ্য\nসূরা ${o.banglaName} (${o.arabicName}), সূরা নম্বর ${o.surah}, মোট ${o.ayahCount} আয়াত, ` +
      `${o.revelationType === 'Meccan' ? 'মক্কি' : 'মাদানি'}। (নির্দিষ্ট আয়াতের বিস্তারিত তথ্য এখানে আনা হয়নি — শুধু সূরা-স্তরের তথ্য।)`
    );
  }

  if (ctx.topic) {
    const lines = [`### বিষয়: ${ctx.topic.nameBn}\n${ctx.topic.summaryBn}`];
    for (const r of ctx.topic.refs) {
      const range = r.ayahStart === r.ayahEnd ? `${r.ayahStart}` : `${r.ayahStart}-${r.ayahEnd}`;
      lines.push(`আয়াত ${r.surah}:${range} — অ্যাপের নিজস্ব সংক্ষিপ্ত ব্যাখ্যা (কোনো প্রকাশিত অনুবাদ নয়): ${r.glossBn}`);
    }
    parts.push(lines.join('\n'));
  }

  if (ctx.fazilah) {
    const lines = [`### ফযীলত/গুরুত্ব — ${ctx.fazilah.nameBn}\n${ctx.fazilah.whySelectedBn}`];
    for (const e of ctx.fazilah.evidence) {
      lines.push(
        `প্রমাণ (অ্যাপের নিজস্ব সারসংক্ষেপ, হাদিসের শব্দানুবাদ নয়) [${e.sourceLabel}${e.narrator ? `, বর্ণনাকারী: ${e.narrator}` : ''}, গ্রেডিং: ${e.gradingNoteBn}]: ${e.summaryBn}`
      );
    }
    parts.push(lines.join('\n'));
  }

  if (ctx.notFound.length > 0) {
    parts.push(`### পাওয়া যায়নি\n${ctx.notFound.join('\n')}`);
  }

  return parts.join('\n\n');
}
