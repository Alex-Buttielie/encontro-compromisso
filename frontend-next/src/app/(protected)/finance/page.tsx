'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid2 as Grid, TextField, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem } from '@mui/material';
import { Plus, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { transactionApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Transaction, FinancialSummary } from '@/types';

export default function FinancePage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Partial<Transaction>>({ type: 'income', category: '', description: '', amount: 0, paid: false, date: new Date().toISOString().slice(0, 10) });

  useEffect(() => { (async () => {
    const [t, s] = await Promise.all([transactionApi.getAll(), transactionApi.getSummary()]);
    setTransactions(t.transactions || []); setSummary(s.summary || null); setLoading(false);
  })(); }, []);

  const save = async () => {
    const res = await transactionApi.create(form);
    if (res.success) { notify('Transação criada', 'success'); setDialogOpen(false); const r = await transactionApi.getAll(); setTransactions(r.transactions || []); }
    else showResponseErrors(res, 'Erro ao criar transação');
  };

  const togglePaid = async (id: number) => { const res = await transactionApi.pay(id); if (res.success) { notify('Marcado como pago', 'success'); const r = await transactionApi.getAll(); setTransactions(r.transactions || []); } };

  const stats = [
    { label: 'Saldo', value: summary ? formatCurrency(summary.balance || 0) : '—', icon: <DollarSign />, color: 'primary.main' },
    { label: 'Receita do Mês', value: summary ? formatCurrency(summary.monthlyIncome || 0) : '—', icon: <TrendingUp />, color: 'success.main' },
    { label: 'Despesa do Mês', value: summary ? formatCurrency(summary.monthlyExpense || 0) : '—', icon: <TrendingDown />, color: 'error.main' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Financeiro</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Nova Transação</Button>
      </Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((s, i) => (
          <Grid key={i} size={{ xs: 12, sm: 4 }}>
            <Card><CardContent><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box><Typography variant="body2" color="text.secondary">{s.label}</Typography><Typography variant="h5" fontWeight={700}>{s.value}</Typography></Box>
              <Box sx={{ color: s.color }}>{s.icon}</Box>
            </Box></CardContent></Card>
          </Grid>
        ))}
      </Grid>
      {loading ? <LoadingSpinner /> : (
        <TableContainer component={Paper}>
          <Table><TableHead><TableRow>
            <TableCell>Descrição</TableCell><TableCell>Categoria</TableCell><TableCell>Tipo</TableCell><TableCell>Valor</TableCell><TableCell>Data</TableCell><TableCell>Status</TableCell><TableCell>Ações</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {transactions.map(t => (
              <TableRow key={t.id}>
                <TableCell>{t.description}</TableCell>
                <TableCell>{t.category}</TableCell>
                <TableCell><Chip label={t.type === 'income' ? 'Receita' : 'Despesa'} size="small" color={t.type === 'income' ? 'success' : 'error'} /></TableCell>
                <TableCell>{formatCurrency(t.amount)}</TableCell>
                <TableCell>{formatDate(t.date)}</TableCell>
                <TableCell><Chip label={t.paid ? 'Pago' : 'Pendente'} size="small" color={t.paid ? 'success' : 'warning'} /></TableCell>
                <TableCell>{!t.paid && <Button size="small" onClick={() => togglePaid(t.id)}>Marcar pago</Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </TableContainer>
      )}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Transação</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField select label="Tipo" value={form.type || 'income'} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
            <MenuItem value="income">Receita</MenuItem><MenuItem value="expense">Despesa</MenuItem>
          </TextField>
          <TextField label="Categoria" value={form.category || ''} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
          <TextField label="Descrição" value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <TextField label="Valor (R$)" type="number" value={form.amount || 0} onChange={e => setForm(p => ({ ...p, amount: parseFloat(e.target.value) }))} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Salvar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
