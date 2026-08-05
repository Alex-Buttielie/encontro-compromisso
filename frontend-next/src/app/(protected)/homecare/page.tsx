'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Plus, Home as HomeIcon, MapPin } from 'lucide-react';
import { homecareApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { formatDateTime } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { HomeCareVisit } from '@/types';

export default function HomecarePage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [visits, setVisits] = useState<HomeCareVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ clientName: '', address: '', scheduledAt: '' });

  useEffect(() => { (async () => { const r = await homecareApi.getVisits(); setVisits((r as Record<string, unknown>).visits as HomeCareVisit[] || []); setLoading(false); })(); }, []);

  const save = async () => { const res = await homecareApi.createVisit(form); if (res.success) { notify('Visita agendada', 'success'); setDialogOpen(false); const r = await homecareApi.getVisits(); setVisits((r as Record<string, unknown>).visits as HomeCareVisit[] || []); } else showResponseErrors(res, 'Erro'); };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Atendimento Domiciliar</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Nova Visita</Button>
      </Box>
      <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Cliente</TableCell><TableCell>Endereço</TableCell><TableCell>Data</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
        <TableBody>{visits.map(v => (<TableRow key={v.id}><TableCell>{v.clientName}</TableCell><TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><MapPin size={14} />{v.address}</Box></TableCell><TableCell>{formatDateTime(v.scheduledAt)}</TableCell><TableCell><Chip label={v.status} size="small" color={v.status === 'completed' ? 'success' : 'primary'} /></TableCell></TableRow>))}</TableBody></Table></TableContainer>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Visita Domiciliar</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Nome do cliente" value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} />
          <TextField label="Endereço" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
          <TextField label="Data e hora" type="datetime-local" value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))} InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Agendar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
