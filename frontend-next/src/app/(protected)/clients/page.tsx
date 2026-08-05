'use client';

import { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid2 as Grid, TextField, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Avatar } from '@mui/material';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { clientApi } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';
import { getInitials } from '@/utils/helpers';
import { AddressFields } from '@/components/AddressFields';
import { SearchAutocomplete } from '@/components/SearchAutocomplete';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageHeader } from '@/components/PageHeader';
import { useCrudQuery, useFetch } from '@/hooks/useQueryCrud';
import type { Client } from '@/types';

const clientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().optional(),
  phone: z.string().optional(),
  cep: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: searchData } = useFetch(
    ['clients', 'search', debouncedSearch],
    () => debouncedSearch ? clientApi.search(debouncedSearch) : clientApi.getAll(1, 100),
  );

  const items = (searchData?.clients as Client[]) || [];

  const { create, update, remove, isCreating, isUpdating } = useCrudQuery<Client>({
    queryKey: ['clients'],
    fetcher: () => clientApi.getAll(1, 100),
    listKey: 'clients',
    createFn: (data) => clientApi.create(data),
    updateFn: (id, data) => clientApi.update(id, data),
    deleteFn: (id) => clientApi.delete(id),
    entityName: 'Cliente',
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: '', email: '', phone: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', notes: '' },
  });

  const openCreate = () => {
    reset({ name: '', email: '', phone: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', notes: '' });
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = (c: Client) => {
    reset({ name: c.name, email: c.email, phone: c.phone, cep: c.cep, rua: c.rua, numero: c.numero, complemento: c.complemento, bairro: c.bairro, cidade: c.cidade, estado: c.estado, notes: c.notes });
    setEditId(c.id);
    setDialogOpen(true);
  };

  const onSubmit = async (data: ClientFormData) => {
    if (editId) {
      await update({ id: editId, data });
    } else {
      await create(data);
    }
    setDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await remove(deleteId);
    setDeleteId(null);
  };

  return (
    <Box>
      <PageHeader title="Clientes" actionLabel="Novo Cliente" actionIcon={<Plus size={18} />} onAction={openCreate} />
      <SearchAutocomplete placeholder="Buscar clientes..." options={items.map(c => ({ label: c.name, value: c.id }))} onSearch={q => setSearch(q)} loading={false} />
      {items.length === 0 ? (
        <Card><CardContent><Box sx={{ textAlign: 'center', py: 4 }}><Users size={40} style={{ opacity: 0.3 }} /><Typography color="text.secondary" sx={{ mt: 1 }}>Nenhum cliente encontrado</Typography></Box></CardContent></Card>
      ) : (
        <Grid container spacing={2}>
          {items.map(c => (
            <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card><CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>{getInitials(c.name)}</Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={600}>{c.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{c.email || c.phone || 'Sem contato'}</Typography>
                  </Box>
                  <IconButton size="small" onClick={() => openEdit(c)}><Edit2 size={16} /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setDeleteId(c.id)}><Trash2 size={16} /></IconButton>
                </Box>
              </CardContent></Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{editId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Controller name="name" control={control} render={({ field }) => (
              <TextField label="Nome" {...field} error={!!errors.name} helperText={errors.name?.message} />
            )} />
            <Controller name="email" control={control} render={({ field }) => (
              <TextField label="E-mail" {...field} />
            )} />
            <Controller name="phone" control={control} render={({ field }) => (
              <TextField label="Telefone" {...field} />
            )} />
            <Controller name="cep" control={control} render={({ field }) => (
              <AddressFields values={{ cep: field.value }} onChange={(f, v) => field.onChange(v)} />
            )} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={isCreating || isUpdating}>Salvar</Button>
          </DialogActions>
        </form>
      </Dialog>
      <ConfirmDialog open={!!deleteId} title="Excluir cliente" message="Tem certeza?" variant="error" confirmLabel="Excluir" onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
    </Box>
  );
}
