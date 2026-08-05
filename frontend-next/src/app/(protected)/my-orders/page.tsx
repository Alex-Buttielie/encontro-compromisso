'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Chip, List, ListItem, ListItemText } from '@mui/material';
import { workOrderApi } from '@/services/api';
import { getStatusLabel } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { WorkOrder } from '@/types';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { const r = await workOrderApi.getPlaced(); setOrders(r.orders || []); setLoading(false); })(); }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Meus Pedidos</Typography>
      {orders.length === 0 ? <Typography color="text.secondary">Nenhum pedido</Typography> : (
        <List>
          {orders.map(o => (
            <ListItem key={o.id} sx={{ mb: 1, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <ListItemText primary={o.workTitle || `Pedido #${o.id}`} secondary={o.notes || ''} />
              <Chip label={getStatusLabel(o.status)} size="small" color={o.status === 'completed' ? 'success' : o.status === 'cancelled' || o.status === 'rejected' ? 'default' : 'primary'} />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
