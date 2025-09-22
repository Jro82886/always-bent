import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { searchParams } = new URL(req.url);
    
    const inlet = searchParams.get('inlet');
    const showAll = searchParams.get('all') === 'true';
    
    // Use mock user for now (will get from localStorage on client)
    const user = { id: 'demo-user', email: 'demo@abfi.com' };
    
    // Build query for vessel positions
    let query = supabase
      .from('vessel_tracks')
      .select(`
        *,
        profiles:user_id (
          id,
          captain_name,
          boat_name,
          avatar_url
        )
      `)
      .order('timestamp', { ascending: false });
    
    // Only show last 24 hours of data
    const since = new Date();
    since.setHours(since.getHours() - 24);
    query = query.gte('timestamp', since.toISOString());
    
    // Filter by inlet if provided
    if (inlet) {
      query = query.eq('inlet_id', inlet);
    }
    
    // If not showing all, only show user's fleet/friends
    if (!showAll && user) {
      // Get user's fleet members (future: implement friends/fleet system)
      // For now, just show user's own vessel
      query = query.eq('user_id', user.id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching fleet:', error);
      return NextResponse.json(
        { error: 'Failed to fetch fleet positions' },
        { status: 500 }
      );
    }
    
    // Group tracks by vessel
    const vesselTracks = new Map();
    
    (data || []).forEach((point: any) => {
      const vesselId = point.user_id;
      if (!vesselTracks.has(vesselId)) {
        vesselTracks.set(vesselId, {
          id: vesselId,
          captain: point.profiles?.captain_name || 'Unknown Captain',
          boat: point.profiles?.boat_name || 'Unknown Vessel',
          avatar: point.profiles?.avatar_url,
          track: []
        });
      }
      
      vesselTracks.get(vesselId).track.push({
        lat: point.latitude,
        lon: point.longitude,
        timestamp: point.timestamp,
        speed: point.speed,
        heading: point.heading
      });
    });
    
    // Convert to array and sort tracks by time
    const fleet = Array.from(vesselTracks.values()).map(vessel => ({
      ...vessel,
      track: vessel.track.sort((a: any, b: any) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
      last_position: vessel.track[vessel.track.length - 1],
      is_active: vessel.track.length > 0 && 
        (Date.now() - new Date(vessel.track[vessel.track.length - 1].timestamp).getTime()) < 3600000 // Active if updated within last hour
    }));
    
    return NextResponse.json({ fleet });
    
  } catch (error) {
    console.error('Fleet tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fleet data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabase();
    
    // Use user ID from request body (sent from client localStorage)
    const body = await req.json();
    const userId = body.user_id || `local-${Date.now()}`;
    const user = { id: userId, email: `${userId}@local.abfi` };
    
    // Validate required fields
    if (!body.latitude || !body.longitude) {
      return NextResponse.json(
        { error: 'Position is required' },
        { status: 400 }
      );
    }
    
    // Insert position update
    const { data, error } = await supabase
      .from('vessel_tracks')
      .insert({
        user_id: user.id,
        inlet_id: body.inlet_id,
        latitude: body.latitude,
        longitude: body.longitude,
        speed: body.speed || 0,
        heading: body.heading || 0,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error updating position:', error);
      return NextResponse.json(
        { error: 'Failed to update position' },
        { status: 500 }
      );
    }
    
    // Broadcast position to other fleet members via Supabase Realtime
    const channel = supabase.channel(`fleet:${body.inlet_id || 'global'}`);
    await channel.send({
      type: 'broadcast',
      event: 'position_update',
      payload: {
        user_id: user.id,
        position: data
      }
    });
    
    return NextResponse.json({ position: data });
    
  } catch (error) {
    console.error('Position update error:', error);
    return NextResponse.json(
      { error: 'Failed to update position' },
      { status: 500 }
    );
  }
}
