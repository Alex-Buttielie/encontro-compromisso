'use client';

import { useState, useCallback, useRef } from 'react';
import type { ApiResponse } from '@/types';

interface UseMutationResult<T> {
  mutate: (data?: unknown) => Promise<ApiResponse & T>;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Hook for write operations (create/update/delete).
 *
 * Implements the Command pattern: encapsulates a mutation as an object,
 * tracking loading and error states. Unlike useApi, it does not execute
 * automatically — the caller triggers it via `mutate()`.
 *
 * @param mutator Async function that performs the mutation
 *
 * @example
 * const { mutate, loading, error } = useMutation(
 *   (data) => clientApi.create(data)
 * );
 * const res = await mutate({ name: 'João' });
 * if (res.success) notify('Cliente criado', 'success');
 */
export function useMutation<T = Record<string, unknown>>(
  mutator: (data?: unknown) => Promise<ApiResponse & T>
): UseMutationResult<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const mutate = useCallback(async (data?: unknown) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutator(data);
      if (mountedRef.current) {
        setLoading(false);
        if (!result.success && result.errors) {
          setError(result.errors.join(', '));
        }
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setLoading(false);
      }
      return { success: false, errors: ['Erro de conexão'] } as ApiResponse & T;
    }
  }, [mutator]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return { mutate, loading, error, reset };
}
