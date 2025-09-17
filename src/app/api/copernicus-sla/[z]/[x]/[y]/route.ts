import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASE = process.env.COPERNICUS_WMTS_BASE!;
// REAL SEA LEVEL ALTIMETRY (CNES Mean Dynamic Topography - verified from GetCapabilities)
const LAYER = process.env.COPERNICUS_WMTS_SLA_LAYER || 'SEALEVEL_GLO_PHY_MDT_008_063/cnes_obs-sl_glo_phy-mdt_my_0.125deg_P20Y_202012--ext--mdt/mdt';
const STYLE = 'cmap:balance'; // Blue-white-red for sea level anomaly
const FORMAT = process.env.COPERNICUS_WMTS_FORMAT || 'image/png';
const MATRIX = process.env.COPERNICUS_WMTS_MATRIXSET || 'EPSG:3857';
const MATRIX_GOOGLE = 'GoogleMapsCompatible'; // Same as working SST
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
    const time = url.searchParams.get('time') || '2025-09-03T00:00:00.000Z';
    
    if (!BASE || !USER || !PASS) {
      return new NextResponse(BLANK_PNG, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300',
          'x-error': 'not-configured'
        }
      });
    }
    
    // COPY EXACT STRATEGY FROM WORKING SST
    const auth = Buffer.from(`${USER}:${PASS}`).toString('base64');
    
    // Try multiple matrix sets for better coastline alignment (same as SST)
    const matrixSets = [MATRIX_GOOGLE, 'PopularVisualisation3857', MATRIX];
    let wmtsUrl: URL | undefined;
    let success = false;
    
    for (const matrix of matrixSets) {
      wmtsUrl = new URL(BASE);
      wmtsUrl.searchParams.set('SERVICE', 'WMTS');
      wmtsUrl.searchParams.set('REQUEST', 'GetTile');
      wmtsUrl.searchParams.set('VERSION', '1.0.0');
      wmtsUrl.searchParams.set('LAYER', LAYER);
      wmtsUrl.searchParams.set('STYLE', STYLE);
      wmtsUrl.searchParams.set('TILEMATRIXSET', matrix);
      wmtsUrl.searchParams.set('FORMAT', FORMAT);
      wmtsUrl.searchParams.set('TILEMATRIX', z);
      wmtsUrl.searchParams.set('TILEROW', y);
      wmtsUrl.searchParams.set('TILECOL', x);
      wmtsUrl.searchParams.set('time', time);
      wmtsUrl.searchParams.set('elevation', '0'); // Sea surface level
      
      // Test this configuration (same as SST)
      const testResponse = await fetch(wmtsUrl.toString(), {
        headers: { 
          'Authorization': `Basic ${auth}`,
          'Accept': 'image/png'
        },
        cache: 'no-store'
      }).catch(() => null);
      
      if (testResponse?.ok) {
        success = true;
        
        break;
      }
    }
    
    if (!success) {
      // Fallback to default matrix set (same as SST)
      wmtsUrl = new URL(BASE);
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
      wmtsUrl.searchParams.set('elevation', '0');
    }
    
    if (!wmtsUrl) {
      
      return new NextResponse(BLANK_PNG, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300',
          'x-error': 'no-valid-matrix-set'
        }
      });
    }
    
    // Fetch SLA tile
    
    const response = await fetch(wmtsUrl.toString(), {
      headers: { 
        'Authorization': `Basic ${auth}`,
        'Accept': 'image/png'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      
      return new NextResponse(BLANK_PNG, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300',
          'x-error': 'wmts-failed'
        }
      });
    }

    const imageBuffer = await response.arrayBuffer();
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'x-source': 'copernicus-altimetry',
        'x-layer': LAYER,
        'x-time': time
      }
    });

  } catch (error) {
    
    return new NextResponse(BLANK_PNG, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300',
        'x-error': 'server-error'
      }
    });
  }
}