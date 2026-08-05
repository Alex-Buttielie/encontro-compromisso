'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid2 as Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Plus, Building2 } from 'lucide-react';
import { branchApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Branch } from '@/types';

export default function BranchesPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });

  useEffect(() => { (async () => { const r = await branchApi.getAll(); setBranches(r.branches || []); setLoading(false); })(); }, []);

  const save = async () => { const res = await branchApi.create(form); if (res.success) { notify('Unidade criada', 'success'); setDialogOpen(false); const r = await branchApi.getAll(); setBranches(r.branches || []); } else showResponseErrors(res, 'Erro'); };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Unidades</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Nova Unidade</Button>
      </Box>
      <Grid container spacing={2}>
        {branches.map(b => (
          <Grid key={b.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><Building2 size={20} /><Typography fontWeight={600}>{b.name}</Typography></Box><Typography variant="body2" color="text.secondary">{b.address}</Typography><Typography variant="body2">{b.phone}</Typography></CardContent></Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Unidade</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Nome" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <TextField label="Endereço" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
          <TextField label="Telefone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Criar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
