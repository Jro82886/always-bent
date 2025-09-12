import { NextRequest, NextResponse } from 'next/server';
import { generateDailyPolygons } from '@/lib/sst/edgeDetection';

/**
 * POST /api/polygons/generate
 * Generate daily SST edge and eddy polygons
 * This would be called by a cron job when new SST data is available
 */
export async function POST(request: NextRequest) {
  try {
    // Get bounds from request or use East Coast defaults
    const body = await request.json().catch(() => ({}));
    const bounds = body.bounds || [[-81, 25], [-65, 45]]; // Default to East Coast
    
    // Generate polygons from current SST data
    const polygons = await generateDailyPolygons(
      process.env.NEXT_PUBLIC_SST_WMTS_TEMPLATE || '',
      bounds
    );
    
    // In production, save to database
    // await savePolygonsToSupabase(polygons);
    
    // For now, save to a JSON file that the polygon layer can read
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const filename = `sst_polygons_${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(dataDir, filename);
    
    // Ensure directory exists
    await fs.mkdir(dataDir, { recursive: true });
    
    // Write polygons
    await fs.writeFile(filepath, JSON.stringify(polygons, null, 2));
    
    // Also update the "latest" file
    const latestPath = path.join(dataDir, 'sst_polygons_latest.json');
    await fs.writeFile(latestPath, JSON.stringify(polygons, null, 2));
    
    return NextResponse.json({
      success: true,
      message: 'Polygons generated successfully',
      count: polygons.features.length,
      filename,
      types: {
        eddies: polygons.features.filter((f: any) => f.properties?.type === 'eddy').length,
        edges: polygons.features.filter((f: any) => f.properties?.type === 'edge').length,
        filaments: polygons.features.filter((f: any) => f.properties?.type === 'filament').length
      }
    });
  } catch (error) {
    console.error('Error generating polygons:', error);
    return NextResponse.json(
      { error: 'Failed to generate polygons' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/polygons/generate
 * Get the latest generated polygons
 */
export async function GET(request: NextRequest) {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Try to read the latest polygons
    const latestPath = path.join(process.cwd(), 'public', 'data', 'sst_polygons_latest.json');
    
    try {
      const data = await fs.readFile(latestPath, 'utf-8');
      const polygons = JSON.parse(data);
      
      return NextResponse.json(polygons);
    } catch (err) {
      // If no file exists, generate new polygons
      const bounds = [[-81, 25], [-65, 45]] as [[number, number], [number, number]];
      const polygons = await generateDailyPolygons(
        process.env.NEXT_PUBLIC_SST_WMTS_TEMPLATE || '',
        bounds
      );
      
      // Save for next time
      await fs.mkdir(path.dirname(latestPath), { recursive: true });
      await fs.writeFile(latestPath, JSON.stringify(polygons, null, 2));
      
      return NextResponse.json(polygons);
    }
  } catch (error) {
    console.error('Error reading polygons:', error);
    return NextResponse.json(
      { error: 'Failed to read polygons' },
      { status: 500 }
    );
  }
}
