import { NextRequest, NextResponse } from "next/server";

type AnalyzePayload = {
  bbox: [number, number, number, number];
  time?: string;
  layers?: string[];
  inletId?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as AnalyzePayload;
    const bbox = body?.bbox;
    if (!bbox || !Array.isArray(bbox) || bbox.length !== 4) {
      return NextResponse.json(
        { error: "bbox [minLng,minLat,maxLng,maxLat] required" },
        { status: 400 }
      );
    }

    const [minLng, minLat, maxLng, maxLat] = bbox as [number, number, number, number];

    // Deterministic demo hotspots inside bbox
    const dx = (maxLng - minLng) / 4;
    const dy = (maxLat - minLat) / 4;
    const points: [number, number][] = [
      [minLng + dx, minLat + dy],
      [minLng + 2 * dx, minLat + 2 * dy],
      [minLng + 3 * dx, minLat + 3 * dy],
    ];

    const hotspots = {
      type: "FeatureCollection" as const,
      features: points.map((p, i) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: p },
        properties: {
          id: `hotspot-${i + 1}`,
          title: i === 0 ? "Hot" : i === 1 ? "Warm" : "Interesting",
          confidence: i === 0 ? 0.8 : i === 1 ? 0.65 : 0.5,
          rationale: "Stub analysis",
        },
      })),
    };

    const summary = {
      notes: "Demo analysis: three candidate spots ranked by confidence.",
    };

    return NextResponse.json({ hotspots, summary });
  } catch (e: any) {
    return NextResponse.json({ error: "Analyze route error", detail: e?.message }, { status: 500 });
  }
}


