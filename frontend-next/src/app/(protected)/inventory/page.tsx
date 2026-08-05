'use client';

import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import { Plus } from 'lucide-react';
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
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', sku: '', category: '', unit: 'un', minStock: 0, unitPrice: 0 });

  useEffect(() => {
    (async () => {
      const r = await inventoryApi.getAll();
      setItems(r.products || []);
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach(i => { if (i.category) cats.add(i.category); });
    return Array.from(cats).sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (filterCategory && i.category !== filterCategory) return false;
      if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, filterCategory, search]);

  const totalEstimated = useMemo(() =>
    filtered.reduce((sum, i) => sum + (i.unitPrice || 0), 0),
  [filtered]);

  const save = async () => {
    const res = await inventoryApi.create(form);
    if (res.success) {
      notify('Item criado', 'success');
      setDialogOpen(false);
      const r = await inventoryApi.getAll();
      setItems(r.products || []);
    } else {
      showResponseErrors(res, 'Erro');
    }
  };

  const addStock = async (id: number) => {
    const res = await inventoryApi.addStock(id, 1);
    if (res.success) {
      notify('Estoque atualizado', 'success');
      const r = await inventoryApi.getAll();
      setItems(r.products || []);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Estoque / Orçamento</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Novo Item</Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label="Buscar item"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ minWidth: 250 }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Categoria</InputLabel>
          <Select
            value={filterCategory}
            label="Categoria"
            onChange={e => setFilterCategory(e.target.value)}
          >
            <MenuItem value="">Todas</MenuItem>
            {categories.map(c => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {filtered.length} {filtered.length === 1 ? 'item' : 'itens'}
          </Typography>
          <Typography variant="body2" fontWeight={700} color="primary.main">
            Total: {formatCurrency(totalEstimated)}
          </Typography>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Qtd</TableCell>
              <TableCell>Unidade</TableCell>
              <TableCell>Preço Unit.</TableCell>
              <TableCell>Estoque</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(i => (
              <TableRow key={i.id}>
                <TableCell>{i.name}</TableCell>
                <TableCell>
                  {i.category && (
                    <Chip label={i.category} size="small" variant="outlined" />
                  )}
                </TableCell>
                <TableCell>{i.currentStock ?? 0}</TableCell>
                <TableCell>{i.unit || 'un'}</TableCell>
                <TableCell>{formatCurrency(i.unitPrice)}</TableCell>
                <TableCell>{i.minStock ?? 0}</TableCell>
                <TableCell>
                  <Chip
                    label={i.belowMinimum ? 'Baixo' : 'OK'}
                    size="small"
                    color={i.belowMinimum ? 'error' : 'success'}
                  />
                </TableCell>
                <TableCell>
                  <Button size="small" onClick={() => addStock(i.id)}>+1</Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    Nenhum item encontrado
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Item</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Nome" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <TextField label="SKU" value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} />
          <TextField label="Categoria" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
          <TextField label="Unidade" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} />
          <TextField label="Qtd mínima" type="number" value={form.minStock} onChange={e => setForm(p => ({ ...p, minStock: parseInt(e.target.value) || 0 }))} />
          <TextField label="Preço unitário" type="number" value={form.unitPrice} onChange={e => setForm(p => ({ ...p, unitPrice: parseFloat(e.target.value) || 0 }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={save}>Criar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
