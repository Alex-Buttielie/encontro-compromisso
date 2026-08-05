'use client';

import { Alert, AlertTitle, Button } from '@mui/material';
import { AlertCircle } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <Alert severity="error" icon={<AlertCircle size={20} />} action={onRetry ? <Button color="inherit" size="small" onClick={onRetry}>Tentar novamente</Button> : undefined}>
      <AlertTitle>Erro</AlertTitle>
      {message}
    </Alert>
  );
}
