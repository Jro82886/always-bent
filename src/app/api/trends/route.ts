import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

interface TideEvent {
  type: 'high' | 'low';
  time: string;
  height_m: number;
}

interface BitePeriod {
  label: string;
  pct: number;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const inlet = searchParams.get('inlet');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const rangeDays = parseInt(searchParams.get('rangeDays') || '14');

    if (!inlet || !lat || !lng) {
      return NextResponse.json(
        { error: 'inlet, lat, and lng parameters are required' },
        { status: 400 }
      );
    }

    // Initialize response structure
    const response = {
      tides: { events: [] as TideEvent[] },
      sun: { sunrise: null as string | null, sunset: null as string | null },
      bitePrediction: null as { window: string; byPeriod: BitePeriod[] } | null,
      communityActivityToday: [] as { hour: string; count: number }[],
      speciesActivityRange: [] as { name: string; pct: number }[]
    };

    // Fetch tides and sun data from Stormglass
    try {
      const stormglassUrl = new URL('https://api.stormglass.io/v2/tide/extremes/point');
      stormglassUrl.searchParams.append('lat', lat);
      stormglassUrl.searchParams.append('lng', lng);
      stormglassUrl.searchParams.append('start', new Date().toISOString());
      stormglassUrl.searchParams.append('end', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());

      const tideResponse = await fetch(stormglassUrl.toString(), {
        headers: {
          'Authorization': process.env.STORMGLASS_API_KEY || ''
        }
      });

      if (tideResponse.ok) {
        const tideData = await tideResponse.json();
        response.tides.events = (tideData.data || []).slice(0, 6).map((event: any) => ({
          type: event.type === 'high' ? 'high' : 'low',
          time: event.time,
          height_m: event.height
        }));
      }

      // Fetch sun data
      const sunUrl = new URL('https://api.stormglass.io/v2/astronomy/point');
      sunUrl.searchParams.append('lat', lat);
      sunUrl.searchParams.append('lng', lng);
      sunUrl.searchParams.append('start', new Date().toISOString());
      sunUrl.searchParams.append('end', new Date().toISOString());

      const sunResponse = await fetch(sunUrl.toString(), {
        headers: {
          'Authorization': process.env.STORMGLASS_API_KEY || ''
        }
      });

      if (sunResponse.ok) {
        const sunData = await sunResponse.json();
        const today = sunData.data?.[0];
        if (today) {
          response.sun.sunrise = today.sunrise;
          response.sun.sunset = today.sunset;
        }
      }
    } catch (error) {
      console.error('Stormglass API error:', error);
    }

    // Fetch community data from Supabase
    try {
      const supabase = await getSupabase();
      
      // Get bite reports for the inlet over the range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - rangeDays);
      
      const { data: bites } = await supabase
        .from('bites')
        .select('*')
        .eq('inlet_slug', inlet)
        .gte('occurred_at', startDate.toISOString())
        .order('occurred_at', { ascending: false });

      if (bites && bites.length > 0) {
        // Calculate bite prediction by time of day
        const periodCounts = {
          Morning: 0,    // 5am-11am
          Midday: 0,     // 11am-2pm
          Afternoon: 0,  // 2pm-6pm
          Evening: 0     // 6pm-10pm
        };

        bites.forEach((bite: any) => {
          const hour = new Date(bite.occurred_at).getHours();
          if (hour >= 5 && hour < 11) periodCounts.Morning++;
          else if (hour >= 11 && hour < 14) periodCounts.Midday++;
          else if (hour >= 14 && hour < 18) periodCounts.Afternoon++;
          else if (hour >= 18 && hour < 22) periodCounts.Evening++;
        });

        const total = Object.values(periodCounts).reduce((a, b) => a + b, 0);
        const periods = Object.entries(periodCounts).map(([label, count]) => ({
          label,
          pct: total > 0 ? Math.round((count / total) * 100) : 0
        }));

        // Find best window (two adjacent periods with highest combined %)
        const windows = [
          { name: 'Morning – Midday', periods: ['Morning', 'Midday'] },
          { name: 'Midday – Afternoon', periods: ['Midday', 'Afternoon'] },
          { name: 'Afternoon – Evening', periods: ['Afternoon', 'Evening'] }
        ];

        let bestWindow = windows[0];
        let bestScore = 0;

        windows.forEach(window => {
          const score = window.periods.reduce((sum, p) => 
            sum + (periods.find(per => per.label === p)?.pct || 0), 0
          );
          if (score > bestScore) {
            bestScore = score;
            bestWindow = window;
          }
        });

        response.bitePrediction = {
          window: bestWindow.name,
          byPeriod: periods
        };

        // Today's activity by hour
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayBites = bites.filter((bite: any) => 
          new Date(bite.occurred_at) >= today
        );

        const hourCounts: Record<string, number> = {};
        todayBites.forEach((bite: any) => {
          const hour = new Date(bite.occurred_at).getHours().toString().padStart(2, '0');
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        response.communityActivityToday = Object.entries(hourCounts)
          .map(([hour, count]) => ({ hour, count }))
          .sort((a, b) => a.hour.localeCompare(b.hour));

        // Species activity
        const speciesCounts: Record<string, number> = {};
        bites.forEach((bite: any) => {
          if (bite.species && Array.isArray(bite.species)) {
            bite.species.forEach((species: string) => {
              speciesCounts[species] = (speciesCounts[species] || 0) + 1;
            });
          }
        });

        const totalSpecies = Object.values(speciesCounts).reduce((a, b) => a + b, 0);
        response.speciesActivityRange = Object.entries(speciesCounts)
          .map(([name, count]) => ({
            name,
            pct: Math.round((count / totalSpecies) * 100)
          }))
          .sort((a, b) => b.pct - a.pct)
          .slice(0, 6);
      }
    } catch (error) {
      console.error('Supabase error:', error);
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('Trends API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends data' },
      { status: 500 }
    );
  }
}
