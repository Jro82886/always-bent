'use client';

import { useEffect } from 'react';
import { useAppState } from '@/lib/store';

export function useInletFromURL() {
  const { setSelectedInletId } = useAppState();
  
  useEffect(() => {
    // Read inlet from URL on mount - client side only
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const inletFromURL = params.get('inlet');
      if (inletFromURL) {
        setSelectedInletId(inletFromURL);
      }
    }
  }, [setSelectedInletId]);
}
