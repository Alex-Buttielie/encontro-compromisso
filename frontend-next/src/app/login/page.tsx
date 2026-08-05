'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Button, Card, CardContent, Typography, Alert, IconButton } from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Input } from '@/components/form-controls';

export default function LoginPage() {
  const { login } = useAuth();
  const { notify } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      notify('Login realizado com sucesso', 'success');
      router.push(res.user?.role === 'provider' ? '/dashboard' : '/home');
    } else {
      setErrors(res.errors || ['Erro ao fazer login']);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2, position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}><ThemeToggle /></Box>
      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} align="center" gutterBottom>Profissional OS</Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>Bem-vindo de volta</Typography>
          {errors.length > 0 && <Alert severity="error" sx={{ mb: 2 }}>{errors.join(', ')}</Alert>}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Input label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            <div style={{ position: 'relative' }}>
              <Input label="Senha" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                sx={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </IconButton>
            </div>
            <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth sx={{ mt: 1 }}>{loading ? 'Entrando...' : 'Entrar'}</Button>
          </Box>
          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Não tem conta? <Link href="/register" style={{ color: 'inherit', fontWeight: 600 }}>Cadastre-se</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
