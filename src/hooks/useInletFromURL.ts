'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppState } from '@/store/appState';

export function useInletFromURL() {
  const searchParams = useSearchParams();
  const { setSelectedInletId } = useAppState();
  
  useEffect(() => {
    // Read inlet from URL on mount
    const inletFromURL = searchParams.get('inlet');
    if (inletFromURL) {
      setSelectedInletId(inletFromURL);
    }
  }, [searchParams, setSelectedInletId]);
}
