import { NextRequest, NextResponse } from 'next/server';

// GFW API configuration
const GFW_API_URL = 'https://gateway.api.globalfishingwatch.org/v3/vessels';
const GFW_TOKEN = process.env.GFW_API_TOKEN;

// Cache for GFW data (5 minutes per inlet)
const gfwCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bbox = searchParams.get('bbox'); // Format: "minLon,minLat,maxLon,maxLat"
    const inletId = searchParams.get('inletId');
    const days = parseInt(searchParams.get('days') || '4');
    
    if (!bbox) {
      return NextResponse.json(
        { error: 'bbox parameter is required' },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `${inletId}-${days}`;
    const cached = gfwCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // If no token, return mock data
    if (!GFW_TOKEN) {
      console.log('GFW API token not configured, returning mock data');
      const mockData = {
        vessels: [
          {
            id: 'mock-longliner-1',
            name: 'Commercial Longliner Alpha',
            type: 'longliner',
            flag: 'USA',
            length: 120,
            positions: [
              { lat: 40.85, lng: -71.95, timestamp: new Date().toISOString() }
            ]
          },
          {
            id: 'mock-trawler-1',
            name: 'Atlantic Trawler',
            type: 'trawler',
            flag: 'USA',
            length: 85,
            positions: [
              { lat: 41.05, lng: -71.65, timestamp: new Date().toISOString() }
            ]
          },
          {
            id: 'mock-drifter-1',
            name: 'Drift Net Vessel',
            type: 'driftnetter',
            flag: 'USA',
            length: 65,
            positions: [
              { lat: 40.95, lng: -71.75, timestamp: new Date().toISOString() }
            ]
          }
        ]
      };
      
      gfwCache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData);
    }

    // Parse bbox
    const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build GFW API request
    const params = new URLSearchParams({
      'dataset': 'public-global-vessel-identity:v20231026',
      'includes': 'vessel,positions',
      'vessel-groups': 'longliner,trawler,driftnetter',
      'start-date': startDate.toISOString().split('T')[0],
      'end-date': endDate.toISOString().split('T')[0],
      'positions-bbox': bbox,
      'limit': '50'
    });

    const response = await fetch(`${GFW_API_URL}?${params}`, {
      headers: {
        'Authorization': `Bearer ${GFW_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('GFW API error:', response.status, response.statusText);
      throw new Error(`GFW API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform GFW data to our format
    const vessels = data.entries?.map((entry: any) => {
      const vessel = entry.vessel || {};
      const positions = entry.positions || [];
      
      // Determine vessel type
      let type = 'unknown';
      if (vessel.geartype?.includes('longline')) type = 'longliner';
      else if (vessel.geartype?.includes('trawl')) type = 'trawler';
      else if (vessel.geartype?.includes('drift')) type = 'driftnetter';
      
      return {
        id: vessel.id || entry.id,
        name: vessel.shipname || 'Unknown Vessel',
        type,
        flag: vessel.flag || 'Unknown',
        length: vessel.length || null,
        positions: positions.map((pos: any) => ({
          lat: pos.lat,
          lng: pos.lon,
          timestamp: pos.timestamp,
          speed: pos.speed,
          course: pos.course
        }))
      };
    }) || [];

    // Filter to only our target types
    const filteredVessels = vessels.filter((v: any) => 
      ['longliner', 'trawler', 'driftnetter'].includes(v.type)
    );

    const result = { vessels: filteredVessels };
    
    // Cache the result
    gfwCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('GFW vessels API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commercial vessels' },
      { status: 500 }
    );
  }
}
