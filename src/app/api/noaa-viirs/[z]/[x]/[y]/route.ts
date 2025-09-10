import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { z: string; x: string; y: string } }
) {
  const { z, x, y } = params;
  const { searchParams } = new URL(request.url);
  const time = searchParams.get('time') || new Date().toISOString().slice(0, 10);

  try {
    // NOAA VIIRS Chlorophyll - 4km resolution (ULTRA HIGH QUALITY)
    const wmsUrl = new URL('https://coastwatch.noaa.gov/erddap/wms/noaacwNPPVIIRSchlaWeekly/request');
    
    // Calculate bounding box from tile coordinates
    const tileSize = 256;
    const n = Math.pow(2, parseInt(z));
    const lon_min = (parseInt(x) / n) * 360 - 180;
    const lat_max = Math.atan(Math.sinh(Math.PI * (1 - 2 * parseInt(y) / n))) * 180 / Math.PI;
    const lon_max = ((parseInt(x) + 1) / n) * 360 - 180;
    const lat_min = Math.atan(Math.sinh(Math.PI * (1 - 2 * (parseInt(y) + 1) / n))) * 180 / Math.PI;

    // WMS parameters for NOAA VIIRS Chlorophyll
    wmsUrl.searchParams.set('SERVICE', 'WMS');
    wmsUrl.searchParams.set('VERSION', '1.3.0');
    wmsUrl.searchParams.set('REQUEST', 'GetMap');
    wmsUrl.searchParams.set('LAYERS', 'noaacwNPPVIIRSchlaWeekly:chlor_a');
    wmsUrl.searchParams.set('STYLES', '');
    wmsUrl.searchParams.set('FORMAT', 'image/png');
    wmsUrl.searchParams.set('TRANSPARENT', 'true');
    wmsUrl.searchParams.set('WIDTH', tileSize.toString());
    wmsUrl.searchParams.set('HEIGHT', tileSize.toString());
    wmsUrl.searchParams.set('CRS', 'EPSG:4326');
    wmsUrl.searchParams.set('BBOX', `${lat_min},${lon_min},${lat_max},${lon_max}`);
    wmsUrl.searchParams.set('TIME', `${time}T12:00:00Z`);
    
    // Enhanced color scale for better visibility
    wmsUrl.searchParams.set('COLORSCALERANGE', '0.01,30');
    wmsUrl.searchParams.set('BELOWMINCOLOR', '0x00000000'); // Transparent below minimum
    wmsUrl.searchParams.set('ABOVEMAXCOLOR', '0xFF00FF'); // Magenta for very high values
    wmsUrl.searchParams.set('NUMCOLORBANDS', '254');

    console.log('🌿 NOAA VIIRS WMS URL:', wmsUrl.toString());

    const response = await fetch(wmsUrl.toString(), {
      headers: {
        'Accept': 'image/png',
        'User-Agent': 'ABFI-Ocean-Platform/1.0'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('NOAA VIIRS WMS error:', response.status, response.statusText);
      
      // Return transparent PNG on error
      const transparentPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );
      
      return new NextResponse(transparentPng, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300',
          'x-error': 'wms-failed'
        }
      });
    }

    const imageBuffer = await response.arrayBuffer();
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'x-source': 'noaa-viirs-4km',
        'x-resolution': '4km',
        'x-time': time
      }
    });

  } catch (error) {
    console.error('NOAA VIIRS tile error:', error);
    
    // Return transparent PNG on error
    const transparentPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    
    return new NextResponse(transparentPng, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300',
        'x-error': 'server-error'
      }
    });
  }
}
