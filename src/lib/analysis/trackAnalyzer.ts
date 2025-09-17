import * as turf from '@turf/turf';
import mapboxgl from 'mapbox-gl';
import { getGFWVesselsInArea, transformGFWToTracks } from '@/lib/services/gfw';

export interface VesselTrack {
  id: string;
  type: 'individual' | 'gfw'; // Individual user or Global Fishing Watch
  vesselName: string;
  vesselType?: string;
  flag?: string;
  mmsi?: string;
  points: [number, number][];
  color: string;
  timestamp: string;
  metadata?: {
    length?: number;
    tonnage?: number;
  };
}

/**
 * Get vessel tracks that pass through the snipped area
 * Returns both individual user tracks and GFW commercial vessel tracks
 * Limited to last 4 days for snipped areas to ensure recent data
 */
export async function getVesselTracksInArea(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  map: mapboxgl.Map,
  daysLimit: number = 4  // Default 4 days for snipped areas
): Promise<{ tracks: VesselTrack[], summary: string }> {
  const bounds = turf.bbox(polygon);
  const [minLng, minLat, maxLng, maxLat] = bounds;
  
  const tracks: VesselTrack[] = [];
  
  // Calculate date range for GFW query
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysLimit);
  
  // Fetch real GFW commercial vessel data with proper filters
  try {
    // First check if commercial vessels are visible on the map
    const commercialMarkersVisible = map.getLayoutProperty('commercial-vessel-markers', 'visibility') !== 'none';
    
    const gfwVessels = await getGFWVesselsInArea(
      [minLng, minLat, maxLng, maxLat],
      startDate.toISOString(),
      endDate.toISOString()
    );
    
    // Transform and add GFW tracks
    const gfwTracks = transformGFWToTracks(gfwVessels);
    
    // Filter vessels based on type and location (matching CommercialVesselLayer filters)
    gfwTracks.forEach(track => {
      const vesselType = track.vesselType?.toLowerCase() || '';
      
      // FILTER: Only trawlers, longliners, and drifting gear (same as CommercialVesselLayer)
      const allowedTypes = ['trawl', 'longliner', 'longline', 'drifting'];
      const isAllowedType = allowedTypes.some(type => vesselType.includes(type));
      
      // Skip if not an allowed type
      if (!isAllowedType && vesselType !== 'commercial' && vesselType !== '') {
        return;
      }
      
      // Check if track intersects the snipped polygon
      const lineString = turf.lineString(track.coordinates);
      if (turf.booleanIntersects(lineString, polygon)) {
        // Color code by vessel type (matching CommercialVesselLayer)
        const vesselColor = vesselType.includes('longliner') || vesselType.includes('longline') ? '#9B59B6' : // Purple
                          vesselType.includes('drifting') ? '#3498DB' : // Blue
                          vesselType.includes('trawl') ? '#FF6B35' :     // Orange
                          '#95A5A6'; // Gray for unknown
        
        tracks.push({
          id: track.id,
          type: 'gfw',
          vesselName: track.vesselName,
          vesselType: track.vesselType || 'Commercial',
          flag: track.flag,
          mmsi: track.mmsi,
          points: track.coordinates,
          color: vesselColor,
          timestamp: track.timestamps[track.timestamps.length - 1],
          metadata: track.metadata
        });
      }
    });
    
    console.log(`Found ${tracks.filter(t => t.type === 'gfw').length} GFW vessels in snipped area`);
  } catch (error) {
    console.error('Failed to fetch GFW data:', error);
  }
  
  // Continue with mock individual tracks for now
  // In production, query Supabase for real user tracks
  
  // Add some individual user tracks (recreational boats) - BRIGHT CYAN
  tracks.push({
    id: 'user-1',
    type: 'individual',
    vesselName: 'Sea Hunter',
    points: generateTrackThroughArea(bounds, 15),
    color: '#06b6d4', // cyan-500 - bright and visible
    timestamp: '2 hours ago'
  });
  
  tracks.push({
    id: 'user-2',
    type: 'individual',
    vesselName: 'Blue Marlin',
    points: generateTrackThroughArea(bounds, 12),
    color: '#06b6d4', // cyan-500
    timestamp: '5 hours ago'
  });
  
  // Add some GFW commercial vessel tracks - BRIGHT ORANGE
  tracks.push({
    id: 'gfw-1',
    type: 'gfw',
    vesselName: 'FV Atlantic Dream',
    points: generateTrackThroughArea(bounds, 20),
    color: '#fb923c', // orange-400 - bright and visible
    timestamp: '1 hour ago'
  });
  
  tracks.push({
    id: 'gfw-2',
    type: 'gfw',
    vesselName: 'FV Ocean Harvest',
    points: generateTrackThroughArea(bounds, 18),
    color: '#fb923c', // orange-400
    timestamp: '3 hours ago'
  });
  
  // Draw tracks on the map
  drawTracksOnMap(tracks, map);
  
  // Generate summary
  const individualCount = tracks.filter(t => t.type === 'individual').length;
  const gfwCount = tracks.filter(t => t.type === 'gfw').length;
  
  const summary = `
📍 VESSEL TRACKS IN AREA

🚤 Individual Boats: ${individualCount}
${tracks.filter(t => t.type === 'individual').map(t => 
  `   • ${t.vesselName} - ${t.timestamp}`
).join('\n')}

🚢 Commercial (GFW): ${gfwCount}
${tracks.filter(t => t.type === 'gfw').map(t => 
  `   • ${t.vesselName} - ${t.timestamp}`
).join('\n')}

Total Tracks: ${tracks.length}
  `;
  
  return { tracks, summary };
}

