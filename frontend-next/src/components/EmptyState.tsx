'use client';

import { Box, Typography, Button } from '@mui/material';
import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function EmptyState({ icon, title, description, actionLabel, onAction, compact }: Props) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: compact ? 4 : 8, px: 2, gap: 1.25, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }} role="status" aria-live="polite">
      {icon && <Box sx={{ color: 'text.secondary', mb: 0.5 }} aria-hidden>{icon}</Box>}
      <Typography fontWeight={700}>{title}</Typography>
      {description && <Typography color="text.secondary" fontSize={13} maxWidth={420}>{description}</Typography>}
      {actionLabel && onAction && <Button variant="contained" onClick={onAction} sx={{ mt: 1 }} aria-label={actionLabel}>{actionLabel}</Button>}
    </Box>
  );
}
