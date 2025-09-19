import { NextRequest, NextResponse } from 'next/server';
import { getInletWeather, fetchBuoyData, INLET_BUOY_MAP } from '@/lib/weather/noaa';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const inletId = searchParams.get('inlet');
    const stationId = searchParams.get('station');
    
    // Direct station query
    if (stationId) {
      const data = await fetchBuoyData(stationId);
      if (!data) {
        return NextResponse.json(
          { error: 'No data available for station' },
          { status: 404 }
        );
      }
      return NextResponse.json(data);
    }
    
    // Inlet-based query
    if (inletId) {
      const weather = await getInletWeather(inletId);
      return NextResponse.json(weather);
    }
    
    // Return all available stations
    const stations = Object.entries(INLET_BUOY_MAP)
      .filter(([key]) => key !== 'default')
      .map(([inletId, config]) => ({
        inlet_id: inletId,
        inlet_name: inletId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        station_id: config.primary,
        station_name: config.name,
        backup_station: config.backup
      }));
    
    return NextResponse.json({ stations });
    
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
// Cache weather data for 10 minutes
export const revalidate = 600;