'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid2 as Grid, Button, TextField, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Star, Award } from 'lucide-react';
import { loyaltyApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { LoyaltyAccount } from '@/types';

export default function LoyaltyPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [points, setPoints] = useState(0);

  useEffect(() => { (async () => { const r = await loyaltyApi.getAccount(); setAccount(r.loyaltyAccount || null); setLoading(false); })(); }, []);

  const redeem = async () => { const res = await loyaltyApi.redeem(points); if (res.success) { notify('Pontos resgatados', 'success'); setDialogOpen(false); const r = await loyaltyApi.getAccount(); setAccount(r.loyaltyAccount || null); } else showResponseErrors(res, 'Erro'); };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Fidelização</Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}><Card><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><Star size={32} /><Box><Typography variant="body2" color="text.secondary">Pontos</Typography><Typography variant="h4" fontWeight={700}>{account?.points || 0}</Typography></Box></Box></CardContent></Card></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><Card><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><Award size={32} /><Box><Typography variant="body2" color="text.secondary">Nível</Typography><Typography variant="h4" fontWeight={700}>{account?.tier || 'Bronze'}</Typography></Box></Box></CardContent></Card></Grid>
      </Grid>
      <Button variant="contained" onClick={() => setDialogOpen(true)}>Resgatar Pontos</Button>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Resgatar Pontos</DialogTitle>
        <DialogContent sx={{ mt: 1 }}><TextField label="Pontos" type="number" value={points} onChange={e => setPoints(parseInt(e.target.value))} fullWidth /></DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={redeem}>Resgatar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
