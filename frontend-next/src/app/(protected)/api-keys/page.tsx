'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Plus, Key, Copy, Trash2 } from 'lucide-react';
import { apiKeyApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { ApiKey } from '@/types';

export default function ApiKeysPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', scopes: '' });

  useEffect(() => { (async () => { const r = await apiKeyApi.getAll(); setKeys(r.apiKeys || []); setLoading(false); })(); }, []);

  const save = async () => { const res = await apiKeyApi.create({ name: form.name, scopes: form.scopes.split(',').map(s => s.trim()) }); if (res.success) { notify('Chave criada', 'success'); setDialogOpen(false); const r = await apiKeyApi.getAll(); setKeys(r.apiKeys || []); } else showResponseErrors(res, 'Erro'); };
  const revoke = async (id: number) => { const res = await apiKeyApi.revoke(id); if (res.success) { notify('Chave revogada', 'success'); setKeys(prev => prev.filter(k => k.id !== id)); } };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Chaves de API</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Nova Chave</Button>
      </Box>
      <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Nome</TableCell><TableCell>Chave</TableCell><TableCell>Scopes</TableCell><TableCell>Status</TableCell><TableCell>Ações</TableCell></TableRow></TableHead>
        <TableBody>{keys.map(k => (<TableRow key={k.id}>
          <TableCell>{k.name}</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{k.key?.slice(0, 20)}...</TableCell><TableCell>{k.scopes?.join(', ')}</TableCell>
          <TableCell><Chip label={k.active ? 'Ativa' : 'Revogada'} size="small" color={k.active ? 'success' : 'default'} /></TableCell>
          <TableCell>{k.active && <IconButton size="small" color="error" onClick={() => revoke(k.id)}><Trash2 size={16} /></IconButton>}</TableCell>
        </TableRow>))}</TableBody></Table></TableContainer>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Chave de API</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Nome" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <TextField label="Scopes (separados por vírgula)" value={form.scopes} onChange={e => setForm(p => ({ ...p, scopes: e.target.value }))} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Criar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
