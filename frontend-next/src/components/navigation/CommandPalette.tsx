'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, List, ListItem, ListItemButton, ListItemIcon, ListItemText, TextField, Box, Typography, Chip } from '@mui/material';
import { Search } from 'lucide-react';
import { allNavItems, navEtapas } from '@/config/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  useEffect(() => { if (!open) setQuery(''); }, [open]);

  const filtered = useMemo(() => {
    const role = user?.role;
    const q = query.toLowerCase().trim();
    return allNavItems.filter(i => {
      if (i.roles && role && !i.roles.includes(role)) return false;
      if (!q) return true;
      return i.label.toLowerCase().includes(q) || i.href.toLowerCase().includes(q) || (i.description?.toLowerCase().includes(q));
    }).slice(0, 12);
  }, [query, user]);

  function go(href: string) {
    onClose();
    router.push(href);
  }

  function etapaLabel(href: string) {
    const etapa = navEtapas.find(e => e.items.some(i => i.href === href));
    return etapa?.label ?? 'Sistema';
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
      <Box sx={{ p: 2, pb: 0 }}>
        <TextField
          autoFocus
          placeholder="Buscar página, ex: clientes, financeiro, agenda..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          fullWidth
          InputProps={{ startAdornment: <Search size={18} style={{ marginRight: 8, opacity: 0.5 }} /> }}
          inputProps={{ 'aria-label': 'Buscar navegação' }}
          onKeyDown={e => { if (e.key === 'Enter' && filtered[0]) go(filtered[0].href); }}
        />
      </Box>
      <List sx={{ maxHeight: 380, overflowY: 'auto', px: 1, py: 1 }}>
        {filtered.length === 0 ? (
          <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary" fontSize={14}>Nenhum resultado para &quot;{query}&quot;</Typography>
          </Box>
        ) : filtered.map(item => (
          <ListItem key={item.href} disablePadding>
            <ListItemButton onClick={() => go(item.href)} sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} secondary={item.description} primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} secondaryTypographyProps={{ fontSize: 12 }} />
              <Chip label={etapaLabel(item.href)} size="small" variant="outlined" sx={{ ml: 1, fontSize: 10 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover', display: 'flex', gap: 1, alignItems: 'center' }}>
        <Typography fontSize={11} color="text.secondary"><b>↵</b> abrir &nbsp; <b>Esc</b> fechar &nbsp; <b>Ctrl K</b> busca</Typography>
      </Box>
    </Dialog>
  );
}
