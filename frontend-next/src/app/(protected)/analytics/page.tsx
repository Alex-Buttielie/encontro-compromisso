'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid2 as Grid } from '@mui/material';
import { DollarSign, Users, CalendarDays, Star } from 'lucide-react';
import { analyticsApi } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { AnalyticsData } from '@/types';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { const r = await analyticsApi.getDashboard(); setData(r.analytics || null); setLoading(false); })(); }, []);

  if (loading) return <LoadingSpinner />;

  const stats = [
    { label: 'Receita total', value: data?.revenue?.toString() || '—', icon: <DollarSign />, color: 'success.main' },
    { label: 'Novos clientes', value: data?.clients?.toString() || '—', icon: <Users />, color: 'info.main' },
    { label: 'Agendamentos', value: data?.appointments?.toString() || '—', icon: <CalendarDays />, color: 'primary.main' },
    { label: 'Taxa de conversão', value: data?.conversionRate?.toString() || '—', icon: <Star />, color: 'warning.main' },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Analytics</Typography>
      <Grid container spacing={3}>
        {stats.map((s, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card><CardContent><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box><Typography variant="body2" color="text.secondary">{s.label}</Typography><Typography variant="h5" fontWeight={700}>{s.value}</Typography></Box>
              <Box sx={{ color: s.color }}>{s.icon}</Box>
            </Box></CardContent></Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
