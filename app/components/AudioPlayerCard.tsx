'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Gauge, AlertTriangle, RefreshCw, Headphones } from 'lucide-react';
import {
  buildTimeline,
  positionAtGlobalTime,
  globalTimeForChunkOffset,
  nextSpeed,
  formatTime,
  clampSkip,
} from '../lib/audio-player-engine';

export interface AudioPlayerChunk {
  path: string;
  durationSec: number;
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const SKIP_SEC = 15;

interface Props {
  chunks: AudioPlayerChunk[];
  /** Small all-caps label above the now-playing title, e.g. "অধ্যায় ১১ · শুনছেন". */
  eyebrow: string;
  /** Title shown in the pre-start CTA and as a fallback now-playing label. */
  title: string;
  /** Returns the label to show for the chunk currently playing (e.g. that
   *  chunk's section/article title) — falls back to `title` if omitted. */
  nowPlayingLabel?: (chunkIndex: number) => string;
  /** Shown as a dashed-border footer note, e.g. naming sections/chunks
   *  that aren't narrated yet. Omit when there's nothing to disclose. */
  gapNotice?: string;
}

/** Shared multi-chunk audio player UI (play/pause, seek, skip, speed,
 *  loading/error/retry, keyboard support) used by both the Sirah and
 *  Research audio readers — see SirahAudioPlayer.tsx / ResearchAudioPlayer.tsx,
 *  which are thin wrappers supplying chunks + labels from their own data. */
export default function AudioPlayerCard({ chunks, eyebrow, title, nowPlayingLabel, gapNotice }: Props) {
  const timeline = useMemo(() => buildTimeline(chunks.map((c, i) => ({ id: String(i), durationSec: c.durationSec }))), [chunks]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [started, setStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [globalTime, setGlobalTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [loadState, setLoadState] = useState<LoadState>('idle');

  const currentLabel = chunks[chunkIndex] ? (nowPlayingLabel?.(chunkIndex) ?? title) : title;

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !started) return;
    el.playbackRate = speed;
  }, [speed, started]);

  function loadChunk(index: number, autoplay: boolean) {
    const el = audioRef.current;
    const chunk = chunks[index];
    if (!el || !chunk) return;
    setLoadState('loading');
    el.src = chunk.path;
    el.playbackRate = speed;
    el.load();
    if (autoplay) {
      el.play().catch(() => setLoadState('error'));
    }
  }

  // The <audio> element only exists in the DOM once `started` is true, so
  // the first chunk load has to happen in an effect (after that render
  // commits and audioRef is attached) rather than inside handleStart
  // itself, which fires while the element is still unmounted.
  useEffect(() => {
    if (started) loadChunk(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot on the started:false->true transition only
  }, [started]);

  function handleStart() {
    setStarted(true);
    setChunkIndex(0);
    setIsPlaying(true);
  }

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().catch(() => setLoadState('error'));
      setIsPlaying(true);
    }
  }

  function seekToGlobal(targetSec: number) {
    const el = audioRef.current;
    if (!el) return;
    const pos = positionAtGlobalTime(timeline, targetSec);
    if (pos.chunkIndex === -1) return;
    if (pos.chunkIndex !== chunkIndex) {
      setChunkIndex(pos.chunkIndex);
      const wasPlaying = isPlaying;
      loadChunk(pos.chunkIndex, wasPlaying);
      const target = pos.offsetSec;
      el.addEventListener('loadedmetadata', () => { el.currentTime = target; }, { once: true });
    } else {
      el.currentTime = pos.offsetSec;
    }
    setGlobalTime(targetSec);
  }

  function handleSkip(deltaSec: number) {
    seekToGlobal(clampSkip(globalTime, deltaSec, timeline.totalDurationSec));
  }

  function handleSpeedCycle() {
    setSpeed((s) => nextSpeed(s));
  }

  function handleTimeUpdate() {
    const el = audioRef.current;
    if (!el || !chunks[chunkIndex]) return;
    setGlobalTime(globalTimeForChunkOffset(timeline, chunkIndex, el.currentTime));
  }

