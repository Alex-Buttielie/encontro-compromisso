'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem } from '@mui/material';
import { Plus } from 'lucide-react';
import { commissionApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { formatCurrency } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Commission } from '@/types';

export default function CommissionsPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: 0, commissionType: 'percentage', value: 0 });

  useEffect(() => { (async () => { const r = await commissionApi.getAll(); setCommissions(r.rules || []); setLoading(false); })(); }, []);

  const save = async () => { const res = await commissionApi.create(form); if (res.success) { notify('Comissão criada', 'success'); setDialogOpen(false); const r = await commissionApi.getAll(); setCommissions(r.rules || []); } else showResponseErrors(res, 'Erro'); };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Comissões</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Nova Comissão</Button>
      </Box>
      <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Funcionário</TableCell><TableCell>Tipo</TableCell><TableCell>Valor</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
        <TableBody>{commissions.map(c => (<TableRow key={c.id}><TableCell>{c.employeeName || c.employeeId}</TableCell><TableCell>{c.type}</TableCell><TableCell>{c.type === 'percentage' ? `${c.value}%` : formatCurrency(c.value)}</TableCell><TableCell>{c.status}</TableCell></TableRow>))}</TableBody></Table></TableContainer>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Comissão</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="ID do funcionário" type="number" value={form.employeeId} onChange={e => setForm(p => ({ ...p, employeeId: parseInt(e.target.value) }))} />
          <TextField select label="Tipo" value={form.commissionType} onChange={e => setForm(p => ({ ...p, commissionType: e.target.value }))}><MenuItem value="percentage">Percentual</MenuItem><MenuItem value="fixed">Fixo</MenuItem></TextField>
          <TextField label="Valor" type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: parseFloat(e.target.value) }))} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Criar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
