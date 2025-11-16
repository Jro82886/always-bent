import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { ALLOWED_SPECIES } from '@/config/species';

// Structured logging helper
function logReportAction(action: string, data: Record<string, any>) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    service: 'reports-api',
    action,
    ...data
  }));
}

// Request body schema for PATCH
const PatchBodySchema = z.object({
  species: z.array(z.string()).max(3).optional()
});

// GET /api/reports/:id - Get single report by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          }
        }
      }
    );
    const { id: reportId } = await params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID format' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In dev mode, use service role client to bypass RLS
    const queryClient = (process.env.NODE_ENV === 'development')
      ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : supabase;

    // Fetch report - filter by user_id in dev, RLS enforces in prod
    let query = queryClient
      .from("reports")
      .select("*")
      .eq("id", reportId);

    if (process.env.NODE_ENV === 'development') {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query.single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        logReportAction('report_get_not_found', { 
          user_id: user.id,
          report_id: reportId 
        });
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      
      logReportAction('report_get_error', { 
        user_id: user.id,
        report_id: reportId,
        error: error.message 
      });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    logReportAction('report_get_ok', { 
      user_id: user.id,
      report_id: reportId,
      type: data.type,
      status: data.status
    });
    
    return NextResponse.json(data);
  } catch (error: any) {
    logReportAction('report_get_error', { error: error.message });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH /api/reports/:id - Update report (species only for now)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          }
        }
      }
    );
    const { id: reportId } = await params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID format' }, { status: 400 });
    }

    // Get current user - in dev mode, use the authenticated Supabase user if available
    let user;
    if (process.env.NODE_ENV === 'development') {
      // In development, try to get the Supabase auth user first
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;

      // If no Supabase user, that's OK in dev - we'll use service role
      if (!user) {
        console.log('[DEV MODE] No Supabase auth user, will use service role to find reports');
      }
    } else {
      // In production, require authentication
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = authUser;
    }

    // Parse and validate request body
    const body = await req.json();
    const parseResult = PatchBodySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({
        error: 'Invalid request body',
        details: parseResult.error.flatten()
      }, { status: 422 });
    }

    // In dev mode, use service role to bypass RLS (regardless of auth state)
    const queryClient = (process.env.NODE_ENV === 'development')
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

    // Load the report
    // In dev: service role bypasses RLS, so we filter by user_id manually
    // In prod: RLS ensures owner-only access
    let query = queryClient
      .from('reports')
      .select('id, type, payload_json, meta, user_id')
      .eq('id', reportId);

    // In dev mode, filter by user_id if we have a user (since we're bypassing RLS)
    if (process.env.NODE_ENV === 'development' && user) {
      query = query.eq('user_id', user.id);
    }

    const { data: report, error: fetchError } = await query.single();
    
    if (fetchError || !report) {
      logReportAction('report_patch_not_found', {
        user_id: user?.id || 'dev-mode-no-auth',
        report_id: reportId
      });
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    // Only allow species editing for bite reports
    if (report.type !== 'bite') {
      return NextResponse.json({ 
        error: 'Species can only be edited for bite reports' 
      }, { status: 400 });
    }
    
    // Prepare updates
    let updatedPayload = report.payload_json as any;
    let updatedMeta = report.meta || {};
    
    // Handle species update
    if (parseResult.data.species !== undefined) {
      const species = parseResult.data.species;
      
      // Validate against allowed species
      const invalidSpecies = species.filter((s: string) => !ALLOWED_SPECIES.includes(s as any));
      if (invalidSpecies.length > 0) {
        return NextResponse.json({ 
          error: `Invalid species: ${invalidSpecies.join(', ')}`,
          allowed: ALLOWED_SPECIES
        }, { status: 400 });
      }
      
      updatedPayload = { ...updatedPayload, species };
      updatedMeta = { 
        ...updatedMeta, 
        last_species_update_at: new Date().toISOString() 
      };
    }
    
    // Update the report
    const { error: updateError } = await queryClient
      .from('reports')
      .update({
        payload_json: updatedPayload,
        meta: updatedMeta
      })
      .eq('id', reportId);
    
    if (updateError) {
      logReportAction('report_patch_error', {
        user_id: user?.id || 'dev-mode-no-auth',
        report_id: reportId,
        error: updateError.message
      });
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    logReportAction('report_patch_ok', {
      user_id: user?.id || 'dev-mode-no-auth',
      report_id: reportId,
      updates: Object.keys(parseResult.data)
    });
    
    return NextResponse.json({ 
      ok: true,
      updated: Object.keys(parseResult.data)
    });
  } catch (error: any) {
    logReportAction('report_patch_error', { error: error.message });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
