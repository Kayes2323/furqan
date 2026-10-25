// ═══════════════════════════════════════════
// FURQAN — Quran Reader: reading preferences (desktop + mobile)
// Mirrors the existing app/lib/reader-progress.ts pattern: pure
// functions for state transitions, thin try/catch localStorage I/O.
//
// These preferences only ever change how the Reader *displays* the
// canonical Arabic text (font size, column width, color palette) —
// never the text itself, which always comes from reader-data.ts.
// ═══════════════════════════════════════════

export type ReaderTheme = 'light' | 'dark' | 'sepia';
export type ReaderWidth = 'comfortable' | 'wide';

export interface ReaderPrefs {
  fontScale: number;
  width: ReaderWidth;
  theme: ReaderTheme;
  focusMode: boolean;
  sidebarCollapsed: boolean;
}

export interface ReaderPalette {
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  textLight: string;
  border: string;
  accent: string;
  accentLight: string;
  gold: string;
  goldLight: string;
}

const KEY = 'furqan_reader_prefs';

export const FONT_SCALE_MIN = 0.8;
export const FONT_SCALE_MAX = 1.6;
export const FONT_SCALE_STEP = 0.1;

// Base Arabic font size (px) before fontScale is applied. Desktop gets a
// larger base so the text is "significantly more comfortable" there even
// at the default scale, without changing the existing mobile default.
export const BASE_ARABIC_PX_MOBILE = 23;
export const BASE_ARABIC_PX_DESKTOP = 28;

export const READER_WIDTH_PX: Record<ReaderWidth, number> = {
  comfortable: 640,
  wide: 820,
};

// Light/dark values are copied verbatim from app/lib/theme.tsx's existing
// :root overrides, so picking "light"/"dark" here looks identical to the
// app's current reading experience by default — sepia is the only new look.
const LIGHT_PALETTE: ReaderPalette = {
  bg: '#F4F1E1', card: '#FFFEF8', text: '#16241B', textMuted: '#5B7360', textLight: '#8FA088',
  border: '#D9D6B8', accent: '#1F7A4C', accentLight: '#2FA06B', gold: '#96702A', goldLight: '#E4C878',
};
const DARK_PALETTE: ReaderPalette = {
  bg: '#0E1C14', card: '#173327', text: '#E7EEDF', textMuted: '#8FA88F', textLight: '#5F7A64',
  border: '#2A4A38', accent: '#4CC48B', accentLight: '#5BD79A', gold: '#D2A85A', goldLight: '#F0D896',
};
// Warm sepia reading theme. Contrast-checked: bg/text 11.1:1, card/text
// 12.5:1, bg/textMuted 4.8:1, bg/accent 4.8:1 — all meet WCAG AA (4.5:1)
// for normal text.
const SEPIA_PALETTE: ReaderPalette = {
  bg: '#F2E6CC', card: '#FBF4E3', text: '#3B2A18', textMuted: '#7A5F3D', textLight: '#A68A5E',
  border: '#E2CFA0', accent: '#8A5A20', accentLight: '#A8742F', gold: '#8A5A20', goldLight: '#D9B978',
};

export function resolveReaderPalette(theme: ReaderTheme): ReaderPalette {
  if (theme === 'dark') return DARK_PALETTE;
  if (theme === 'sepia') return SEPIA_PALETTE;
  return LIGHT_PALETTE;
}

export function defaultReaderPrefs(fallbackTheme: 'light' | 'dark' = 'light'): ReaderPrefs {
  return {
    fontScale: 1,
    width: 'comfortable',
    theme: fallbackTheme,
    focusMode: false,
    sidebarCollapsed: false,
  };
}

export function clampFontScale(value: number): number {
  const clamped = Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, value));
  return Math.round(clamped * 100) / 100;
}

export function increaseFontScale(prefs: ReaderPrefs): ReaderPrefs {
  return { ...prefs, fontScale: clampFontScale(prefs.fontScale + FONT_SCALE_STEP) };
}

export function decreaseFontScale(prefs: ReaderPrefs): ReaderPrefs {
  return { ...prefs, fontScale: clampFontScale(prefs.fontScale - FONT_SCALE_STEP) };
}

export function setReaderTheme(prefs: ReaderPrefs, theme: ReaderTheme): ReaderPrefs {
  return { ...prefs, theme };
}

export function setReaderWidth(prefs: ReaderPrefs, width: ReaderWidth): ReaderPrefs {
  return { ...prefs, width };
}

export function toggleFocusMode(prefs: ReaderPrefs): ReaderPrefs {
  return { ...prefs, focusMode: !prefs.focusMode };
}

export function toggleSidebarCollapsed(prefs: ReaderPrefs): ReaderPrefs {
  return { ...prefs, sidebarCollapsed: !prefs.sidebarCollapsed };
}

// Seeds the theme from the app's current global light/dark setting the
// first time a reader is opened (so it isn't jarringly different from the
// rest of the app on first use), then persists independently once the
// person picks a reading theme of their own (including sepia).
export function loadReaderPrefs(fallbackTheme: 'light' | 'dark' = 'light'): ReaderPrefs {
  const defaults = defaultReaderPrefs(fallbackTheme);
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    const theme: ReaderTheme =
      parsed.theme === 'dark' || parsed.theme === 'sepia' || parsed.theme === 'light'
        ? parsed.theme
        : defaults.theme;
    return {
      fontScale: clampFontScale(typeof parsed.fontScale === 'number' ? parsed.fontScale : defaults.fontScale),
      width: parsed.width === 'wide' ? 'wide' : 'comfortable',
      theme,
      focusMode: Boolean(parsed.focusMode),
      sidebarCollapsed: Boolean(parsed.sidebarCollapsed),
    };
  } catch {
    return defaults;
  }
}

export function saveReaderPrefs(prefs: ReaderPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {}
}
