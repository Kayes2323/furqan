// ═══════════════════════════════════════════
// FURQAN — NUR's retrieval-augmented generation (RAG) layer
//
// Resolves "which ayah/topic is this question about" and fetches the
// actual verified canonical Arabic, Bengali translation, and Bengali
// tafsir for it — before any text is generated. NUR is given this
// retrieved content as clearly labeled context; it never has to guess
// a reference or invent source text. See app/lib/server/tafsir-registry.ts
// for the source metadata attached to every piece of retrieved content.
//
// Dependency-injected (see `RetrievalDeps`) so this module's logic is
// unit-testable without a real network call or filesystem read —
// `defaultRetrievalDeps` wires up the real implementations for
// production use (app/api/nur/route.ts uses that).
// ═══════════════════════════════════════════

import {
  extractSurahAyahRefs,
  matchImportantSurah,
  matchTopic,
  looksAyahSpecific,
  type SurahAyahRef,
} from '../../lib/server/quran-reference-parser.ts';
import { loadSurahMetaServer, loadAyahServer } from '../../lib/server/quran-local-data.ts';
import {
  fetchAyahTranslation,
  fetchAyahTafsir,
  isQuranFoundationConfigured,
} from '../../lib/server/quran-foundation.ts';
import {
  getActiveBengaliTranslationSource,
  getActiveBengaliTafsirSource,
  type TafsirSourceEntry,
} from '../../lib/server/tafsir-registry.ts';
import { TOPICS, IMPORTANT_SURAHS } from '../../lib/topics-data.ts';
import type { SurahMeta } from '../../lib/reader-types.ts';
import type { Topic, ImportantSurah, EvidenceItem } from '../../lib/topics-types.ts';
import { parseTafsirHtml } from '../../lib/tafsir-html.ts';
import type { TafsirBlock } from '../../lib/translation-tafsir-types.ts';

const MAX_AYAH_RANGE = 5;

export interface ExplicitContext {
  surah: number;
  ayah?: number;
}

export interface RetrievedAyah {
  surah: number;
  ayah: number;
  surahBanglaName: string;
  arabic: string | null;
  translation: { text: string; source: TafsirSourceEntry } | null;
  tafsir: { verseKey: string; blocks: TafsirBlock[]; source: TafsirSourceEntry } | 'not_found' | 'not_configured' | null;
}

export interface RetrievedTopicInfo {
  id: string;
  nameBn: string;
  summaryBn: string;
  /** Each ref's glossBn is this project's OWN concise explanation, never
   *  a published translation — callers must label it as such to the model. */
  refs: { surah: number; ayahStart: number; ayahEnd: number; glossBn: string }[];
}

export interface RetrievedFazilahInfo {
  id: string;
  nameBn: string;
  whySelectedBn: string;
  evidence: EvidenceItem[];
}

export interface RetrievedContext {
  ayahs: RetrievedAyah[];
  surahOverview: { surah: number; banglaName: string; arabicName: string; ayahCount: number; revelationType: string } | null;
  topic: RetrievedTopicInfo | null;
  fazilah: RetrievedFazilahInfo | null;
  sourcesUsed: TafsirSourceEntry[];
  notFound: string[];
  resolvedVia: 'explicit-context' | 'deterministic' | 'important-surah' | 'topic' | 'llm-fallback' | 'none';
}

export interface RetrievalDeps {
  loadMeta: () => Promise<SurahMeta[]>;
  loadAyahArabic: (surah: number, ayah: number) => Promise<string | null>;
  loadAyahTranslation: (surah: number, ayah: number) => Promise<{ text: string } | null>;
  loadAyahTafsir: (surah: number, ayah: number) => Promise<{ verseKey: string; blocks: TafsirBlock[] } | 'not_found' | null>;
  isConfigured: () => boolean;
  translationSource: () => TafsirSourceEntry | undefined;
  tafsirSource: () => TafsirSourceEntry | undefined;
  topics: Topic[];
  importantSurahs: ImportantSurah[];
}

