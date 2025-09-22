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
  console.log('[GFW] Request received:', request.url);
  
  try {
    const { searchParams } = new URL(request.url);
    let bbox = searchParams.get('bbox'); // Format: "minLon,minLat,maxLon,maxLat"
    const inletId = searchParams.get('inletId');
    const days = parseInt(searchParams.get('days') || '4');
    
    console.log('[GFW] Params:', { bbox, inletId, days });
    
    // If inletId is provided, calculate bbox from it
    if (inletId && !bbox) {
      bbox = getInletBbox(inletId);
      if (!bbox) {
        console.log('[GFW] Invalid inlet ID:', inletId);
        return NextResponse.json(
          { error: 'Invalid inlet ID' },
          { status: 400 }
        );
      }
    }
    
    if (!bbox) {
      console.log('[GFW] No bbox parameter');
      return NextResponse.json(
        { error: 'bbox parameter is required' },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `${inletId}-${days}`;
    const cached = gfwCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[GFW] Returning cached data');
      return NextResponse.json(cached.data);
    }

    // Check token
    const tokenPresent = !!GFW_TOKEN?.trim();
    console.log('[GFW] Token present:', tokenPresent);
    console.log('[GFW] Token length:', GFW_TOKEN?.length || 0);
    
    // If no token, return configured: false
    if (!tokenPresent) {
      console.log('[GFW] No token configured, returning empty response');
      return NextResponse.json({
        configured: false,
        vessels: [],
        tracks: [],
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

    console.log('[GFW] Calling upstream API:', `${GFW_API_URL}?${params}`);
    console.log('[GFW] Request headers:', {
      'Authorization': `Bearer ${GFW_TOKEN?.substring(0, 10)}...`,
      'Content-Type': 'application/json'
    });
    
    const fetchStart = Date.now();
    const response = await fetch(`${GFW_API_URL}?${params}`, {
      headers: {
        'Authorization': `Bearer ${GFW_TOKEN}`,
        'Content-Type': 'application/json'
      },
      // Add timeout
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    const fetchDuration = Date.now() - fetchStart;
    console.log('[GFW] Upstream response received in', fetchDuration, 'ms');
    console.log('[GFW] Upstream status:', response.status);

    if (!response.ok) {
      // Soft-fail for auth/rate limit errors
      if ([401, 403, 429].includes(response.status)) {
        console.error('[GFW] Auth/rate limit error:', response.status);
        return NextResponse.json({
          configured: false,
          vessels: [],
          tracks: [],
          events: []
        });
      }
      
      // Check if it's a server error
      if (response.status >= 500) {
        console.error('[GFW] Server error:', response.status);
        return NextResponse.json({
          configured: false,
          vessels: [],
          tracks: [],
          events: []
        });
      }
      
      console.error('[GFW] API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('[GFW] Error body:', errorText);
      
      return NextResponse.json({
        error: `GFW API error: ${response.status}`,
        configured: false,
        vessels: [],
        tracks: [],
        events: []
      });
    }

    const data = await response.json();
    console.log('[GFW] Response data received, entries:', data.entries?.length || 0);

    // Transform GFW data to our format
    const vessels = (data.entries || []).map((entry: any) => {
      const vessel = entry.vessel || {};
      const positions = entry.positions || [];
      
      // Determine vessel type based on gear type
      let gear = 'unknown';
      const gearType = vessel.geartype?.toLowerCase() || '';
      
      if (gearType.includes('longline') || gearType.includes('set_longlines')) {
        gear = 'longliner';
      } else if (gearType.includes('drifting_longlines')) {
        gear = 'drifting_longline';
      } else if (gearType.includes('trawl')) {
        gear = 'trawler';
      }
      
      // Get last position
      const lastPos = positions[positions.length - 1];
      
      return {
        id: vessel.id || entry.id,
        name: vessel.shipname || 'Unknown Vessel',
        gear, // Changed from 'type' to 'gear'
        flag: vessel.flag || 'Unknown',
        length: vessel.length || null,
        last_pos: lastPos ? {
          lon: lastPos.lon,
          lat: lastPos.lat,
          t: lastPos.timestamp
        } : null,
        track: positions.map((pos: any) => ({
          lon: pos.lon,
          lat: pos.lat,
          t: pos.timestamp
        }))
      };
    }).filter((v: any) => v.last_pos); // Only include vessels with positions

    // Extract fishing events
    const events = (data.entries || []).flatMap((entry: any) => {
      const fishingEvents = entry.events?.filter((e: any) => 
        e.type === 'fishing' || e.type === 'apparent_fishing'
      ) || [];
      
      const vessel = entry.vessel || {};
      let gear = 'unknown';
      const gearType = vessel.geartype?.toLowerCase() || '';
      
      if (gearType.includes('longline') || gearType.includes('set_longlines')) {
        gear = 'longliner';
      } else if (gearType.includes('drifting_longlines')) {
        gear = 'drifting_longline';
      } else if (gearType.includes('trawl')) {
        gear = 'trawler';
      }
      
      return fishingEvents.map((event: any) => ({
        lon: event.position?.lon,
        lat: event.position?.lat,
        t: event.start,
        gear,
        score: event.score || 1
      })).filter((e: any) => e.lon && e.lat);
    });

    const result = { vessels, events };
    
    // Cache the result
    gfwCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('[GFW] Route error:', error);
    console.error('[GFW] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[GFW] Error message:', error instanceof Error ? error.message : String(error));
    
    // Always return a valid response
    return NextResponse.json(
      { 
        error: 'Failed to fetch vessel data',
        message: error instanceof Error ? error.message : 'Unknown error',
        configured: false,
        vessels: [],
        tracks: [],
        events: []
      },
      { status: 200 } // Return 200 to avoid client-side errors
    );
  }
}// Force deployment with GFW token active
