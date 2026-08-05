'use client';

import { createTheme, type ThemeOptions } from '@mui/material/styles';

export function getDesignTokens(mode: 'light' | 'dark'): ThemeOptions {
  const isDark = mode === 'dark';

  return {
    palette: {
      mode,
      primary: { main: '#6366f1', dark: '#4f46e5', light: '#818cf8' },
      secondary: { main: '#ec4899' },
      success: { main: '#16a34a' },
      error: { main: '#dc2626' },
      warning: { main: '#f59e0b' },
      info: { main: '#3b82f6' },
      background: isDark
        ? { default: '#0f172a', paper: '#1e293b' }
        : { default: '#f8fafc', paper: '#ffffff' },
      text: isDark
        ? { primary: '#f1f5f9', secondary: '#94a3b8' }
        : { primary: '#1e293b', secondary: '#64748b' },
      divider: isDark ? '#334155' : '#e2e8f0',
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            '&:focus-visible': {
              outline: `2px solid #6366f1`,
              outlineOffset: 2,
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            '&:focus-visible': {
              outline: `2px solid #6366f1`,
              outlineOffset: 2,
            },
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            borderRadius: 16,
          },
        },
      },
      MuiTextField: {
        defaultProps: { fullWidth: true },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 2,
            },
          },
          input: {
            padding: '12px 14px',
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '0.9375rem',
          },
          outlined: {
            transform: 'translate(14px, 13px) scale(1)',
            '&.MuiInputLabel-shrink': {
              transform: 'translate(14px, -6px) scale(0.75)',
            },
          },
        },
      },
      MuiFilledInput: {
        styleOverrides: {
          input: {
            padding: '12px 12px',
          },
        },
      },
      MuiDialog: {
        defaultProps: {
          PaperProps: { sx: { borderRadius: 3 } },
          'aria-modal': true,
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&:focus-visible': {
              outline: `2px solid #6366f1`,
              outlineOffset: -2,
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            bgcolor: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#f1f5f9' : '#1e293b',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            bgcolor: isDark ? '#1e293b' : '#ffffff',
            borderRight: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          },
        },
      },
    },
  };
}

export function getTheme(mode: 'light' | 'dark') {
  return createTheme(getDesignTokens(mode));
}
