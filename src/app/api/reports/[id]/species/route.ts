import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createRouteHandlerClient({ cookies });
    const { species } = await req.json();
    
    // Validate species is an array
    if (!Array.isArray(species)) {
      return NextResponse.json(
        { error: 'Species must be an array' },
        { status: 400 }
      );
    }
    
    // Update the report's species
    const { data, error } = await supabase
      .from("reports")
      .update({ species })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update species' },
      { status: 500 }
    );
  }
}
