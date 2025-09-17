/**
 * ABFI Bite Sync Initializer
 * Initializes the offline bite sync engine on app load
 */

"use client";
import { useEffect } from 'react';
import { initBiteSync } from '@/lib/offline/biteSync';

export default function BiteSyncInitializer() {
  useEffect(() => {
    // Initialize the bite sync engine
    initBiteSync();
    
    
    // Log sync status for debugging
    if (!navigator.onLine) {
      
    }
  }, []);
  
  return null; // No UI, just initialization
}
