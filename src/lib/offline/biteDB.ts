/**
 * ABFI Offline Bite Storage
 * Stores bite logs locally when offline, syncs when connection restored
 * 24-hour expiry for accurate ocean data analysis
 */

import { openDB, IDBPDatabase } from 'idb';
import { v7 as uuidv7 } from 'uuid';

export interface QueuedBite {
  bite_id: string;          // uuidv7 for ordering and uniqueness
  user_id: string;          // from auth session
  user_name?: string;       // for display in reports
  created_at_ms: number;    // Date.now() at bite time
  expires_at_ms: number;    // 24 hours from creation
  lat: number;
  lon: number;
  accuracy_m?: number;      // GPS accuracy in meters
  inlet_id?: string;        // selected inlet if any
  
  // Context for report generation
  context?: {
    layers_on?: string[];   // Active layers at bite time
    map_zoom?: number;      // Zoom level for context
    vessel_count?: number;  // Nearby vessels visible
  };
  
  // User input
  notes?: string;           // Quick note about the bite
  fish_on?: boolean;        // Did they hook up?
  species?: string;         // If they identified the fish
  
  // Metadata
  device_tz?: string;       // Timezone for accurate time display
  app_version?: string;
  
  // Sync status
  uploaded_at_ms?: number;  // When successfully synced
  upload_attempts?: number; // For retry backoff
  last_error?: string;      // Last sync error message
}

let dbInstance: IDBPDatabase | null = null;

export async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB('abfi_offline', 1, {
    upgrade(db) {
      const store = db.createObjectStore('biteQueue', { 
        keyPath: 'bite_id' 
      });
      
      // Indexes for efficient queries
      store.createIndex('by-uploaded', 'uploaded_at_ms');
      store.createIndex('by-created', 'created_at_ms');
      store.createIndex('by-expires', 'expires_at_ms');
      store.createIndex('by-inlet', 'inlet_id');
    }
  });
  
  return dbInstance;
}

/**
 * Record a bite with automatic expiry after 24 hours
 */
export async function recordBite(params: {
  user_id: string;
  user_name?: string;
  inlet_id?: string;
  layers_on?: string[];
  notes?: string;
  fish_on?: boolean;
  species?: string;
}): Promise<QueuedBite> {
  const db = await getDB();
  const bite_id = uuidv7();
  const created_at_ms = Date.now();
  const expires_at_ms = created_at_ms + (24 * 60 * 60 * 1000); // 24 hours
  
  // Get current position with high accuracy
  const position = await getCurrentPosition();
  
  const bite: QueuedBite = {
    bite_id,
    user_id: params.user_id,
    user_name: params.user_name,
    created_at_ms,
    expires_at_ms,
    lat: position.lat,
    lon: position.lon,
    accuracy_m: position.accuracy_m,
    inlet_id: params.inlet_id,
    context: {
      layers_on: params.layers_on,
      map_zoom: getMapZoom(),
      vessel_count: getVisibleVesselCount(),
    },
    notes: params.notes,
    fish_on: params.fish_on,
    species: params.species,
    device_tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    app_version: process.env.NEXT_PUBLIC_APP_VERSION || 'dev',
    upload_attempts: 0,
  };
  
  await db.put('biteQueue', bite);
  
  // Clean up expired bites
  await cleanExpiredBites();
  
  return bite;
}

/**
 * Get current GPS position with fallback to map center
 */
async function getCurrentPosition(): Promise<{
  lat: number;
  lon: number;
  accuracy_m?: number;
}> {
  try {
    return await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy_m: pos.coords.accuracy,
          });
        },
        reject,
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 15000, // Accept cached position up to 15 seconds old
        }
      );
    });
  } catch (error) {
    // Fallback to map center if GPS fails
    const mapCenter = getMapCenter();
    if (mapCenter) {
      return {
        lat: mapCenter[1],
        lon: mapCenter[0],
        accuracy_m: undefined, // Unknown accuracy
      };
    }
    throw new Error('Unable to determine location');
  }
}

/**
 * Get current map center as fallback location
 */
function getMapCenter(): [number, number] | null {
  // Try various ways to get the map instance
  const map = (window as any).abfiMap || 
             (window as any).map || 
             (document.querySelector('.mapboxgl-map') as any)?.__mapboxgl;
  
  if (map && map.getCenter) {
    const center = map.getCenter();
    return [center.lng, center.lat];
  }
  
  return null;
}

/**
 * Get current map zoom level for context
 */
function getMapZoom(): number | undefined {
  const map = (window as any).abfiMap || (window as any).map;
  return map?.getZoom?.();
}

/**
 * Count visible vessels for context
 */
function getVisibleVesselCount(): number {
  // Count vessel markers currently visible on map
  const vesselMarkers = document.querySelectorAll('.vessel-marker:not(.hidden)');
  return vesselMarkers.length;
}

/**
 * Get all pending bites for current user (not uploaded and not expired)
 */
export async function getPendingBites(): Promise<QueuedBite[]> {
  const db = await getDB();
  const all = await db.getAll('biteQueue');
  const now = Date.now();
  
  // Get current user ID (this is stored locally, so all bites should be from current user)
  // But we double-check to be safe
  const currentUserId = (window as any).__ABFI_USER_ID__ || localStorage.getItem('abfi_user_id');
  
  return all.filter(bite => 
    !bite.uploaded_at_ms && 
    bite.expires_at_ms > now &&
    (!currentUserId || bite.user_id === currentUserId) // Only current user's bites
  );
}

/**
 * Get count of pending bites for badge display
 */
export async function getPendingCount(): Promise<number> {
  const pending = await getPendingBites();
  return pending.length;
}

/**
 * Mark bites as uploaded
 */
export async function markUploaded(bite_ids: string[]): Promise<void> {
  const db = await getDB();
  const now = Date.now();
  
  for (const bite_id of bite_ids) {
    const bite = await db.get('biteQueue', bite_id);
    if (bite) {
      bite.uploaded_at_ms = now;
      bite.last_error = undefined;
      await db.put('biteQueue', bite);
    }
  }
}

/**
 * Update bite with error
 */
export async function markError(bite_id: string, error: string): Promise<void> {
  const db = await getDB();
  const bite = await db.get('biteQueue', bite_id);
  
  if (bite) {
    bite.upload_attempts = (bite.upload_attempts || 0) + 1;
    bite.last_error = error;
    await db.put('biteQueue', bite);
  }
}

/**
 * Clean up expired bites (older than 24 hours)
 */
export async function cleanExpiredBites(): Promise<number> {
  const db = await getDB();
  const now = Date.now();
  const tx = db.transaction('biteQueue', 'readwrite');
  const index = tx.store.index('by-expires');
  
  let deleted = 0;
  
  // Find all expired bites
  for await (const cursor of index.iterate()) {
    if (cursor.value.expires_at_ms <= now && !cursor.value.uploaded_at_ms) {
      await cursor.delete();
      deleted++;
    }
  }
  
  await tx.done;
  return deleted;
}

/**
 * Get all bites for display (including uploaded ones from last 3 days)
 */
export async function getRecentBites(days: number = 3): Promise<QueuedBite[]> {
  const db = await getDB();
  const all = await db.getAll('biteQueue');
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  
  return all
    .filter(bite => bite.created_at_ms > cutoff)
    .sort((a, b) => b.created_at_ms - a.created_at_ms);
}

/**
 * Clear all local bite data (for debugging/reset)
 */
export async function clearAllBites(): Promise<void> {
  const db = await getDB();
  await db.clear('biteQueue');
}
