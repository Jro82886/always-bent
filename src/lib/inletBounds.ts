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
 * Fly to inlet showing view out to Gulf Stream
 * Each inlet has a custom zoom level designed to show from inlet to Gulf Stream
 */
export function flyToInlet60nm(map: mapboxgl.Map | null, inlet: Inlet) {
  if (!map || !inlet) return;
  
  // Handle overview separately - zoom out to FULL East Coast (Maine to Florida)
  if (inlet.isOverview) {
    // Use the full East Coast bounds for proper overview
    const eastCoastBounds: [[number, number], [number, number]] = [
      [-82.0, 24.0],  // Southwest: Florida Keys
      [-65.0, 46.0],  // Northeast: Maine
    ];
    
    map.fitBounds(eastCoastBounds as any, {
      padding: { top: 50, bottom: 50, left: 100, right: 50 },
      duration: 1500,
      essential: true
    });
    return;
  }
  
  const [lng, lat] = inlet.center;
  
  // Calculate offshore distance based on latitude (Gulf Stream distance varies)
  // Northern inlets: Gulf Stream is 60-90nm offshore
  // Mid-Atlantic: Gulf Stream is 40-60nm offshore  
  // South Florida: Gulf Stream is 5-20nm offshore
  let offshoreDistance = 60; // default 60nm
  
  if (lat >= 40) {
    // Maine to New York - Gulf Stream far offshore
    offshoreDistance = 90;
  } else if (lat >= 35) {
    // New Jersey to North Carolina
    offshoreDistance = 70;
  } else if (lat >= 30) {
    // South Carolina to North Florida
    offshoreDistance = 50;
  } else if (lat >= 26) {
    // Central to South Florida - Gulf Stream close
    offshoreDistance = 30;
  } else {
    // Florida Keys
    offshoreDistance = 35;
  }
  
  // Calculate the view to show inlet to Gulf Stream
  const eastOffset = offshoreDistance * NM_TO_DEGREES_LNG(lat);
  const northSouthOffset = (offshoreDistance * 0.5) * NM_TO_DEGREES_LAT; // Half the distance for N/S
  const westOffset = 10 * NM_TO_DEGREES_LNG(lat); // Show 10nm inland for context
  
  // Calculate bounds [west, south, east, north]
  // Note: On east coast, offshore is EAST (positive longitude from inlet)
  const bounds: [number, number, number, number] = [
    lng - westOffset,  // west (10nm inland for coastline context)
    lat - northSouthOffset,  // south
    lng + eastOffset,  // east (out to Gulf Stream)
    lat + northSouthOffset   // north
  ];
  
  map.fitBounds(bounds as any, {
    padding: { top: 80, bottom: 80, left: 20, right: 20 },
    duration: 1500,
    essential: true,
    maxZoom: 9.5 // Allow slightly closer zoom
  });
}
