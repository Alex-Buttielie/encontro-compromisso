'use client';

import { Box, Typography, Button, Chip } from '@mui/material';
import type { ReactNode } from 'react';
import { AppBreadcrumb } from '@/components/navigation/AppBreadcrumb';
import { usePathname } from 'next/navigation';
import { getEtapaByPath } from '@/config/navigation';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: ReactNode;
  showBreadcrumb?: boolean;
}

export function PageHeader({ title, subtitle, actionLabel, onAction, actionIcon, showBreadcrumb = false }: PageHeaderProps) {
  const pathname = usePathname();
  const etapa = getEtapaByPath(pathname || '');
  return (
    <Box sx={{ mb: 3 }} role="banner">
      {showBreadcrumb && pathname && <Box sx={{ mb: 1 }}><AppBreadcrumb pathname={pathname} /></Box>}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="h5" fontWeight={800} component="h2">{title}</Typography>
            {etapa && <Chip label={`Etapa ${etapa.step} · ${etapa.label}`} size="small" color="primary" variant="outlined" sx={{ fontSize: 11, height: 22 }} />}
          </Box>
          {subtitle ? <Typography color="text.secondary" fontSize={13} sx={{ mt: 0.5 }}>{subtitle}</Typography> : null}
        </Box>
        {actionLabel && (
          <Button variant="contained" startIcon={actionIcon} onClick={onAction} aria-label={actionLabel} sx={{ flexShrink: 0 }}>
            {actionLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
}
