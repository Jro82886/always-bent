import { NextResponse } from 'next/server';
import { gfwEnabled } from '@/lib/features/gfw';

export const runtime = 'nodejs';

export async function GET() {
  if (!gfwEnabled) {
    return NextResponse.json({
      ok: true,
      configured: false,
      reason: 'disabled-by-flag',
    });
  }
  
  const token = process.env.GFW_API_TOKEN ?? '';
  return NextResponse.json({
    ok: true,
    token: { 
      present: !!token, 
      preview: token ? token.slice(0, 8) + '…' : null 
    }
  });
}
