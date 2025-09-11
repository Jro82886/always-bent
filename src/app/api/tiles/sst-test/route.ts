import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Test a known good NASA GIBS tile
    const testUrl = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_L3_SST_Thermal_4km_Night_Daily/default/2025-09-08/GoogleMapsCompatible_Level9/6/17/26.png";

    console.log('🧪 Testing NASA GIBS connectivity:', testUrl);

    const response = await fetch(testUrl, {
      headers: { "User-Agent": "ABFI/1.0 (gibs-test)" },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    console.log('📡 NASA GIBS Test Response:', response.status);

    if (response.ok) {
      const body = await response.arrayBuffer();
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "X-Test-Status": "SUCCESS",
          "X-Test-URL": testUrl
        }
      });
    } else {
      return NextResponse.json({
        error: "NASA GIBS test failed",
        status: response.status,
        testUrl,
        message: response.status === 404 ? "Tile not available for this date" : "NASA GIBS service issue"
      }, { status: response.status });
    }

  } catch (error: any) {
    console.error('🚨 NASA GIBS Test Error:', error);
    return NextResponse.json({
      error: "NASA GIBS connectivity test failed",
      message: error.message,
      type: error.name
    }, { status: 500 });
  }
}
