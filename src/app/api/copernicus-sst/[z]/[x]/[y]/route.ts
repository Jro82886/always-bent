import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASE = process.env.COPERNICUS_WMTS_BASE!;
const LAYER = 'GLOBAL_ANALYSISFORECAST_PHY_001_024/cmems_mod_glo_phy_anfc_0.083deg_P1D-m_202311/thetao'; // Sea Surface Temperature
const STYLE = 'cmap:thermal'; // Thermal colormap for SST
const FORMAT = process.env.COPERNICUS_WMTS_FORMAT || 'image/png';
const MATRIX = process.env.COPERNICUS_WMTS_MATRIXSET || 'EPSG:3857';
const MATRIX_GOOGLE = 'GoogleMapsCompatible'; // Better coastline alignment
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
          'x-error': 'not-configured'
        }
      });
    }
    
    // Build WMTS URL for sea surface temperature
    const auth = Buffer.from(`${USER}:${PASS}`).toString('base64');
    
    // Try multiple matrix sets for better coastline alignment
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
      wmtsUrl.searchParams.set('elevation', '-0.4940253794193268');
      
      // Test this configuration
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
      // Fallback to default matrix set
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
      wmtsUrl.searchParams.set('elevation', '-0.4940253794193268');
    } // Surface level
    
    if (!wmtsUrl) {
      console.error('🚨 No valid WMTS URL found for SST');
      return new NextResponse(BLANK_PNG, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300',
          'x-error': 'no-valid-matrix-set'
        }
      });
    }
    
    console.log('🌡️ SST WMTS URL:', wmtsUrl.toString());
    
    const response = await fetch(wmtsUrl.toString(), {
      headers: { 
        'Authorization': `Basic ${auth}`,
        'Accept': 'image/png'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.warn(`SST WMTS error ${response.status}`);
      return new NextResponse(BLANK_PNG, {
        headers: {
          'Content-Type': 'image/png',
          'x-error': `copernicus-sst-${response.status}`
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
    console.error('SST WMTS error:', error);
    return new NextResponse(BLANK_PNG, {
      headers: {
        'Content-Type': 'image/png',
        'x-error': 'proxy-error'
      }
    });
  }
}
