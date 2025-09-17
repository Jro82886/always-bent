/**
 * NOAA Bathymetry Service Integration
 * Provides multibeam bathymetry mosaic and DEM color shaded relief
 * Source: https://www.ncei.noaa.gov/maps/bathymetry/
 */

export interface BathymetryConfig {
  multibeamMosaic: boolean;
  demColorShadedRelief: boolean;
  opacity: number;
}

// NOAA Bathymetry WMS endpoints
export const BATHYMETRY_SERVICES = {
  // Multibeam Bathymetry Mosaic - High-resolution seafloor depth data
  multibeam: {
    url: 'https://gis.ngdc.noaa.gov/arcgis/services/multibeam/MapServer/WMSServer',
    layers: 'multibeam_mosaic',
    format: 'image/png',
    transparent: true,
    attribution: 'NOAA NCEI Multibeam Bathymetry',
    description: 'High-resolution multibeam sonar bathymetry showing seafloor depth and features'
  },
  
  // DEM Color Shaded Relief - Digital Elevation Model with color-coded depths
  demRelief: {
    url: 'https://gis.ngdc.noaa.gov/arcgis/services/DEM_global_mosaic/MapServer/WMSServer',
    layers: 'DEM_color_shaded_relief',
    format: 'image/png',
    transparent: true,
    attribution: 'NOAA NCEI DEM Color Shaded Relief',
    description: 'Color-coded bathymetric relief showing depth contours and seafloor topography'
  },
  
  // Alternative: GEBCO gridded bathymetry for broader coverage
  gebco: {
    url: 'https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv',
    layers: 'GEBCO_LATEST',
    format: 'image/png',
    transparent: true,
    attribution: 'GEBCO Bathymetry',
    description: 'Global bathymetric dataset with consistent coverage'
  }
};

// Color ramps for depth visualization
export const DEPTH_COLOR_RAMPS = {
  ocean: {
    // Depths in meters with corresponding colors
    '-10000': '#000033',  // Deepest trenches - dark blue
    '-6000': '#000055',   // Abyssal depths
    '-4000': '#000077',   // Deep ocean
    '-3000': '#0000AA',   // Continental rise
    '-2000': '#0033CC',   // Lower slope
    '-1000': '#0066FF',   // Upper slope
    '-500': '#3399FF',    // Shelf break
    '-200': '#66CCFF',    // Outer shelf
    '-100': '#99DDFF',    // Mid shelf
    '-50': '#CCEEFF',     // Inner shelf
    '-20': '#E6F5FF',     // Nearshore
    '0': '#FFFFFF'        // Sea level
  },
  
  fishing: {
    // Optimized for fishing - highlights key depth ranges
    '-2000': '#1a0033',  // Deep canyon - purple
    '-1000': '#2d004d',  // Canyon walls - deep purple
    '-600': '#0d0d4d',   // Productive canyon edges - dark blue
    '-400': '#1a1a80',   // Prime fishing depths - blue
    '-300': '#2d2db3',   // Tuna/marlin zone
    '-200': '#4d4dcc',   // Shelf break - key zone
    '-150': '#6666e6',   // Upper slope
    '-100': '#8080ff',   // Outer shelf edge
    '-75': '#9999ff',    // Mid shelf
    '-50': '#b3b3ff',    // Inner shelf
    '-30': '#ccccff',    // Nearshore structure
    '-20': '#e6e6ff',    // Shallow structure
    '0': '#ffffff'       // Surface
  }
};

/**
 * Generate Mapbox layer configuration for bathymetry
 */
export function getBathymetryLayers(config: BathymetryConfig): any[] {
  const layers = [];
  
  if (config.multibeamMosaic) {
    layers.push({
      id: 'bathymetry-multibeam',
      type: 'raster',
      source: 'bathymetry-multibeam-source',
      paint: {
        'raster-opacity': config.opacity * 0.8 // Slightly lower for multibeam
      },
      layout: {
        visibility: 'visible'
      }
    });
  }
  
  if (config.demColorShadedRelief) {
    layers.push({
      id: 'bathymetry-dem-relief',
      type: 'raster',
      source: 'bathymetry-dem-source',
      paint: {
        'raster-opacity': config.opacity,
        'raster-contrast': 0.2,  // Enhance depth contrast
        'raster-brightness-min': 0.1,
        'raster-brightness-max': 0.9
      },
      layout: {
        visibility: 'visible'
      }
    });
  }
  
  return layers;
}

/**
 * Generate Mapbox source configuration for bathymetry
 */
