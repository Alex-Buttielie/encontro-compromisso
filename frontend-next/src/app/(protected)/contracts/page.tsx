'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid2 as Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip } from '@mui/material';
import { Plus, FileText } from 'lucide-react';
import { contractApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Contract } from '@/types';

export default function ContractsPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });

  useEffect(() => { (async () => { const r = await contractApi.getAll(); setContracts(r.contracts || []); setLoading(false); })(); }, []);

  const save = async () => { const res = await contractApi.create(form); if (res.success) { notify('Contrato criado', 'success'); setDialogOpen(false); const r = await contractApi.getAll(); setContracts(r.contracts || []); } else showResponseErrors(res, 'Erro'); };
  const sign = async (id: number) => { const res = await contractApi.sign(id); if (res.success) { notify('Contrato assinado', 'success'); const r = await contractApi.getAll(); setContracts(r.contracts || []); } };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Contratos</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Novo Contrato</Button>
      </Box>
      <Grid container spacing={2}>
        {contracts.map(c => (
          <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><FileText size={20} /><Typography fontWeight={600}>{c.title}</Typography></Box><Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{c.content?.slice(0, 100)}...</Typography><Chip label={c.signed ? 'Assinado' : 'Pendente'} size="small" color={c.signed ? 'success' : 'warning'} />{!c.signed && <Button size="small" sx={{ ml: 1 }} onClick={() => sign(c.id)}>Assinar</Button>}</CardContent></Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Contrato</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Título" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <TextField label="Conteúdo" multiline rows={6} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Criar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
