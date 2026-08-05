'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Plus, Webhook } from 'lucide-react';
import { webhookApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Webhook as WebhookType } from '@/types';

export default function WebhooksPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [webhooks, setWebhooks] = useState<WebhookType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ url: '', events: '' });

  useEffect(() => { (async () => { const r = await webhookApi.getAll(); setWebhooks(r.webhooks || []); setLoading(false); })(); }, []);

  const save = async () => { const res = await webhookApi.create({ url: form.url, events: form.events.split(',').map(e => e.trim()) }); if (res.success) { notify('Webhook criado', 'success'); setDialogOpen(false); const r = await webhookApi.getAll(); setWebhooks(r.webhooks || []); } else showResponseErrors(res, 'Erro'); };
  const remove = async (id: number) => { const res = await webhookApi.disable(id); if (res.success) { notify('Webhook desativado', 'success'); setWebhooks(prev => prev.filter(w => w.id !== id)); } };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Webhooks</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Novo Webhook</Button>
      </Box>
      <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>URL</TableCell><TableCell>Eventos</TableCell><TableCell>Status</TableCell><TableCell>Ações</TableCell></TableRow></TableHead>
        <TableBody>{webhooks.map(w => (<TableRow key={w.id}><TableCell sx={{ fontFamily: 'monospace' }}>{w.url}</TableCell><TableCell>{w.events?.join(', ')}</TableCell><TableCell><Chip label={w.active ? 'Ativo' : 'Inativo'} size="small" color={w.active ? 'success' : 'default'} /></TableCell><TableCell><Button size="small" color="error" onClick={() => remove(w.id)}>Remover</Button></TableCell></TableRow>))}</TableBody></Table></TableContainer>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Webhook</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="URL" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} />
          <TextField label="Eventos (separados por vírgula)" value={form.events} onChange={e => setForm(p => ({ ...p, events: e.target.value }))} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Criar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
