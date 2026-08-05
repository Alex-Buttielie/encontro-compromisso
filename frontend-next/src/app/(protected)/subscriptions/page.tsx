'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, MenuItem } from '@mui/material';
import { Plus, Repeat } from 'lucide-react';
import { subscriptionApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Subscription } from '@/types';

export default function SubscriptionsPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ planName: '', amount: 0, interval: 'monthly' });

  useEffect(() => { (async () => { const r = await subscriptionApi.getAll(); setSubscriptions(r.subscriptions || []); setLoading(false); })(); }, []);

  const save = async () => { const res = await subscriptionApi.create(form); if (res.success) { notify('Assinatura criada', 'success'); setDialogOpen(false); const r = await subscriptionApi.getAll(); setSubscriptions(r.subscriptions || []); } else showResponseErrors(res, 'Erro'); };
  const suspend = async (id: number) => { const res = await subscriptionApi.suspend(id); if (res.success) { notify('Assinatura suspensa', 'success'); const r = await subscriptionApi.getAll(); setSubscriptions(r.subscriptions || []); } };
  const cancel = async (id: number) => { const res = await subscriptionApi.cancel(id); if (res.success) { notify('Assinatura cancelada', 'success'); const r = await subscriptionApi.getAll(); setSubscriptions(r.subscriptions || []); } };
  const reactivate = async (id: number) => { const res = await subscriptionApi.reactivate(id); if (res.success) { notify('Assinatura reativada', 'success'); const r = await subscriptionApi.getAll(); setSubscriptions(r.subscriptions || []); } };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Assinaturas</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Nova Assinatura</Button>
      </Box>
      <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Plano</TableCell><TableCell>Ciclo</TableCell><TableCell>Status</TableCell><TableCell>Próxima cobrança</TableCell><TableCell>Ações</TableCell></TableRow></TableHead>
        <TableBody>{subscriptions.map(s => (<TableRow key={s.id}>
          <TableCell>{s.planName}</TableCell><TableCell>{s.billingCycle}</TableCell><TableCell><Chip label={s.status} size="small" color={s.status === 'active' ? 'success' : 'default'} /></TableCell><TableCell>{s.nextBillingDate ? formatDate(s.nextBillingDate) : '—'}</TableCell>
          <TableCell>{s.status === 'active' && <><Button size="small" onClick={() => suspend(s.id)}>Suspender</Button><Button size="small" color="error" onClick={() => cancel(s.id)}>Cancelar</Button></>}{s.status === 'suspended' && <Button size="small" color="success" onClick={() => reactivate(s.id)}>Reativar</Button>}</TableCell>
        </TableRow>))}</TableBody></Table></TableContainer>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Assinatura</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Nome do plano" value={form.planName} onChange={e => setForm(p => ({ ...p, planName: e.target.value }))} />
          <TextField label="Valor (R$)" type="number" value={form.amount || ''} onChange={e => setForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} />
          <TextField select label="Ciclo de cobrança" value={form.interval} onChange={e => setForm(p => ({ ...p, interval: e.target.value }))}><MenuItem value="monthly">Mensal</MenuItem><MenuItem value="yearly">Anual</MenuItem></TextField>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Criar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
