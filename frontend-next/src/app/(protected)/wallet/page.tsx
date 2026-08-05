'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { Wallet as WalletIcon, Plus } from 'lucide-react';
import { walletApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { formatCurrency, formatDateTime } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { WalletTransaction } from '@/types';

export default function WalletPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<'withdraw' | 'transfer'>('withdraw');
  const [amount, setAmount] = useState(0);
  const [toUserId, setToUserId] = useState('');

  useEffect(() => { (async () => { const [b, t] = await Promise.all([walletApi.getBalance(), walletApi.getTransactions()]); setBalance(b.wallet?.balance || 0); setTransactions(t.walletTransactions || []); setLoading(false); })(); }, []);

  const submit = async () => {
    const res = action === 'withdraw' ? await walletApi.withdraw(amount) : await walletApi.transfer(parseInt(toUserId), amount);
    if (res.success) { notify(action === 'withdraw' ? 'Saque solicitado' : 'Transferência realizada', 'success'); setDialogOpen(false); const [b, t] = await Promise.all([walletApi.getBalance(), walletApi.getTransactions()]); setBalance(b.wallet?.balance || 0); setTransactions(t.walletTransactions || []); }
    else showResponseErrors(res, 'Erro');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Carteira</Typography>
      <Card sx={{ mb: 3 }}><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><WalletIcon size={32} /><Box><Typography variant="body2" color="text.secondary">Saldo disponível</Typography><Typography variant="h4" fontWeight={700} color="primary">{formatCurrency(balance)}</Typography></Box></Box></CardContent></Card>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => { setAction('withdraw'); setDialogOpen(true); }}>Sacar</Button>
        <Button variant="outlined" onClick={() => { setAction('transfer'); setDialogOpen(true); }}>Transferir</Button>
      </Box>
      <Typography variant="h6" gutterBottom>Extrato</Typography>
      <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Descrição</TableCell><TableCell>Tipo</TableCell><TableCell>Valor</TableCell><TableCell>Data</TableCell></TableRow></TableHead>
        <TableBody>{transactions.map(t => (<TableRow key={t.id}><TableCell>{t.description}</TableCell><TableCell>{t.type}</TableCell><TableCell>{formatCurrency(t.amount)}</TableCell><TableCell>{formatDateTime(t.createdAt)}</TableCell></TableRow>))}</TableBody></Table></TableContainer>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{action === 'withdraw' ? 'Saque' : 'Transferência'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Valor (R$)" type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} />
          {action === 'transfer' && <TextField label="ID do destinatário" value={toUserId} onChange={e => setToUserId(e.target.value)} />}
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={submit}>Confirmar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
