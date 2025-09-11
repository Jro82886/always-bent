import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ ok: true, note: 'supabase disabled (no env)' });
    }
    // Using admin API to verify service role is valid without relying on a specific table
    const { error } = await supabaseServer.auth.admin.listUsers({ page: 1, perPage: 1 });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}


