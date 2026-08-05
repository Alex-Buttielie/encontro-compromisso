'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid2 as Grid, Button } from '@mui/material';
import { Briefcase, CalendarDays, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentApi, workOrderApi } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Appointment, WorkOrder } from '@/types';

export default function HomePage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    const [a, o] = await Promise.all([appointmentApi.getUpcoming(), workOrderApi.getPlaced()]);
    setAppointments(a.appointments || []); setOrders(o.orders || []); setLoading(false);
  })(); }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Olá, {user?.name?.split(' ')[0]}!</Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><Briefcase /><Box><Typography variant="body2" color="text.secondary">Próximos agendamentos</Typography><Typography variant="h5">{appointments.length}</Typography></Box></Box></CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><ShoppingCart /><Box><Typography variant="body2" color="text.secondary">Meus pedidos</Typography><Typography variant="h5">{orders.length}</Typography></Box></Box></CardContent></Card>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Próximos Agendamentos</Typography>
            {appointments.length === 0 ? <Typography color="text.secondary">Nenhum agendamento</Typography> : appointments.slice(0, 5).map(a => <Box key={a.id} sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}><Typography fontWeight={500}>{a.serviceName}</Typography><Typography variant="body2" color="text.secondary">{a.date} às {a.time}</Typography></Box>)}
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Meus Pedidos</Typography>
            {orders.length === 0 ? <Typography color="text.secondary">Nenhum pedido</Typography> : orders.slice(0, 5).map(o => <Box key={o.id} sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}><Typography fontWeight={500}>{o.workTitle}</Typography><Typography variant="body2" color="text.secondary">{o.status}</Typography></Box>)}
          </CardContent></Card>
        </Grid>
      </Grid>
      <Box sx={{ mt: 3 }}><Button variant="contained" component={Link} href="/explore">Explorar Serviços</Button></Box>
    </Box>
  );
}
