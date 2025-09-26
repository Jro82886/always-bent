import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // TODO: verify JWT / user (Memberstack) → userId
    // For now, using a placeholder user ID
    const userId = 'placeholder-user-id';
    
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Minimal validation
    const { inlet_slug, date, sst, chl, area_nm2, species, narrative } = body || {};
    if (!inlet_slug || !date || !sst?.p10F || !sst?.p90F) {
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
    }

    const payload = {
      user_id: userId,
      inlet_slug,
      date,
      area_nm2,
      species: species ?? [],
      sst_mean_f: sst.meanF,
      sst_p10_f: sst.p10F,
      sst_p90_f: sst.p90F,
      sst_grad_f: sst.gradF,
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
