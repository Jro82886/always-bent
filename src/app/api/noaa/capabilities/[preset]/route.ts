import { NextResponse } from 'next/server';
import { getRecentTimes } from '@/lib/capabilities';
import { WMS_PRESETS } from '@/lib/wmsPresets';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ preset: string }> }) {
  try {
    const { preset } = await params;
    if (!WMS_PRESETS[preset]) {
      return NextResponse.json({ error: 'Unknown preset' }, { status: 400 });
    }
    const times = await getRecentTimes(preset, 4); // Latest & 3 previous
    return NextResponse.json({ preset, times });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Capabilities error' }, { status: 500 });
  }
}
