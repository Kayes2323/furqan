// ═══════════════════════════════════════════
// FURQAN — Audio Reader: pure multi-chunk playback engine
//
// A chapter's narration is one or more small audio files played back
// to back as if they were one continuous track. This module is the pure
// math for that — given a list of chunk durations, where is "global"
// time T within the chunk list, and vice versa — fully unit-testable
// without a real <audio> element. See audio-player-engine.test.ts.
// ═══════════════════════════════════════════

export interface TimelineChunk {
  id: string;
  durationSec: number;
  /** Cumulative start offset in the overall timeline. */
  startSec: number;
}

export interface Timeline {
  chunks: TimelineChunk[];
  totalDurationSec: number;
}

export function buildTimeline(chunks: { id: string; durationSec: number }[]): Timeline {
  let cursor = 0;
  const built: TimelineChunk[] = chunks.map((c) => {
    const entry = { id: c.id, durationSec: c.durationSec, startSec: cursor };
    cursor += c.durationSec;
    return entry;
  });
  return { chunks: built, totalDurationSec: cursor };
}

export interface PlaybackPosition {
  chunkIndex: number;
  /** Seconds elapsed within that chunk. */
  offsetSec: number;
}

/** Maps a global timeline position (clamped to [0, totalDuration]) to
 *  which chunk it falls in and the offset within that chunk. Never
 *  throws on an out-of-range input — always clamps instead. */
export function positionAtGlobalTime(timeline: Timeline, globalSec: number): PlaybackPosition {
  if (timeline.chunks.length === 0) return { chunkIndex: -1, offsetSec: 0 };
  const clamped = Math.max(0, Math.min(globalSec, timeline.totalDurationSec));
  for (let i = timeline.chunks.length - 1; i >= 0; i--) {
    const chunk = timeline.chunks[i];
    if (clamped >= chunk.startSec) {
      return { chunkIndex: i, offsetSec: clamped - chunk.startSec };
    }
  }
  return { chunkIndex: 0, offsetSec: 0 };
}

/** The global timeline position where a given chunk begins — used to
 *  seek directly to a chunk (e.g. jumping to a specific section). */
export function globalTimeForChunkStart(timeline: Timeline, chunkIndex: number): number {
  const chunk = timeline.chunks[chunkIndex];
  return chunk ? chunk.startSec : 0;
}

export function globalTimeForChunkOffset(timeline: Timeline, chunkIndex: number, offsetSec: number): number {
  const chunk = timeline.chunks[chunkIndex];
  if (!chunk) return 0;
  return chunk.startSec + Math.max(0, Math.min(offsetSec, chunk.durationSec));
}

export const PLAYBACK_SPEEDS = [0.8, 1, 1.2, 1.5] as const;
export type PlaybackSpeed = typeof PLAYBACK_SPEEDS[number];

export function nextSpeed(current: number): number {
  const idx = PLAYBACK_SPEEDS.indexOf(current as PlaybackSpeed);
  return PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length];
}

/** mm:ss, floor-rounded. Negative/NaN input renders as 00:00 rather
 *  than throwing or showing a confusing negative time. */
export function formatTime(totalSec: number): string {
  const safe = Number.isFinite(totalSec) && totalSec > 0 ? Math.floor(totalSec) : 0;
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function clampSkip(globalSec: number, deltaSec: number, totalDurationSec: number): number {
  return Math.max(0, Math.min(globalSec + deltaSec, totalDurationSec));
}
