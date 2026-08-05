'use client';

import { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid2 as Grid, TextField, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Switch, FormControlLabel, Autocomplete } from '@mui/material';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { serviceApi } from '@/services/api';
import { formatCurrency } from '@/utils/helpers';
import { SERVICE_CATEGORIES } from '@/config/autocompletes';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { useCrud } from '@/hooks/useCrud';
import type { Service } from '@/types';

export default function ServicesPage() {
  const [form, setForm] = useState<Partial<Service>>({});
  const [categoryFilter, setCategoryFilter] = useState<typeof SERVICE_CATEGORIES[number] | null>(null);

  const crud = useCrud<Service>(serviceApi, { listKey: 'services', entityName: 'Serviço' });

  const filteredServices = categoryFilter
    ? crud.items.filter(s => s.category === categoryFilter.value || s.name.toLowerCase().includes(categoryFilter.label.toLowerCase()))
    : crud.items;

  const openCreate = () => { setForm({ duration: 30, price: 0 }); crud.openCreate(); };
  const openEdit = (s: Service) => { setForm(s); crud.openEdit(s); };
  const handleSave = () => crud.save(form);

  return (
    <Box>
      <PageHeader title="Serviços" actionLabel="Novo Serviço" actionIcon={<Plus size={18} />} onAction={openCreate} />

      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <Autocomplete
          options={SERVICE_CATEGORIES}
          value={categoryFilter}
          onChange={(_, v) => setCategoryFilter(v)}
          getOptionLabel={o => o.label}
          renderInput={params => <TextField {...params} label="Filtrar por categoria" size="small" />}
          sx={{ minWidth: 250 }}
          isOptionEqualToValue={(a, b) => a.value === b.value}
        />
      </Box>

      {crud.loading ? <LoadingSpinner /> : (
        <Grid container spacing={2}>
          {filteredServices.map(s => (
            <Grid key={s.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography fontWeight={600}>{s.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{s.description}</Typography>
                      <Typography variant="h6" color="primary" sx={{ mt: 1 }}>{formatCurrency(s.price)}</Typography>
                      <Typography variant="body2" color="text.secondary">{s.duration} min</Typography>
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => openEdit(s)}><Edit2 size={16} /></IconButton>
                      <IconButton size="small" color="error" onClick={() => crud.setDeleteId(s.id)}><Trash2 size={16} /></IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={crud.dialogOpen} onClose={crud.closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{crud.editId ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Nome" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <Autocomplete
            freeSolo
            options={SERVICE_CATEGORIES}
            value={SERVICE_CATEGORIES.find(c => c.value === form.category) || null}
            onChange={(_, v) => {
              const val = typeof v === 'string' ? v : v?.value || '';
              setForm(p => ({ ...p, category: val }));
            }}
            getOptionLabel={o => (typeof o === 'string' ? o : o.label)}
            renderInput={params => <TextField {...params} label="Categoria" />}
            isOptionEqualToValue={(a, b) => a.value === b?.value}
          />
          <TextField label="Descrição" multiline rows={2} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <TextField label="Preço (R$)" type="number" value={form.price || 0} onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) }))} />
          <TextField label="Duração (min)" type="number" value={form.duration || 30} onChange={e => setForm(p => ({ ...p, duration: parseInt(e.target.value) }))} />
          <FormControlLabel
            control={<Switch checked={!!form.homeAttendance} onChange={e => setForm(p => ({ ...p, homeAttendance: e.target.checked }))} />}
            label="Atendimento domiciliar"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={crud.closeDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Salvar</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!crud.deleteId}
        title="Excluir serviço"
        message="Tem certeza?"
        variant="error"
        confirmLabel="Excluir"
        onConfirm={crud.confirmDelete}
        onCancel={() => crud.setDeleteId(null)}
      />
    </Box>
  );
}
