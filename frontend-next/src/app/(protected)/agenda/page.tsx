'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, TextField, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem } from '@mui/material';
import { Plus, CalendarDays } from 'lucide-react';
import { appointmentApi, clientApi, serviceApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { formatDate, getStatusLabel } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Appointment, Client, Service } from '@/types';

export default function AgendaPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Partial<Appointment>>({});

  useEffect(() => {
    (async () => {
      const [c, s] = await Promise.all([clientApi.getAll(1, 100), serviceApi.getAll()]);
      setClients(c.clients || []); setServices(s.services || []);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const r = await appointmentApi.getByDate(date);
      setAppointments(r.appointments || []);
      setLoading(false);
    })();
  }, [date]);

  const save = async () => {
    const res = await appointmentApi.create(form);
    if (res.success) {
      notify('Agendamento criado', 'success');
      setDialogOpen(false);
      const r = await appointmentApi.getByDate(date); setAppointments(r.appointments || []);
    } else showResponseErrors(res, 'Erro ao criar agendamento');
  };

  const handleAction = async (id: number, action: 'confirm' | 'complete' | 'cancel') => {
    const res = await appointmentApi[action](id);
    if (res.success) { notify(`Agendamento ${action === 'confirm' ? 'confirmado' : action === 'complete' ? 'concluído' : 'cancelado'}`, 'success'); const r = await appointmentApi.getByDate(date); setAppointments(r.appointments || []); }
    else showResponseErrors(res, 'Erro ao processar agendamento');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Agenda</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => { setForm({ date, time: '09:00', status: 'scheduled' }); setDialogOpen(true); }}>Novo Agendamento</Button>
      </Box>
      <TextField type="date" value={date} onChange={e => setDate(e.target.value)} sx={{ mb: 2 }} />
      {loading ? <LoadingSpinner /> : appointments.length === 0 ? (
        <Card><CardContent><Box sx={{ textAlign: 'center', py: 4 }}><CalendarDays size={40} style={{ opacity: 0.3 }} /><Typography color="text.secondary" sx={{ mt: 1 }}>Nenhum agendamento para esta data</Typography></Box></CardContent></Card>
      ) : (
        <List>
          {appointments.map(a => (
            <ListItem key={a.id} sx={{ mb: 1, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', pr: 1 }}
              secondaryAction={
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {a.status === 'scheduled' && <Button size="small" variant="outlined" onClick={() => handleAction(a.id, 'confirm')}>Confirmar</Button>}
                  {a.status === 'confirmed' && <Button size="small" variant="outlined" color="success" onClick={() => handleAction(a.id, 'complete')}>Concluir</Button>}
                  {a.status !== 'cancelled' && a.status !== 'completed' && <Button size="small" variant="outlined" color="error" onClick={() => handleAction(a.id, 'cancel')}>Cancelar</Button>}
                </Box>
              }>
              <ListItemText
                primary={`${a.time} — ${a.serviceName || 'Serviço'}`}
                secondary={`${a.clientName || 'Cliente'} • ${getStatusLabel(a.status)}`}
                sx={{ pr: 12 }}
              />
            </ListItem>
          ))}
        </List>
      )}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Agendamento</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField select label="Cliente" value={form.clientId || ''} onChange={e => setForm(p => ({ ...p, clientId: parseInt(e.target.value) }))}>{clients.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</TextField>
          <TextField select label="Serviço" value={form.serviceId || ''} onChange={e => setForm(p => ({ ...p, serviceId: parseInt(e.target.value) }))}>{services.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}</TextField>
          <TextField type="date" label="Data" value={form.date || date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          <TextField type="time" label="Hora" value={form.time || '09:00'} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Agendar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
