'use client';

import { useEffect, useMemo, useState } from 'react';
import { Mic, MicOff, RotateCw, ShieldAlert, WifiOff } from 'lucide-react';
import BackButton from './BackButton';
import { loadSurahMeta, loadSurah } from '../lib/reader-data';
import { splitOpeningBismillah } from '../lib/bismillah';
import { compareRecitation, splitIntoWords } from '../lib/recitation-compare';
import { WebSpeechRecognitionAdapter, isWebSpeechSupported } from '../lib/web-speech-adapter';
import type { ComparedWord, RecognizedWord, RecognitionErrorReason } from '../lib/recitation-types';
import type { SurahMeta, SurahDoc } from '../lib/reader-types';

interface Props {
  onBack: () => void;
}

// Surahs this prototype can check. Currently just Al-Kawthar — add more
// surah numbers here once the prototype's accuracy has been evaluated
// (see app/lib/recitation-RESEARCH.md §5); nothing else in this file
// needs to change to support another short surah.
const TEST_SURAHS = [108];

type SessionState = 'idle' | 'requesting-permission' | 'listening' | 'reviewing';
type MicPermission = 'unknown' | 'granted' | 'denied';

interface WordGroup {
  key: string;
  ayahNumber: number;
  isHeader: boolean;
  refLabel: string | null;
  startIndex: number;
  endIndex: number; // exclusive
}

function buildWordGroupsAndCanonical(doc: SurahDoc): { groups: WordGroup[]; canonicalWords: string[] } {
  const groups: WordGroup[] = [];
  const canonicalWords: string[] = [];

  for (const ayah of doc.ayahs) {
    const split = splitOpeningBismillah(ayah.number, ayah.text);
    if (split) {
      const headerWords = splitIntoWords(split.bismillah);
      groups.push({
        key: `${ayah.number}-header`,
        ayahNumber: ayah.number,
        isHeader: true,
        refLabel: null,
        startIndex: canonicalWords.length,
        endIndex: canonicalWords.length + headerWords.length,
      });
      canonicalWords.push(...headerWords);

      const bodyWords = splitIntoWords(split.body);
      groups.push({
        key: `${ayah.number}-body`,
        ayahNumber: ayah.number,
        isHeader: false,
        refLabel: String(ayah.number),
        startIndex: canonicalWords.length,
        endIndex: canonicalWords.length + bodyWords.length,
      });
      canonicalWords.push(...bodyWords);
    } else {
      const words = splitIntoWords(ayah.text);
      groups.push({
        key: `${ayah.number}-body`,
        ayahNumber: ayah.number,
        isHeader: false,
        refLabel: String(ayah.number),
        startIndex: canonicalWords.length,
        endIndex: canonicalWords.length + words.length,
      });
      canonicalWords.push(...words);
    }
  }

  return { groups, canonicalWords };
}

/** Buckets an in-order ComparedWord[] back into per-group lists, using
 *  canonicalIndex for canonical/matched/substituted/omitted words and
 *  sequence position (the group most recently reached) for an
 *  'inserted' word, which has no canonical index of its own. */
function groupComparedWords(compared: ComparedWord[], groups: WordGroup[]): Map<string, ComparedWord[]> {
  const byGroup = new Map<string, ComparedWord[]>(groups.map((g) => [g.key, []]));
  let currentGroup = groups[0]?.key ?? null;

  for (const word of compared) {
    if (word.canonicalIndex !== null) {
      const g = groups.find((g) => word.canonicalIndex! >= g.startIndex && word.canonicalIndex! < g.endIndex);
      if (g) currentGroup = g.key;
    }
    if (currentGroup) byGroup.get(currentGroup)!.push(word);
  }
  return byGroup;
}

function wordStyle(status: ComparedWord['status']): React.CSSProperties {
  switch (status) {
    case 'match':
      return { color: 'var(--text)' };
    case 'substituted':
      return { color: '#C85A4C', textDecoration: 'underline', textDecorationStyle: 'solid' };
    case 'omitted':
      return { color: 'var(--text-light)', opacity: 0.55, textDecoration: 'line-through' };
    case 'inserted':
      return { color: 'var(--gold)', background: 'rgba(201,168,76,0.15)', borderRadius: 6, padding: '0 4px' };
    case 'uncertain':
      return { color: 'var(--text-muted)', textDecoration: 'underline dashed' };
  }
}

