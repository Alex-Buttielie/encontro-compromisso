'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Plus, Shield, Users, Server } from 'lucide-react';
import { adminApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { AdminUser } from '@/types';

export default function AdminPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ email: '', role: 'admin' });

  useEffect(() => { (async () => { const r = await adminApi.getUsers(); setUsers(r.users || []); setLoading(false); })(); }, []);

  const save = async () => { const res = await adminApi.createUser(form); if (res.success) { notify('Usuário criado', 'success'); setDialogOpen(false); const r = await adminApi.getUsers(); setUsers(r.users || []); } else showResponseErrors(res, 'Erro'); };
  const toggleAdmin = async (id: number) => { const res = await adminApi.toggleAdmin(id); if (res.success) { notify('Permissão alterada', 'success'); const r = await adminApi.getUsers(); setUsers(r.users || []); } };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Administração</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Novo Usuário</Button>
      </Box>
      <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Nome</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell>Ações</TableCell></TableRow></TableHead>
        <TableBody>{users.map(u => (<TableRow key={u.id}><TableCell>{u.name}</TableCell><TableCell>{u.email}</TableCell><TableCell><Chip label={u.role} size="small" color={u.role === 'admin' ? 'error' : 'default'} /></TableCell><TableCell>{u.active ? 'Ativo' : 'Inativo'}</TableCell><TableCell><Button size="small" onClick={() => toggleAdmin(u.id)}>Toggle Admin</Button></TableCell></TableRow>))}</TableBody></Table></TableContainer>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Usuário Admin</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          <TextField label="Role" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Criar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
