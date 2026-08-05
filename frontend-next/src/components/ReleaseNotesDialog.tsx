'use client';

import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Chip, IconButton, Divider, List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material';
import { Close, CheckCircle2, Sparkles } from 'lucide-react';
import { RELEASE_NOTES, CURRENT_VERSION } from '@/config/release-notes';

const STORAGE_KEY = 'profissionalOS_seenVersion';

export function ReleaseNotesDialog() {
  const [open, setOpen] = useState(false);
  const [seenVersion, setSeenVersion] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof localStorage !== 'undefined'
      ? localStorage.getItem(STORAGE_KEY)
      : null;
    setSeenVersion(stored);
    if (stored !== CURRENT_VERSION) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    }
    setSeenVersion(CURRENT_VERSION);
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: { sx: { borderRadius: 3 } },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Sparkles size={24} color="var(--mui-palette-primary-main)" />
          <Box>
            <Typography variant="h6" fontWeight={700}>Novidades do Sistema</Typography>
            <Typography variant="caption" color="text.secondary">
              Versão {CURRENT_VERSION}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} size="small" aria-label="Fechar">
          <Close size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        {RELEASE_NOTES.map((release, idx) => (
          <Box key={release.version} sx={{ mb: idx < RELEASE_NOTES.length - 1 ? 3 : 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip
                label={`v${release.version}`}
                size="small"
                color={idx === 0 ? 'primary' : 'default'}
                sx={{ fontWeight: 700 }}
              />
              <Typography variant="caption" color="text.secondary">
                {new Date(release.date).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </Typography>
            </Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              {release.title}
            </Typography>
            <List dense disablePadding>
              {release.changes.map((change, i) => (
                <ListItem key={i} disableGutters sx={{ py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <CheckCircle2 size={14} color="var(--mui-palette-success-main)" />
                  </ListItemIcon>
                  <ListItemText
                    primary={change}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  />
                </ListItem>
              ))}
            </List>
            {idx < RELEASE_NOTES.length - 1 && <Divider sx={{ mt: 2 }} />}
          </Box>
        ))}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="contained" onClick={handleClose} fullWidth>
          Entendi, ver novidades
        </Button>
      </DialogActions>
    </Dialog>
  );
}
