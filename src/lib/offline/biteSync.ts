/**
 * ABFI Bite Sync Engine
 * Handles automatic synchronization of offline bites when connection is restored
 * Implements exponential backoff and smart retry logic
 */

import { 
  getPendingBites, 
  markUploaded, 
  markError,
  cleanExpiredBites,
  getPendingCount,
  type QueuedBite 
} from './biteDB';
import { createClient } from "@/lib/supabaseClient"

// Re-export for convenience
export { getPendingCount } from './biteDB';

// Sync state
let isSyncing = false;
let syncTimer: NodeJS.Timeout | null = null;
let retryCount = 0;

// Event emitter for UI updates
type SyncEventType = 'sync-start' | 'sync-complete' | 'sync-error' | 'bite-expired';
type SyncEventListener = (event: { type: SyncEventType; data?: any }) => void;
const syncListeners = new Set<SyncEventListener>();

export function onSyncEvent(listener: SyncEventListener): () => void {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
}

function emitSyncEvent(type: SyncEventType, data?: any) {
  syncListeners.forEach(listener => listener({ type, data }));
}

/**
 * Attempt to sync all pending bites
 */
export async function syncBites(manual: boolean = false): Promise<{
  synced: number;
  failed: number;
  expired: number;
}> {
  // Skip if already syncing
  if (isSyncing) {
    
    return { synced: 0, failed: 0, expired: 0 };
  }
  
  // Check if online
  if (!navigator.onLine && !manual) {
    
    return { synced: 0, failed: 0, expired: 0 };
  }
  
  isSyncing = true;
  emitSyncEvent('sync-start');
  
  try {
    // Clean expired bites first
    const expired = await cleanExpiredBites();
    if (expired > 0) {
      emitSyncEvent('bite-expired', { count: expired });
    }
    
    // Get all pending bites
    const pending = await getPendingBites();
    
    if (pending.length === 0) {
      
      return { synced: 0, failed: 0, expired };
    }
    
    
    
    // Get current user
    let user;
    try {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getUser();
      user = data?.user;
    } catch (authError) {
      
      // Skip sync if auth fails
      return { synced: 0, failed: 0, expired };
    }
    
    if (!user) {
      
      return { synced: 0, failed: 0, expired };
    }
    
    // Prepare batch payload
    const payload = {
      bites: pending.map(bite => ({
        bite_id: bite.bite_id,
        user_id: bite.user_id,
        user_name: bite.user_name,
        created_at_ms: bite.created_at_ms,
        lat: bite.lat,
        lon: bite.lon,
        accuracy_m: bite.accuracy_m,
        inlet_id: bite.inlet_id,
        context: bite.context,
        notes: bite.notes,
        fish_on: bite.fish_on,
        species: bite.species,
        device_tz: bite.device_tz,
        app_version: bite.app_version,
      }))
    };
    
    // Get session token
    let accessToken;
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      accessToken = session?.access_token;
    } catch (sessionError) {
      
      return { synced: 0, failed: 0, expired };
    }
    
    if (!accessToken) {
      
      return { synced: 0, failed: 0, expired };
    }
    
    // Send to server
    const response = await fetch('/api/bites/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Process results
    let synced = 0;
    let failed = 0;
    
    for (const biteResult of result.results) {
      if (biteResult.status === 'accepted' || biteResult.status === 'duplicate') {
        await markUploaded([biteResult.bite_id]);
        synced++;
      } else {
        await markError(
          biteResult.bite_id, 
          biteResult.status.replace('error:', '')
        );
        failed++;
      }
    }
    
    
    
    // Reset retry count on successful sync
    if (synced > 0) {
      retryCount = 0;
    }
    
    emitSyncEvent('sync-complete', { synced, failed, expired });
    
    return { synced, failed, expired };
    
  } catch (error) {
    
    
    // Mark all pending bites with error
    const pending = await getPendingBites();
    for (const bite of pending) {
      await markError(bite.bite_id, String(error));
    }
    
    // Increment retry count for backoff
    retryCount++;
    
    emitSyncEvent('sync-error', { error: String(error) });
    
    // Schedule retry with exponential backoff
    scheduleRetry();
    
    return { synced: 0, failed: pending.length, expired: 0 };
    
  } finally {
    isSyncing = false;
  }
}

/**
 * Schedule a retry with exponential backoff
 */
function scheduleRetry() {
  if (syncTimer) {
    clearTimeout(syncTimer);
  }
  
  // Exponential backoff: 5s, 10s, 20s, 40s, then cap at 60s
  const delay = Math.min(5000 * Math.pow(2, retryCount), 60000);
  
  
  
  syncTimer = setTimeout(() => {
    syncTimer = null;
    syncBites();
  }, delay);
}

/**
 * Initialize automatic sync on various triggers
 */
export function initBiteSync() {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return;
  }
  
  // Sync when coming online
  window.addEventListener('online', () => {
    
    syncBites();
  });
  
  // Sync when app becomes visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      
      syncBites();
    }
  });
  
  // Periodic sync every 60 seconds when online
  setInterval(() => {
    if (navigator.onLine && !isSyncing) {
      syncBites();
    }
  }, 60000);
  
  // Initial sync on load (delayed to allow auth to initialize)
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    setTimeout(() => syncBites(), 5000);
  }
  
  
}

/**
 * Force manual sync (user-triggered)
 */
export async function manualSync(): Promise<{
  synced: number;
  failed: number;
  expired: number;
}> {
  
  return syncBites(true);
}

/**
 * Get sync status
 */
export function getSyncStatus(): {
  isSyncing: boolean;
  nextRetryIn: number | null;
} {
  const nextRetryIn = syncTimer ? 
    Math.max(0, 5000 * Math.pow(2, retryCount) - Date.now()) : 
    null;
    
  return {
    isSyncing,
    nextRetryIn,
  };
}

/**
 * Cancel any pending sync operations
 */
export function cancelSync() {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
  retryCount = 0;
}
