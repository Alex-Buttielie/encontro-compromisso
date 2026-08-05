'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid2 as Grid, TextField, Button, Avatar, Divider, Autocomplete } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { AddressFields } from '@/components/AddressFields';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getInitials } from '@/utils/helpers';
import { PROFESSIONS } from '@/config/autocompletes';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({
      name: user.name || '', email: user.email || '', phone: user.phone || '',
      profession: user.profession || '', bio: user.bio || '',
      cep: user.cep || '', rua: user.rua || '', numero: user.numero || '',
      complemento: user.complemento || '', bairro: user.bairro || '',
      cidade: user.cidade || '', estado: user.estado || '',
    });
  }, [user]);

  if (!user) return <LoadingSpinner />;

  const setField = (f: string, v: string) => setForm(prev => ({ ...prev, [f]: v }));

  const save = async () => {
    setSaving(true);
    const res = await updateProfile(form);
    setSaving(false);
    if (res.success) notify('Perfil atualizado', 'success');
    else showResponseErrors(res, 'Erro');
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Perfil</Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card><CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 32, mx: 'auto', mb: 2 }}>{getInitials(user.name)}</Avatar>
            <Typography variant="h6">{user.name}</Typography>
            <Typography color="text.secondary">{user.email}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{user.role === 'provider' ? 'Prestador' : 'Cliente'}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Dados Pessoais</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Nome" value={form.name || ''} onChange={e => setField('name', e.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="E-mail" value={form.email || ''} onChange={e => setField('email', e.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Telefone" value={form.phone || ''} onChange={e => setField('phone', e.target.value)} /></Grid>
              {user.role === 'provider' && <Grid size={{ xs: 12, sm: 6 }}><Autocomplete freeSolo options={PROFESSIONS} value={form.profession || null} onInputChange={(_, v) => setField('profession', v)} renderInput={params => <TextField {...params} label="Profissão" />} /></Grid>}
              <Grid size={{ xs: 12 }}><TextField label="Bio" multiline rows={2} value={form.bio || ''} onChange={e => setField('bio', e.target.value)} /></Grid>
            </Grid>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>Endereço</Typography>
            <AddressFields values={form} onChange={setField} />
            <Box sx={{ mt: 3 }}><Button variant="contained" onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Alterações'}</Button></Box>
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
}
