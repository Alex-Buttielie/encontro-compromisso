'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Plus, Share2, Trophy } from 'lucide-react';
import { referralApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Referral } from '@/types';

export default function ReferralsPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ referredName: '', referredEmail: '' });

  useEffect(() => { (async () => { const r = await referralApi.getAll(); setReferrals(r.referrals || []); setLoading(false); })(); }, []);

  const save = async () => { const res = await referralApi.register(form); if (res.success) { notify('Indicação registrada', 'success'); setDialogOpen(false); const r = await referralApi.getAll(); setReferrals(r.referrals || []); } else showResponseErrors(res, 'Erro'); };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Indicações</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Nova Indicação</Button>
      </Box>
      <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Indicado</TableCell><TableCell>Email</TableCell><TableCell>Status</TableCell><TableCell>Recompensa</TableCell></TableRow></TableHead>
        <TableBody>{referrals.map(r => (<TableRow key={r.id}><TableCell>{r.referredName}</TableCell><TableCell>{r.referredEmail}</TableCell><TableCell><Chip label={r.status} size="small" color={r.status === 'converted' ? 'success' : 'default'} /></TableCell><TableCell>{r.reward || '—'}</TableCell></TableRow>))}</TableBody></Table></TableContainer>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Indicação</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Nome do indicado" value={form.referredName} onChange={e => setForm(p => ({ ...p, referredName: e.target.value }))} />
          <TextField label="Email do indicado" value={form.referredEmail} onChange={e => setForm(p => ({ ...p, referredEmail: e.target.value }))} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Registrar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
