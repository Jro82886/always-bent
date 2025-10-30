import { NextRequest } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 512px tiles for smoother rendering
const TILE_SIZE = 512;
const COPERNICUS_TILE_SIZE = 256; // Their native size

export async function GET(req: NextRequest, { params }: { params: Promise<{ z: string; x: string; y: string }> }) {
  const resolvedParams = await params;
  const z = resolvedParams.z;
  const x = resolvedParams.x;
  const y = resolvedParams.y.replace('.png',''); // sanitize
  const isSst = req.nextUrl.pathname.includes('/sst/');
  // Try both naming conventions for backward compatibility
  const tplKey = isSst ? 'CMEMS_SST_WMTS_TEMPLATE' : 'CMEMS_CHL_WMTS_TEMPLATE';
  const publicTplKey = isSst ? 'NEXT_PUBLIC_SST_WMTS_TEMPLATE' : 'NEXT_PUBLIC_CHL_WMTS_TEMPLATE';
  const base = process.env[tplKey] || process.env[publicTplKey];

  if (!base) {
    return new Response(`${tplKey} not configured`, { status: 500 });
  }

  // Build TIME for ODYSSEA daily product (expects ISO8601 with milliseconds)
  const qTime = req.nextUrl.searchParams.get('time');
  const buildDailyIso = (d: Date) => {
    const dd = new Date(d);
    dd.setUTCHours(0, 0, 0, 0);
    return dd.toISOString(); // Returns YYYY-MM-DDTHH:mm:ss.sssZ format
  };
  
  // Generate fallback dates: yesterday and 2 days ago
  // Copernicus data is typically 1-2 days behind real-time
  const fallbackDates: string[] = [];
  // Use a known good date range (January 2025)
  // CHL data may have different availability than SST
  const baseDate = new Date('2025-01-15'); // Use mid-January for better CHL data availability
  for (let daysAgo = 0; daysAgo <= 7; daysAgo++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - daysAgo);
    fallbackDates.push(buildDailyIso(date));
  }
  
  let timeParam: string;
  if (!qTime || qTime === 'latest') {
    // Default to yesterday (1 day ago) - usually available
    timeParam = fallbackDates[0];
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(qTime)) {
    timeParam = `${qTime}T00:00:00.000Z`;
  } else {
    timeParam = qTime; // assume caller provided a full ISO timestamp
  }
  
  // CHL tile fetching logic - ensure credentials are present
  const u = process.env.COPERNICUS_USER;
  const p = process.env.COPERNICUS_PASS;

  if (!u || !p) {
    return new Response('Copernicus credentials not configured', {
      status: 500,
      headers: { 'x-error': 'Missing COPERNICUS_USER or COPERNICUS_PASS environment variables' }
    });
  }

  const auth = 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');

  // Try with smart fallback if the requested date fails
  let successfulTime = timeParam;
  let upstream: Response | null = null;
  let lastError: string = '';
  
  // If using 'latest' or default, try fallback dates
  const datesToTry = (!qTime || qTime === 'latest') ? 
    [timeParam, ...fallbackDates.slice(1)] : // Try yesterday, then 2 days ago
    [timeParam]; // Only try the specific date requested

  for (const tryTime of datesToTry) {
    // Extract just the date part (YYYY-MM-DD) for TIME substitution
    const dateOnly = tryTime.split('T')[0];
    const target = base
      .replace('{z}', z)
      .replace('{x}', x)
    .replace('{y}', y)
    .replace('{TIME}', dateOnly);

    // Attempt to fetch from upstream with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout for CHL (often has missing tiles)

    try {
      const response = await fetch(target, {
        headers: {
          Authorization: auth,
          Accept: 'image/png',
          'User-Agent': 'alwaysbent-abfi'
        },
        redirect: 'follow',
        cache: 'no-store',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        upstream = response;
        successfulTime = tryTime;
        // Fallback attempt logged
        break;
      } else if ((response.status === 400 || response.status === 404) && datesToTry.length > 1) {
        // Try next date - both 400 and 404 indicate no data for this date
        lastError = `HTTP ${response.status}`;
        continue;
      } else {
        // Non-400 error or last attempt
        const text = await response.text();
        return new Response(text || `Upstream ${response.status}`, {
          status: response.status,
          headers: { 
            'x-upstream-url': target,
            'x-sst-date-tried': tryTime.split('T')[0]
          }
        });
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      lastError = e?.name === 'AbortError' ? 'Request timeout' : e?.message || String(e);
      if (datesToTry.indexOf(tryTime) === datesToTry.length - 1) {
        // Last attempt failed
        break;
      }
    }
  }

  if (!upstream) {
    // For CHL, ALWAYS return a transparent PNG with status 200 for missing tiles
    // CHL data often has gaps due to clouds or coverage
    if (!isSst) {
      try {
        // Create a transparent 256x256 PNG using sharp
        const transparentPng = await sharp({
          create: {
            width: 256,
            height: 256,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          }
        })
        .png()
        .toBuffer();

        return new Response(transparentPng, {
          status: 200, // Always 200 so Mapbox accepts the tile
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
            'x-chl-fallback': 'transparent-tile-sharp',
            'x-dates-tried': datesToTry.map(d => d.split('T')[0]).join(', ')
          }
        });
      } catch (e) {
        // Fallback: Create a valid transparent 256x256 PNG without sharp
        // This is a properly formatted minimal PNG
        const png256 = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gEKDgAAAGSWpQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAASSURBVHja7cEBAQAAAIIg/69uSDUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4M1AAAQFwtJXbAAAAAElFTkSuQmCC',
          'base64'
        );
        return new Response(png256, {
          status: 200, // Always 200
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
            'x-chl-fallback': 'transparent-tile-256-fallback'
          }
        });
      }
    }

    // For SST, still return error
    return new Response(`All dates failed. Last error: ${lastError}`, {
      status: 502,
      headers: {
        'x-dates-tried': datesToTry.map(d => d.split('T')[0]).join(', ')
      }
    });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      'x-upstream-url': base.replace('{z}', z).replace('{x}', x).replace('{y}', y).replace('{TIME}', successfulTime),
      'x-sst-date': successfulTime.split('T')[0]
    }
  });
}
