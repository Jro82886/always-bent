'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { cleanupMapResources } from '@/lib/utils/mapCleanup';

/**
 * Hook to ensure stable tab switching
 * Cleans up resources when navigating away from a tab
 */
export function useTabStability(mapRef?: React.MutableRefObject<mapboxgl.Map | null>) {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const cleanupTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());
  
  useEffect(() => {
    // Clear any pending operations on route change
    if (previousPathname.current !== pathname) {
      console.log(`[TabStability] Route change: ${previousPathname.current} → ${pathname}`);
      
      // Cancel all pending timeouts
      cleanupTimeouts.current.forEach(timeout => clearTimeout(timeout));
      cleanupTimeouts.current.clear();
      
      // Stop any animations
      if (mapRef?.current) {
        try {
          mapRef.current.stop();
        } catch (e) {
          console.warn('[TabStability] Failed to stop map animations:', e);
        }
      }
      
      // Clear any floating elements
      const elementsToClean = [
        '.mapboxgl-popup',
        '.snip-tooltip',
        '.analysis-tooltip',
        '[data-floating-ui-portal]'
      ];
      
      elementsToClean.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          try {
            el.remove();
          } catch {}
        });
      });
      
      previousPathname.current = pathname;
    }
    
    // Cleanup on unmount
    return () => {
      cleanupTimeouts.current.forEach(timeout => clearTimeout(timeout));
      cleanupTimeouts.current.clear();
      
      if (mapRef?.current) {
        cleanupMapResources(mapRef.current);
      }
    };
  }, [pathname, mapRef]);
  
  // Helper to add managed timeout
  const addTimeout = (callback: () => void, delay: number): NodeJS.Timeout => {
    const timeout = setTimeout(() => {
      cleanupTimeouts.current.delete(timeout);
      callback();
    }, delay);
    cleanupTimeouts.current.add(timeout);
    return timeout;
  };
  
  // Helper to clear a specific timeout
  const clearManagedTimeout = (timeout: NodeJS.Timeout) => {
    clearTimeout(timeout);
    cleanupTimeouts.current.delete(timeout);
  };
  
  return {
    addTimeout,
    clearManagedTimeout,
    isTransitioning: false
  };
}
