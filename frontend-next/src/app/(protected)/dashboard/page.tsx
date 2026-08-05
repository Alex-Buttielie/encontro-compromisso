'use client';

import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Grid2 as Grid, Typography, Chip, List, ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';
import { DollarSign, Users, Wrench, ShoppingCart, CalendarDays } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentApi, clientApi, serviceApi, workOrderApi, transactionApi } from '@/services/api';
import { formatCurrency, formatDate, getInitials } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorBanner } from '@/components/ErrorBanner';
import type { Appointment, Client, WorkOrder, FinancialSummary } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [pendingOrders, setPendingOrders] = useState<WorkOrder[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);

  useEffect(() => {
    const load = async () => {
      const [apptRes, clientRes, orderRes, summaryRes] = await Promise.all([
        appointmentApi.getUpcoming(), clientApi.getAll(1, 5),
        workOrderApi.getReceived(), transactionApi.getSummary(),
      ]);
      if (apptRes.success) setAppointments(apptRes.appointments || []);
      if (clientRes.success) setClients(clientRes.clients || []);
      if (orderRes.success) setPendingOrders((orderRes.orders || []).filter(o => o.status === 'pending'));
      if (summaryRes.success) setSummary(summaryRes.summary || null);
      if (!apptRes.success && !clientRes.success) setError('Erro ao carregar dados');
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  const stats = [
    { label: 'Receita do Mês', value: summary ? formatCurrency(summary.monthlyIncome || 0) : '—', icon: <DollarSign />, color: 'success.main' },
    { label: 'Total de Clientes', value: clients.length, icon: <Users />, color: 'info.main' },
    { label: 'Próximos Agendamentos', value: appointments.length, icon: <CalendarDays />, color: 'primary.main' },
    { label: 'Pedidos Pendentes', value: pendingOrders.length, icon: <ShoppingCart />, color: 'warning.main' },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Dashboard</Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((s, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card><CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>{s.value}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: s.color, color: 'white' }}>{s.icon}</Avatar>
              </Box>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Próximos Agendamentos</Typography>
            {appointments.length === 0 ? <Typography color="text.secondary">Nenhum agendamento próximo</Typography> : (
              <List>
                {appointments.slice(0, 5).map(a => (
                  <ListItem key={a.id}>
                    <ListItemAvatar><Avatar><CalendarDays size={18} /></Avatar></ListItemAvatar>
                    <ListItemText primary={a.serviceName || `Agendamento #${a.id}`} secondary={`${formatDate(a.date)} — ${a.time}`} />
                    <Chip label={a.status} size="small" color={a.status === 'confirmed' ? 'success' : 'default'} />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Clientes Recentes</Typography>
            {clients.length === 0 ? <Typography color="text.secondary">Nenhum cliente ainda</Typography> : (
              <List>
                {clients.slice(0, 5).map(c => (
                  <ListItem key={c.id}>
                    <ListItemAvatar><Avatar sx={{ bgcolor: 'primary.main' }}>{getInitials(c.name)}</Avatar></ListItemAvatar>
                    <ListItemText primary={c.name} secondary={c.email || c.phone} />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
}
