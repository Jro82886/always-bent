import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
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
    const supabase = createRouteHandlerClient({ cookies });
    const { id: reportId } = await params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID format' }, { status: 400 });
    }
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch report - RLS ensures user can only see their own
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();
    
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
    const supabase = createRouteHandlerClient({ cookies });
    const { id: reportId } = await params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID format' }, { status: 400 });
    }
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    
    // Load the report (RLS ensures owner-only access)
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('id, type, payload_json, meta')
      .eq('id', reportId)
      .single();
    
    if (fetchError || !report) {
      logReportAction('report_patch_not_found', { 
        user_id: user.id,
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
    const { error: updateError } = await supabase
      .from('reports')
      .update({ 
        payload_json: updatedPayload,
        meta: updatedMeta
      })
      .eq('id', reportId);
    
    if (updateError) {
      logReportAction('report_patch_error', { 
        user_id: user.id,
        report_id: reportId,
        error: updateError.message 
      });
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    logReportAction('report_patch_ok', { 
      user_id: user.id,
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
