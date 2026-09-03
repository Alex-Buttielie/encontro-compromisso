'use client';

import Link from 'next/link';
import { Breadcrumbs, Typography, Box } from '@mui/material';
import { ChevronRight } from 'lucide-react';
import { getBreadcrumbs } from '@/config/navigation';

export function AppBreadcrumb({ pathname }: { pathname: string }) {
  const crumbs = getBreadcrumbs(pathname);
  if (crumbs.length <= 1) return null;
  return (
    <Breadcrumbs separator={<ChevronRight size={14} />} aria-label="Navegação estrutural" sx={{ '& ol': { alignItems: 'center' } }}>
      {crumbs.map((c, idx) => {
        const isLast = idx === crumbs.length - 1;
        return isLast || !c.href ? (
          <Typography key={c.label} color="text.primary" fontWeight={600} fontSize={13} component="span" aria-current="page">
            {c.label}
          </Typography>
        ) : (
          <Box key={c.label} component={Link} href={c.href} sx={{ color: 'text.secondary', textDecoration: 'none', fontSize: 13, '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}>
            {c.label}
          </Box>
        );
      })}
    </Breadcrumbs>
  );
}