export function getBathymetrySources(): Record<string, any> {
  return {
    'bathymetry-multibeam-source': {
      type: 'raster',
      tiles: [
        `${BATHYMETRY_SERVICES.multibeam.url}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX={bbox-epsg-3857}&CRS=EPSG:3857&WIDTH=512&HEIGHT=512&LAYERS=${BATHYMETRY_SERVICES.multibeam.layers}&FORMAT=${BATHYMETRY_SERVICES.multibeam.format}&TRANSPARENT=true`
      ],
      tileSize: 512,
      attribution: BATHYMETRY_SERVICES.multibeam.attribution
    },
    
    'bathymetry-dem-source': {
      type: 'raster',
      tiles: [
        `${BATHYMETRY_SERVICES.demRelief.url}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX={bbox-epsg-3857}&CRS=EPSG:3857&WIDTH=512&HEIGHT=512&LAYERS=${BATHYMETRY_SERVICES.demRelief.layers}&FORMAT=${BATHYMETRY_SERVICES.demRelief.format}&TRANSPARENT=true`
      ],
      tileSize: 512,
      attribution: BATHYMETRY_SERVICES.demRelief.attribution
    }
  };
}

/**
 * Get depth at a specific point (requires additional API)
 */
export async function getDepthAtPoint(lat: number, lng: number): Promise<number | null> {
  try {
    // NOAA depth service endpoint
    const response = await fetch(
      `https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_global_mosaic/MapServer/identify?` +
      `geometry=${lng},${lat}&geometryType=esriGeometryPoint&sr=4326&` +
      `layers=all&tolerance=1&mapExtent=-180,-90,180,90&imageDisplay=512,512,96&` +
      `returnGeometry=false&f=json`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Extract depth value from response
    if (data.results && data.results.length > 0) {
      const depth = data.results[0].attributes?.depth || data.results[0].value;
      return depth ? parseFloat(depth) : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching depth:', error);
    return null;
  }
}

/**
 * Analyze bathymetry for fishing potential
 */
export function analyzeBathymetryForFishing(depths: number[]): {
  features: string[];
  score: number;
  recommendation: string;
} {
  if (!depths || depths.length === 0) {
    return {
      features: ['No bathymetry data available'],
      score: 50,
      recommendation: 'Unable to analyze seafloor structure'
    };
  }
  
  const minDepth = Math.min(...depths);
  const maxDepth = Math.max(...depths);
  const depthRange = maxDepth - minDepth;
  const avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length;
  
  const features: string[] = [];
  let score = 50; // Base score
  
  // Analyze depth characteristics
  if (depthRange > 100) {
    features.push('Significant depth changes detected - likely structure');
    score += 20;
  }
  
  if (avgDepth >= -200 && avgDepth <= -50) {
    features.push('Shelf edge zone - prime fishing depth');
    score += 15;
  }
  
  if (avgDepth >= -600 && avgDepth <= -200) {
    features.push('Upper slope - canyon edges possible');
    score += 10;
  }
  
  if (depthRange > 200 && avgDepth < -300) {
    features.push('Canyon or seamount feature likely');
    score += 25;
  }
  
  // Generate recommendation
  let recommendation = '';
  if (score >= 80) {
    recommendation = 'Excellent structure detected - high probability of fish concentration';
  } else if (score >= 65) {
    recommendation = 'Good bathymetric features - worth investigating';
  } else if (score >= 50) {
    recommendation = 'Moderate structure - check for temperature breaks';
  } else {
    recommendation = 'Flat bottom - look for other attractors';
  }
  
  return { features, score, recommendation };
}

/**
 * Format depth for display
 */
export function formatDepth(depthMeters: number, units: 'meters' | 'feet' | 'fathoms' = 'feet'): string {
  const absDepth = Math.abs(depthMeters);
  
  switch (units) {
    case 'feet':
      return `${Math.round(absDepth * 3.28084)}ft`;
    case 'fathoms':
      return `${Math.round(absDepth * 0.546807)}fm`;
    default:
      return `${Math.round(absDepth)}m`;
  }
}

/**
 * Get fishing zone based on depth
 */
export function getFishingZone(depthMeters: number): {
  zone: string;
  targetSpecies: string[];
  techniques: string[];
} {
  const depth = Math.abs(depthMeters);
  
  if (depth < 30) {
    return {
      zone: 'Nearshore',
      targetSpecies: ['Striped Bass', 'Bluefish', 'Fluke', 'Sea Bass'],
      techniques: ['Casting', 'Jigging', 'Bottom fishing']
    };
  } else if (depth < 100) {
    return {
      zone: 'Mid-Shelf',
      targetSpecies: ['Bluefin Tuna', 'Mahi', 'Sea Bass', 'Cod'],
      techniques: ['Trolling', 'Chunking', 'Deep jigging']
    };
  } else if (depth < 200) {
    return {
      zone: 'Shelf Edge',
      targetSpecies: ['Yellowfin Tuna', 'Bigeye Tuna', 'Mahi', 'Wahoo'],
      techniques: ['Trolling', 'Deep dropping', 'Chunking']
    };
  } else if (depth < 600) {
    return {
      zone: 'Canyon Edge',
      targetSpecies: ['Bigeye Tuna', 'Swordfish', 'Blue Marlin', 'Tilefish'],
      techniques: ['Deep trolling', 'Sword fishing', 'Deep dropping']
    };
  } else {
    return {
      zone: 'Deep Canyon',
      targetSpecies: ['Swordfish', 'Deep water species', 'Giant Bluefin'],
      techniques: ['Deep dropping', 'Specialized deep techniques']
    };
  }
}
