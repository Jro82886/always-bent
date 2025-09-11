import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const resolvedParams = await params;
  const z = parseInt(resolvedParams.z, 10);
  const x = parseInt(resolvedParams.x, 10);
  const y = parseInt(resolvedParams.y, 10);

  // Get Copernicus WMTS template
  const template = process.env.CMEMS_SST_WMTS_TEMPLATE;
  if (!template) {
    return NextResponse.json({ error: "CMEMS_SST_WMTS_TEMPLATE not configured" }, { status: 500 });
  }

  // Build target URL by replacing placeholders
  const targetUrl = template
    .replace("{z}", z.toString())
    .replace("{x}", x.toString())
    .replace("{y}", y.toString());

  try {
    // Add auth if credentials are available
    const headers: Record<string, string> = { "User-Agent": "ABFI/1.0" };
    const user = process.env.COPERNICUS_USER;
    const pass = process.env.COPERNICUS_PASS;
    if (user && pass) {
      headers.Authorization = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
    }

    // Fetch from Copernicus and stream back
    const response = await fetch(targetUrl, {
      headers,
      next: { revalidate: 3600 } // 1 hour cache
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Copernicus ${response.status}`, targetUrl },
        { status: 502 }
      );
    }

    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "X-Debug-Copernicus": targetUrl
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: "proxy-failure", detail: String(error) },
      { status: 500 }
    );
  }
}
