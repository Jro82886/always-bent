/**
 * Calculate map bounds for 60 nautical miles offshore from an inlet
 */

import type { Inlet } from './inlets';

// 1 nautical mile = 1.15078 statute miles = 1.852 kilometers
const NM_TO_DEGREES_LAT = 1 / 60; // 1 nautical mile = 1/60 degree latitude
const NM_TO_DEGREES_LNG = (lat: number) => 1 / (60 * Math.cos(lat * Math.PI / 180));

/**
 * Calculate bounds for 60nm offshore view
 * Returns [west, south, east, north] for Mapbox fitBounds
 */
export function getInlet60nmBounds(inlet: Inlet): [number, number, number, number] {
  const [lng, lat] = inlet.center;
  
  // 60nm offshore to the east (into the ocean)
  const eastOffset = 60 * NM_TO_DEGREES_LNG(lat);
  
  // 30nm north and south for a good view
  const northSouthOffset = 30 * NM_TO_DEGREES_LAT;
  
  // 10nm inland (west) to show some coastline context
  const westOffset = 10 * NM_TO_DEGREES_LNG(lat);
  
  // Calculate bounds [west, south, east, north]
  const bounds: [number, number, number, number] = [
    lng + westOffset,  // west (slightly inland)
    lat - northSouthOffset,  // south
    lng - eastOffset,  // east (60nm offshore - negative because we're on east coast)
    lat + northSouthOffset   // north
  ];
  
  return bounds;
}

/**
 * Fly to inlet with 60nm offshore view
 */
export function flyToInlet60nm(map: mapboxgl.Map | null, inlet: Inlet) {
  if (!map || !inlet) return;
  
  // Handle overview separately - zoom out to full East Coast
  if (inlet.isOverview) {
    map.flyTo({
      center: inlet.center,
      zoom: inlet.zoom,
      duration: 1500,
      essential: true
    });
    return;
  }
  
  const [lng, lat] = inlet.center;
  
  // 60nm offshore to the east (positive longitude on east coast)
  const eastOffset = 60 * NM_TO_DEGREES_LNG(lat);
  
  // 30nm north and south for a good view
  const northSouthOffset = 30 * NM_TO_DEGREES_LAT;
  
  // 5nm inland (west) to show coastline
  const westOffset = 5 * NM_TO_DEGREES_LNG(lat);
  
  // Calculate bounds [west, south, east, north]
  // Note: On east coast, offshore is EAST (positive longitude)
  const bounds: [number, number, number, number] = [
    lng - westOffset,  // west (slightly inland)
    lat - northSouthOffset,  // south
    lng + eastOffset,  // east (60nm offshore - positive for east coast)
    lat + northSouthOffset   // north
  ];
  
  map.fitBounds(bounds as any, {
    padding: { top: 80, bottom: 80, left: 20, right: 20 },
    duration: 1500,
    essential: true,
    maxZoom: 9 // Don't zoom in too close
  });
}
