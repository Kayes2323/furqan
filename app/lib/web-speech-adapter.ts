// ═══════════════════════════════════════════
// FURQAN — Recitation Checking: Web Speech API adapter
//
// Wraps the browser's native SpeechRecognition (window.SpeechRecognition
// / window.webkitSpeechRecognition). This is a general-purpose speech
// engine, not trained on Quranic recitation — see
// app/lib/recitation-RESEARCH.md for why no Quran-specific engine is
// wired up in this prototype. Chosen for the MVP specifically because
// it requires no API key, no server, and no audio ever reaches
// Furqan's own infrastructure: the browser vendor (e.g. Google, for
// Chrome) handles recognition directly, which is exactly what this
// adapter's privacy disclosure to the user describes.
//
// Real implementation — no recognition results are fabricated here.
// `isSupported()` returns false (not "best effort true") whenever the
// constructor is genuinely absent, so the UI can show an honest
// unsupported-browser message instead of silently failing later.
// ═══════════════════════════════════════════

import type { RecognitionAdapter, RecognitionErrorReason, RecognizedWord } from './recitation-types';

// Minimal shape of the (still only partially standardized) Web Speech
// API that this adapter actually uses — avoids pulling in a full
// third-party typings package for a handful of fields.
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Static feature detection, usable during render without touching a
 *  ref/instance. */
export function isWebSpeechSupported(): boolean {
  return getCtor() !== null;
}

function mapError(code: string): RecognitionErrorReason {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'permission-denied';
    case 'no-speech':
      return 'no-speech';
    case 'network':
      return 'network';
    case 'aborted':
      return 'aborted';
    default:
      return 'unknown';
  }
}

export class WebSpeechRecognitionAdapter implements RecognitionAdapter {
  readonly id = 'web-speech-api';
  readonly label = 'ব্রাউজার স্পিচ রিকগনিশন (সাধারণ আরবি, কুরআন-নির্দিষ্ট নয়)';

  private recognition: SpeechRecognitionLike | null = null;

  isSupported(): boolean {
    return isWebSpeechSupported();
  }

  start(options: {
    lang: string;
    onResult: (words: RecognizedWord[], isFinalChunk: boolean) => void;
    onError: (reason: RecognitionErrorReason, detail?: string) => void;
    onEnd: () => void;
  }): void {
    const Ctor = getCtor();
    if (!Ctor) {
      options.onError('not-supported');
      return;
    }

    const recognition = new Ctor();
    recognition.lang = options.lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.length === 0) continue;
        const alt = r[0];
        // Chrome does not report per-word confidence, only per-result
        // (per recognized phrase); every word in that phrase inherits
        // it, which is still meaningful for the confidence-threshold
        // check in recitation-compare.ts, just coarser than per-word.
        const words = alt.transcript
          .split(/\s+/)
          .filter((w) => w.length > 0)
          .map((text): RecognizedWord => ({
            text,
            confidence: Number.isFinite(alt.confidence) && alt.confidence > 0 ? alt.confidence : null,
            isFinal: r.isFinal,
          }));
        if (words.length > 0) options.onResult(words, r.isFinal);
      }
    };

    recognition.onerror = (ev) => {
      options.onError(mapError(ev.error), ev.message);
    };

    recognition.onend = () => {
      this.recognition = null;
      options.onEnd();
    };

    this.recognition = recognition;
    try {
      recognition.start();
    } catch {
      // start() throws if called while already running/starting —
      // surface it the same way a runtime error would.
      options.onError('unknown');
    }
  }

  stop(): void {
    this.recognition?.stop();
  }
}
