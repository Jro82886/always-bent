import * as turf from '@turf/turf';
import mapboxgl from 'mapbox-gl';
import { getGFWVesselsInArea, transformGFWToTracks } from '@/lib/services/gfw';
import { supabase } from '@/lib/supabaseClient';

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
): Promise<{ tracks: VesselTrack[], summary: string, reports: any[] }> {
  const bounds = turf.bbox(polygon);
  const [minLng, minLat, maxLng, maxLat] = bounds;
  
  const tracks: VesselTrack[] = [];
  const reports: any[] = [];
  
  // Calculate date range for queries
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysLimit);
  
  // Fetch user reports from Supabase within the snipped area
  try {
    // Query bite_reports within the bounds
    const { data: biteReports, error: biteError } = await supabase
      .from('bite_reports')
      .select('*')
      .gte('lat', minLat)
      .lte('lat', maxLat)
      .gte('lon', minLng)
      .lte('lon', maxLng)
      .gte('created_at', startDate.toISOString())
      .eq('status', 'analyzed')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (!biteError && biteReports) {
      reports.push(...biteReports.map(report => ({
        ...report,
        type: 'bite',
        displayName: report.user_name || 'Anonymous Captain'
      })));
    }
    
    // Query catch_reports within the bounds
    const { data: catchReports, error: catchError } = await supabase
      .from('catch_reports')
      .select('*')
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (!catchError && catchReports) {
      reports.push(...catchReports.map(report => ({
        ...report,
        type: 'catch',
        lat: report.latitude,
        lon: report.longitude,
        displayName: report.captain_name || 'Anonymous Captain'
      })));
    }
    
    console.log(`Found ${reports.length} user reports in snipped area`);
    
    // Add report markers to the map
    if (reports.length > 0) {
      addReportMarkersToMap(reports, map);
    }
  } catch (error) {
    console.error('Failed to fetch user reports:', error);
  }
  
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
  const biteCount = reports.filter(r => r.type === 'bite').length;
  const catchCount = reports.filter(r => r.type === 'catch').length;
  
  const summary = `
📍 VESSEL TRACKS & REPORTS IN AREA

🚤 Individual Boats: ${individualCount}
${tracks.filter(t => t.type === 'individual').map(t => 
  `   • ${t.vesselName} - ${t.timestamp}`
).join('\n')}

🚢 Commercial (GFW): ${gfwCount}
${tracks.filter(t => t.type === 'gfw').map(t => 
  `   • ${t.vesselName} - ${t.timestamp}`
).join('\n')}

🎣 User Reports: ${reports.length}
${biteCount > 0 ? `   • ${biteCount} Bite Reports` : ''}
${catchCount > 0 ? `   • ${catchCount} Catch Reports` : ''}
${reports.slice(0, 5).map(r => 
  `   • ${r.displayName} - ${r.species || r.notes || 'Report'} (${new Date(r.created_at).toLocaleDateString()})`
).join('\n')}

Total Activity: ${tracks.length + reports.length} items
  `;
  
  return { tracks, summary, reports };
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
 * Add report markers to the map
 */
function addReportMarkersToMap(reports: any[], map: mapboxgl.Map) {
  reports.forEach((report, index) => {
    const el = document.createElement('div');
    el.className = 'report-marker-snip';
    
    // Create different styles for bite vs catch reports
    const isBite = report.type === 'bite';
    const color = isBite ? '#10B981' : '#3B82F6'; // Green for bites, blue for catches
    const icon = isBite ? '🎣' : '🐟';
    
    el.innerHTML = `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 28px;
          height: 28px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">${icon}</div>
        ${report.fish_on || report.success ? `
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 10px;
            height: 10px;
            background: #FFD700;
            border-radius: 50%;
            border: 1px solid white;
          "></div>
        ` : ''}
      </div>
    `;
    
    // Create popup content
    const popupContent = `
      <div style="padding: 10px; min-width: 200px;">
        <div style="font-weight: bold; margin-bottom: 6px; color: ${color};">
          ${report.displayName}
        </div>
        <div style="font-size: 12px; color: #666;">
          ${isBite ? 'BITE Report' : 'CATCH Report'}
        </div>
        ${report.species ? `
          <div style="margin-top: 4px; padding: 4px 8px; background: #F3F4F6; border-radius: 4px;">
            <strong>Species:</strong> ${report.species}
          </div>
        ` : ''}
        ${report.notes ? `
          <div style="margin-top: 4px; font-size: 11px; color: #888;">
            "${report.notes}"
          </div>
        ` : ''}
        ${report.analysis?.confidence_score ? `
          <div style="margin-top: 4px; font-size: 10px; color: #999;">
            Confidence: ${report.analysis.confidence_score}%
          </div>
        ` : ''}
        <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #eee; font-size: 10px; color: #999;">
          ${new Date(report.created_at).toLocaleString()}
        </div>
      </div>
    `;
    
    new (window as any).mapboxgl.Marker(el)
      .setLngLat([report.lon || report.longitude, report.lat || report.latitude])
      .setPopup(
        new (window as any).mapboxgl.Popup({ offset: 15 })
          .setHTML(popupContent)
      )
      .addTo(map);
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
  
  // Remove vessel markers
  const vesselMarkers = document.querySelectorAll('.vessel-track-marker');
  vesselMarkers.forEach(marker => {
    const parent = marker.parentElement?.parentElement;
    if (parent) parent.remove();
  });
  
  // Remove report markers
  const reportMarkers = document.querySelectorAll('.report-marker-snip');
  reportMarkers.forEach(marker => {
    const parent = marker.parentElement?.parentElement;
    if (parent) parent.remove();
  });
}