export const defaultRetrievalDeps: RetrievalDeps = {
  loadMeta: loadSurahMetaServer,
  loadAyahArabic: async (surah, ayah) => {
    const a = await loadAyahServer(surah, ayah);
    return a?.text ?? null;
  },
  loadAyahTranslation: async (surah, ayah) => {
    const t = await fetchAyahTranslation(surah, ayah);
    return t ? { text: t.text } : null;
  },
  loadAyahTafsir: async (surah, ayah) => {
    const raw = await fetchAyahTafsir(surah, ayah);
    if (!raw) return 'not_found';
    return { verseKey: raw.verse_key ?? `${surah}:${ayah}`, blocks: parseTafsirHtml(raw.text) };
  },
  isConfigured: isQuranFoundationConfigured,
  translationSource: getActiveBengaliTranslationSource,
  tafsirSource: getActiveBengaliTafsirSource,
  topics: TOPICS,
  importantSurahs: IMPORTANT_SURAHS,
};

async function fetchAyahBundle(deps: RetrievalDeps, surah: number, ayah: number, surahBanglaName: string, sourcesUsed: Set<TafsirSourceEntry>, notFound: string[]): Promise<RetrievedAyah> {
  const arabic = await deps.loadAyahArabic(surah, ayah);

  let translation: RetrievedAyah['translation'] = null;
  let tafsir: RetrievedAyah['tafsir'] = null;

  if (!deps.isConfigured()) {
    notFound.push(`${surah}:${ayah} — বাংলা অনুবাদ/তাফসির সংযোগ কনফিগার করা নেই`);
  } else {
    const [t, tf] = await Promise.all([
      deps.loadAyahTranslation(surah, ayah),
      deps.loadAyahTafsir(surah, ayah),
    ]);
    const tSource = deps.translationSource();
    if (t && tSource) {
      translation = { text: t.text, source: tSource };
      sourcesUsed.add(tSource);
    } else if (!t) {
      notFound.push(`${surah}:${ayah} — অনুবাদ পাওয়া যায়নি`);
    }

    const tfSource = deps.tafsirSource();
    if (tf === 'not_found' || tf === null) {
      tafsir = 'not_found';
      notFound.push(`${surah}:${ayah} — তাফসির পাওয়া যায়নি`);
    } else if (tfSource) {
      tafsir = { verseKey: tf.verseKey, blocks: tf.blocks, source: tfSource };
      sourcesUsed.add(tfSource);
    }
  }

  return { surah, ayah, surahBanglaName, arabic, translation, tafsir };
}

function expandRange(ref: SurahAyahRef): number[] {
  if (ref.ayah == null) return [];
  const end = Math.min(ref.ayahEnd ?? ref.ayah, ref.ayah + MAX_AYAH_RANGE - 1);
  const ayahs: number[] = [];
  for (let a = ref.ayah; a <= end; a++) ayahs.push(a);
  return ayahs;
}

export interface RetrievalOptions {
  explicitContext?: ExplicitContext;
  /** A last-resort, cheap LLM call to extract a reference when nothing
   *  deterministic matched. Only invoked when the message looks
   *  Quran/tafsir-specific at all (see looksAyahSpecific). Injected so
   *  retrieval.ts itself never depends on the AI client directly. */
  llmReferenceFallback?: (message: string) => Promise<ExplicitContext | null>;
}

