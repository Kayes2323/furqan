'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light', toggle: () => {}
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = localStorage.getItem('furqan-theme') as Theme;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.style.setProperty('--bg', '#0F1117');
      root.style.setProperty('--card', '#1A1D27');
      root.style.setProperty('--text', '#E8E6E0');
      root.style.setProperty('--text-muted', '#9CA3AF');
      root.style.setProperty('--text-light', '#6B7280');
      root.style.setProperty('--border', '#2A2D3A');
      root.style.setProperty('--accent', '#2A9FBF');
      root.style.setProperty('--accent-light', '#3ABFDF');
    } else {
      root.style.setProperty('--bg', '#FAF7F0');
      root.style.setProperty('--card', '#FFFFFF');
      root.style.setProperty('--text', '#1A1A2E');
      root.style.setProperty('--text-muted', '#6B7280');
      root.style.setProperty('--text-light', '#9CA3AF');
      root.style.setProperty('--border', '#E8E0D0');
      root.style.setProperty('--accent', '#1A5F7A');
      root.style.setProperty('--accent-light', '#2A7F9A');
    }
    localStorage.setItem('furqan-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle: () => setTheme(t => t === 'light' ? 'dark' : 'light') }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);