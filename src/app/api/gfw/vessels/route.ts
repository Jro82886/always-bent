import { NextRequest, NextResponse } from 'next/server';

// GFW API configuration
const GFW_API_URL = 'https://gateway.api.globalfishingwatch.org/v3/vessels';
const GFW_TOKEN = process.env.GFW_API_TOKEN;

// Cache for GFW data (5 minutes per inlet)
const gfwCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Import INLETS configuration
import { INLETS } from '@/lib/inlets';

// Helper to calculate bbox from inlet center and zoom
function getInletBbox(inletId: string): string | null {
  const inlet = INLETS.find(i => i.id === inletId);
  if (!inlet) return null;
  
  // Rough calculation based on zoom level
  // Higher zoom = smaller area
  const zoomToDegrees: Record<number, number> = {
    4.5: 20,   // Overview
    7.2: 2.5,  // 90nm view
    7.3: 2.3,  // 85nm view
    7.4: 2.1,  // 80nm view
    7.5: 1.9,  // 75nm view
    7.6: 1.7,  // 70nm view
    7.7: 1.5,  // 65nm view
    7.8: 1.3,  // 55nm view
    7.9: 1.1,  // 50nm view
    8.0: 0.9   // 40nm view
  };
  
  const degrees = zoomToDegrees[inlet.zoom] || 1.5;
  const [lng, lat] = inlet.center;
  
  return `${lng - degrees},${lat - degrees},${lng + degrees},${lat + degrees}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let bbox = searchParams.get('bbox'); // Format: "minLon,minLat,maxLon,maxLat"
    const inletId = searchParams.get('inletId');
    const days = parseInt(searchParams.get('days') || '4');
    
    // If inletId is provided, calculate bbox from it
    if (inletId && !bbox) {
      bbox = getInletBbox(inletId);
      if (!bbox) {
        return NextResponse.json(
          { error: 'Invalid inlet ID' },
          { status: 400 }
        );
      }
    }
    
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

    // If no token, return configured: false
    if (!GFW_TOKEN) {
      console.error('GFW_API_TOKEN not configured');
      return NextResponse.json({
        configured: false,
        vessels: [],
        events: []
      });
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