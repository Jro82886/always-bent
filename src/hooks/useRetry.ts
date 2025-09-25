'use client';

import { useCallback, useState } from 'react';
import { SmartRetry } from '@/lib/smart-retry';
import type { RetryOptions } from '@/lib/smart-retry';

export function useRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [attempts, setAttempts] = useState(0);
  
  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAttempts(0);
    
    try {
      const result = await SmartRetry.execute(
        operation,
        {
          ...options,
          onRetry: (err, attempt) => {
            setAttempts(attempt);
            options?.onRetry?.(err, attempt);
          },
        }
      );
      setData(result);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [operation, options]);
  
  return { execute, loading, error, data, attempts };
}
