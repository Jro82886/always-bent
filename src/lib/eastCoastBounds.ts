/**
 * East Coast Geographic Optimization
 * Based on 150 nautical mile offshore coverage
 * Implements regional bounding boxes for better resolution
 */

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
  name: string;
}

// East Coast + 150nm offshore bounding boxes (from other Claude)
export const EAST_COAST_BOUNDS: BoundingBox[] = [
  {
    north: 47.5, south: 43.5,
    east: -65.0, west: -71.0,
    name: "Northeast_Maritime"
  },
  {
    north: 43.5, south: 40.0,
    east: -65.5, west: -74.0,
    name: "New_England"
  },
  {
    north: 40.0, south: 36.0,
    east: -70.0, west: -78.0,
    name: "Mid_Atlantic"
  },
  {
    north: 36.5, south: 33.0,
    east: -72.0, west: -79.0,
    name: "Carolina_Banks"
  },
  {
    north: 33.5, south: 30.0,
    east: -75.0, west: -82.0,
    name: "Southeast"
  },
  {
    north: 30.5, south: 24.0,
    east: -78.0, west: -83.0,
    name: "Florida_Atlantic"
  }
];

// Overall East Coast bounds
export const MASTER_BOUNDS: BoundingBox = {
  north: 47.5,  // Nova Scotia approaches
  south: 23.5,  // Florida Keys + buffer
  east: -65.0,  // 150nm offshore from Cape Cod
  west: -87.0,  // 150nm offshore from Gulf transition
  name: "East_Coast_150nm"
};

// Geographic zones for prioritized loading
export const PRIORITY_ZONES = {
  nearshore: { distance_nm: 12, resolution: 13, priority: 1 },
  coastal: { distance_nm: 50, resolution: 12, priority: 2 },
  offshore: { distance_nm: 150, resolution: 11, priority: 3 }
};

/**
 * Check if coordinates are within East Coast fishing zone
 */
export function isInEastCoastZone(lat: number, lon: number): boolean {
  return (
    lat >= MASTER_BOUNDS.south &&
    lat <= MASTER_BOUNDS.north &&
    lon >= MASTER_BOUNDS.west &&
    lon <= MASTER_BOUNDS.east
  );
}

/**
 * Get the most relevant regional bounds for given coordinates
 */
export function getRegionalBounds(lat: number, lon: number): BoundingBox | null {
  for (const bounds of EAST_COAST_BOUNDS) {
    if (
      lat >= bounds.south &&
      lat <= bounds.north &&
      lon >= bounds.west &&
      lon <= bounds.east
    ) {
      return bounds;
    }
  }
  return null;
}
