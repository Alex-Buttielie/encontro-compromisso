'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid2 as Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip } from '@mui/material';
import { Plus, FileCheck } from 'lucide-react';
import { quoteApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Quote } from '@/types';

export default function QuotesPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ validUntil: '', items: [{ description: '', quantity: 1, price: 0 }] });

  useEffect(() => { (async () => { const r = await quoteApi.getAll(); setQuotes(r.quotes || []); setLoading(false); })(); }, []);

  const save = async () => { const res = await quoteApi.create(form); if (res.success) { notify('Orçamento criado', 'success'); setDialogOpen(false); const r = await quoteApi.getAll(); setQuotes(r.quotes || []); } else showResponseErrors(res, 'Erro'); };
  const approve = async (id: number) => { const res = await quoteApi.approve(id); if (res.success) { notify('Orçamento aprovado', 'success'); const r = await quoteApi.getAll(); setQuotes(r.quotes || []); } };
  const reject = async (id: number) => { const res = await quoteApi.reject(id); if (res.success) { notify('Orçamento rejeitado', 'success'); const r = await quoteApi.getAll(); setQuotes(r.quotes || []); } };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Orçamentos</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Novo Orçamento</Button>
      </Box>
      <Grid container spacing={2}>
        {quotes.map(q => (
          <Grid key={q.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><FileCheck size={20} /><Typography fontWeight={600}>{q.clientName}</Typography></Box><Typography variant="h6" color="primary">{formatCurrency(q.totalAmount)}</Typography><Typography variant="body2" color="text.secondary">Válido até: {formatDate(q.validUntil)}</Typography><Chip label={q.status} size="small" color={q.status === 'approved' ? 'success' : q.status === 'rejected' ? 'default' : 'warning'} sx={{ mt: 1 }} />{q.status === 'pending' && <Box sx={{ mt: 1 }}><Button size="small" color="success" onClick={() => approve(q.id)}>Aprovar</Button><Button size="small" color="error" onClick={() => reject(q.id)}>Rejeitar</Button></Box>}</CardContent></Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Orçamento</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Válido até" type="date" value={form.validUntil} onChange={e => setForm(p => ({ ...p, validUntil: e.target.value }))} />
          {form.items.map((item, i) => (<Box key={i} sx={{ display: 'flex', gap: 1 }}>
            <TextField label="Descrição" size="small" value={item.description} onChange={e => setForm(p => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, description: e.target.value } : it) }))} />
            <TextField label="Qtd" size="small" type="number" value={item.quantity} onChange={e => setForm(p => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, quantity: parseInt(e.target.value) } : it) }))} />
            <TextField label="Preço" size="small" type="number" value={item.price} onChange={e => setForm(p => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, price: parseFloat(e.target.value) } : it) }))} />
          </Box>))}
          <Button size="small" onClick={() => setForm(p => ({ ...p, items: [...p.items, { description: '', quantity: 1, price: 0 }] }))}>Adicionar item</Button>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Criar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
