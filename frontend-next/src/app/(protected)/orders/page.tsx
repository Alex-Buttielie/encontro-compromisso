'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText } from '@mui/material';
import { workOrderApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { getStatusLabel } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { WorkOrder } from '@/types';

export default function OrdersPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { const r = await workOrderApi.getReceived(); setOrders(r.orders || []); setLoading(false); })(); }, []);

  const handleAction = async (id: number, action: 'accept' | 'reject' | 'complete' | 'cancel') => {
    const res = await workOrderApi[action](id);
    if (res.success) { notify(`Pedido ${action === 'accept' ? 'aceito' : action === 'reject' ? 'rejeitado' : action === 'complete' ? 'concluído' : 'cancelado'}`, 'success'); const r = await workOrderApi.getReceived(); setOrders(r.orders || []); }
    else showResponseErrors(res, 'Erro ao processar pedido');
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Pedidos Recebidos</Typography>
      {loading ? <LoadingSpinner /> : orders.length === 0 ? <Typography color="text.secondary">Nenhum pedido recebido</Typography> : (
        <List>
          {orders.map(o => (
            <ListItem key={o.id} sx={{ mb: 1, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', pr: 1 }}
              secondaryAction={
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {o.status === 'pending' && <><Button size="small" variant="contained" color="success" onClick={() => handleAction(o.id, 'accept')}>Aceitar</Button><Button size="small" variant="outlined" color="error" onClick={() => handleAction(o.id, 'reject')}>Rejeitar</Button></>}
                  {o.status === 'accepted' && <Button size="small" variant="contained" onClick={() => handleAction(o.id, 'complete')}>Concluir</Button>}
                  {o.status !== 'cancelled' && o.status !== 'completed' && <Button size="small" variant="outlined" onClick={() => handleAction(o.id, 'cancel')}>Cancelar</Button>}
                </Box>
              }>
              <ListItemText
                primary={o.workTitle || `Pedido #${o.id}`}
                secondary={`${o.clientName || 'Cliente'} • ${getStatusLabel(o.status)}`}
                sx={{ pr: 14 }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
