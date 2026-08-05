'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Avatar, List, ListItem, ListItemText, ListItemAvatar, Chip } from '@mui/material';
import { Plus, UserPlus } from 'lucide-react';
import { employeeApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { getInitials } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Employee } from '@/types';

export default function EmployeesPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'assistant' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('assistant');

  useEffect(() => { (async () => { const r = await employeeApi.getAll(); setEmployees(r.employees || []); setLoading(false); })(); }, []);

  const save = async () => { const res = await employeeApi.create(form); if (res.success) { notify('Funcionário adicionado', 'success'); setDialogOpen(false); const r = await employeeApi.getAll(); setEmployees(r.employees || []); } else showResponseErrors(res, 'Erro'); };
  const invite = async () => { const res = await employeeApi.invite(inviteEmail, inviteRole); if (res.success) { notify('Convite enviado', 'success'); setInviteOpen(false); } else showResponseErrors(res, 'Erro'); };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Equipe</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}><Button variant="outlined" startIcon={<UserPlus size={18} />} onClick={() => setInviteOpen(true)}>Convidar</Button><Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Adicionar</Button></Box>
      </Box>
      <List>
        {employees.map(e => (
          <ListItem key={e.id} sx={{ mb: 1, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <ListItemAvatar><Avatar sx={{ bgcolor: 'primary.main' }}>{getInitials(e.name)}</Avatar></ListItemAvatar>
            <ListItemText primary={e.name} secondary={e.email} />
            <Chip label={e.role} size="small" color="primary" />
          </ListItem>
        ))}
      </List>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Funcionário</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Nome" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <TextField label="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          <TextField select label="Função" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}><MenuItem value="dentist">Dentista</MenuItem><MenuItem value="assistant">Assistente</MenuItem><MenuItem value="receptionist">Recepcionista</MenuItem><MenuItem value="manager">Gerente</MenuItem><MenuItem value="finance">Financeiro</MenuItem><MenuItem value="other">Outro</MenuItem></TextField>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Adicionar</Button></DialogActions>
      </Dialog>
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Convidar Funcionário</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
          <TextField select label="Função" value={inviteRole} onChange={e => setInviteRole(e.target.value)}><MenuItem value="dentist">Dentista</MenuItem><MenuItem value="assistant">Assistente</MenuItem><MenuItem value="receptionist">Recepcionista</MenuItem><MenuItem value="manager">Gerente</MenuItem><MenuItem value="finance">Financeiro</MenuItem><MenuItem value="other">Outro</MenuItem></TextField>
        </DialogContent>
        <DialogActions><Button onClick={() => setInviteOpen(false)}>Cancelar</Button><Button variant="contained" onClick={invite}>Enviar Convite</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
