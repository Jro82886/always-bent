import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { searchParams } = new URL(req.url);
    
    const inlet = searchParams.get('inlet');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build query
    let query = supabase
      .from('catch_reports')
      .select(`
        *,
        profiles:user_id (
          captain_name,
          boat_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);
    
    // Filter by inlet if provided
    if (inlet) {
      query = query.eq('inlet_id', inlet);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }
    
    // Transform data for client
    const reports = (data || []).map(report => ({
      id: report.id,
      user_id: report.user_id,
      captain_name: report.profiles?.captain_name || 'Anonymous',
      boat_name: report.profiles?.boat_name || 'Unknown Vessel',
      inlet_id: report.inlet_id,
      species: report.species,
      quantity: report.quantity,
      size: report.size,
      depth: report.depth,
      bait_lure: report.bait_lure,
      water_temp: report.water_temp,
      conditions: report.conditions,
      notes: report.notes,
      location: report.location,
      photos: report.photos || [],
      created_at: report.created_at,
      likes: report.likes || 0,
      comments_count: report.comments_count || 0
    }));
    
    return NextResponse.json({ reports });
    
  } catch (error) {
    console.error('Community reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community reports' },
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
    if (!body.species || !body.inlet_id) {
      return NextResponse.json(
        { error: 'Species and inlet are required' },
        { status: 400 }
      );
    }
    
    // Insert report
    const { data, error } = await supabase
      .from('catch_reports')
      .insert({
        user_id: user.id,
        inlet_id: body.inlet_id,
        species: body.species,
        quantity: body.quantity || 1,
        size: body.size,
        depth: body.depth,
        bait_lure: body.bait_lure,
        water_temp: body.water_temp,
        conditions: body.conditions,
        notes: body.notes,
        location: body.location,
        photos: body.photos || []
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating report:', error);
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ report: data });
    
  } catch (error) {
    console.error('Create report error:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
