import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// Initialize Supabase client
const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    return null;
  }
  
  return supabase;
};

// Simplify track points based on zoom level
function simplifyTrack(points: any[], zoomLevel: number = 12): any[] {
  if (!points || points.length < 3) return points;
  
  // Determine sampling rate based on zoom
  let keepEveryNth = 1;
  if (zoomLevel < 9) keepEveryNth = 10;  // Very zoomed out
  else if (zoomLevel < 12) keepEveryNth = 5; // Medium zoom
  
  if (keepEveryNth === 1) return points;
  
  // Keep first and last point, sample the rest
  const simplified = [points[0]];
  for (let i = keepEveryNth; i < points.length - 1; i += keepEveryNth) {
    simplified.push(points[i]);
  }
  simplified.push(points[points.length - 1]);
  
  return simplified;
}

// GET /api/tracking/tracks - Get vessel tracks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inlet_id = searchParams.get('inlet_id');
    const hours = parseInt(searchParams.get('hours') || '96'); // Default 4 days
    const zoom = parseInt(searchParams.get('zoom') || '12');
    
    if (!inlet_id) {
      return NextResponse.json(
        { error: 'inlet_id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ 
        tracks: [],
        message: 'Position tracking disabled (no database configured)' 
      });
    }

    // Get all positions for the inlet in the time window
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    const { data: positions, error } = await supabase
      .from('vessel_positions')
      .select('user_id, username, lat, lng, timestamp')
      .eq('inlet_id', inlet_id)
      .gte('timestamp', cutoffTime)
      .order('user_id')
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching tracks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tracks' },
        { status: 500 }
      );
    }

    // Group by user and build tracks
    const tracksMap = new Map();
    
    positions?.forEach(pos => {
      if (!tracksMap.has(pos.user_id)) {
        tracksMap.set(pos.user_id, {
          user_id: pos.user_id,
          username: pos.username,
          points: []
        });
      }
      
      const track = tracksMap.get(pos.user_id);
      track.points.push({
        lat: pos.lat,
        lng: pos.lng,
        ts: pos.timestamp
      });
    });

    // Convert to array and simplify based on zoom
    const tracks = Array.from(tracksMap.values()).map(track => ({
      ...track,
      points: simplifyTrack(track.points, zoom),
      point_count: track.points.length
    }));

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Tracks API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
