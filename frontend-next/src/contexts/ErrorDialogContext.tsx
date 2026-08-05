'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Alert, AlertTitle, Stack } from '@mui/material';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

type ErrorSeverity = 'error' | 'warning' | 'info' | 'success';

interface ErrorDialogState {
  open: boolean;
  title: string;
  errors: string[];
  severity: ErrorSeverity;
}

interface ErrorDialogContextType {
  showErrorDialog: (errors: string[] | string, options?: { title?: string; severity?: ErrorSeverity }) => void;
  showResponseErrors: (response: { success?: boolean; errors?: string[] }, fallbackMessage?: string) => boolean;
  closeDialog: () => void;
}

const ErrorDialogContext = createContext<ErrorDialogContextType | null>(null);

const severityConfig: Record<ErrorSeverity, { icon: ReactNode; color: 'error' | 'warning' | 'info' | 'success'; titleColor: string }> = {
  error: { icon: <XCircle size={28} />, color: 'error', titleColor: 'error.main' },
  warning: { icon: <AlertTriangle size={28} />, color: 'warning', titleColor: 'warning.main' },
  info: { icon: <Info size={28} />, color: 'info', titleColor: 'info.main' },
  success: { icon: <CheckCircle size={28} />, color: 'success', titleColor: 'success.main' },
};

export function ErrorDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ErrorDialogState>({
    open: false,
    title: '',
    errors: [],
    severity: 'error',
  });

  const closeDialog = useCallback(() => {
    setDialog(prev => ({ ...prev, open: false }));
  }, []);

  const showErrorDialog = useCallback((
    errors: string[] | string,
    options?: { title?: string; severity?: ErrorSeverity },
  ) => {
    const errorList = Array.isArray(errors) ? errors : [errors];
    const severity = options?.severity || 'error';
    const title = options?.title || getDefaultTitle(severity);
    setDialog({ open: true, title, errors: errorList, severity });
  }, []);

  const showResponseErrors = useCallback((
    response: { success?: boolean; errors?: string[] },
    fallbackMessage?: string,
  ): boolean => {
    if (response.success) return false;
    const errors = response.errors?.length ? response.errors : [fallbackMessage || 'Ocorreu um erro inesperado'];
    const severity = inferSeverity(errors);
    const title = getTitleForErrors(errors);
    setDialog({ open: true, title, errors, severity });
    return true;
  }, []);

  const config = severityConfig[dialog.severity];

  return (
    <ErrorDialogContext.Provider value={{ showErrorDialog, showResponseErrors, closeDialog }}>
      {children}
      <Dialog
        open={dialog.open}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden' } }}
      >
        <Box sx={{ borderBottom: `3px solid`, borderColor: `${config.color}.main` }}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1.5 }}>
            <Box sx={{ color: config.titleColor, display: 'flex' }}>{config.icon}</Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: config.titleColor }}>
              {dialog.title}
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button onClick={closeDialog} sx={{ minWidth: 32, width: 32, height: 32, p: 0, color: 'text.secondary' }}>
              <X size={18} />
            </Button>
          </DialogTitle>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          {dialog.errors.length === 1 ? (
            <Alert severity={dialog.severity} sx={{ alignItems: 'center' }}>
              <Typography>{dialog.errors[0]}</Typography>
            </Alert>
          ) : (
            <Stack spacing={1}>
              {dialog.errors.map((err, i) => (
                <Alert key={i} severity={dialog.severity} icon={false} sx={{ pl: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ color: config.titleColor, mt: 0.3, fontSize: '0.75rem', fontWeight: 700 }}>{i + 1}.</Box>
                    <Typography variant="body2">{err}</Typography>
                  </Box>
                </Alert>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button variant="contained" onClick={closeDialog} color={config.color} size="small">
            Entendi
          </Button>
        </DialogActions>
      </Dialog>
    </ErrorDialogContext.Provider>
  );
}

function getDefaultTitle(severity: ErrorSeverity): string {
  switch (severity) {
    case 'error': return 'Erro de Validação';
    case 'warning': return 'Atenção';
    case 'info': return 'Informação';
    case 'success': return 'Sucesso';
  }
}

function inferSeverity(errors: string[]): ErrorSeverity {
  const joined = errors.join(' ').toLowerCase();
  if (joined.includes('não encontrado') || joined.includes('nao encontrado')) return 'warning';
  if (joined.includes('já') || joined.includes('ja') || joined.includes('expirad')) return 'warning';
  if (joined.includes('conexão') || joined.includes('conexao') || joined.includes('servidor')) return 'error';
  return 'error';
}

function getTitleForErrors(errors: string[]): string {
  const joined = errors.join(' ').toLowerCase();
  if (joined.includes('não encontrado') || joined.includes('nao encontrado')) return 'Item Não Encontrado';
  if (joined.includes('expirad')) return 'Item Expirado';
  if (joined.includes('não autorizado') || joined.includes('nao autorizado')) return 'Não Autorizado';
  if (joined.includes('conexão') || joined.includes('conexao')) return 'Erro de Conexão';
  if (errors.length > 1) return 'Múltiplos Erros de Validação';
  return 'Erro de Validação';
}

export function useErrorDialog() {
  const ctx = useContext(ErrorDialogContext);
  if (!ctx) throw new Error('useErrorDialog must be used within ErrorDialogProvider');
  return ctx;
}
