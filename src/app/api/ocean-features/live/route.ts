import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const feature = searchParams.get('feature') || 'edges'; // edges, eddies, fronts
  
  // Get Python backend URL from environment
  const PYTHON_BACKEND = process.env.NEXT_PUBLIC_POLYGONS_URL || process.env.POLYGONS_BACKEND_URL;
  
  if (!PYTHON_BACKEND) {
    
    // Return demo data as fallback
    return NextResponse.json({
      type: 'FeatureCollection',
      features: [],
      demo: true,
      message: 'Python backend not configured - using demo data'
    });
  }

  try {
    // Call Python backend (Railway endpoints are at /ocean-features/*, not /api/ocean-features/*)
    const pythonUrl = `${PYTHON_BACKEND}/ocean-features/${feature}?date=${date}`;
    
    
    const response = await fetch(pythonUrl, {
      headers: {
        'Accept': 'application/json',
      },
      // Cache for 1 hour since ocean features don't change rapidly
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`Python backend returned ${response.status}`);
    }

    const data = await response.json();
    
    // Ensure it's valid GeoJSON
    if (!data.type || data.type !== 'FeatureCollection') {
      throw new Error('Invalid GeoJSON from Python backend');
    }

    // Add metadata
    return NextResponse.json({
      ...data,
      generated: new Date().toISOString(),
      source: 'live',
      date: date
    });

  } catch (error) {
    
    
    // Fallback to demo data
    const demoResponse = await fetch(`${request.nextUrl.origin}/abfi_sst_edges_latest.geojson`);
    const demoData = await demoResponse.json();
    
    return NextResponse.json({
      ...demoData,
      demo: true,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Using demo data due to backend error'
    });
  }
}
