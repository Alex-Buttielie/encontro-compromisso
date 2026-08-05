'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid2 as Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Alert, MenuItem } from '@mui/material';
import { Shield, Download, Trash2, FileText } from 'lucide-react';
import { lgpdApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { DataRequest } from '@/types';

export default function LGPDPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ type: 'access', description: '' });

  useEffect(() => { (async () => { const r = await lgpdApi.getRequests(); setRequests(r.dataRequests || []); setLoading(false); })(); }, []);

  const save = async () => { const res = await lgpdApi.createRequest(form.type); if (res.success) { notify('Solicitação criada', 'success'); setDialogOpen(false); const r = await lgpdApi.getRequests(); setRequests(r.dataRequests || []); } else showResponseErrors(res, 'Erro'); };
  const exportData = async () => { const res = await lgpdApi.createRequest('portability'); if (res.success) { notify('Solicitação de exportação criada', 'success'); const r = await lgpdApi.getRequests(); setRequests(r.dataRequests || []); } else notify('Erro ao solicitar exportação', 'error'); };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>LGPD</Typography>
      <Alert severity="info" sx={{ mb: 3 }}>Você tem direitos sobre seus dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD).</Alert>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}><Card><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><Download size={24} /><Box><Typography variant="body2" color="text.secondary">Exportar meus dados</Typography><Button size="small" onClick={exportData}>Exportar</Button></Box></Box></CardContent></Card></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><Card><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><Shield size={24} /><Box><Typography variant="body2" color="text.secondary">Solicitar ação</Typography><Button size="small" onClick={() => setDialogOpen(true)}>Nova Solicitação</Button></Box></Box></CardContent></Card></Grid>
      </Grid>
      <Typography variant="h6" gutterBottom>Solicitações</Typography>
      {requests.map(r => (<Card key={r.id} sx={{ mb: 1 }}><CardContent><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><Box><Typography fontWeight={600}>{r.requestType}</Typography></Box><Chip label={r.status} size="small" color={r.status === 'completed' ? 'success' : 'warning'} /></Box></CardContent></Card>))}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Solicitação LGPD</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField select label="Tipo" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
            <MenuItem value="access">Acesso</MenuItem><MenuItem value="rectification">Retificação</MenuItem><MenuItem value="deletion">Exclusão</MenuItem><MenuItem value="portability">Portabilidade</MenuItem>
          </TextField>
          <TextField label="Descrição" multiline rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Enviar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
