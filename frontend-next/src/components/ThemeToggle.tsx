'use client';

import { IconButton } from '@mui/material';
import { Sun, Moon } from 'lucide-react';
import { useThemeMode } from '@/contexts/ThemeContext';

export function ThemeToggle({ size = 20 }: { size?: number }) {
  const { mode, toggleMode } = useThemeMode();

  return (
    <IconButton
      onClick={toggleMode}
      aria-label={mode === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      title={mode === 'light' ? 'Modo escuro' : 'Modo claro'}
      sx={{
        transition: 'all 0.3s ease',
        '&:hover': { transform: 'rotate(15deg)' },
      }}
    >
      {mode === 'light' ? <Moon size={size} /> : <Sun size={size} />}
    </IconButton>
  );
}
