/**
 * Chlorophyll Tile Proxy Route
 * Fetches high-resolution chlorophyll tiles from Copernicus Marine WMTS
 * Similar to SST proxy but for ocean color/chlorophyll data
 */

import { NextRequest, NextResponse } from 'next/server';

// Get today's date in UTC
function getTodayUTC(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}T12:00:00.000Z`;
}

// Get date N days ago
function getDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}T12:00:00.000Z`;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const params = await context.params;
  const { z, x, y } = params;
  
  // Get CHL WMTS template from environment
  const template = process.env.NEXT_PUBLIC_CHL_WMTS_TEMPLATE;
  if (!template) {
    
    return new NextResponse('CHL WMTS not configured', { status: 500 });
  }

  // Try today first, then fall back to previous days if needed
  const datesToTry = [
    getTodayUTC(),
    getDaysAgo(1),
    getDaysAgo(2),
    getDaysAgo(3),
    getDaysAgo(4),
    getDaysAgo(5)
  ];

  for (const dateTime of datesToTry) {
    // Build the Copernicus WMTS URL
    const url = template
      .replace('{z}', z)
      .replace('{x}', x)
      .replace('{y}', y)
      .replace('{TIME}', dateTime);

    // Fetching CHL tile

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ABFI-CHL-Proxy/1.0',
        },
        // Don't cache failed attempts
        cache: 'no-store'
      });

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        
        // Return the tile with proper caching headers
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            'X-CHL-Date': dateTime.split('T')[0],
            'X-CHL-Source': 'Copernicus-Marine',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // If 404 or other error, try next date
      [0]}, trying earlier date...`);
      
    } catch (error) {
      
      // Continue to next date
    }
  }

  // If all dates failed, return a transparent tile
  
  
  // Return transparent 256x256 PNG
  const transparentPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  );
  
  return new NextResponse(transparentPng, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=300', // Cache empty tiles for 5 min
      'X-CHL-Status': 'no-data',
    },
  });
}