'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { Plus } from 'lucide-react';
import { paymentApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { formatCurrency, formatDateTime } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Payment } from '@/types';

export default function PaymentsPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ amount: 0, method: 'pix', description: '' });

  useEffect(() => { (async () => { const r = await paymentApi.getAll(); setPayments(r.payments || []); setLoading(false); })(); }, []);

  const save = async () => { const res = await paymentApi.create(form); if (res.success) { notify('Pagamento criado', 'success'); setDialogOpen(false); const r = await paymentApi.getAll(); setPayments(r.payments || []); } else showResponseErrors(res, 'Erro'); };
  const refund = async (id: number) => { const res = await paymentApi.refund(id); if (res.success) { notify('Reembolso processado', 'success'); const r = await paymentApi.getAll(); setPayments(r.payments || []); } };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Pagamentos</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Novo Pagamento</Button>
      </Box>
      {loading ? <LoadingSpinner /> : (
        <TableContainer component={Paper}>
          <Table><TableHead><TableRow><TableCell>Descrição</TableCell><TableCell>Método</TableCell><TableCell>Valor</TableCell><TableCell>Status</TableCell><TableCell>Data</TableCell><TableCell>Ações</TableCell></TableRow></TableHead>
          <TableBody>{payments.map(p => (<TableRow key={p.id}>
            <TableCell>{p.description}</TableCell><TableCell>{p.method}</TableCell><TableCell>{formatCurrency(p.amount)}</TableCell>
            <TableCell>{p.status}</TableCell><TableCell>{formatDateTime(p.createdAt)}</TableCell>
            <TableCell>{p.status !== 'refunded' && <Button size="small" color="error" onClick={() => refund(p.id)}>Reembolso</Button>}</TableCell>
          </TableRow>))}</TableBody></Table>
        </TableContainer>
      )}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Pagamento</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Valor (R$)" type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: parseFloat(e.target.value) }))} />
          <TextField select label="Método" value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))}><MenuItem value="pix">Pix</MenuItem><MenuItem value="credit">Crédito</MenuItem><MenuItem value="debit">Débito</MenuItem></TextField>
          <TextField label="Descrição" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Criar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
