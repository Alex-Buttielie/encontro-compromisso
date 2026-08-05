'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid2 as Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip, MenuItem } from '@mui/material';
import { Plus, Workflow as WorkflowIcon, Play } from 'lucide-react';
import { workflowApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Workflow } from '@/types';

export default function WorkflowsPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', trigger: 'manual', actions: [''] });

  useEffect(() => { (async () => { const r = await workflowApi.getAll(); setWorkflows(r.workflows || []); setLoading(false); })(); }, []);

  const save = async () => { const res = await workflowApi.create({ name: form.name, trigger: form.trigger, actions: form.actions.filter(Boolean).map(a => ({ type: a, params: {} })) }); if (res.success) { notify('Workflow criado', 'success'); setDialogOpen(false); const r = await workflowApi.getAll(); setWorkflows(r.workflows || []); } else showResponseErrors(res, 'Erro'); };
  const trigger = async (id: number) => { const res = await workflowApi.trigger(id); if (res.success) { notify('Workflow disparado', 'success'); } };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Automações</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Novo Workflow</Button>
      </Box>
      <Grid container spacing={2}>
        {workflows.map(w => (
          <Grid key={w.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card><CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><WorkflowIcon size={20} /><Typography fontWeight={600}>{w.name}</Typography></Box>
              <Chip label={w.trigger} size="small" color="primary" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary">Ações: {w.actions?.join(', ')}</Typography>
              <Button size="small" startIcon={<Play size={14} />} sx={{ mt: 1 }} onClick={() => trigger(w.id)}>Disparar</Button>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Workflow</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Nome" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <TextField select label="Gatilho" value={form.trigger} onChange={e => setForm(p => ({ ...p, trigger: e.target.value }))}><MenuItem value="manual">Manual</MenuItem><MenuItem value="appointment_created">Agendamento criado</MenuItem><MenuItem value="appointment_completed">Atendimento concluído</MenuItem><MenuItem value="appointment_cancelled">Agendamento cancelado</MenuItem><MenuItem value="quote_approved">Orçamento aprovado</MenuItem><MenuItem value="contract_signed">Contrato assinado</MenuItem><MenuItem value="client_registered">Cliente cadastrado</MenuItem><MenuItem value="payment_received">Pagamento recebido</MenuItem><MenuItem value="check_out_completed">Check-out concluído</MenuItem></TextField>
          {form.actions.map((a, i) => <TextField key={i} label={`Ação ${i + 1}`} value={a} onChange={e => setForm(p => ({ ...p, actions: p.actions.map((x, idx) => idx === i ? e.target.value : x) }))} />)}
          <Button size="small" onClick={() => setForm(p => ({ ...p, actions: [...p.actions, ''] }))}>Adicionar ação</Button>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Criar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
