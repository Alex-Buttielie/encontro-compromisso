'use client';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'error' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', variant = 'primary', onConfirm, onCancel }: ConfirmDialogProps) {
  const color = variant === 'error' ? 'error' : variant === 'warning' ? 'warning' : 'primary';
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-desc">
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent><DialogContentText id="confirm-dialog-desc">{message}</DialogContentText></DialogContent>
      <DialogActions>
        <Button onClick={onCancel} aria-label={cancelLabel}>{cancelLabel}</Button>
        <Button onClick={onConfirm} variant="contained" color={color} aria-label={confirmLabel}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}
