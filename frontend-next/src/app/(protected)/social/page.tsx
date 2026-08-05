'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid2 as Grid, Button, TextField, Avatar, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Heart, MessageCircle, Share2, Plus } from 'lucide-react';
import { socialApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { getInitials, formatDateTime } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { SocialPost } from '@/types';

export default function SocialPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');

  useEffect(() => { (async () => { const r = await socialApi.getFeed(); setPosts(r.posts || []); setLoading(false); })(); }, []);

  const create = async () => { const res = await socialApi.createPost({ postType: 'text', caption, mediaUrl: mediaUrl || undefined }); if (res.success) { notify('Post publicado', 'success'); setDialogOpen(false); setCaption(''); setMediaUrl(''); const r = await socialApi.getFeed(); setPosts(r.posts || []); } else showResponseErrors(res, 'Erro'); };
  const like = async (id: number) => { const res = await socialApi.like(id); if (res.success) { const r = await socialApi.getFeed(); setPosts(r.posts || []); } };
  const share = async (id: number) => { const res = await socialApi.share(id); if (res.success) { notify('Post compartilhado', 'success'); } };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Feed</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Postar</Button>
      </Box>
      <Grid container spacing={2}>
        {posts.map(p => (
          <Grid key={p.id} size={{ xs: 12 }}>
            <Card><CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>{getInitials(p.authorName || '?')}</Avatar>
                <Box><Typography fontWeight={600}>{p.authorName}</Typography><Typography variant="body2" color="text.secondary">{formatDateTime(p.createdAt)}</Typography></Box>
              </Box>
              <Typography sx={{ mb: 2 }}>{p.content}</Typography>
              {p.imageUrl && <Box component="img" src={p.imageUrl} sx={{ width: '100%', borderRadius: 2, mb: 2 }} />}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton size="small" onClick={() => like(p.id)}><Heart size={18} /></IconButton><Typography variant="body2">{p.likes}</Typography>
                <IconButton size="small"><MessageCircle size={18} /></IconButton><Typography variant="body2">{p.comments}</Typography>
                <IconButton size="small" onClick={() => share(p.id)}><Share2 size={18} /></IconButton><Typography variant="body2">{p.shares}</Typography>
              </Box>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Post</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Legenda" multiline rows={4} value={caption} onChange={e => setCaption(e.target.value)} />
          <TextField label="URL da mídia (opcional)" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={create}>Publicar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