export async function retrieveContext(
  message: string,
  deps: RetrievalDeps = defaultRetrievalDeps,
  options: RetrievalOptions = {}
): Promise<RetrievedContext> {
  const sourcesUsed = new Set<TafsirSourceEntry>();
  const notFound: string[] = [];
  const meta = await deps.loadMeta();
  const metaByNumber = new Map(meta.map((s) => [s.number, s] as const));
  const banglaNameOf = (surah: number) => metaByNumber.get(surah)?.banglaName ?? `সূরা ${surah}`;

  const empty = (resolvedVia: RetrievedContext['resolvedVia']): RetrievedContext => ({
    ayahs: [], surahOverview: null, topic: null, fazilah: null,
    sourcesUsed: [], notFound, resolvedVia,
  });

  // 1. Explicit context always wins — e.g. the user tapped "NUR-কে
  //    জিজ্ঞাসা করো" from a specific ayah in the Reader. Never guessed.
  let primaryRef: SurahAyahRef | null = options.explicitContext
    ? { surah: options.explicitContext.surah, ayah: options.explicitContext.ayah }
    : null;
  let resolvedVia: RetrievedContext['resolvedVia'] = primaryRef ? 'explicit-context' : 'none';

  // 2. Deterministic numeric/named-surah extraction.
  if (!primaryRef) {
    const refs = extractSurahAyahRefs(message, meta);
    if (refs.length > 0) {
      primaryRef = refs[0];
      resolvedVia = 'deterministic';
    }
  }

  // 3. Named "important surah/ayah" match (e.g. আয়াতুল কুরসি).
  let fazilah: RetrievedFazilahInfo | null = null;
  if (!primaryRef) {
    const match = matchImportantSurah(message, deps.importantSurahs);
    if (match) {
      fazilah = { id: match.id, nameBn: match.nameBn, whySelectedBn: match.whySelectedBn, evidence: match.evidence };
      if (match.highlightAyah) {
        primaryRef = { surah: match.surahNumber, ayah: match.highlightAyah.ayahStart, ayahEnd: match.highlightAyah.ayahEnd };
      } else {
        primaryRef = { surah: match.surahNumber };
      }
      resolvedVia = 'important-surah';
    }
  }

  // 4. Topic match (e.g. সবর, দোয়া) — returns a small set of refs, not a
  //    single ayah; handled separately from the ayah/surah paths below.
  if (!primaryRef) {
    const topicMatch = matchTopic(message, deps.topics);
    if (topicMatch) {
      const topicAyahs: RetrievedAyah[] = [];
      for (const ref of topicMatch.ayahs.slice(0, MAX_AYAH_RANGE)) {
        topicAyahs.push(await fetchAyahBundle(deps, ref.surah, ref.ayahStart, banglaNameOf(ref.surah), sourcesUsed, notFound));
      }
      return {
        ayahs: topicAyahs,
        surahOverview: null,
        topic: {
          id: topicMatch.id, nameBn: topicMatch.nameBn, summaryBn: topicMatch.summaryBn,
          refs: topicMatch.ayahs.map((r) => ({ surah: r.surah, ayahStart: r.ayahStart, ayahEnd: r.ayahEnd, glossBn: r.glossBn })),
        },
        fazilah: null,
        sourcesUsed: Array.from(sourcesUsed),
        notFound,
        resolvedVia: 'topic',
      };
    }
  }

  // 5. Last resort: a cheap LLM extraction call, only when the question
  //    plausibly concerns a specific passage and nothing else matched.
  if (!primaryRef && options.llmReferenceFallback && looksAyahSpecific(message)) {
    const llmRef = await options.llmReferenceFallback(message);
    if (llmRef) {
      primaryRef = { surah: llmRef.surah, ayah: llmRef.ayah };
      resolvedVia = 'llm-fallback';
    }
  }

  if (!primaryRef) return empty('none');

  // Surah-level-only reference (no specific ayah) — don't fetch an
  // entire surah's content; just surface surah metadata as context.
  if (primaryRef.ayah == null) {
    const surahMeta = metaByNumber.get(primaryRef.surah) ?? null;
    return {
      ayahs: [],
      surahOverview: surahMeta
        ? { surah: surahMeta.number, banglaName: surahMeta.banglaName, arabicName: surahMeta.arabicName, ayahCount: surahMeta.ayahCount, revelationType: surahMeta.revelationType }
        : null,
      topic: null,
      fazilah,
      sourcesUsed: [],
      notFound,
      resolvedVia,
    };
  }

  const ayahNumbers = expandRange(primaryRef);
  const ayahs: RetrievedAyah[] = [];
  const surahName = banglaNameOf(primaryRef.surah);
  for (const a of ayahNumbers) {
    ayahs.push(await fetchAyahBundle(deps, primaryRef.surah, a, surahName, sourcesUsed, notFound));
  }

  return {
    ayahs,
    surahOverview: null,
    topic: null,
    fazilah,
    sourcesUsed: Array.from(sourcesUsed),
    notFound,
    resolvedVia,
  };
}
