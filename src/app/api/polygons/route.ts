import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Simple stub that returns empty polygon collection
  // This prevents 404 errors when polygons are requested
  const polygons = {
    type: "FeatureCollection",
    features: []
  };

  return NextResponse.json(polygons, {
    headers: {
      'Cache-Control': 'public, max-age=300',
    },
  });
}
