'use client';

import { Box, Button, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pages, onPageChange }: PaginationProps) {
  if (pages <= 1) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 3 }}>
      <Button size="small" variant="outlined" disabled={page <= 1} onClick={() => onPageChange(page - 1)} startIcon={<ChevronLeft size={16} />}>Anterior</Button>
      <Typography variant="body2" color="text.secondary">Página {page} de {pages}</Typography>
      <Button size="small" variant="outlined" disabled={page >= pages} onClick={() => onPageChange(page + 1)} endIcon={<ChevronRight size={16} />}>Próximo</Button>
    </Box>
  );
}
