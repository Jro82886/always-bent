import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// Initialize Supabase client only when environment variables are available
const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    return null;
  }
  
  return supabase;
};

// GET /api/tracking/fleet - Get all active fleet positions with trails
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inlet_id = searchParams.get('inlet_id');
    const hours = parseInt(searchParams.get('hours') || '4');
    
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        vessels: [],
        total: 0,
        time_window: `${hours} hours`,
        message: 'Database not configured'
      });
    }
    
    // Get positions from the last N hours
    const timeWindow = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    let query = supabase
      .from('vessel_positions')
      .select('*')
      .gte('timestamp', timeWindow)
      .order('timestamp', { ascending: false });
    
    // Filter by inlet if specified (not overview)
    if (inlet_id && inlet_id !== 'overview') {
      query = query.eq('inlet_id', inlet_id);
    }
    
    const { data: positions, error } = await query;
    
    if (error) {
      console.error('Error fetching fleet positions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch fleet positions' },
        { status: 500 }
      );
    }
    
    // Group positions by user to create vessel objects
    const vesselMap = new Map<string, any>();
    
    (positions || []).forEach(pos => {
      if (!vesselMap.has(pos.user_id)) {
        vesselMap.set(pos.user_id, {
          user_id: pos.user_id,
          boat_name: pos.username || `Vessel ${pos.user_id.slice(0, 4)}`,
          inlet_id: pos.inlet_id,
          current_position: null,
          trail: [],
          last_seen: null,
          is_fishing: false,
          avg_speed: 0
        });
      }
      
      const vessel = vesselMap.get(pos.user_id);
      
      // Set current position (most recent)
      if (!vessel.current_position) {
        vessel.current_position = {
          lat: pos.lat,
          lng: pos.lng,
          speed: pos.speed,
          heading: pos.heading
        };
        vessel.last_seen = pos.timestamp;
        
        // Determine if fishing (speed < 3 knots)
        vessel.is_fishing = pos.speed !== null && pos.speed < 3;
      }
      
      // Add to trail (for line visualization)
      vessel.trail.push({
        lat: pos.lat,
        lng: pos.lng,
        speed: pos.speed,
        timestamp: pos.timestamp
      });
    });
    
    // Convert map to array and calculate statistics
    const vessels = Array.from(vesselMap.values()).map(vessel => {
      // Calculate average speed for the trail
      const speeds = vessel.trail.filter((p: any) => p.speed !== null).map((p: any) => p.speed);
      vessel.avg_speed = speeds.length > 0 
        ? speeds.reduce((a: number, b: number) => a + b, 0) / speeds.length 
        : 0;
      
      // Limit trail points for performance (every nth point for older data)
      if (vessel.trail.length > 100) {
        const filtered = [];
        const step = Math.ceil(vessel.trail.length / 100);
        for (let i = 0; i < vessel.trail.length; i += step) {
          filtered.push(vessel.trail[i]);
        }
        vessel.trail = filtered;
      }
      
      // Calculate time since last seen
      const lastSeenMs = Date.now() - new Date(vessel.last_seen).getTime();
      vessel.minutes_ago = Math.round(lastSeenMs / 60000);
      
      return vessel;
    });
    
    // Filter out stale vessels (not seen in last hour for current view)
    const activeVessels = vessels.filter(v => v.minutes_ago < 60);
    const fishingCount = activeVessels.filter(v => v.is_fishing).length;
    
    return NextResponse.json({
      success: true,
      fleet: {
        vessels: activeVessels,
        total_active: activeVessels.length,
        fishing_now: fishingCount,
        time_window: `${hours} hours`,
        last_updated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Fleet API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
