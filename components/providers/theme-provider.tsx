'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Theme provider (Stage 1 §5 dark/light modes).
 *
 * Persists the user's choice, respects the system preference by default, and
 * applies the `.dark` class that the token CSS variables key off. The no-flash
 * inline script that sets the class before hydration lives in the root layout so
 * there is no light/dark flicker on first paint.
 */

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  readonly mode: ThemeMode;
  readonly resolved: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = 'theme-mode';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolve(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return mode;
}

export function ThemeProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initial: ThemeMode = stored ?? 'system';
    setModeState(initial);
    setResolved(resolve(initial));
  }, []);

  useEffect(() => {
    const next = resolve(mode);
    setResolved(next);
    document.documentElement.classList.toggle('dark', next === 'dark');

    if (mode !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (): void => {
      const r = systemPrefersDark() ? 'dark' : 'light';
      setResolved(r);
      document.documentElement.classList.toggle('dark', r === 'dark');
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode): void => {
    setModeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolved, setMode }),
    [mode, resolved, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider.');
  }
  return context;
}
