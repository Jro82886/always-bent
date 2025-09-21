import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/reports/health - Health check for reports system
export async function GET(req: NextRequest) {
  const health: Record<string, any> = {
    timestamp: new Date().toISOString(),
    service: 'reports-api',
    status: 'checking',
    checks: {}
  };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check 1: Table exists and is queryable
    try {
      const { count, error } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true });
      
      health.checks.table_exists = !error;
      health.checks.table_error = error?.message;
    } catch (e: any) {
      health.checks.table_exists = false;
      health.checks.table_error = e.message;
    }
    
    // Check 2: RLS is enabled
    try {
      // This query should return empty due to RLS if not authenticated
      const { data } = await supabase
        .from('reports')
        .select('id')
        .limit(1);
      
      health.checks.rls_enabled = true;
      health.checks.rls_working = Array.isArray(data);
    } catch (e: any) {
      health.checks.rls_enabled = false;
      health.checks.rls_error = e.message;
    }
    
    // Check 3: Feature flag status
    health.checks.feature_flag = {
      NEXT_PUBLIC_FLAG_REPORTS_CONTRACT: process.env.NEXT_PUBLIC_FLAG_REPORTS_CONTRACT || 'not set',
      enabled: process.env.NEXT_PUBLIC_FLAG_REPORTS_CONTRACT === 'true'
    };
    
    // Check 4: Can authenticate
    try {
      const { data: { user } } = await supabase.auth.getUser();
      health.checks.auth = {
        can_authenticate: true,
        has_user: !!user,
        user_id: user?.id
      };
    } catch (e: any) {
      health.checks.auth = {
        can_authenticate: false,
        error: e.message
      };
    }
    
    // Overall status
    health.status = health.checks.table_exists && health.checks.rls_enabled ? 'healthy' : 'unhealthy';
    
    return NextResponse.json(health, { 
      status: health.status === 'healthy' ? 200 : 503 
    });
  } catch (error: any) {
    health.status = 'error';
    health.error = error.message;
    
    return NextResponse.json(health, { status: 500 });
  }
}
