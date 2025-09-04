import { NextRequest, NextResponse } from 'next/server';
import { edlFetch } from '@/server/edl/fetch';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });
  try {
    const res = await edlFetch(url);
    const buf = await res.arrayBuffer();
    const ct = res.headers.get('content-type') || 'application/octet-stream';
    return new NextResponse(buf, { status: res.status, headers: { 'content-type': ct } });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 502 });
  }
}


