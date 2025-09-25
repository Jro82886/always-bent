import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Structured logging helper
function logReportAction(action: string, data: Record<string, any>) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    service: 'reports-api',
    action,
    ...data
  }));
}

// GET /api/reports - List reports with filters
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(req.url);
    
    // Get current user (with dev fallback)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Dev mode: use stub user if no auth
    const effectiveUser = user || (process.env.NODE_ENV === 'development' ? {
      id: 'dev-user-001',
      email: 'dev@always-bent.com'
    } : null);
    
    if (!effectiveUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = effectiveUser;
    
    // Parse filters
    const inlet = searchParams.get("inlet");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Build query - RLS ensures user only sees their own
    let query = supabase
      .from("reports")
      .select("*", { count: 'exact' });

    // Apply filters
    if (inlet) query = query.eq("inlet_id", inlet);
    if (type) query = query.eq("type", type);
    if (status) query = query.eq("status", status);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);

    // Apply pagination
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    
    if (error) {
      logReportAction('reports_list_error', { 
        user_id: user.id, 
        error: error.message 
      });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    logReportAction('reports_list_ok', { 
      user_id: user.id,
      count: data?.length || 0,
      filters: { inlet, type, status, from, to }
    });
    
    return NextResponse.json({ 
      data,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });
  } catch (error: any) {
    logReportAction('reports_list_error', { error: error.message });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/reports - Create a new report
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user (with dev fallback)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Dev mode: use stub user if no auth
    const effectiveUser = user || (process.env.NODE_ENV === 'development' ? {
      id: 'dev-user-001',
      email: 'dev@always-bent.com'
    } : null);
    
    if (!effectiveUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = effectiveUser;
    
    // Parse request body
    const body = await req.json();
    
    // Validate required fields
    if (!body.inlet_id || !body.type || !body.payload_json) {
      return NextResponse.json({ 
        error: 'Missing required fields: inlet_id, type, payload_json' 
      }, { status: 422 });
    }
    
    // Validate type
    if (!['snip', 'bite'].includes(body.type)) {
      return NextResponse.json({ 
        error: 'Invalid type. Must be "snip" or "bite"' 
      }, { status: 422 });
    }
    
    // Validate status if provided
    if (body.status && !['queued', 'complete', 'failed'].includes(body.status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be "queued", "complete", or "failed"' 
      }, { status: 422 });
    }
    
    // Validate source if provided
    if (body.source && !['online', 'offline'].includes(body.source)) {
      return NextResponse.json({ 
        error: 'Invalid source. Must be "online" or "offline"' 
      }, { status: 422 });
    }
    
    // Prepare report data
    const reportData = {
      user_id: user.id,
      inlet_id: body.inlet_id,
      type: body.type,
      status: body.status || 'complete',
      source: body.source || 'online',
      payload_json: body.payload_json,
      meta: body.meta || null
    };
    
    // Insert report
    const { data, error } = await supabase
      .from("reports")
      .insert(reportData)
      .select()
      .single();
    
    if (error) {
      logReportAction('reports_post_err', { 
        user_id: user.id,
        type: body.type,
        error: error.message 
      });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    logReportAction('reports_post_ok', { 
      user_id: user.id,
      report_id: data.id,
      type: data.type,
      status: data.status,
      source: data.source,
      inlet_id: data.inlet_id
    });
    
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    logReportAction('reports_post_err', { error: error.message });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}