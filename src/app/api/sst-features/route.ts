import { NextRequest, NextResponse } from 'next/server';
import { generateDailyPolygons } from '@/lib/sst/edgeDetection';

/**
 * GET /api/sst-features
 * Get SST edge and eddy features for the current view
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bbox = searchParams.get('bbox');
    
    // Parse bbox if provided, otherwise use default
    let bounds: [[number, number], [number, number]];
    if (bbox) {
      const [west, south, east, north] = bbox.split(',').map(Number);
      bounds = [[west, south], [east, north]];
    } else {
      // Default to a smaller test area
      bounds = [[-75, 35], [-70, 40]]; // Mid-Atlantic region
    }
    
    // Generate polygons for the requested area
    const polygons = await generateDailyPolygons(
      process.env.NEXT_PUBLIC_SST_WMTS_TEMPLATE || '',
      bounds
    );
    
    // Add some logging
     => f.properties?.type === 'eddy').length,
      edges: polygons.features.filter((f: any) => f.properties?.type === 'edge').length,
      filaments: polygons.features.filter((f: any) => f.properties?.type === 'filament').length,
      bounds
    });
    
    return NextResponse.json(polygons);
  } catch (error) {
    
    return NextResponse.json(
      { 
        type: 'FeatureCollection',
        features: [],
        error: 'Failed to generate features' 
      },
      { status: 500 }
    );
  }
}
