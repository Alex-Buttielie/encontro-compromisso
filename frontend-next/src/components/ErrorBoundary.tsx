'use client';

import { Component, type ReactNode } from 'react';
import { Button, Box, Typography } from '@mui/material';

interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2, p: 4 }}>
          <Typography variant="h5" fontWeight={700}>Algo deu errado</Typography>
          <Typography color="text.secondary">{this.state.error?.message}</Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>Recarregar página</Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
