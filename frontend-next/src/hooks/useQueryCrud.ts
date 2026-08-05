'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { useToast } from '@/contexts/ToastContext';
import type { ApiResponse } from '@/types';

/**
 * Generic data fetching hook powered by React Query.
 *
 * Replaces the manual useApi hook with cache, refetch, and
 * background synchronization built-in.
 *
 * @param key Query key for caching
 * @param fetcher Async function that returns the data
 * @param options Additional React Query options
 */
export function useFetch<T>(
  key: unknown[],
  fetcher: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T>({
    queryKey: key,
    queryFn: fetcher,
    ...options,
  });
}

/**
 * Generic mutation hook powered by React Query.
 *
 * Replaces the manual useMutation hook with cache invalidation
 * and optimistic update support.
 *
 * @param mutationFn Async function that performs the mutation
 * @param options Additional React Query mutation options
 */
export function useApiMutation<TData = ApiResponse, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> & {
    invalidateKeys?: unknown[][];
    successMessage?: string;
  }
) {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const { invalidateKeys, successMessage, onSuccess: userOnSuccess, onError: userOnError, ...mutationOptions } = (options || {}) as any;

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: (data, variables, context) => {
      if (successMessage) {
        notify(successMessage, 'success');
      }
      if (invalidateKeys) {
        invalidateKeys.forEach((key: unknown[]) => queryClient.invalidateQueries({ queryKey: key }));
      }
      (userOnSuccess as any)?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      notify(message, 'error');
      (userOnError as any)?.(error, variables, context);
    },
    ...mutationOptions,
  });
}

/**
 * CRUD hook powered by React Query.
 *
 * Combines list fetching, create, update, and delete mutations
 * with automatic cache invalidation. Replaces the manual useCrud hook.
 */
export function useCrudQuery<T extends { id: number }>(opts: {
  queryKey: unknown[];
  fetcher: () => Promise<ApiResponse & Record<string, unknown>>;
  listKey: string;
  createFn: (data: Partial<T>) => Promise<ApiResponse>;
  updateFn: (id: number, data: Partial<T>) => Promise<ApiResponse>;
  deleteFn: (id: number) => Promise<ApiResponse>;
  entityName: string;
}) {
  const { queryKey, fetcher, listKey, createFn, updateFn, deleteFn, entityName } = opts;
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const query = useQuery({
    queryKey,
    queryFn: fetcher,
  });

  const items = (query.data?.[listKey] as T[]) || [];

  const createMutation = useMutation({
    mutationFn: (data: Partial<T>) => createFn(data),
    onSuccess: (res, _variables, _context) => {
      if (res.success) {
        notify(`${entityName} criado`, 'success');
        queryClient.invalidateQueries({ queryKey });
      } else {
        notify(res.errors?.join(', ') || 'Erro', 'error');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<T> }) => updateFn(id, data),
    onSuccess: (res, _variables, _context) => {
      if (res.success) {
        notify(`${entityName} atualizado`, 'success');
        queryClient.invalidateQueries({ queryKey });
      } else {
        notify(res.errors?.join(', ') || 'Erro', 'error');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFn(id),
    onSuccess: (res, _variables, _context) => {
      if (res.success) {
        notify(`${entityName} excluído`, 'success');
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  return {
    items,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