const ERROR_MESSAGES: Record<RecognitionErrorReason, string> = {
  'not-supported': 'এই ব্রাউজারে ভয়েস রিকগনিশন সমর্থিত নয়। Chrome (Android/Desktop) ব্যবহার করে দেখুন।',
  'permission-denied': 'মাইক্রোফোনের অনুমতি দেওয়া হয়নি। ব্রাউজার সেটিংস থেকে অনুমতি দিয়ে আবার চেষ্টা করুন।',
  'no-speech': 'কোনো কণ্ঠস্বর শনাক্ত হয়নি। কাছাকাছি থেকে স্পষ্ট করে তিলাওয়াত করুন।',
  network: 'নেটওয়ার্ক সমস্যার কারণে রিকগনিশন ব্যর্থ হয়েছে। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।',
  aborted: 'সেশন থেমে গেছে।',
  unknown: 'একটি অপ্রত্যাশিত সমস্যা হয়েছে। আবার চেষ্টা করুন।',
};

export default function ReciteScreen({ onBack }: Props) {
  const [surahNumber] = useState(TEST_SURAHS[0]);
  const [meta, setMeta] = useState<SurahMeta | null>(null);
  const [doc, setDoc] = useState<SurahDoc | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [micPermission, setMicPermission] = useState<MicPermission>('unknown');
  const [errorReason, setErrorReason] = useState<RecognitionErrorReason | null>(null);
  const [liveWords, setLiveWords] = useState<RecognizedWord[]>([]);
  const [, setFinalWords] = useState<RecognizedWord[]>([]);
  const [comparison, setComparison] = useState<ComparedWord[] | null>(null);

  const [adapter] = useState(() => new WebSpeechRecognitionAdapter());
  const isSupported = isWebSpeechSupported();

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadSurahMeta(), loadSurah(surahNumber)])
      .then(([metaList, surahDoc]) => {
        if (cancelled) return;
        setMeta(metaList.find((s) => s.number === surahNumber) ?? null);
        setDoc(surahDoc);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [surahNumber]);

  const { groups, canonicalWords } = useMemo(
    () => (doc ? buildWordGroupsAndCanonical(doc) : { groups: [], canonicalWords: [] }),
    [doc],
  );

  async function requestMicPermission() {
    setSessionState('requesting-permission');
    setErrorReason(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // We only needed this to trigger/confirm the permission prompt —
      // SpeechRecognition captures its own audio internally, so this
      // stream is released immediately rather than held open.
      stream.getTracks().forEach((t) => t.stop());
      setMicPermission('granted');
      setSessionState('idle');
    } catch {
      setMicPermission('denied');
      setErrorReason('permission-denied');
      setSessionState('idle');
    }
  }

  function startSession() {
    if (!doc) return;
    setErrorReason(null);
    setLiveWords([]);
    setFinalWords([]);
    setComparison(null);
    setSessionState('listening');

    adapter.start({
      lang: 'ar-SA',
      onResult: (words, isFinalChunk) => {
        setLiveWords((prev) => [...prev, ...words]);
        if (isFinalChunk) setFinalWords((prev) => [...prev, ...words]);
      },
      onError: (reason) => {
        setErrorReason(reason);
        setSessionState('idle');
      },
      onEnd: () => {
        setSessionState((s) => (s === 'listening' ? 'idle' : s));
      },
    });
  }

  function stopSession() {
    adapter.stop();
    setFinalWords((currentFinal) => {
      // If the engine never emitted a final chunk (user stopped quickly,
      // or the browser only ever reports interim results), fall back to
      // comparing against whatever interim words were seen — still real
      // recognition output, just not confirmed-final by the engine.
      const wordsToCompare = currentFinal.length > 0 ? currentFinal : liveWords;
      setComparison(compareRecitation(canonicalWords, wordsToCompare));
      return currentFinal;
    });
    setSessionState('reviewing');
  }

  function retry() {
    setSessionState('idle');
    setErrorReason(null);
    setLiveWords([]);
    setFinalWords([]);
    setComparison(null);
  }

  const groupedComparison = comparison ? groupComparedWords(comparison, groups) : null;
  const hasUncertainWord = comparison?.some((w) => w.status === 'uncertain') ?? false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <div style={{
        padding: '44px 16px 12px', flexShrink: 0,
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <BackButton onClick={onBack} variant="dark" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>তিলাওয়াত যাচাই (পরীক্ষামূলক)</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>
            {meta ? `সূরা ${meta.banglaName}` : 'লোড হচ্ছে...'}
          </div>
        </div>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: '14px 16px 20px' }}>
        {/* Privacy / capability disclosure — always visible, never collapsed by default */}
        <div style={{
          background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 14, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 10,
        }}>
          <ShieldAlert size={16} color="var(--gold)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.6 }}>
এটি একটি পরীক্ষামূলক প্রোটোটাইপ এবং এখনও নির্ভরযোগ্যভাবে তিলাওয়াত শনাক্ত করতে পারে না — এটি Tarteel-এর মতো কোনো নির্ভরযোগ্য বিকল্প নয়, শুধু একটি পরীক্ষা। রিকগনিশন আপনার ব্রাউজারের নিজস্ব ভয়েস সার্ভিস ব্যবহার করে (Furqan-এর সার্ভারে অডিও পাঠানো বা সংরক্ষণ করা হয় না)। এটি কুরআন তিলাওয়াতের জন্য প্রশিক্ষিত নয়—সাধারণ আরবি শনাক্তকরণ ব্যবহার করে, তাই ফলাফল প্রায়ই ভুল হতে পারে। তাজবিদ, মাখরাজ বা উচ্চারণ যাচাই করা হয় না — শুধু শব্দ মেলানোর একটি আনুমানিক চেষ্টা।
          </div>
        </div>

        {loadError && (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <WifiOff size={24} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13 }}>সূরা লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।</div>
          </div>
        )}

        {!isSupported && !loadError && (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--card)', borderRadius: 14, border: '1px solid var(--border)' }}>
            <MicOff size={24} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13 }}>{ERROR_MESSAGES['not-supported']}</div>
          </div>
        )}

        {errorReason && (
          <div style={{
            background: 'rgba(200,90,76,0.1)', border: '1px solid rgba(200,90,76,0.3)',
            borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#C85A4C',
          }}>
            {ERROR_MESSAGES[errorReason]}
          </div>
        )}

        {/* Canonical text + per-word feedback */}
        {doc && groups.map((g) => {
          const words = groupedComparison?.get(g.key);
          const showComparison = sessionState === 'reviewing' && words;
          return (
            <div
              key={g.key}
              style={g.isHeader ? {
                padding: '10px 16px', marginBottom: 10, textAlign: 'center',
              } : {
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
                padding: '16px 16px 12px', marginBottom: 10,
              }}
            >
              <div
                className="arabic"
                dir="rtl"
                style={{
                  fontFamily: 'Amiri, serif', fontSize: g.isHeader ? 21 : 23, lineHeight: 2.1,
                  display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '0 8px',
                  color: g.isHeader ? 'var(--accent)' : 'var(--text)',
                }}
              >
                {showComparison
                  ? words!.map((w, i) => (
                      <span key={i} style={wordStyle(w.status)}>
                        {w.status === 'omitted' ? w.canonicalText : (w.recognizedText ?? w.canonicalText)}
                      </span>
                    ))
                  : canonicalWords.slice(g.startIndex, g.endIndex).map((w, i) => <span key={i}>{w}</span>)}
              </div>
              {g.refLabel && !g.isHeader && (
                <div style={{
                  marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)',
                  fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)',
                  background: 'var(--bg)', borderRadius: 100, padding: '3px 10px', display: 'inline-block',
                }}>
                  {surahNumber}:{g.refLabel}
                </div>
              )}
            </div>
          );
        })}

        {sessionState === 'listening' && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', margin: '8px 0', direction: 'rtl' }}>
            {liveWords.length > 0 ? liveWords.map((w) => w.text).join(' ') : 'শুনছি...'}
          </div>
        )}

        {sessionState === 'reviewing' && hasUncertainWord && (
          <div style={{
            background: 'rgba(150,112,42,0.12)', border: '1px solid rgba(150,112,42,0.3)',
            borderRadius: 12, padding: '10px 14px', margin: '10px 0', fontSize: 12.5, color: 'var(--text)', textAlign: 'center',
          }}>
            সম্ভাব্য ভুল—আবার যাচাই করুন
          </div>
        )}

        {/* Controls */}
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          {micPermission !== 'granted' && sessionState !== 'listening' && isSupported && (
            <button
              onClick={requestMicPermission}
              disabled={sessionState === 'requesting-permission'}
              style={{
                background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 100,
                padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'Hind Siliguri, sans-serif', display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Mic size={15} />
              {sessionState === 'requesting-permission' ? 'অনুমতি চাওয়া হচ্ছে...' : 'মাইক্রোফোন অনুমতি দিন'}
            </button>
          )}

          {micPermission === 'granted' && isSupported && sessionState !== 'listening' && (
            <button
              onClick={sessionState === 'reviewing' ? retry : startSession}
              style={{
                background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 100,
                padding: '12px 28px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'Hind Siliguri, sans-serif', display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Mic size={16} />
              {sessionState === 'reviewing' ? 'আবার চেষ্টা করুন' : 'তিলাওয়াত শুরু করুন'}
            </button>
          )}

          {sessionState === 'listening' && (
            <button
              onClick={stopSession}
              style={{
                background: '#C85A4C', color: '#fff', border: 'none', borderRadius: 100,
                padding: '12px 28px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'Hind Siliguri, sans-serif', display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <RotateCw size={15} className="qibla-spin" />
              থামান
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
