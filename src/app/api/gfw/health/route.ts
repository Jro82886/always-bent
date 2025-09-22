import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const token = process.env.GFW_API_TOKEN ?? '';
  return NextResponse.json({
    ok: true,
    token: { 
      present: !!token, 
      preview: token ? token.slice(0, 8) + '…' : null 
    }
  });
}