  function handleEnded() {
    const nextIndex = chunkIndex + 1;
    if (nextIndex < chunks.length) {
      setChunkIndex(nextIndex);
      loadChunk(nextIndex, true);
    } else {
      setIsPlaying(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      if (started) togglePlay();
    } else if (e.key === 'ArrowRight') {
      handleSkip(SKIP_SEC);
    } else if (e.key === 'ArrowLeft') {
      handleSkip(-SKIP_SEC);
    }
  }

  if (chunks.length === 0) return null;

  if (!started) {
    return (
      <div style={{
        margin: '0 16px 18px', background: 'linear-gradient(135deg, #2A1A0A, #5A3A10)',
        borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Headphones size={20} color="#fff" strokeWidth={1.8} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{title} শুনুন</div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.65)' }}>বাংলা কণ্ঠে অডিও বর্ণনা (পাইলট)</div>
        </div>
        <button
          type="button"
          onClick={handleStart}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)',
            borderRadius: 100, padding: '9px 16px', color: '#fff', fontWeight: 700, fontSize: 12.5,
            cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
          }}
        ><Play size={13} fill="#fff" /> শুনুন</button>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="অডিও প্লেয়ার"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        position: 'sticky', top: 3, zIndex: 40, margin: '0 16px 18px',
        background: '#1F150A', borderRadius: 16, padding: '14px 16px 12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      }}
    >
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onCanPlay={() => setLoadState('ready')}
        onWaiting={() => setLoadState('loading')}
        onError={() => setLoadState('error')}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 10, color: 'rgba(201,168,76,.85)', letterSpacing: 1, textTransform: 'uppercase' }}>
            {eyebrow}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentLabel}
          </div>
        </div>
        <button
          type="button"
          onClick={handleSpeedCycle}
          aria-label="গতি পরিবর্তন করুন"
          style={{
            display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 100, padding: '5px 10px', color: '#fff', fontSize: 11.5, fontWeight: 700,
            cursor: 'pointer',
          }}
        ><Gauge size={12} />{speed}×</button>
      </div>

      {loadState === 'error' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', color: '#E8A87C', fontSize: 12 }}>
          <AlertTriangle size={14} />
          <span style={{ flex: 1 }}>অডিও লোড করা যায়নি।</span>
          <button
            type="button"
            onClick={() => loadChunk(chunkIndex, true)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#C9A84C', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          ><RefreshCw size={12} /> আবার চেষ্টা করুন</button>
        </div>
      ) : (
        <>
          <input
            type="range"
            min={0}
            max={Math.max(timeline.totalDurationSec, 0.01)}
            step={0.1}
            value={globalTime}
            onChange={(e) => seekToGlobal(parseFloat(e.target.value))}
            aria-label="অডিও অগ্রগতি"
            style={{ width: '100%', margin: '4px 0 2px', accentColor: '#C9A84C' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>
            <span>{formatTime(globalTime)}</span>
            <span>-{formatTime(timeline.totalDurationSec - globalTime)}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
            <button type="button" onClick={() => handleSkip(-SKIP_SEC)} aria-label="১৫ সেকেন্ড পিছনে" style={iconBtnStyle}>
              <RotateCcw size={18} color="#fff" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'থামান' : 'চালু করুন'}
              style={{
                width: 48, height: 48, borderRadius: '50%', background: '#C9A84C', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              {loadState === 'loading' ? (
                <RefreshCw size={18} color="#1F150A" className="qibla-spin" />
              ) : isPlaying ? (
                <Pause size={18} color="#1F150A" fill="#1F150A" />
              ) : (
                <Play size={18} color="#1F150A" fill="#1F150A" />
              )}
            </button>
            <button type="button" onClick={() => handleSkip(SKIP_SEC)} aria-label="১৫ সেকেন্ড সামনে" style={iconBtnStyle}>
              <RotateCw size={18} color="#fff" />
            </button>
          </div>
        </>
      )}

      {gapNotice && (
        <div style={{
          marginTop: 12, paddingTop: 10, borderTop: '1px dashed rgba(255,255,255,0.12)',
          fontSize: 10.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6,
        }}>
          {gapNotice}
        </div>
      )}
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
};
