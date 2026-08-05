'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid2 as Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip } from '@mui/material';
import { Plus, Package } from 'lucide-react';
import { packageApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { ServicePackage } from '@/types';

export default function PackagesPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', totalSessions: 1, price: 0, validUntil: '', description: '' });

  useEffect(() => { (async () => { const r = await packageApi.getAll(); setPackages(r.packages || []); setLoading(false); })(); }, []);

  const save = async () => { const res = await packageApi.create(form); if (res.success) { notify('Pacote criado', 'success'); setDialogOpen(false); const r = await packageApi.getAll(); setPackages(r.packages || []); } else showResponseErrors(res, 'Erro'); };
  const redeem = async (id: number) => { const res = await packageApi.redeem(id); if (res.success) { notify('Sessão resgatada', 'success'); const r = await packageApi.getAll(); setPackages(r.packages || []); } };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Pacotes</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Novo Pacote</Button>
      </Box>
      <Grid container spacing={2}>
        {packages.map(p => (
          <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card><CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><Package size={20} /><Typography fontWeight={600}>{p.name}</Typography></Box>
              <Typography variant="body2" color="text.secondary">{p.description}</Typography>
              <Typography variant="h6" color="primary" sx={{ mt: 1 }}>{formatCurrency(p.price)}</Typography>
              <Typography variant="body2">Sessões: {p.usedSessions || (p.totalSessions - (p.remainingSessions || 0))}/{p.totalSessions}</Typography>
              <Typography variant="body2" color="text.secondary">Válido até: {formatDate(p.expiresAt || p.validUntil || '')}</Typography>
              <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={() => redeem(p.id)} disabled={(p.usedSessions || (p.totalSessions - (p.remainingSessions || 0))) >= p.totalSessions}>Resgatar Sessão</Button>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Pacote</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Nome" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <TextField label="Sessões totais" type="number" value={form.totalSessions} onChange={e => setForm(p => ({ ...p, totalSessions: parseInt(e.target.value) }))} />
          <TextField label="Preço (R$)" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) }))} />
          <TextField label="Válido até" type="date" value={form.validUntil} onChange={e => setForm(p => ({ ...p, validUntil: e.target.value }))} />
          <TextField label="Descrição" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Criar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
