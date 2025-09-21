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

// GET /api/reports/:id - Get single report by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const reportId = params.id;
    
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
