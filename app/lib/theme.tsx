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
      root.style.setProperty('--bg', '#0E1C14');
      root.style.setProperty('--card', '#173327');
      root.style.setProperty('--text', '#E7EEDF');
      root.style.setProperty('--text-muted', '#8FA88F');
      root.style.setProperty('--text-light', '#5F7A64');
      root.style.setProperty('--border', '#2A4A38');
      root.style.setProperty('--accent', '#4CC48B');
      root.style.setProperty('--accent-light', '#5BD79A');
      root.style.setProperty('--gold', '#D2A85A');
      root.style.setProperty('--gold-light', '#F0D896');
      root.style.setProperty('--green', '#4CC48B');
      root.style.setProperty('--green-light', '#5BD79A');
    } else {
      root.style.setProperty('--bg', '#F4F1E1');
      root.style.setProperty('--card', '#FFFEF8');
      root.style.setProperty('--text', '#16241B');
      root.style.setProperty('--text-muted', '#5B7360');
      root.style.setProperty('--text-light', '#8FA088');
      root.style.setProperty('--border', '#D9D6B8');
      root.style.setProperty('--accent', '#1F7A4C');
      root.style.setProperty('--accent-light', '#2FA06B');
      root.style.setProperty('--gold', '#96702A');
      root.style.setProperty('--gold-light', '#E4C878');
      root.style.setProperty('--green', '#1F7A4C');
      root.style.setProperty('--green-light', '#2FA06B');
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