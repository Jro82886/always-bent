import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Using imported supabase client

    // Test connection and check our ML tables exist
    const tables = [
      'snip_analyses',
      'catch_reports', 
      'vessel_tracks',
      'ml_patterns',
      'hotspot_intelligence'
    ];

    const results: Record<string, boolean> = {};
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      results[table] = !error;
    }

    return NextResponse.json({
      status: 'connected',
      project: 'hobvjmmambhonsugehge',
      tables: results,
      ready: Object.values(results).every(v => v)
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
