import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client only when environment variables are available
const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase environment variables not configured');
  }
  
  return createClient(url, key);
};

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
      session_id 
    } = body;

    // Validate required fields
    if (!user_id || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, lat, lng' },
        { status: 400 }
      );
    }

    // Insert position
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('vessel_positions')
      .insert({
        user_id,
        username: username || null,
        inlet_id: inlet_id || null,
        lat,
        lng,
        speed: speed || null,
        heading: heading || null,
        session_id: session_id || null,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording position:', error);
      return NextResponse.json(
        { error: 'Failed to record position' },
        { status: 500 }
      );
    }

    // Check for loitering (speed < 3 knots for extended period)
    if (speed !== undefined && speed < 3) {
      await checkForLoitering(user_id, inlet_id, lat, lng, speed);
    }

    return NextResponse.json({ 
      success: true, 
      position: data,
      message: 'Position recorded successfully'
    });

  } catch (error) {
    console.error('Position API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/tracking/position - Get recent positions for all vessels
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inlet_id = searchParams.get('inlet_id');
    const hours = parseInt(searchParams.get('hours') || '4');

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('[TRACKING API] Supabase not configured, returning empty vessel list');
      return NextResponse.json({
        success: true,
        vessels: [],
        total: 0,
        time_window: `${hours} hours`,
        message: 'Database not configured - using mock data'
      });
    }

    const supabase = getSupabaseClient();
    let query = supabase
      .from('vessel_positions')
      .select('*')
      .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false });

    if (inlet_id && inlet_id !== 'overview') {
      query = query.eq('inlet_id', inlet_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching positions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch positions' },
        { status: 500 }
      );
    }

    // Group positions by user for trail visualization
    const positionsByUser = data.reduce((acc: any, pos: any) => {
      if (!acc[pos.user_id]) {
        acc[pos.user_id] = {
          user_id: pos.user_id,
          username: pos.username,
          inlet_id: pos.inlet_id,
          positions: [],
          latest: null
        };
      }
      
      acc[pos.user_id].positions.push({
        lat: pos.lat,
        lng: pos.lng,
        timestamp: pos.timestamp,
        speed: pos.speed,
        heading: pos.heading
      });

      // Track latest position
      if (!acc[pos.user_id].latest || pos.timestamp > acc[pos.user_id].latest.timestamp) {
        acc[pos.user_id].latest = {
          lat: pos.lat,
          lng: pos.lng,
          timestamp: pos.timestamp,
          speed: pos.speed
        };
      }

      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      vessels: Object.values(positionsByUser),
      total: Object.keys(positionsByUser).length,
      time_window: `${hours} hours`
    });

  } catch (error) {
    console.error('Position GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to detect and record loitering events
async function checkForLoitering(
  user_id: string, 
  inlet_id: string | null,
  lat: number, 
  lng: number, 
  speed: number
) {
  try {
    const supabase = getSupabaseClient();
    // Get recent positions for this user (last 30 minutes)
    const { data: recentPositions } = await supabase
      .from('vessel_positions')
      .select('*')
      .eq('user_id', user_id)
      .gte('timestamp', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false });

    if (!recentPositions || recentPositions.length < 5) {
      return; // Not enough data
    }

    // Calculate if boat has been slow/stopped in roughly same area
    const slowPositions = recentPositions.filter(p => p.speed < 3);
    const loiteringRatio = slowPositions.length / recentPositions.length;

    if (loiteringRatio > 0.7) { // 70% of time at low speed
      // Check if we already have an active loitering event
      const { data: activeLoitering } = await supabase
        .from('loitering_events')
        .select('*')
        .eq('user_id', user_id)
        .is('end_time', null)
        .single();

      if (!activeLoitering) {
        // Start new loitering event
        await supabase
          .from('loitering_events')
          .insert({
            user_id,
            inlet_id,
            lat,
            lng,
            start_time: recentPositions[recentPositions.length - 1].timestamp,
            avg_speed: speed,
            confidence_score: loiteringRatio
          });
      }
    } else if (loiteringRatio < 0.3) {
      // End any active loitering event
      const { data: activeLoitering } = await supabase
        .from('loitering_events')
        .select('*')
        .eq('user_id', user_id)
        .is('end_time', null)
        .single();

      if (activeLoitering) {
        const duration = Math.round(
          (Date.now() - new Date(activeLoitering.start_time).getTime()) / 60000
        );

        await supabase
          .from('loitering_events')
          .update({
            end_time: new Date().toISOString(),
            duration_minutes: duration
          })
          .eq('id', activeLoitering.id);
      }
    }
  } catch (error) {
    console.error('Loitering detection error:', error);
    // Don't throw - this is a background process
  }
}
