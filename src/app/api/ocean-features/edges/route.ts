import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bbox = searchParams.get('bbox');
  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  
  if (!bbox) {
    return NextResponse.json({ error: 'bbox parameter required' }, { status: 400 });
  }
  
  try {
    const [south, west, north, east] = bbox.split(',').map(Number);
    
    // Call Python backend for chlorophyll edge detection
    const backendUrl = process.env.POLYGONS_BACKEND_URL || 'http://localhost:8010';
    const response = await fetch(
      `${backendUrl}/ocean-features/edges?bbox=${bbox}&date=${date}&low_thresh=0.1&high_thresh=0.3`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }
    
    const edges = await response.json();
    
    return NextResponse.json({
      type: "FeatureCollection",
      features: edges,
      metadata: {
        bbox: [south, west, north, east],
        date,
        feature_type: "chlorophyll_edges",
        thresholds: "0.1-0.3",
        source: "Chlorophyll edge detection"
      }
    });
    
  } catch (error) {
    console.error('Chlorophyll edges detection error:', error);
    
    // Fallback: return sample edge data
    return NextResponse.json({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            feature_type: "chlorophyll_edge",
            area_pixels: 2500,
            perimeter_pixels: 180,
            id: "sample_edge_1"
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-75.2, 36.0],
              [-75.0, 36.0],
              [-75.0, 36.2],
              [-75.2, 36.2],
              [-75.2, 36.0]
            ]]
          }
        }
      ],
      metadata: {
        bbox: bbox?.split(',').map(Number),
        date,
        feature_type: "chlorophyll_edges",
        status: "fallback_data"
      }
    });
  }
}
