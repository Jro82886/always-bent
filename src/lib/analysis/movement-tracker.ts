/**
 * Water Movement Tracker
 * Stores and manages historical polygon/feature data for 3-day movement visualization
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MovementRecord {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  features: GeoJSON.FeatureCollection;
  location: {
    bounds: [[number, number], [number, number]];
    center: [number, number];
  };
}

interface MovementDB extends DBSchema {
  movements: {
    key: string; // id
    value: MovementRecord;
    indexes: {
      'by-date': string;
      'by-timestamp': number;
    };
  };
}

const DB_NAME = 'abfi-movements';
const DB_VERSION = 1;
const STORE_NAME = 'movements';

/**
 * Initialize IndexedDB for movement tracking
 */
async function getDB(): Promise<IDBPDatabase<MovementDB>> {
  return openDB<MovementDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by-date', 'date');
        store.createIndex('by-timestamp', 'timestamp');
      }
    },
  });
}

/**
 * Store ocean features for a given date
 */
export async function storeMovementData(
  features: GeoJSON.FeatureCollection,
  bounds: [[number, number], [number, number]],
  center: [number, number]
): Promise<void> {
  try {
    const db = await getDB();
    const date = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();

    const record: MovementRecord = {
      id: `${date}-${timestamp}`,
      date,
      timestamp,
      features,
      location: {
        bounds,
        center
      }
    };

    await db.put(STORE_NAME, record);

    // Cleanup old records (keep only last 7 days)
    await cleanupOldRecords(db);
  } catch (error) {
    console.error('Failed to store movement data:', error);
  }
}

/**
 * Get movement data for the last N days
 */
export async function getMovementHistory(
  days: number = 3
): Promise<MovementRecord[]> {
  try {
    const db = await getDB();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffTimestamp = cutoffDate.getTime();

    const allRecords = await db.getAllFromIndex(STORE_NAME, 'by-timestamp');

    // Filter records from the last N days and group by date (keep most recent per day)
    const recordsByDate = new Map<string, MovementRecord>();

    for (const record of allRecords) {
      if (record.timestamp >= cutoffTimestamp) {
        const existing = recordsByDate.get(record.date);
        if (!existing || record.timestamp > existing.timestamp) {
          recordsByDate.set(record.date, record);
        }
      }
    }

    // Sort by date descending (most recent first)
    return Array.from(recordsByDate.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, days);
  } catch (error) {
    console.error('Failed to get movement history:', error);
    return [];
  }
}

/**
 * Get movement data for a specific area (within bounds)
 */
export async function getMovementHistoryForArea(
  bounds: [[number, number], [number, number]],
  days: number = 3
): Promise<MovementRecord[]> {
  const allRecords = await getMovementHistory(days);

  // Filter records that are near the specified bounds
  return allRecords.filter(record => {
    const recordBounds = record.location.bounds;

    // Check if bounds overlap (simple bounding box intersection)
    const overlaps =
      bounds[0][0] <= recordBounds[1][0] &&
      bounds[1][0] >= recordBounds[0][0] &&
      bounds[0][1] <= recordBounds[1][1] &&
      bounds[1][1] >= recordBounds[0][1];

    return overlaps;
  });
}

/**
 * Calculate opacity based on age (days old)
 */
export function calculateOpacityForAge(daysOld: number): number {
  if (daysOld === 0) return 1.0;  // Today: 100%
  if (daysOld === 1) return 0.4;  // 1 day old: 40%
  if (daysOld === 2) return 0.2;  // 2 days old: 20%
  return 0.1; // Older: 10%
}

/**
 * Get days between two dates
 */
export function getDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Cleanup records older than 7 days
 */
async function cleanupOldRecords(db: IDBPDatabase<MovementDB>): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoffTimestamp = cutoffDate.getTime();

    const allRecords = await db.getAllFromIndex(STORE_NAME, 'by-timestamp');

    for (const record of allRecords) {
      if (record.timestamp < cutoffTimestamp) {
        await db.delete(STORE_NAME, record.id);
      }
    }
  } catch (error) {
    console.error('Failed to cleanup old records:', error);
  }
}

/**
 * Clear all movement data (for debugging/testing)
 */
export async function clearAllMovementData(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
  } catch (error) {
    console.error('Failed to clear movement data:', error);
  }
}
