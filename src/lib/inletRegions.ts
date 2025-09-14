/**
 * Inlet regions for visualization on the map
 * Each region is a polygon that represents the approximate area of influence for an inlet
 * Regions are designed to touch each other along the coast
 */

import { INLETS } from './inlets';

export interface InletRegion {
  id: string;
  name: string;
  color: string;
  // GeoJSON polygon coordinates [lng, lat]
  coordinates: number[][][];
}

// Create regions based on inlet positions
// These are approximate regions that extend from the coast out to sea
// and touch each other at the boundaries
export function generateInletRegions(): InletRegion[] {
  const regions: InletRegion[] = [];
  const sortedInlets = INLETS
    .filter(i => !i.isOverview)
    .sort((a, b) => b.center[1] - a.center[1]); // Sort north to south

  sortedInlets.forEach((inlet, index) => {
    const [lng, lat] = inlet.center;
    
    // Calculate boundaries with neighboring inlets
    let northBoundary = lat + 0.5; // Default half degree north
    let southBoundary = lat - 0.5; // Default half degree south
    
    // Adjust boundaries to touch neighboring inlets
    if (index > 0) {
      const northNeighbor = sortedInlets[index - 1];
      northBoundary = (lat + northNeighbor.center[1]) / 2;
    } else {
      northBoundary = lat + 1; // Extend further north for the northernmost inlet
    }
    
    if (index < sortedInlets.length - 1) {
      const southNeighbor = sortedInlets[index + 1];
      southBoundary = (lat + southNeighbor.center[1]) / 2;
    } else {
      southBoundary = lat - 1; // Extend further south for the southernmost inlet
    }
    
    // Create a polygon that extends from the coast out to sea
    // Approximate the coastline at -75 longitude (average for East Coast)
    const coastLng = lng + 0.5; // Slightly west of inlet (towards land)
    const seaLng = lng - 2.5; // Extend 2.5 degrees east into ocean
    
    // Create polygon coordinates (clockwise)
    const coordinates = [[
      [coastLng, northBoundary],  // Northwest corner (coast)
      [seaLng, northBoundary],    // Northeast corner (sea)
      [seaLng, southBoundary],    // Southeast corner (sea)
      [coastLng, southBoundary],  // Southwest corner (coast)
      [coastLng, northBoundary]   // Close the polygon
    ]];
    
    regions.push({
      id: inlet.id,
      name: inlet.name,
      color: inlet.color || '#00ffff',
      coordinates
    });
  });
  
  return regions;
}

// Convert regions to GeoJSON FeatureCollection
export function regionsToGeoJSON() {
  const regions = generateInletRegions();
  
  return {
    type: 'FeatureCollection' as const,
    features: regions.map(region => ({
      type: 'Feature' as const,
      properties: {
        id: region.id,
        name: region.name,
        color: region.color
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: region.coordinates
      }
    }))
  };
}
