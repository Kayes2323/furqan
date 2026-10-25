import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clampFontScale,
  increaseFontScale,
  decreaseFontScale,
  setReaderTheme,
  setReaderWidth,
  toggleFocusMode,
  toggleSidebarCollapsed,
  defaultReaderPrefs,
  resolveReaderPalette,
  FONT_SCALE_MIN,
  FONT_SCALE_MAX,
} from './reader-prefs.ts';

test('defaultReaderPrefs seeds theme from the given fallback, light by default', () => {
  assert.equal(defaultReaderPrefs().theme, 'light');
  assert.equal(defaultReaderPrefs('dark').theme, 'dark');
  assert.equal(defaultReaderPrefs().fontScale, 1);
  assert.equal(defaultReaderPrefs().width, 'comfortable');
  assert.equal(defaultReaderPrefs().focusMode, false);
  assert.equal(defaultReaderPrefs().sidebarCollapsed, false);
});

test('clampFontScale keeps values within [FONT_SCALE_MIN, FONT_SCALE_MAX]', () => {
  assert.equal(clampFontScale(0.1), FONT_SCALE_MIN);
  assert.equal(clampFontScale(5), FONT_SCALE_MAX);
  assert.equal(clampFontScale(1.23456), 1.23);
});

test('increaseFontScale steps up and clamps at the max', () => {
  let prefs = defaultReaderPrefs();
  prefs = increaseFontScale(prefs);
  assert.equal(prefs.fontScale, 1.1);
  for (let i = 0; i < 20; i++) prefs = increaseFontScale(prefs);
  assert.equal(prefs.fontScale, FONT_SCALE_MAX);
});

test('decreaseFontScale steps down and clamps at the min', () => {
  let prefs = defaultReaderPrefs();
  prefs = decreaseFontScale(prefs);
  assert.equal(prefs.fontScale, 0.9);
  for (let i = 0; i < 20; i++) prefs = decreaseFontScale(prefs);
  assert.equal(prefs.fontScale, FONT_SCALE_MIN);
});

test('setReaderTheme/setReaderWidth only change the targeted field', () => {
  const prefs = defaultReaderPrefs();
  const withSepia = setReaderTheme(prefs, 'sepia');
  assert.equal(withSepia.theme, 'sepia');
  assert.equal(withSepia.fontScale, prefs.fontScale);

  const withWide = setReaderWidth(prefs, 'wide');
  assert.equal(withWide.width, 'wide');
  assert.equal(withWide.theme, prefs.theme);
});

test('toggleFocusMode and toggleSidebarCollapsed flip only their own field', () => {
  const prefs = defaultReaderPrefs();
  const focused = toggleFocusMode(prefs);
  assert.equal(focused.focusMode, true);
  assert.equal(toggleFocusMode(focused).focusMode, false);

  const collapsed = toggleSidebarCollapsed(prefs);
  assert.equal(collapsed.sidebarCollapsed, true);
  assert.equal(toggleSidebarCollapsed(collapsed).sidebarCollapsed, false);
});

test('resolveReaderPalette returns a distinct, fully-specified palette for each theme', () => {
  const light = resolveReaderPalette('light');
  const dark = resolveReaderPalette('dark');
  const sepia = resolveReaderPalette('sepia');
  for (const pal of [light, dark, sepia]) {
    for (const key of ['bg', 'card', 'text', 'textMuted', 'textLight', 'border', 'accent', 'accentLight', 'gold', 'goldLight'] as const) {
      assert.ok(typeof pal[key] === 'string' && pal[key].startsWith('#'), `missing/invalid ${key}`);
    }
  }
  assert.notEqual(light.bg, dark.bg);
  assert.notEqual(light.bg, sepia.bg);
  assert.notEqual(dark.bg, sepia.bg);
});
