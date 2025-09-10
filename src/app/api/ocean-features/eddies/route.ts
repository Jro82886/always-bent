import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bbox = searchParams.get('bbox');
  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const minRadius = searchParams.get('min_radius') || '10';
  
  if (!bbox) {
    return NextResponse.json({ error: 'bbox parameter required' }, { status: 400 });
  }
  
  try {
    const [south, west, north, east] = bbox.split(',').map(Number);
    
    // Call Python backend for eddy detection
    const backendUrl = process.env.POLYGONS_BACKEND_URL || 'http://localhost:8010';
    const response = await fetch(
      `${backendUrl}/ocean-features/eddies?bbox=${bbox}&date=${date}&min_radius=${minRadius}`,
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
    
    const eddies = await response.json();
    
    return NextResponse.json({
      type: "FeatureCollection",
      features: eddies,
      metadata: {
        bbox: [south, west, north, east],
        date,
        feature_type: "mesoscale_eddies",
        min_radius_km: parseInt(minRadius),
        source: "Okubo-Weiss parameter analysis"
      }
    });
    
  } catch (error) {
    console.error('Eddy detection error:', error);
    
    // Fallback: return sample eddy data
    return NextResponse.json({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            feature_type: "eddy",
            eddy_type: "warm_core",
            radius_km: 25.0,
            centroid_lat: 36.1,
            centroid_lon: -74.8,
            okubo_weiss: -0.15,
            sst_anomaly: 1.2,
            id: "sample_eddy_1"
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-74.8, 36.1],
              [-74.75, 36.15],
              [-74.7, 36.1],
              [-74.75, 36.05],
              [-74.8, 36.1]
            ]]
          }
        },
        {
          type: "Feature",
          properties: {
            feature_type: "eddy",
            eddy_type: "cold_core",
            radius_km: 18.0,
            centroid_lat: 36.3,
            centroid_lon: -75.1,
            okubo_weiss: -0.22,
            sst_anomaly: -0.8,
            id: "sample_eddy_2"
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-75.1, 36.3],
              [-75.05, 36.35],
              [-75.0, 36.3],
              [-75.05, 36.25],
              [-75.1, 36.3]
            ]]
          }
        }
      ],
      metadata: {
        bbox: bbox?.split(',').map(Number),
        date,
        feature_type: "mesoscale_eddies",
        status: "fallback_data"
      }
    });
  }
}
