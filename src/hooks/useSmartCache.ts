'use client';

import { useEffect, useState } from 'react';
import { smartCache } from '@/lib/cache-strategy';

export function useSmartCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    staleAfter?: number;
    expireAfter?: number;
    fallback?: T;
  }
) {
  const [data, setData] = useState<T | undefined>(options?.fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    smartCache.get(key, fetcher, options)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [key]);
  
  return { data, loading, error };
}
