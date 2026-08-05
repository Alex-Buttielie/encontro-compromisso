'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, ListItemAvatar, Avatar, TextField, Button, Divider } from '@mui/material';
import { MessageSquare, Send } from 'lucide-react';
import { chatApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Conversation, Message } from '@/types';

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { const r = await chatApi.getConversations(); setConversations(r.conversations || []); setLoading(false); })(); }, []);

  useEffect(() => { if (selected) (async () => { const r = await chatApi.getMessages(selected.id); setMessages(r.messages || []); })(); }, [selected]);

  const send = async () => { if (!selected || !input.trim()) return; const res = await chatApi.sendMessage(selected.id, input); if (res.success) { setInput(''); const r = await chatApi.getMessages(selected.id); setMessages(r.messages || []); } };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Chat</Typography>
      <Box sx={{ display: 'flex', gap: 2, height: '70vh' }}>
        <Box sx={{ width: 280, borderRight: '1px solid', borderColor: 'divider', overflowY: 'auto' }}>
          <List>{conversations.map(c => (
            <ListItem key={c.id} disablePadding>
              <ListItemButton selected={selected?.id === c.id} onClick={() => setSelected(c)}>
                <ListItemAvatar><Avatar sx={{ bgcolor: 'primary.main' }}>{getInitials(c.participantName || '?')}</Avatar></ListItemAvatar>
                <ListItemText primary={c.participantName} secondary={c.lastMessage?.slice(0, 30)} />
              </ListItemButton>
            </ListItem>
          ))}</List>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selected ? (<>
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>{messages.map(m => (<Box key={m.id} sx={{ mb: 1, textAlign: m.senderId === user?.id ? 'right' : 'left' }}><Box sx={{ display: 'inline-block', p: 1, px: 2, borderRadius: 2, bgcolor: m.senderId === user?.id ? 'primary.main' : 'grey.200', color: m.senderId === user?.id ? 'white' : 'text.primary' }}>{m.content}</Box></Box>))}</Box>
            <Divider /><Box sx={{ display: 'flex', gap: 1, p: 1 }}><TextField size="small" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} sx={{ flex: 1 }} /><Button variant="contained" onClick={send}><Send size={18} /></Button></Box>
          </>) : <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}><MessageSquare size={48} style={{ opacity: 0.2 }} /></Box>}
        </Box>
      </Box>
    </Box>
  );
}
