'use client';

import { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid2 as Grid, TextField, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { workApi } from '@/services/api';
import { formatCurrency } from '@/utils/helpers';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { useCrud } from '@/hooks/useCrud';
import type { Work, CustomField } from '@/types';

interface WorkForm {
  title: string;
  description?: string;
  price: number;
  category?: string;
  customFields: CustomField[];
}

export default function WorksPage() {
  const [form, setForm] = useState<WorkForm>({ title: '', price: 0, customFields: [] });
  const crud = useCrud<Work>(workApi, { listKey: 'works', entityName: 'Trabalho' });

  const openCreate = () => { setForm({ title: '', price: 0, customFields: [] }); crud.openCreate(); };
  const openEdit = (w: Work) => {
    setForm({ title: w.title, description: w.description, price: w.price, category: w.category, customFields: w.customFields || [] });
    crud.openEdit(w);
  };

  const addField = () => setForm(p => ({ ...p, customFields: [...p.customFields, { name: '', label: '', type: 'text', required: false, options: [] }] }));
  const updateField = (i: number, key: string, val: string | boolean) => setForm(p => ({ ...p, customFields: p.customFields.map((f, idx) => idx === i ? { ...f, [key]: val } : f) }));
  const removeField = (i: number) => setForm(p => ({ ...p, customFields: p.customFields.filter((_, idx) => idx !== i) }));

  return (
    <Box>
      <PageHeader title="Trabalhos" actionLabel="Novo Trabalho" actionIcon={<Plus size={18} />} onAction={openCreate} />
      {crud.loading ? <LoadingSpinner /> : (
        <Grid container spacing={2}>
          {crud.items.map(w => (
            <Grid key={w.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card><CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography fontWeight={600}>{w.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{w.description}</Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 1 }}>{formatCurrency(w.price)}</Typography>
                    {w.category && <Typography variant="body2" color="text.secondary">{w.category}</Typography>}
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => openEdit(w)}><Edit2 size={16} /></IconButton>
                    <IconButton size="small" color="error" onClick={() => crud.setDeleteId(w.id)}><Trash2 size={16} /></IconButton>
                  </Box>
                </Box>
              </CardContent></Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Dialog open={crud.dialogOpen} onClose={crud.closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{crud.editId ? 'Editar Trabalho' : 'Novo Trabalho'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Título" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <TextField label="Descrição" multiline rows={2} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <TextField label="Preço (R$)" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) }))} />
          <TextField label="Categoria" value={form.category || ''} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2">Campos Personalizados</Typography>
            <Button size="small" startIcon={<Plus size={14} />} onClick={addField}>Adicionar</Button>
          </Box>
          {form.customFields.map((f, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField label="Rótulo" size="small" value={f.label} onChange={e => updateField(i, 'label', e.target.value)} />
              <TextField label="Nome" size="small" value={f.name} onChange={e => updateField(i, 'name', e.target.value)} />
              <IconButton size="small" onClick={() => removeField(i)}><Trash2 size={14} /></IconButton>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={crud.closeDialog}>Cancelar</Button>
          <Button variant="contained" onClick={() => crud.save(form)}>Salvar</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={!!crud.deleteId} title="Excluir trabalho" message="Tem certeza?" variant="error" confirmLabel="Excluir" onConfirm={crud.confirmDelete} onCancel={() => crud.setDeleteId(null)} />
    </Box>
  );
}
