import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ z: string; x: string; y: string }> }) {
  const resolvedParams = await params;
  const z = resolvedParams.z;
  const x = resolvedParams.x;
  const y = resolvedParams.y.replace('.png',''); // sanitize
  
  // EXACTLY like SST - use Copernicus WMTS
  const base = process.env.CMEMS_CHL_WMTS_TEMPLATE;
  
  // Debug logging
  console.log('CHL Route - Environment check:', {
    hasTemplate: !!base,
    templateLength: base?.length || 0,
    z, x, y
  });

  if (!base) {
    console.error('CMEMS_CHL_WMTS_TEMPLATE not configured - please add to Vercel environment variables');
    return new Response(JSON.stringify({ 
      error: 'Chlorophyll layer not configured',
      message: 'Please add CMEMS_CHL_WMTS_TEMPLATE to environment variables',
      required: 'CMEMS_CHL_WMTS_TEMPLATE=https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OCEANCOLOUR_GLO_BGC_L4_MY_009_104/cmems_obs-oc_glo_bgc-plankton_my_l4-gapfree-multi-4km_P1D/CHL&STYLE=cmap:turbo&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&TIME={TIME}'
    }), { 
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Build TIME for Copernicus (expects ISO8601 with milliseconds)
  const qTime = req.nextUrl.searchParams.get('time');
  const buildDailyIso = (d: Date) => {
    const dd = new Date(d);
    dd.setUTCHours(0, 0, 0, 0);
    return dd.toISOString(); // Returns YYYY-MM-DDTHH:mm:ss.sssZ format
  };
  
  // Generate fallback dates: yesterday and 2 days ago (same as SST)
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
  
  // Copernicus auth (EXACTLY like SST)
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
    
    // Attempt to fetch from Copernicus
    console.log(`CHL: Trying ${tryTime} for tile ${z}/${x}/${y}`);
    
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
        break;
      } else if (response.status === 400 && datesToTry.length > 1) {
        // Try next date
        lastError = await response.text();
        continue;
      } else {
        // Non-400 error or last attempt
        const text = await response.text();
        return new Response(text || `Copernicus ${response.status}`, {
          status: response.status,
          headers: { 
            'x-upstream-url': target,
            'x-chl-date-tried': tryTime.split('T')[0]
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
      'x-chl-date': successfulTime.split('T')[0]
    }
  });
}