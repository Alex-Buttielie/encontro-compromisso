'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid2 as Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Plus, Gift } from 'lucide-react';
import { giftCardApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { GiftCard } from '@/types';

export default function GiftCardsPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ amount: 0, recipientEmail: '', validUntil: '' });
  const [redeemCode, setRedeemCode] = useState('');

  useEffect(() => { (async () => { const r = await giftCardApi.getAll(); setCards(r.giftCards || []); setLoading(false); })(); }, []);

  const create = async () => { const res = await giftCardApi.create(form); if (res.success) { notify('Gift card criado', 'success'); setDialogOpen(false); const r = await giftCardApi.getAll(); setCards(r.giftCards || []); } else showResponseErrors(res, 'Erro'); };
  const redeem = async () => { const res = await giftCardApi.redeem(redeemCode); if (res.success) { notify('Gift card resgatado', 'success'); setRedeemCode(''); const r = await giftCardApi.getAll(); setCards(r.giftCards || []); } else showResponseErrors(res, 'Erro'); };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Gift Cards</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Novo Gift Card</Button>
      </Box>
      <Card sx={{ mb: 3 }}><CardContent><Typography variant="h6" gutterBottom>Resgatar Gift Card</Typography><Box sx={{ display: 'flex', gap: 2 }}><TextField label="Código" value={redeemCode} onChange={e => setRedeemCode(e.target.value)} /><Button variant="contained" onClick={redeem}>Resgatar</Button></Box></CardContent></Card>
      <Grid container spacing={2}>
        {cards.map(c => (
          <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><Gift size={20} /><Typography fontWeight={600}>{c.code}</Typography></Box><Typography variant="h6" color="primary">{formatCurrency(c.balance)}</Typography><Typography variant="body2" color="text.secondary">Válido até: {formatDate(c.expiresAt || c.validUntil || '')}</Typography></CardContent></Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Novo Gift Card</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Valor (R$)" type="number" value={form.amount || ''} onChange={e => setForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} />
          <TextField label="E-mail do destinatário" type="email" value={form.recipientEmail} onChange={e => setForm(p => ({ ...p, recipientEmail: e.target.value }))} />
          <TextField label="Válido até" type="date" value={form.validUntil} onChange={e => setForm(p => ({ ...p, validUntil: e.target.value }))} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={create}>Criar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
