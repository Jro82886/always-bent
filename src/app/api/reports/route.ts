import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
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
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Handle cookie setting errors (e.g., in middleware)
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // Handle cookie removal errors
            }
          },
        },
      }
    );
    const { searchParams } = new URL(req.url);

    // Get current user (with dev fallback)
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    // Dev mode: use stub user if no auth (with valid UUID format)
    const user = authUser || (process.env.NODE_ENV === 'development' ? {
      id: '05a3cd96-01b5-4280-97cb-46400fab45b9', // Actual dev user UUID
      email: 'dev@always-bent.com'
    } : null);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse filters
    const inlet = searchParams.get("inlet");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // In dev mode without auth, use service role to bypass RLS
    const queryClient = (!authUser && process.env.NODE_ENV === 'development')
      ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )
      : supabase;

    // Build query - RLS ensures user only sees their own (or we filter manually in dev)
    let query = queryClient
      .from("reports")
      .select("*", { count: 'exact' });

    // In dev mode, manually filter by user_id since we're bypassing RLS
    if (!authUser && process.env.NODE_ENV === 'development') {
      query = query.eq("user_id", user.id);
    }

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
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Handle cookie setting errors (e.g., in middleware)
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // Handle cookie removal errors
            }
          },
        },
      }
    );

    // Get current user - try Supabase auth first
    let { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    // If no Supabase auth user, sign in anonymously (like chat does)
    // This supports Memberstack-authenticated users who don't have Supabase sessions
    if (!authUser) {
      console.log('[REPORTS] No Supabase session, signing in anonymously...');
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) {
        console.error('[REPORTS] Anonymous sign-in failed:', anonError);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
      }
      authUser = anonData.user;
    }

    // Dev mode fallback
    const user = authUser || (process.env.NODE_ENV === 'development' ? {
      id: '05a3cd96-01b5-4280-97cb-46400fab45b9', // Actual dev user UUID
      email: 'dev@always-bent.com'
    } : null);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
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

    // Use the authenticated supabase client (user is either Supabase auth or anonymous)
    // RLS policies should allow inserts for authenticated users
    const insertClient = supabase;

    // Insert report
    const { data, error } = await insertClient
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