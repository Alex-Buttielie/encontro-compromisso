'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid2 as Grid, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { workApi, workOrderApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/utils/helpers';
import { SearchAutocomplete } from '@/components/SearchAutocomplete';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Work } from '@/types';

export default function ExplorePage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [works, setWorks] = useState<Work[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Work | null>(null);
  const [fieldData, setFieldData] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');

  useEffect(() => { (async () => { setLoading(true); const r = await workApi.explore(debouncedSearch); setWorks(r.works || []); setLoading(false); })(); }, [debouncedSearch]);

  const order = async () => {
    if (!selected) return;
    const res = await workOrderApi.create(selected.id, fieldData, notes);
    if (res.success) { notify('Pedido enviado', 'success'); setSelected(null); setFieldData({}); setNotes(''); }
    else showResponseErrors(res, 'Erro ao enviar pedido');
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Explorar Serviços</Typography>
      <SearchAutocomplete placeholder="Buscar serviços..." options={works.map(w => ({ label: w.title, value: w.id }))} onSearch={q => setSearch(q)} loading={loading} />
      {loading ? <LoadingSpinner /> : (
        <Grid container spacing={2}>
          {works.map(w => (
            <Grid key={w.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card><CardContent>
                <Typography fontWeight={600}>{w.title}</Typography>
                <Typography variant="body2" color="text.secondary">{w.description}</Typography>
                <Typography variant="h6" color="primary" sx={{ mt: 1 }}>{formatCurrency(w.price)}</Typography>
                {w.category && <Typography variant="body2" color="text.secondary">{w.category}</Typography>}
                <Button variant="contained" size="small" sx={{ mt: 1 }} onClick={() => { setSelected(w); setFieldData({}); setNotes(''); }}>Solicitar</Button>
              </CardContent></Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected?.title}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {selected?.customFields?.map(f => <TextField key={f.name} label={f.label} value={fieldData[f.name] || ''} onChange={e => setFieldData(prev => ({ ...prev, [f.name]: e.target.value }))} required={f.required} />)}
          <TextField label="Observações" multiline rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </DialogContent>
        <DialogActions><Button onClick={() => setSelected(null)}>Cancelar</Button><Button variant="contained" onClick={order}>Enviar Pedido</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
