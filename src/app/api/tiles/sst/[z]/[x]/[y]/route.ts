import { NextRequest } from 'next/server';

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
  // Use the current date (Copernicus NRT data typically available within 1-2 days)
  const now = new Date();
  const baseDate = now; // Use current date, let API handle availability

  for (let daysAgo = 1; daysAgo <= 3; daysAgo++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - daysAgo);
    fallbackDates.push(buildDailyIso(date));
  }
  
  let timeParam: string;
  if (!qTime || qTime === 'latest') {
    // Default to yesterday (1 day ago) - usually available
    timeParam = fallbackDates[0];
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(qTime)) {
    // Check if the requested date is in the future
    const requestedDate = new Date(qTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedDate > today) {
      // If future date requested, use the most recent available data
      console.log(`[SST] Future date ${qTime} requested, using ${fallbackDates[0].split('T')[0]} instead`);
      timeParam = fallbackDates[0];
    } else {
      timeParam = `${qTime}T00:00:00.000Z`;
    }
  } else {
    timeParam = qTime; // assume caller provided a full ISO timestamp
  }
  
  // SST tile fetching logic - ensure credentials are present
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
    
    // Attempt to fetch from upstream

    try {
      const response = await fetch(target, {
        headers: {
          Authorization: auth,
          Accept: 'image/png',
          'User-Agent': 'alwaysbent-abfi'
        },
        redirect: 'follow',
        cache: 'no-store'
      });

      if (response.ok) {
        upstream = response;
        successfulTime = tryTime;
        // Fallback attempt logged
        break;
      } else if (response.status === 400 && datesToTry.length > 1) {
        // Try next date
        lastError = await response.text();
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
      lastError = e?.message || String(e);
      if (datesToTry.indexOf(tryTime) === datesToTry.length - 1) {
        // Last attempt failed
        break;
      }
    }
  }

  if (!upstream) {
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
