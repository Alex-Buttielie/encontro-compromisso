'use client';

import { Box, CircularProgress, Typography } from '@mui/material';

export function LoadingSpinner({ message = 'Carregando...' }: { message?: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }} role="status" aria-live="polite">
      <CircularProgress aria-hidden />
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
}
