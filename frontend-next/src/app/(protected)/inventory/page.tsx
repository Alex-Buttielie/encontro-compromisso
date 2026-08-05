'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { Plus, Boxes } from 'lucide-react';
import { inventoryApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';
import { formatCurrency } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { InventoryItem } from '@/types';

export default function InventoryPage() {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', minStock: 0, unitPrice: 0 });

  useEffect(() => { (async () => { const r = await inventoryApi.getAll(); setItems(r.products || []); setLoading(false); })(); }, []);

  const save = async () => { const res = await inventoryApi.create(form); if (res.success) { notify('Item criado', 'success'); setDialogOpen(false); const r = await inventoryApi.getAll(); setItems(r.products || []); } else showResponseErrors(res, 'Erro'); };
  const addStock = async (id: number) => { const res = await inventoryApi.addStock(id, 1); if (res.success) { notify('Estoque atualizado', 'success'); const r = await inventoryApi.getAll(); setItems(r.products || []); } };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Estoque</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Novo Item</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table><TableHead><TableRow><TableCell>Nome</TableCell><TableCell>SKU</TableCell><TableCell>Qtd</TableCell><TableCell>Mínimo</TableCell><TableCell>Preço</TableCell><TableCell>Status</TableCell><TableCell>Ações</TableCell></TableRow></TableHead>
          <TableBody>{items.map(i => (<TableRow key={i.id}>
            <TableCell>{i.name}</TableCell><TableCell>{i.sku}</TableCell><TableCell>{i.quantity}</TableCell><TableCell>{i.minQuantity}</TableCell><TableCell>{formatCurrency(i.unitPrice)}</TableCell>
            <TableCell><Chip label={i.quantity <= i.minQuantity ? 'Baixo' : 'OK'} size="small" color={i.quantity <= i.minQuantity ? 'error' : 'success'} /></TableCell>
            <TableCell><Button size="small" onClick={() => addStock(i.id)}>+1</Button></TableCell>
          </TableRow>))}</TableBody></Table>
      </TableContainer>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Item</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Nome" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <TextField label="SKU" value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} />
          <TextField label="Qtd mínima" type="number" value={form.minStock} onChange={e => setForm(p => ({ ...p, minStock: parseInt(e.target.value) }))} />
          <TextField label="Preço unitário" type="number" value={form.unitPrice} onChange={e => setForm(p => ({ ...p, unitPrice: parseFloat(e.target.value) }))} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button variant="contained" onClick={save}>Criar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
