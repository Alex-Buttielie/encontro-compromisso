'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid2 as Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Chip } from '@mui/material';
import { Plus, Megaphone } from 'lucide-react';
import { marketingApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Campaign } from '@/types';

export default function MarketingPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', channel: 'email', segment: '' });

  useEffect(() => { (async () => { const r = await marketingApi.getCampaigns(); setCampaigns(r.campaigns || []); setLoading(false); })(); }, []);

  const save = async () => { const res = await marketingApi.create(form); if (res.success) { notify('Campanha criada', 'success'); setDialogOpen(false); const r = await marketingApi.getCampaigns(); setCampaigns(r.campaigns || []); } else showResponseErrors(res, 'Erro'); };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Marketing</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Nova Campanha</Button>
      </Box>
      <Grid container spacing={2}>
        {campaigns.map(c => (
          <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card><CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><Megaphone size={20} /><Typography fontWeight={600}>{c.name}</Typography></Box>
              <Chip label={c.channel} size="small" color="primary" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary">Segmento: {c.segment || 'Todos'}</Typography>
              <Typography variant="body2">Enviados: {c.sentCount} | Abertos: {c.openCount}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Campanha</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Nome" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <TextField select label="Canal" value={form.channel} onChange={e => setForm(p => ({ ...p, channel: e.target.value }))}><MenuItem value="email">Email</MenuItem><MenuItem value="sms">SMS</MenuItem><MenuItem value="push">Push</MenuItem><MenuItem value="whatsapp">WhatsApp</MenuItem></TextField>
          <TextField label="Segmento" value={form.segment} onChange={e => setForm(p => ({ ...p, segment: e.target.value }))} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Criar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
