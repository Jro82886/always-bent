import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // For Milestone 1, using Amanda's user ID
    // In production, this will come from Memberstack auth
    const userId = '123e4567-e89b-12d3-a456-426614174000'; // amanda@alwaysbent.com

    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Minimal validation
    const { inlet_slug, date, sst, chl, area_nm2, species, narrative } = body || {};
    if (!inlet_slug || !date) {
      return NextResponse.json({ error: 'invalid payload - missing inlet_slug or date' }, { status: 400 });
    }

    const payload = {
      user_id: userId,
      inlet_slug,
      date,
      area_nm2: area_nm2 ?? null,
      species: species ?? [],
      sst_mean_f: sst?.meanF ?? null,
      sst_p10_f: sst?.p10F ?? null,
      sst_p90_f: sst?.p90F ?? null,
      sst_grad_f: sst?.gradF ?? null,
      chl_mean: chl?.mean ?? null,
      chl_p10: chl?.p10 ?? null,
      chl_p90: chl?.p90 ?? null,
      chl_grad: chl?.grad ?? null,
      narrative: narrative ?? null,
    };

    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('snips')
      .insert(payload)
      .select()
      .single();
      
    if (error) throw error;
    
    return NextResponse.json({ ok: true, snip: data });
  } catch (e: any) {
    console.error('[/api/snips] Error:', e);
    return NextResponse.json(
      { error: 'server', detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}
