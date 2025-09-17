import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    
    const inlet = searchParams.get('inlet');
    const hours = parseInt(searchParams.get('hours') || '24');
    
    // Calculate time window
    const since = new Date();
    since.setHours(since.getHours() - hours);
    
    // Build query for shared hotspots
    let query = supabase
      .from('hotspot_intelligence')
      .select(`
        *,
        profiles:user_id (
          captain_name,
          boat_name
        )
      `)
      .eq('is_public', true)
      .gte('created_at', since.toISOString())
      .order('confidence', { ascending: false })
      .limit(50);
    
    // Filter by inlet if provided
    if (inlet) {
      query = query.eq('inlet_id', inlet);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching hotspots:', error);
      return NextResponse.json(
        { error: 'Failed to fetch hotspots' },
        { status: 500 }
      );
    }
    
    // Transform to GeoJSON for map display
    const hotspots = {
      type: 'FeatureCollection',
      features: (data || []).map(spot => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [spot.longitude, spot.latitude]
        },
        properties: {
          id: spot.id,
          captain: spot.profiles?.captain_name || 'Anonymous Captain',
          boat: spot.profiles?.boat_name || 'Unknown Vessel',
          confidence: spot.confidence,
          sst_score: spot.sst_score,
          chl_score: spot.chl_score,
          depth: spot.depth,
          notes: spot.notes,
          species_targeted: spot.species_targeted,
          verified_catch: spot.verified_catch,
          created_at: spot.created_at,
          likes: spot.likes || 0
        }
      }))
    };
    
    return NextResponse.json(hotspots);
    
  } catch (error) {
    console.error('Community hotspots error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community hotspots' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.latitude || !body.longitude || !body.confidence) {
      return NextResponse.json(
        { error: 'Location and confidence are required' },
        { status: 400 }
      );
    }
    
    // Insert hotspot
    const { data, error } = await supabase
      .from('hotspot_intelligence')
      .insert({
        user_id: user.id,
        inlet_id: body.inlet_id,
        latitude: body.latitude,
        longitude: body.longitude,
        confidence: body.confidence,
        sst_score: body.sst_score || 0,
        chl_score: body.chl_score || 0,
        depth: body.depth,
        notes: body.notes,
        species_targeted: body.species_targeted,
        verified_catch: body.verified_catch || false,
        is_public: body.is_public !== false // Default to public
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating hotspot:', error);
      return NextResponse.json(
        { error: 'Failed to share hotspot' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ hotspot: data });
    
  } catch (error) {
    console.error('Create hotspot error:', error);
    return NextResponse.json(
      { error: 'Failed to share hotspot' },
      { status: 500 }
    );
  }
}
