/**
 * NASA Chlorophyll Tile Route - Alternative source
 * Uses NASA's MODIS Aqua chlorophyll data
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const params = await context.params;
  const { z, x, y } = params;
  
  // SAFETY: NASA only supports zoom levels 0-13
  const zoomLevel = parseInt(z);
  if (zoomLevel > 13) {
    
    const transparentPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    return new NextResponse(transparentPng, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
  
  // NASA GIBS MODIS Aqua Chlorophyll endpoint
  const url = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_Chlorophyll_A/default/2024-09-10/GoogleMapsCompatible_Level13/${z}/${y}/${x}.png`;
  
  

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ABFI-CHL-NASA/1.0',
      }
    });

    if (response.ok) {
      const buffer = await response.arrayBuffer();
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
          'X-CHL-Source': 'NASA-MODIS',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } catch (error) {
    
  }

  // Return transparent tile on error
  const transparentPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  );
  
  return new NextResponse(transparentPng, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=300',
      'X-CHL-Status': 'no-data',
    },
  });
}
