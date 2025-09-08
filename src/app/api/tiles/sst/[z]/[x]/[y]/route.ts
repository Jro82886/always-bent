import { NextRequest, NextResponse } from 'next/server';
import { xyzToBboxCRS84, buildWMSUrl } from '@/lib/wms';

export const dynamic = 'force-dynamic';

const BASE = process.env.ABFI_SST_WMS_BASE!;
const LAYER = process.env.ABFI_SST_WMS_LAYER!;
const VERSION = process.env.ABFI_SST_WMS_VERSION || '1.3.0';
const STYLES = process.env.ABFI_SST_WMS_STYLES || 'boxfill/rainbow';

// 1x1 transparent PNG fallback
const BLANK_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwAB/aurH8kAAAAASUVORK5CYII=',
  'base64'
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  try {
    const { z, x, y } = await params;
    const url = new URL(req.url);
    const time = url.searchParams.get('time') || 'latest';
    
    const zN = parseInt(z, 10);
    const xN = parseInt(x, 10);
    const yN = parseInt(y, 10);
    
    if (!BASE || !LAYER) {
      return new NextResponse(BLANK_PNG, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300',
          'x-error': 'not-configured'
        }
      });
    }
    
    const bbox = xyzToBboxCRS84(zN, xN, yN);
    const wmsUrl = buildWMSUrl(BASE, LAYER, bbox, {
      time: time === 'latest' ? undefined : time,
      version: VERSION,
      styles: STYLES
    });
    
    const response = await fetch(wmsUrl);
    
    if (!response.ok) {
      console.warn(`WMS error ${response.status} for tile ${z}/${x}/${y}`);
      return new NextResponse(BLANK_PNG, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=60',
          'x-error': `upstream-${response.status}`
        }
      });
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=600'
      }
    });
    
  } catch (error: any) {
    console.error('SST tile error:', error);
    return new NextResponse(BLANK_PNG, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=60',
        'x-error': 'proxy-error'
      }
    });
  }
}
