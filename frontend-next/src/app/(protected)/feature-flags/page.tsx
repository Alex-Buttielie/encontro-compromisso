'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid2 as Grid, Switch, FormControlLabel, Chip, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Plus, Flag } from 'lucide-react';
import { featureFlagApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { FeatureFlag } from '@/types';

export default function FeatureFlagsPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ key: '', description: '', enabled: false });

  useEffect(() => { (async () => { const r = await featureFlagApi.getAll(); setFlags(r.flags || []); setLoading(false); })(); }, []);

  const save = async () => { const res = await featureFlagApi.create({ key: form.key, enabled: form.enabled, description: form.description }); if (res.success) { notify('Flag criada', 'success'); setDialogOpen(false); const r = await featureFlagApi.getAll(); setFlags(r.flags || []); } else showResponseErrors(res, 'Erro'); };
  const toggle = async (id: number) => { const res = await featureFlagApi.toggle(id); if (res.success) { const r = await featureFlagApi.getAll(); setFlags(r.flags || []); } };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Feature Flags</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Nova Flag</Button>
      </Box>
      <Grid container spacing={2}>
        {flags.map(f => (
          <Grid key={f.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card><CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><Flag size={20} /><Typography fontWeight={600}>{f.key}</Typography></Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{f.description}</Typography>
              <FormControlLabel control={<Switch checked={!!f.enabled} onChange={() => toggle(f.id)} />} label={f.enabled ? 'Ativa' : 'Inativa'} />
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Feature Flag</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Chave" value={form.key} onChange={e => setForm(p => ({ ...p, key: e.target.value }))} />
          <TextField label="Descrição" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <FormControlLabel control={<Switch checked={form.enabled} onChange={e => setForm(p => ({ ...p, enabled: e.target.checked }))} />} label="Ativa" />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Criar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
