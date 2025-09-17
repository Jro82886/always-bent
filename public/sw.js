// ABFI Service Worker - Offline Capabilities
const CACHE_NAME = 'abfi-v1';
const DYNAMIC_CACHE = 'abfi-dynamic-v1';
const TILE_CACHE = 'abfi-tiles-v1';

// Core assets to cache for offline
const STATIC_ASSETS = [
  '/',
  '/legendary',
  '/legendary/analysis',
  '/legendary/tracking',
  '/legendary/community',
  '/legendary/trends',
  '/manifest.json',
  '/favicon.ico'
];

// API routes to cache responses
const API_CACHE_ROUTES = [
  '/api/weather',
  '/api/community/reports',
  '/api/community/hotspots',
  '/api/community/fleet'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing ABFI Service Worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching core assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Force immediate activation
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating ABFI Service Worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('abfi-') && name !== CACHE_NAME && name !== DYNAMIC_CACHE && name !== TILE_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle tile requests specially (aggressive caching)
  if (url.pathname.includes('/tiles/') || url.pathname.includes('/api/tiles/')) {
    event.respondWith(
      caches.open(TILE_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            // Serve from cache, but update in background
            fetch(request).then((fetchResponse) => {
              if (fetchResponse.ok) {
                cache.put(request, fetchResponse.clone());
              }
            }).catch(() => {});
            return response;
          }
          
          // Not in cache, fetch and cache
          return fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => {
            // Offline and not cached - return placeholder
            return new Response('Tile unavailable offline', { status: 503 });
          });
        });
      })
    );
    return;
  }
  
  // Handle API requests with network-first strategy
  if (API_CACHE_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline - try cache
          return caches.match(request).then((response) => {
            if (response) {
              console.log('[SW] Serving API from cache:', url.pathname);
              return response;
            }
            // Return offline message
            return new Response(
              JSON.stringify({ 
                error: 'Offline', 
                message: 'Data unavailable offline. Please reconnect to update.' 
              }),
              { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }
  
  // Default strategy: Cache first, fallback to network
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        // Update cache in background
        fetch(request).then((fetchResponse) => {
          if (fetchResponse.ok) {
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, fetchResponse.clone());
            });
          }
        }).catch(() => {});
        return response;
      }
      
      // Not in cache, fetch from network
      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.ok && !url.pathname.includes('_next')) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Offline and not cached
        if (request.headers.get('accept')?.includes('text/html')) {
          // Return offline page for navigation requests
          return caches.match('/');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered');
  
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncOfflineReports());
  } else if (event.tag === 'sync-positions') {
    event.waitUntil(syncOfflinePositions());
  }
});

// Sync offline reports when back online
async function syncOfflineReports() {
  try {
    // Get pending reports from IndexedDB
    const db = await openDB();
    const tx = db.transaction('pending_reports', 'readonly');
    const store = tx.objectStore('pending_reports');
    const reports = await store.getAll();
    
    // Upload each report
    for (const report of reports) {
      try {
        const response = await fetch('/api/community/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report)
        });
        
        if (response.ok) {
          // Remove from pending
          const deleteTx = db.transaction('pending_reports', 'readwrite');
          await deleteTx.objectStore('pending_reports').delete(report.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync report:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync reports error:', error);
  }
}

// Sync offline position updates
async function syncOfflinePositions() {
  try {
    const db = await openDB();
    const tx = db.transaction('pending_positions', 'readonly');
    const store = tx.objectStore('pending_positions');
    const positions = await store.getAll();
    
    for (const position of positions) {
      try {
        const response = await fetch('/api/community/fleet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(position)
        });
        
        if (response.ok) {
          const deleteTx = db.transaction('pending_positions', 'readwrite');
          await deleteTx.objectStore('pending_positions').delete(position.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync position:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync positions error:', error);
  }
}

// Helper to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ABFI_Offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
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
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CACHE_TILES') {
    // Pre-cache tiles for an area
    cacheTilesForArea(event.data.bounds, event.data.zoom);
  }
});

// Pre-cache tiles for offline use
async function cacheTilesForArea(bounds, zoomLevels) {
  const cache = await caches.open(TILE_CACHE);
  const tilesToCache = [];
  
  // Calculate tiles needed for the bounds and zoom levels
  for (let z = zoomLevels.min; z <= zoomLevels.max; z++) {
    const tiles = getTilesInBounds(bounds, z);
    for (const tile of tiles) {
      tilesToCache.push(`/api/tiles/sst/${z}/${tile.x}/${tile.y}.png`);
    }
  }
  
  // Cache tiles in batches
  const batchSize = 10;
  for (let i = 0; i < tilesToCache.length; i += batchSize) {
    const batch = tilesToCache.slice(i, i + batchSize);
    await Promise.all(
      batch.map(url => 
        fetch(url)
          .then(response => cache.put(url, response))
          .catch(() => {})
      )
    );
  }
  
  console.log(`[SW] Cached ${tilesToCache.length} tiles for offline use`);
}

// Calculate tiles within bounds
function getTilesInBounds(bounds, zoom) {
  const tiles = [];
  const [west, south, east, north] = bounds;
  
  const minX = Math.floor(lng2tile(west, zoom));
  const maxX = Math.floor(lng2tile(east, zoom));
  const minY = Math.floor(lat2tile(north, zoom));
  const maxY = Math.floor(lat2tile(south, zoom));
  
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      tiles.push({ x, y });
    }
  }
  
  return tiles;
}

// Convert lng to tile x
function lng2tile(lng, zoom) {
  return (lng + 180) / 360 * Math.pow(2, zoom);
}

// Convert lat to tile y
function lat2tile(lat, zoom) {
  return (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);
}
