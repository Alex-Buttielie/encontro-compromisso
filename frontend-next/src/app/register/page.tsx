'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Button, Card, CardContent, TextField, Typography, Alert, ToggleButtonGroup, ToggleButton, Autocomplete, Checkbox, FormControlLabel, Link as MuiLink } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { PROFESSIONS } from '@/config/autocompletes';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Input } from '@/components/form-controls';

export default function RegisterPage() {
  const { register } = useAuth();
  const { notify } = useToast();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('provider');
  const [profession, setProfession] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    const res = await register({ name, email, password, role, profession: role === 'provider' ? profession : undefined, termsAccepted: acceptTerms, privacyAccepted: acceptPrivacy });
    setLoading(false);
    if (res.success) {
      notify('Cadastro realizado com sucesso', 'success');
      router.push(role === 'provider' ? '/dashboard' : '/home');
    } else {
      setErrors(res.errors || ['Erro ao cadastrar']);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2, position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}><ThemeToggle /></Box>
      <Card sx={{ maxWidth: 480, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} align="center" gutterBottom>Profissional OS</Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>Criar sua conta</Typography>
          {errors.length > 0 && <Alert severity="error" sx={{ mb: 2 }}>{errors.join(', ')}</Alert>}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <ToggleButtonGroup value={role} exclusive onChange={(_, v) => v && setRole(v)} fullWidth size="small">
              <ToggleButton value="provider">Prestador</ToggleButton>
              <ToggleButton value="client">Cliente</ToggleButton>
            </ToggleButtonGroup>
            <Input label="Nome completo" value={name} onChange={e => setName(e.target.value)} required />
            <Input label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            {role === 'provider' && (
              <Autocomplete freeSolo options={PROFESSIONS} value={profession} onInputChange={(_, v) => setProfession(v)}
                renderInput={params => <TextField {...params} label="Profissão" placeholder="Ex: Cabeleireiro, Eletricista..." />} />
            )}
            <FormControlLabel control={<Checkbox checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} />} label={<Typography variant="body2">Li e aceito os <MuiLink href="#" onClick={e => e.preventDefault()}>Termos de Uso</MuiLink></Typography>} />
            <FormControlLabel control={<Checkbox checked={acceptPrivacy} onChange={e => setAcceptPrivacy(e.target.checked)} />} label={<Typography variant="body2">Li e aceito a <MuiLink href="#" onClick={e => e.preventDefault()}>Política de Privacidade</MuiLink></Typography>} />
            <Button type="submit" variant="contained" size="large" disabled={loading || !acceptTerms || !acceptPrivacy} fullWidth>{loading ? 'Cadastrando...' : 'Cadastrar'}</Button>
          </Box>
          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Já tem conta? <Link href="/login" style={{ color: 'inherit', fontWeight: 600 }}>Entrar</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
