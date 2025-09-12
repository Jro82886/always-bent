import { NextResponse } from 'next/server';

export async function GET() {
  // This endpoint can be used to verify the SnipTool is being loaded
  const diagnostics = {
    timestamp: new Date().toISOString(),
    message: 'SnipTool diagnostic endpoint',
    checks: {
      mapboxToken: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
      environment: process.env.NODE_ENV,
    },
    instructions: [
      '1. Open browser console',
      '2. Click "Ocean Analysis" button',
      '3. Look for console logs starting with 🚀',
      '4. Check if cursor changes to crosshair',
      '5. Try clicking and dragging on map',
      '6. Look for 🖱️ mouse event logs',
      '7. Check for any error messages in console'
    ],
    expectedLogs: [
      '🚀 Starting drawing mode...',
      '📍 Current map state: {...}',
      '✅ Cleared existing rectangle',
      '🎯 Rectangle drawing mode verification:',
      '🖱️ Started dragging from: [lng, lat]',
      '👁️ Preview updating, area: X km²',
      '✅ Rectangle completed: {...}'
    ]
  };

  return NextResponse.json(diagnostics, { status: 200 });
}
