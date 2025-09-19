import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    return null;
  }
  
  return createClient(url, key);
};

// Rate limiting map (in-memory for MVP)
const lastPositionMap = new Map<string, { lat: number; lng: number; heading?: number; timestamp: number }>();

// Constants for position validation
const MIN_SEND_INTERVAL = 15000; // 15 seconds
const MIN_DISTANCE_METERS = 50; // 50m
const MIN_HEADING_CHANGE = 15; // 15 degrees

// Calculate distance between two points in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

// POST /api/tracking/position - Record a vessel position
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      user_id, 
      username, 
      inlet_id, 
      lat, 
      lng, 
      speed, 
      heading,
      session_id,
      ts 
    } = body;

    // Validate required fields
    if (!user_id || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, lat, lng' },
        { status: 400 }
      );
    }

    // Check rate limiting and significant change
    const now = Date.now();
    const lastPosition = lastPositionMap.get(user_id);
    
    if (lastPosition) {
      const timeSinceLastSent = now - lastPosition.timestamp;
      
      // Enforce minimum interval
      if (timeSinceLastSent < MIN_SEND_INTERVAL) {
        return NextResponse.json(
          { success: false, message: 'Rate limited - too frequent' },
          { status: 429 }
        );
      }
      
      // Check for significant change
      const distance = calculateDistance(lastPosition.lat, lastPosition.lng, lat, lng);
      const headingDelta = heading !== null && lastPosition.heading !== undefined
        ? Math.abs(heading - lastPosition.heading)
        : 0;
        
      const hasSignificantChange = 
        distance > MIN_DISTANCE_METERS ||
        headingDelta > MIN_HEADING_CHANGE ||
        timeSinceLastSent >= 60000; // 60 seconds max
        
      if (!hasSignificantChange) {
        return NextResponse.json(
          { success: false, message: 'No significant change' },
          { status: 200 }
        );
      }
    }

    // Update last position map
    lastPositionMap.set(user_id, {
      lat,
      lng,
      heading: heading || undefined,
      timestamp: now
    });

    // Insert position
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ 
        success: true, 
        message: 'Position tracking disabled (no database configured)' 
      });
    }
    
    const { data, error } = await supabase
      .from('vessel_positions')
      .insert({
        user_id,
        username: username || 'Unknown Captain',
        inlet_id,
        lat,
        lng,
        speed: speed || 0,
        heading,
        session_id,
        timestamp: ts || new Date().toISOString()
      });

    if (error) {
      console.error('Error inserting position:', error);
      return NextResponse.json(
        { error: 'Failed to record position' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Position API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/tracking/position - Get vessel positions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inlet_id = searchParams.get('inlet_id');
    const hours = parseInt(searchParams.get('hours') || '96'); // Default 4 days
    
    if (!inlet_id) {
      return NextResponse.json(
        { error: 'inlet_id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ 
        vessels: [],
        message: 'Position tracking disabled (no database configured)' 
      });
    }

    // Get all positions for the inlet in the time window
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    const { data: positions, error } = await supabase
      .from('vessel_positions')
      .select('*')
      .eq('inlet_id', inlet_id)
      .gte('timestamp', cutoffTime)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching positions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch positions' },
        { status: 500 }
      );
    }

    // Group by user and get latest position + trail
    const vesselsMap = new Map();
    
    positions?.forEach(pos => {
      if (!vesselsMap.has(pos.user_id)) {
        vesselsMap.set(pos.user_id, {
          user_id: pos.user_id,
          username: pos.username,
          latest: null,
          trail: []
        });
      }
      
      const vessel = vesselsMap.get(pos.user_id);
      
      // Set latest if this is the most recent
      if (!vessel.latest) {
        vessel.latest = {
          lat: pos.lat,
          lng: pos.lng,
          speed: pos.speed,
          heading: pos.heading,
          timestamp: pos.timestamp
        };
      }
      
      // Add to trail (already ordered by timestamp desc)
      vessel.trail.push({
        lat: pos.lat,
        lng: pos.lng,
        timestamp: pos.timestamp
      });
    });

    // Convert to array and filter by recency
    const vessels = Array.from(vesselsMap.values()).filter(vessel => {
      if (!vessel.latest) return false;
      const minutesAgo = (Date.now() - new Date(vessel.latest.timestamp).getTime()) / 60000;
      return minutesAgo <= 5; // Only show vessels active in last 5 minutes
    });

    return NextResponse.json({ vessels });
  } catch (error) {
    console.error('Position API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}