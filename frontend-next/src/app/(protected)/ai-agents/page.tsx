'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid2 as Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Switch, FormControlLabel, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { Bot, Plus, Zap } from 'lucide-react';
import { aiAgentApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { AIAgent } from '@/types';

export default function AIAgentsPage() {
  const { notify } = useToast();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'assistant', model: 'gpt-4', systemPrompt: '' });

  useEffect(() => { (async () => { const r = await aiAgentApi.getAll(); setAgents(r.agents || []); setLoading(false); })(); }, []);

  const save = async () => { notify('Criação de agentes via API administrativa', 'info'); setDialogOpen(false); };
  const toggle = async (id: number, active: boolean) => { const res = active ? await aiAgentApi.disable(id) : await aiAgentApi.enable(id); if (res.success) { const r = await aiAgentApi.getAll(); setAgents(r.agents || []); } };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Agentes de IA</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Novo Agente</Button>
      </Box>
      <Grid container spacing={2}>
        {agents.map(a => (
          <Grid key={a.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card><CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><Bot size={20} /><Typography fontWeight={600}>{a.name}</Typography></Box>
              <Chip label={a.type} size="small" color="primary" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary">Modelo: {a.model}</Typography>
              <FormControlLabel control={<Switch checked={!!a.active} onChange={() => toggle(a.id, !!a.active)} />} label={a.active ? 'Ativo' : 'Inativo'} />
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Agente de IA</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Nome" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <TextField label="Tipo" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} />
          <TextField label="Modelo" value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} />
          <TextField label="Prompt do sistema" multiline rows={4} value={form.systemPrompt} onChange={e => setForm(p => ({ ...p, systemPrompt: e.target.value }))} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Criar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
