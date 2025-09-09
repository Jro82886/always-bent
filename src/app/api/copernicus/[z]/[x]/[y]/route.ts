import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASE = process.env.COPERNICUS_WMTS_BASE!;
const LAYER = process.env.COPERNICUS_WMTS_LAYER!;
const STYLE = process.env.COPERNICUS_WMTS_STYLE || 'cmap:algae';
const FORMAT = process.env.COPERNICUS_WMTS_FORMAT || 'image/png';
const MATRIX = process.env.COPERNICUS_WMTS_MATRIXSET || 'EPSG:3857';
const USER = process.env.COPERNICUS_USER!;
const PASS = process.env.COPERNICUS_PASS!;

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
    const time = url.searchParams.get('time') || '2025-09-03T00:00:00.000Z'; // Use default from capabilities
    
    if (!BASE || !LAYER || !USER || !PASS) {
      return new NextResponse(BLANK_PNG, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300',
          'x-error': 'not-configured'
        }
      });
    }
    
    // Build WMTS URL - Copernicus specific format
    const wmtsUrl = new URL(BASE);
    wmtsUrl.searchParams.set('SERVICE', 'WMTS');
    wmtsUrl.searchParams.set('REQUEST', 'GetTile');
    wmtsUrl.searchParams.set('VERSION', '1.0.0');
    wmtsUrl.searchParams.set('LAYER', LAYER);
    wmtsUrl.searchParams.set('STYLE', STYLE);
    wmtsUrl.searchParams.set('TILEMATRIXSET', MATRIX);
    wmtsUrl.searchParams.set('FORMAT', FORMAT);
    wmtsUrl.searchParams.set('TILEMATRIX', z);
    wmtsUrl.searchParams.set('TILEROW', y);
    wmtsUrl.searchParams.set('TILECOL', x);
    wmtsUrl.searchParams.set('time', time);
    wmtsUrl.searchParams.set('elevation', '-0.4940253794193268'); // Default surface level
    
    console.log('🌿 Copernicus WMTS URL:', wmtsUrl.toString());
    
    // Add authentication
    const auth = Buffer.from(`${USER}:${PASS}`).toString('base64');
    
    const response = await fetch(wmtsUrl.toString(), {
      headers: { 
        'Authorization': `Basic ${auth}`,
        'Accept': 'image/png'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.warn(`Copernicus WMTS error ${response.status} for tile ${z}/${x}/${y}`);
      return new NextResponse(BLANK_PNG, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=60',
          'x-error': `copernicus-${response.status}`
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
    console.error('Copernicus WMTS error:', error);
    return new NextResponse(BLANK_PNG, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=60',
        'x-error': 'proxy-error'
      }
    });
  }
}
