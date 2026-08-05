'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Generic data fetching hook with loading/error states.
 *
 * Implements the Command pattern: the fetcher function is encapsulated
 * as an async operation, and the hook manages all state transitions
 * (idle → loading → success/error) transparently.
 *
 * @param fetcher Async function that returns the data
 * @param deps Dependency array for refetching when values change
 * @param options Configuration (enabled, refetchInterval)
 *
 * @example
 * const { data, loading, error, refetch } = useApi(
 *   () => clientApi.getAll(),
 *   [],
 *   { enabled: !!user }
 * );
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options: UseApiOptions = {}
): UseApiResult<T> {
  const { enabled = true, refetchInterval } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setLoading(false);
      }
    }
  }, [enabled, fetcher]);

  useEffect(() => {
    mountedRef.current = true;
    execute();
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!refetchInterval || !enabled) return;
    const interval = setInterval(() => execute(), refetchInterval);
    return () => clearInterval(interval);
  }, [refetchInterval, enabled, execute]);

  return { data, loading, error, refetch: execute };
}