/**
 * Generate a realistic track that passes through the area
 */
function generateTrackThroughArea(
  bounds: number[],
  pointCount: number
): [number, number][] {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  const points: [number, number][] = [];
  
  // Start from one edge
  let currentLng = minLng - 0.01; // Start slightly outside
  let currentLat = minLat + Math.random() * (maxLat - minLat);
  
  // Generate smooth track across the area
  for (let i = 0; i < pointCount; i++) {
    points.push([currentLng, currentLat]);
    
    // Move generally eastward with some variation
    currentLng += (maxLng - minLng) / pointCount + (Math.random() - 0.5) * 0.002;
    currentLat += (Math.random() - 0.5) * 0.003;
    
    // Add some realistic curves
    if (i % 3 === 0) {
      currentLat += (Math.random() - 0.5) * 0.005;
    }
  }
  
  return points;
}

/**
 * Draw vessel tracks on the map
 */
function drawTracksOnMap(tracks: VesselTrack[], map: mapboxgl.Map) {
  // Remove existing track layers if any
  tracks.forEach((track, index) => {
    const layerId = `vessel-track-${index}`;
    const sourceId = `vessel-track-source-${index}`;
    
    // Remove existing if present
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
    
    // Add track as line
    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: track.points
        }
      }
    });
    
    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': track.color,
        'line-width': track.type === 'gfw' ? 5 : 3, // Extra thick for GFW vessels
        'line-opacity': track.type === 'gfw' ? 1 : 0.9, // Full opacity for GFW
        'line-dasharray': track.type === 'gfw' ? [6, 2] : [1, 0], // Longer dashes for commercial
        'line-blur': track.type === 'gfw' ? 0 : 1 // Sharp lines for GFW
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      }
    });
    
    // Add vessel icon at the last point
    const lastPoint = track.points[track.points.length - 1];
    if (lastPoint) {
      const el = document.createElement('div');
      el.className = 'vessel-track-marker';
      
      // Create different marker styles for GFW vs recreational
      if (track.type === 'gfw') {
        // Triangle marker for commercial vessels (matching CommercialVesselLayer)
        el.innerHTML = `
          <div style="
            width: 24px;
            height: 24px;
            position: relative;
          ">
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 20px;
              height: 20px;
              background: ${track.color};
              clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            "></div>
            <div style="
              position: absolute;
              top: -4px;
              right: -4px;
              width: 12px;
              height: 12px;
              background: linear-gradient(135deg, #00DDEB, #0099CC);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 7px;
              font-weight: bold;
              color: white;
              border: 1px solid white;
            ">GFW</div>
          </div>
        `;
      } else {
        // Circle marker for recreational vessels
        el.innerHTML = `
          <div style="
            width: 20px;
            height: 20px;
            background: ${track.color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: white;
            font-weight: bold;
          ">R</div>
        `;
      }
      
      new (window as any).mapboxgl.Marker(el)
        .setLngLat(lastPoint)
        .setPopup(
          new (window as any).mapboxgl.Popup({ offset: 15 })
            .setHTML(`
              <div style="padding: 8px; min-width: 180px;">
                <div style="font-weight: bold; color: ${track.color}; margin-bottom: 4px;">
                  ${track.vesselName}
                </div>
                <div style="font-size: 11px; color: #666;">
                  ${track.type === 'gfw' ? 
                    `<div style="margin-bottom: 4px;">
                      <span style="background: linear-gradient(135deg, #00DDEB, #0099CC); 
                             color: white; padding: 2px 6px; border-radius: 3px; 
                             font-size: 9px; font-weight: bold;">GFW DATA</span>
                    </div>
                    <div>Type: ${track.vesselType || 'Commercial'}</div>
                    ${track.flag ? `<div>Flag: ${track.flag}</div>` : ''}
                    ${track.mmsi ? `<div>MMSI: ${track.mmsi}</div>` : ''}
                    ${track.metadata?.length ? `<div>Length: ${Math.round(track.metadata.length)}m</div>` : ''}`
                    : 
                    '<div>Type: Recreational</div>'
                  }
                  <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #eee;">
                    Last seen: ${track.timestamp}
                  </div>
                </div>
              </div>
            `)
        )
        .addTo(map);
    }
  });
}

/**
 * Clear vessel tracks from the map
 */
export function clearVesselTracks(map: mapboxgl.Map) {
  // Remove track layers
  for (let i = 0; i < 10; i++) {
    const layerId = `vessel-track-${i}`;
    const sourceId = `vessel-track-source-${i}`;
    
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  }
  
  // Remove markers
  const markers = document.querySelectorAll('.vessel-track-marker');
  markers.forEach(marker => {
    const parent = marker.parentElement?.parentElement;
    if (parent) parent.remove();
  });
}
