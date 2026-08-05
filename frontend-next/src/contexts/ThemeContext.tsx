'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { getDesignTokens } from '@/theme';

type Mode = 'light' | 'dark';

interface ThemeContextType {
  mode: Mode;
  toggleMode: () => void;
}

const ThemeModeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'profissionalOS_theme';

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Mode | null;
    let initial: Mode = 'light';
    if (stored === 'light' || stored === 'dark') {
      initial = stored;
    } else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      initial = 'dark';
    }
    setMode(initial);
    document.documentElement.setAttribute('data-theme', initial);
    setMounted(true);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  }, []);

  const theme = createTheme(getDesignTokens(mode));

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
}
