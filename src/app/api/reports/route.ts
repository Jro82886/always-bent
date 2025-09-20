import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  
  const month = searchParams.get("month"); // "YYYY-MM"
  const type = searchParams.get("type");   // optional 'snip' | 'bite'
  const userId = searchParams.get("userId"); // optional for user-specific reports
  const speciesParam = searchParams.get("species"); // comma-separated species
  
  const { start, end } = monthRange(month);

  // Build query
  let query = supabase
    .from("reports")
    .select("*")
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false });

  // Apply filters
  if (type) query = query.eq("type", type);
  if (userId) query = query.eq("user_id", userId);
  
  // Filter by species (comma-separated)
  if (speciesParam) {
    const speciesArray = speciesParam.split(",").map(s => s.trim().toLowerCase());
    // Use Postgres array contains operator
    query = query.contains("species", speciesArray);
  }

  const { data, error } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json({ data });
}

function monthRange(m?: string | null) {
  const d = m ? new Date(m + "-01T00:00:00Z") : new Date();
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  return { 
    start: start.toISOString(), 
    end: end.toISOString() 
  };
}