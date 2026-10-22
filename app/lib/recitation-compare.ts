// ═══════════════════════════════════════════
// FURQAN — Recitation Checking: word-level comparison engine
//
// Pure function: canonical ayah words + recognized words in, an
// annotated comparison out. Never touches canonical Quran text —
// comparison uses normalizeArabic (the same diacritic/alef-variant
// folding already used by Reader search) purely to decide whether two
// words "sound the same" for matching purposes; the canonicalText
// carried on each result is always the verbatim source string.
//
// Alignment uses a standard word-level edit-distance (Levenshtein)
// dynamic program — the same technique ASR systems use to compute
// Word Error Rate — so a single inserted/omitted word doesn't cascade
// into marking every later word wrong, the way a naive positional
// comparison would.
// ═══════════════════════════════════════════

import { normalizeArabic } from './reader-data.ts';
import type { ComparedWord, RecognizedWord } from './recitation-types';

/** Below this confidence, a recognized word is never reported as a
 *  confirmed match or a confirmed mistake — only 'uncertain'. Applies
 *  only to words carrying a confidence score; a null confidence (the
 *  adapter doesn't report one) is treated as confident, since there is
 *  no signal to doubt it on. */
export const CONFIDENCE_THRESHOLD = 0.5;

function classifyPair(canonicalText: string, recognized: RecognizedWord): WordStatusResult {
  if (recognized.confidence !== null && recognized.confidence < CONFIDENCE_THRESHOLD) {
    return { status: 'uncertain', recognizedText: recognized.text };
  }
  const matches = normalizeArabic(canonicalText) === normalizeArabic(recognized.text);
  return { status: matches ? 'match' : 'substituted', recognizedText: recognized.text };
}

interface WordStatusResult {
  status: ComparedWord['status'];
  recognizedText: string;
}

export function compareRecitation(canonicalWords: string[], recognizedWords: RecognizedWord[]): ComparedWord[] {
  const n = canonicalWords.length;
  const m = recognizedWords.length;

  const normC = canonicalWords.map(normalizeArabic);
  const normR = recognizedWords.map((w) => normalizeArabic(w.text));

  // dp[i][j] = minimum edit operations to align canonical[0..i) with recognized[0..j)
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const subCost = normC[i - 1] === normR[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + subCost, // align (match or substitute)
        dp[i - 1][j] + 1, // canonical word has no recognized counterpart: omitted
        dp[i][j - 1] + 1, // recognized word has no canonical counterpart: inserted
      );
    }
  }

  const result: ComparedWord[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const subCost = normC[i - 1] === normR[j - 1] ? 0 : 1;
      if (dp[i][j] === dp[i - 1][j - 1] + subCost) {
        const { status, recognizedText } = classifyPair(canonicalWords[i - 1], recognizedWords[j - 1]);
        result.push({ canonicalIndex: i - 1, canonicalText: canonicalWords[i - 1], recognizedText, status });
        i--;
        j--;
        continue;
      }
    }
    if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      result.push({ canonicalIndex: i - 1, canonicalText: canonicalWords[i - 1], recognizedText: null, status: 'omitted' });
      i--;
      continue;
    }
    result.push({ canonicalIndex: null, canonicalText: null, recognizedText: recognizedWords[j - 1].text, status: 'inserted' });
    j--;
  }

  result.reverse();
  return result;
}

/** Splits an ayah's verbatim text into its words on whitespace. Pure
 *  display/comparison helper — the canonical string itself (with every
 *  diacritic and the embedded opening Bismillah where present) is
 *  never altered; this only decides word boundaries for alignment. */
export function splitIntoWords(text: string): string[] {
  return text.split(/\s+/).filter((w) => w.length > 0);
}
