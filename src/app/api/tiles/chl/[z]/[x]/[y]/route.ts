import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ z: string; x: string; y: string }> }) {
  const resolvedParams = await params;
  const z = resolvedParams.z;
  const x = resolvedParams.x;
  const y = resolvedParams.y.replace('.png',''); // sanitize
  
  // NASA GIBS provides reliable chlorophyll data
  // Using MODIS Aqua Chlorophyll-a concentration
  const qTime = req.nextUrl.searchParams.get('time');
  
  // NASA GIBS expects YYYY-MM-DD format
  const buildDateStr = (d: Date) => {
    return d.toISOString().split('T')[0];
  };
  
  // Generate fallback dates: NASA data is usually 1-8 days behind
  const fallbackDates: string[] = [];
  for (let daysAgo = 1; daysAgo <= 8; daysAgo++) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    fallbackDates.push(buildDateStr(date));
  }
  
  let dateParam: string;
  if (!qTime || qTime === 'latest') {
    // Default to 3 days ago - usually available
    dateParam = fallbackDates[2];
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(qTime)) {
    dateParam = qTime;
  } else {
    // Extract date from ISO timestamp
    dateParam = qTime.split('T')[0];
  }
  
  // Try with smart fallback if the requested date fails
  let successfulDate = dateParam;
  let upstream: Response | null = null;
  let lastError: string = '';
  
  // If using 'latest' or default, try multiple fallback dates
  const datesToTry = (!qTime || qTime === 'latest') ? 
    [dateParam, ...fallbackDates.slice(3)] : // Try from 3 days ago onwards
    [dateParam]; // Only try the specific date requested

  for (const tryDate of datesToTry) {
    // NASA GIBS WMTS endpoint for MODIS Aqua Chlorophyll-a
    const target = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_Chlorophyll_A/default/${tryDate}/GoogleMapsCompatible_Level9/${z}/${y}/${x}.png`;
    
    // Attempt to fetch from NASA GIBS (no auth required)
    try {
      const response = await fetch(target, {
        headers: {
          Accept: 'image/png',
          'User-Agent': 'alwaysbent-abfi'
        },
        redirect: 'follow',
        cache: 'no-store'
      });

      if (response.ok) {
        upstream = response;
        successfulDate = tryDate;
        // Successfully got chlorophyll data
        break;
      } else if (response.status === 404 && datesToTry.length > 1) {
        // Try next date
        lastError = `404 for ${tryDate}`;
        continue;
      } else {
        // Non-404 error or last attempt
        const text = await response.text();
        return new Response(text || `NASA GIBS ${response.status}`, {
          status: response.status,
          headers: { 
            'x-upstream-url': target,
            'x-chl-date-tried': tryDate
          }
        });
      }
    } catch (e: any) {
      lastError = e?.message || String(e);
      if (datesToTry.indexOf(tryDate) === datesToTry.length - 1) {
        // Last attempt failed
        break;
      }
    }
  }

  if (!upstream) {
    return new Response(`All dates failed. Last error: ${lastError}`, {
      status: 502,
      headers: { 
        'x-dates-tried': datesToTry.join(', '),
        'x-service': 'NASA GIBS MODIS Aqua Chlorophyll'
      }
    });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      'x-upstream-url': `https://gibs.earthdata.nasa.gov/.../MODIS_Aqua_Chlorophyll_A/.../`,
      'x-chl-date': successfulDate,
      'x-service': 'NASA GIBS'
    }
  });
}