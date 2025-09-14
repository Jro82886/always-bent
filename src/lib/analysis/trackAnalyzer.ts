import * as turf from '@turf/turf';

export interface VesselTrack {
  id: string;
  type: 'individual' | 'gfw'; // Individual user or Global Fishing Watch
  vesselName: string;
  points: [number, number][];
  color: string;
  timestamp: string;
}

/**
 * Get vessel tracks that pass through the snipped area
 * Returns both individual user tracks and GFW commercial vessel tracks
 */
export async function getVesselTracksInArea(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  map: mapboxgl.Map
): Promise<{ tracks: VesselTrack[], summary: string }> {
  const bounds = turf.bbox(polygon);
  const [minLng, minLat, maxLng, maxLat] = bounds;
  
  // Generate mock tracks for MVP
  // In production, this would query Supabase for real user tracks
  // and GFW API for commercial vessel tracks
  
  const tracks: VesselTrack[] = [];
  
  // Add some individual user tracks (recreational boats)
  tracks.push({
    id: 'user-1',
    type: 'individual',
    vesselName: 'Sea Hunter',
    points: generateTrackThroughArea(bounds, 15),
    color: '#00DDEB', // Cyan for individual boats
    timestamp: '2 hours ago'
  });
  
  tracks.push({
    id: 'user-2',
    type: 'individual',
    vesselName: 'Blue Marlin',
    points: generateTrackThroughArea(bounds, 12),
    color: '#00DDEB',
    timestamp: '5 hours ago'
  });
  
  // Add some GFW commercial vessel tracks
  tracks.push({
    id: 'gfw-1',
    type: 'gfw',
    vesselName: 'FV Atlantic Dream',
    points: generateTrackThroughArea(bounds, 20),
    color: '#FF6B6B', // Red for commercial vessels
    timestamp: '1 hour ago'
  });
  
  tracks.push({
    id: 'gfw-2',
    type: 'gfw',
    vesselName: 'FV Ocean Harvest',
    points: generateTrackThroughArea(bounds, 18),
    color: '#FF6B6B',
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
        'line-width': track.type === 'gfw' ? 3 : 2, // Thicker for commercial
        'line-opacity': 0.7,
        'line-dasharray': track.type === 'gfw' ? [2, 1] : [1, 0] // Dashed for commercial
      }
    });
    
    // Add vessel icon at the last point
    const lastPoint = track.points[track.points.length - 1];
    if (lastPoint) {
      const el = document.createElement('div');
      el.className = 'vessel-track-marker';
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
        ">
          ${track.type === 'gfw' ? 'C' : 'R'}
        </div>
      `;
      
      new (window as any).mapboxgl.Marker(el)
        .setLngLat(lastPoint)
        .setPopup(
          new (window as any).mapboxgl.Popup({ offset: 15 })
            .setHTML(`
              <div style="padding: 6px;">
                <div style="font-weight: bold; color: ${track.color};">
                  ${track.vesselName}
                </div>
                <div style="font-size: 11px; color: #666;">
                  ${track.type === 'gfw' ? 'Commercial (GFW)' : 'Recreational'}
                  <br/>${track.timestamp}
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
