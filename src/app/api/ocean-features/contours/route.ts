import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Generate SST contour lines at specific temperature breaks
 * Perfect for highlighting thermal fronts!
 */

// Key temperature breaks for fishing (Fahrenheit)
const TEMP_BREAKS_F = [64, 66, 68, 70, 72, 74, 76, 78];

// Convert Fahrenheit to Celsius for data processing
const fToC = (f: number) => (f - 32) * 5/9;

interface ContourPoint {
  lng: number;
  lat: number;
  value: number;
}

/**
 * Simple contour detection using marching squares algorithm
 */
function generateContours(
  values: number[][],
  bounds: { north: number; south: number; east: number; west: number },
  threshold: number
): number[][][] {
  const rows = values.length;
  const cols = values[0].length;
  const contours: number[][][] = [];
  
  // Helper to convert grid coords to lat/lng
  const gridToGeo = (row: number, col: number): [number, number] => {
    const lng = bounds.west + (col / cols) * (bounds.east - bounds.west);
    const lat = bounds.north - (row / rows) * (bounds.north - bounds.south);
    return [lng, lat];
  };
  
  // Marching squares lookup table (simplified)
  const getContourSegment = (
    tl: boolean, tr: boolean, 
    bl: boolean, br: boolean,
    row: number, col: number
  ): number[][] | null => {
    const config = (tl ? 8 : 0) + (tr ? 4 : 0) + (br ? 2 : 0) + (bl ? 1 : 0);
    
    // Calculate interpolated positions
    const top = [col + 0.5, row];
    const right = [col + 1, row + 0.5];
    const bottom = [col + 0.5, row + 1];
    const left = [col, row + 0.5];
    
    // Return line segments based on configuration
    switch (config) {
      case 1: case 14: return [left, bottom];
      case 2: case 13: return [bottom, right];
      case 3: case 12: return [left, right];
      case 4: case 11: return [top, right];
      case 5: return [top, bottom]; // Saddle point
      case 6: case 9: return [top, bottom];
      case 7: case 8: return [top, left];
      case 10: return [left, right]; // Saddle point
      default: return null;
    }
  };
  
  // Process each cell
  const segments: number[][][] = [];
  
  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < cols - 1; col++) {
      // Get corner values
      const tl = values[row][col] >= threshold;
      const tr = values[row][col + 1] >= threshold;
      const bl = values[row + 1][col] >= threshold;
      const br = values[row + 1][col + 1] >= threshold;
      
      // Skip if all corners are same
      if (tl === tr && tr === bl && bl === br) continue;
      
      const segment = getContourSegment(tl, tr, bl, br, row, col);
      if (segment) {
        // Convert to geo coordinates
        const geoSegment = segment.map(([c, r]) => gridToGeo(r, c));
        segments.push(geoSegment);
      }
    }
  }
  
  // Connect segments into continuous lines
  // (Simplified - just return segments for now)
  return segments;
}

/**
 * Generate smooth Bezier curves from contour segments
 */
function smoothContours(segments: number[][][]): any[] {
  const features: any[] = [];
  
  // Group connected segments (simplified)
  const lines: number[][][] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < segments.length; i++) {
    if (used.has(i)) continue;
    
    const line = [...segments[i]];
    used.add(i);
    
    // Try to connect segments
    let found = true;
    while (found) {
      found = false;
      const lastPoint = line[line.length - 1];
      
      for (let j = 0; j < segments.length; j++) {
        if (used.has(j)) continue;
        
        const seg = segments[j];
        const dist1 = Math.hypot(lastPoint[0] - seg[0][0], lastPoint[1] - seg[0][1]);
        const dist2 = Math.hypot(lastPoint[0] - seg[1][0], lastPoint[1] - seg[1][1]);
        
        if (dist1 < 0.001) {
          line.push(seg[1]);
          used.add(j);
          found = true;
          break;
        } else if (dist2 < 0.001) {
          line.push(seg[0]);
          used.add(j);
          found = true;
          break;
        }
      }
    }
    
    if (line.length > 2) {
      lines.push(line);
    }
  }
  
  return lines;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const bbox = url.searchParams.get('bbox');
    
    if (!bbox) {
      return NextResponse.json({ error: 'bbox parameter required' }, { status: 400 });
    }
    
    const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
    
    // For now, generate synthetic SST data
    // TODO: Extract from actual SST tiles
    const resolution = 100; // Grid resolution
    const values: number[][] = [];
    
    for (let i = 0; i < resolution; i++) {
      const row: number[] = [];
      for (let j = 0; j < resolution; j++) {
        // Create realistic SST pattern (Celsius)
        const lat = minLat + (i / resolution) * (maxLat - minLat);
        const lng = minLng + (j / resolution) * (maxLng - minLng);
        
        // Gulf Stream effect
        const gulfStreamTemp = 25 - Math.abs(lat - 35) * 0.5;
        const eddyEffect = Math.sin(lng * 0.1) * Math.cos(lat * 0.1) * 2;
        const coastalCooling = Math.exp(-(lng + 75) * 0.1) * 3;
        
        const temp = gulfStreamTemp + eddyEffect - coastalCooling + Math.random() * 0.5;
        row.push(temp);
      }
      values.push(row);
    }
    
    const bounds = { north: maxLat, south: minLat, east: maxLng, west: minLng };
    const features: any[] = [];
    
    // Generate contours for each temperature break
    for (const tempF of TEMP_BREAKS_F) {
      const tempC = fToC(tempF);
      const segments = generateContours(values, bounds, tempC);
      const smoothed = smoothContours(segments);
      
      // Create GeoJSON features
      for (const line of smoothed) {
        if (line.length > 5) { // Only include significant contours
          features.push({
            type: 'Feature',
            properties: {
              temperature_f: tempF,
              temperature_c: tempC,
              type: 'isotherm',
              style: {
                color: tempF >= 72 ? '#ff6b6b' : tempF >= 68 ? '#feca57' : '#54a0ff',
                weight: tempF === 70 ? 3 : 2, // Emphasize 70°F
                opacity: 0.8
              }
            },
            geometry: {
              type: 'LineString',
              coordinates: line
            }
          });
        }
      }
    }
    
    return NextResponse.json({
      type: 'FeatureCollection',
      features,
      properties: {
        generated_at: new Date().toISOString(),
        temperature_breaks_f: TEMP_BREAKS_F,
        bbox: [minLng, minLat, maxLng, maxLat]
      }
    });
    
  } catch (error) {
    console.error('Error generating contours:', error);
    return NextResponse.json(
      { error: 'Failed to generate contours' },
      { status: 500 }
    );
  }
}
