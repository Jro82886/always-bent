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

    // If no token, return error
    if (!GFW_TOKEN) {
      console.error('GFW_API_TOKEN not configured');
      return NextResponse.json(
        { 
          error: 'GFW API not configured',
          message: 'Vessel tracking service not available',
          vessels: []
        },
        { status: 503 }
      );
    }

    // Parse bbox
    const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
    
    // Calculate date range (4 days of history as per requirement)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build GFW API request - only fishing vessels
    const params = new URLSearchParams({
      'dataset': 'public-global-fishing-vessels:latest',
      'includes': 'vessel,positions,events',
      'vessel-types': 'fishing',
      'gear-types': 'trawlers,drifting_longlines,set_longlines,fixed_gear',
      'start-date': startDate.toISOString().split('T')[0],
      'end-date': endDate.toISOString().split('T')[0],
      'positions-bbox': bbox,
      'limit': '100'
    });

    const response = await fetch(`${GFW_API_URL}?${params}`, {
      headers: {
        'Authorization': `Bearer ${GFW_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // Check if it's a server error
      if (response.status >= 500) {
        console.error('GFW server error:', response.status);
        return NextResponse.json(
          { 
            error: 'GFW server error',
            message: 'GFW server down, try back later',
            vessels: []
          },
          { status: 503 }
        );
      }
      
      console.error('GFW API error:', response.status, response.statusText);
      throw new Error(`GFW API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform GFW data to our format
    const vessels = (data.entries || []).map((entry: any) => {
      const vessel = entry.vessel || {};
      const positions = entry.positions || [];
      
      // Determine vessel type based on gear type
      let type = 'unknown';
      const gearType = vessel.geartype?.toLowerCase() || '';
      
      if (gearType.includes('longline') || gearType.includes('set_longlines')) {
        type = 'longliner';
      } else if (gearType.includes('drifting_longlines')) {
        type = 'drifting_longline';
      } else if (gearType.includes('trawl')) {
        type = 'trawler';
      }
      
      // Check for fishing events
      const fishingEvents = entry.events?.filter((e: any) => 
        e.type === 'fishing' || e.type === 'apparent_fishing'
      ) || [];
      
      return {
        id: vessel.id || entry.id,
        name: vessel.shipname || 'Unknown Vessel',
        type,
        flag: vessel.flag || 'Unknown',
        length: vessel.length || null,
        positions: positions.map((pos: any) => ({
          lat: pos.lat,
          lng: pos.lon,
          timestamp: pos.timestamp
        })),
        fishingEvents: fishingEvents.map((event: any) => ({
          start: event.start,
          end: event.end,
          lat: event.position?.lat,
          lng: event.position?.lon
        }))
      };
    });

    const result = { vessels };
    
    // Cache the result
    gfwCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('GFW vessels error:', error);
    
    // Return empty vessels array with error message
    return NextResponse.json(
      { 
        error: 'Failed to fetch vessel data',
        message: error instanceof Error ? error.message : 'Unknown error',
        vessels: []
      },
      { status: 500 }
    );
  }
}