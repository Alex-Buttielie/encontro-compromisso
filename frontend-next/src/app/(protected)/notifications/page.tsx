'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemIcon, Button } from '@mui/material';
import { Bell } from 'lucide-react';
import { notificationApi } from '@/services/api';
import { formatDateTime } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Notification } from '@/types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { const r = await notificationApi.getAll(); setNotifications(r.notifications || []); setLoading(false); })(); }, []);

  const markRead = async (id: number) => { await notificationApi.markRead(id); setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)); };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Notificações</Typography>
      <List>{notifications.map(n => (
        <ListItem key={n.id} sx={{ mb: 1, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', opacity: n.read ? 0.6 : 1, pr: 1 }}
          secondaryAction={!n.read && <Button size="small" onClick={() => markRead(n.id)}>Marcar lida</Button>}>
          <ListItemIcon><Bell size={20} /></ListItemIcon>
          <ListItemText primary={n.title} secondary={formatDateTime(n.createdAt)} sx={{ pr: 10 }} />
        </ListItem>
      ))}</List>
    </Box>
  );
}
