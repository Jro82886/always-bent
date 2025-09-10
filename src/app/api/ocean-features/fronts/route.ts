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
    
    // Call Python backend for SST front detection
    const backendUrl = process.env.POLYGONS_BACKEND_URL || 'http://localhost:8010';
    const response = await fetch(
      `${backendUrl}/ocean-features/fronts?bbox=${bbox}&date=${date}&threshold=0.5`,
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
    
    const fronts = await response.json();
    
    return NextResponse.json({
      type: "FeatureCollection",
      features: fronts,
      metadata: {
        bbox: [south, west, north, east],
        date,
        feature_type: "thermal_fronts",
        threshold: "0.5°C/km",
        source: "SST gradient analysis"
      }
    });
    
  } catch (error) {
    console.error('SST fronts detection error:', error);
    
    // Fallback: return sample front data
    return NextResponse.json({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            feature_type: "thermal_front",
            strength: 0.8,
            threshold: 0.5,
            id: "sample_front_1"
          },
          geometry: {
            type: "LineString",
            coordinates: [
              [-75.0, 36.0],
              [-74.8, 36.2],
              [-74.5, 36.1],
              [-74.2, 36.3]
            ]
          }
        }
      ],
      metadata: {
        bbox: bbox?.split(',').map(Number),
        date,
        feature_type: "thermal_fronts",
        status: "fallback_data"
      }
    });
  }
}
