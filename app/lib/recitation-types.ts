// ═══════════════════════════════════════════
// FURQAN — Recitation Checking: shared types
//
// Phase 7A prototype (Surah Al-Kawthar only). See
// app/lib/recitation-RESEARCH.md for the technical feasibility
// investigation behind these choices: no Quran-specific speech API
// was available to wire up with credentials this project actually
// has, so recognition is pluggable behind RecognitionAdapter and the
// only adapter implemented is the browser's own Web Speech API —
// general-purpose Arabic recognition, not Quran-tuned, and that
// limitation is surfaced in the UI rather than hidden.
// ═══════════════════════════════════════════

/** One recognized word as reported by a RecognitionAdapter. `confidence`
 *  is null when the underlying engine doesn't report one (the UI must
 *  then treat the word cautiously, never as a confirmed match). */
export interface RecognizedWord {
  text: string;
  confidence: number | null;
  isFinal: boolean;
}

export type WordStatus = 'match' | 'omitted' | 'substituted' | 'inserted' | 'uncertain';

/** The outcome of aligning one canonical ayah word against the
 *  recognized transcript. Exactly one of canonicalIndex/canonicalText
 *  is null for an 'inserted' word (no canonical counterpart), and
 *  recognizedText is null for an 'omitted' word (no recognized
 *  counterpart) — the canonical ayah text itself is never touched by
 *  this comparison; it only annotates a parallel, display-only
 *  structure. */
export interface ComparedWord {
  canonicalIndex: number | null;
  canonicalText: string | null;
  recognizedText: string | null;
  status: WordStatus;
}

export type RecognitionErrorReason =
  | 'not-supported'
  | 'permission-denied'
  | 'no-speech'
  | 'network'
  | 'aborted'
  | 'unknown';

/** Pluggable recognition engine. The MVP ships one implementation
 *  (WebSpeechRecognitionAdapter); a Quran-specific engine can be added
 *  later behind this same interface without touching the UI or the
 *  comparison logic. */
export interface RecognitionAdapter {
  readonly id: string;
  readonly label: string;
  isSupported(): boolean;
  start(options: {
    lang: string;
    onResult: (words: RecognizedWord[], isFinalChunk: boolean) => void;
    onError: (reason: RecognitionErrorReason, detail?: string) => void;
    onEnd: () => void;
  }): void;
  stop(): void;
}
