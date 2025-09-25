'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppState } from '@/lib/store';

export default function OfflineManager() {
  const SW_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SW === 'true';
  const [isOffline, setIsOffline] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [syncPending, setSyncPending] = useState(false);
  const { selectedInletId } = useAppState();

  // Register/Unregister service worker based on env flag
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // If disabled, proactively unregister existing SW and clear caches (prevents stale chunks)
    if (!SW_ENABLED) {
      (async () => {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const r of regs) await r.unregister();
          if (window.caches) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
          // Reload once to pick up fresh HTML without SW
          const KEY = 'abfi:sw-cleared';
          if (!sessionStorage.getItem(KEY)) {
            sessionStorage.setItem(KEY, '1');
            location.reload();
          }
        } catch (e) {
          // no-op
        }
      })();
      return;
    }

    // Enabled: register SW normally
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
        setSwRegistration(registration);
        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 3600000);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  }, [SW_ENABLED]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Trigger background sync when back online
      if (swRegistration && 'sync' in swRegistration) {
        const syncManager = (swRegistration as any).sync;
        if (syncManager && typeof syncManager.register === 'function') {
          syncManager.register('sync-reports');
          syncManager.register('sync-positions');
        }
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    // Set initial state
    setIsOffline(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [swRegistration]);

  // Pre-cache tiles for current inlet
  const cacheTilesForInlet = useCallback(async () => {
    if (!swRegistration || !selectedInletId) return;

    // Get inlet bounds (simplified - you'd get real bounds from inlet data)
    const inletBounds: Record<string, [number, number, number, number]> = {
      'jupiter-inlet': [-80.2, 26.9, -79.9, 27.0],
      'palm-beach-inlet': [-80.1, 26.7, -79.9, 26.8],
      'default': [-80.5, 25.5, -79.5, 27.5]
    };

    const bounds = inletBounds[selectedInletId] || inletBounds.default;

    // Send message to service worker to cache tiles
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_TILES',
        bounds,
        zoom: { min: 8, max: 12 }
      });
    }
  }, [swRegistration, selectedInletId]);

  // Store data in IndexedDB for offline access
  const saveOfflineData = useCallback(async (type: string, data: any) => {
    try {
      const db = await openDB();
      const tx = db.transaction(`pending_${type}`, 'readwrite');
      const store = tx.objectStore(`pending_${type}`);
      await store.add(data);
      setSyncPending(true);
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }, []);

  // Helper to open IndexedDB
  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ABFI_Offline', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        
        // Create stores for offline data
        if (!db.objectStoreNames.contains('pending_reports')) {
          db.createObjectStore('pending_reports', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('pending_positions')) {
          db.createObjectStore('pending_positions', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('cached_hotspots')) {
          db.createObjectStore('cached_hotspots', { keyPath: 'id' });
        }
      };
    });
  };

  // Expose offline save function globally
  useEffect(() => {
    (window as any).ABFIOffline = {
      saveReport: (data: any) => saveOfflineData('reports', data),
      savePosition: (data: any) => saveOfflineData('positions', data),
      isOffline,
      cacheTiles: cacheTilesForInlet
    };
  }, [isOffline, saveOfflineData, cacheTilesForInlet]);

  // UI indicator for offline status
  if (!SW_ENABLED) return null;
  if (!isOffline && !syncPending) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50">
      {isOffline && (
        <div className="bg-orange-500/90 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
          <div>
            <div className="text-xs font-semibold">Offline Mode</div>
            <div className="text-[10px] opacity-80">Data will sync when reconnected</div>
          </div>
        </div>
      )}
      
      {!isOffline && syncPending && (
        <div className="bg-green-500/90 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <div>
            <div className="text-xs font-semibold">Syncing...</div>
            <div className="text-[10px] opacity-80">Uploading offline data</div>
          </div>
        </div>
      )}

      {/* Cache tiles button */}
      <button
        onClick={cacheTilesForInlet}
        className="mt-2 bg-black/60 text-white px-3 py-1 rounded text-xs hover:bg-black/80 transition-colors"
      >
        Download maps for offline
      </button>
    </div>
  );
}
