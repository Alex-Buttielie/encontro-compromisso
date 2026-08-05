'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ApiResponse } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useErrorDialog } from '@/contexts/ErrorDialogContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface CrudApi<T> {
  getAll: (...args: any[]) => Promise<Record<string, unknown>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: (data: any) => Promise<ApiResponse>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: (id: number, data: any) => Promise<ApiResponse>;
  delete: (id: number) => Promise<ApiResponse>;
}

interface UseCrudOptions<T> {
  listKey: string;
  entityName: string;
}

export function useCrud<T extends { id: number }>(
  crudApi: CrudApi<T>,
  options: UseCrudOptions<T>
) {
  const { notify } = useToast();
  const { showResponseErrors } = useErrorDialog();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await crudApi.getAll();
    setItems((res as Record<string, unknown>)[options.listKey] as T[] || []);
    setLoading(false);
  }, [crudApi, options.listKey]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditId(null); setDialogOpen(true); };
  const openEdit = (item: T) => { setEditId(item.id); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditId(null); };

  const save = async (form: Partial<T>) => {
    const res = editId
      ? await crudApi.update(editId, form)
      : await crudApi.create(form);
    if (res.success) {
      notify(`${options.entityName} ${editId ? 'atualizado' : 'criado'}`, 'success');
      closeDialog();
      await load();
    } else {
      showResponseErrors(res, `Erro ao ${editId ? 'atualizar' : 'criar'} ${options.entityName.toLowerCase()}`);
    }
    return res;
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const res = await crudApi.delete(deleteId);
    if (res.success) {
      notify(`${options.entityName} excluído`, 'success');
      setItems(prev => prev.filter(i => i.id !== deleteId));
    }
    setDeleteId(null);
  };

  return {
    items,
    setItems,
    loading,
    dialogOpen,
    editId,
    deleteId,
    openCreate,
    openEdit,
    closeDialog,
    save,
    confirmDelete,
    setDeleteId,
    notify,
    reload: load,
  };
}
