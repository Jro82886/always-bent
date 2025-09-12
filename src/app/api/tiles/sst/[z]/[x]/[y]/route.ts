import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ z: string; x: string; y: string }> }) {
  const resolvedParams = await params;
  const z = resolvedParams.z;
  const x = resolvedParams.x;
  const y = resolvedParams.y.replace('.png',''); // sanitize
  const isSst = req.nextUrl.pathname.includes('/sst/');
  const tplKey = isSst ? 'CMEMS_SST_WMTS_TEMPLATE' : 'CMEMS_CHL_WMTS_TEMPLATE';
  const base = process.env[tplKey];

  // DEBUG LOGGING
  console.log(`🚨 SST DEBUG - Tile: ${z}/${x}/${y}`);
  console.log(`🚨 SST DEBUG - Template Key: ${tplKey}`);
  console.log(`🚨 SST DEBUG - Template: ${base ? 'SET' : 'MISSING'}`);
  console.log(`🚨 SST DEBUG - User: ${process.env.COPERNICUS_USER ? 'SET' : 'MISSING'}`);
  console.log(`🚨 SST DEBUG - Pass: ${process.env.COPERNICUS_PASS ? 'SET' : 'MISSING'}`);

  if (!base) {
    console.log(`🚨 SST ERROR - ${tplKey} not configured`);
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
  // (GetCapabilities shows data up to 2025-09-10, which is 2 days ago)
  const fallbackDates: string[] = [];
  for (let daysAgo = 1; daysAgo <= 2; daysAgo++) {
    const date = new Date();
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
  
  console.log(`🚨 SST DEBUG - Time param: ${timeParam}`);
  console.log(`🚨 SST DEBUG - Fallback dates available: ${fallbackDates.join(', ')}`);

  const u = process.env.COPERNICUS_USER || '';
  const p = process.env.COPERNICUS_PASS || '';
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
    const target = base
      .replace('{z}', z)
      .replace('{x}', x)
      .replace('{y}', y)
      .replace('{TIME}', tryTime);
    
    console.log(`🚨 SST DEBUG - Trying date: ${tryTime.split('T')[0]}`);
    console.log(`🚨 SST DEBUG - URL: ${target}`);

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

      console.log(`🚨 SST DEBUG - Response status: ${response.status}`);
      
      if (response.ok) {
        upstream = response;
        successfulTime = tryTime;
        console.log(`🚨 SST SUCCESS - Tile loaded for date: ${tryTime.split('T')[0]}`);
        break;
      } else if (response.status === 400 && datesToTry.length > 1) {
        // Try next date
        lastError = await response.text();
        console.log(`🚨 SST DEBUG - 400 error, trying fallback date...`);
        continue;
      } else {
        // Non-400 error or last attempt
        const text = await response.text();
        console.log(`🚨 SST ERROR - Upstream failed: ${response.status}`);
        console.log(`🚨 SST ERROR - Full Response: ${text}`);
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
      console.log(`🚨 SST ERROR - Fetch failed: ${lastError}`);
      if (datesToTry.indexOf(tryTime) === datesToTry.length - 1) {
        // Last attempt failed
        break;
      }
    }
  }

  if (!upstream) {
    console.log(`🚨 SST ERROR - All dates failed`);
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
