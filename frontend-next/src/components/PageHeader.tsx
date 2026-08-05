'use client';

import { Box, Typography, Button } from '@mui/material';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: ReactNode;
}

export function PageHeader({ title, actionLabel, onAction, actionIcon }: PageHeaderProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }} role="banner">
      <Typography variant="h5" fontWeight={700} component="h2">{title}</Typography>
      {actionLabel && (
        <Button variant="contained" startIcon={actionIcon} onClick={onAction} aria-label={actionLabel}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
