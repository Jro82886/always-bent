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

    // Deterministic SST/CHL score synthesis (placeholder until real rasters are sampled)
    function synthScores(lng: number, lat: number, idx: number) {
      // Normalize lng/lat into [0,1] range-like values
      const n = (x: number) => (Math.sin(x * 12.9898 + idx * 78.233) * 43758.5453) % 1;
      const sstEdge = 0.5 + 0.5 * Math.sin((lng + lat) * 0.05 + idx);
      const chlGradient = 0.5 + 0.5 * Math.cos((lng - lat) * 0.07 - idx * 0.5);
      const sst = 0.55 * sstEdge + 0.15 * n(lng) + 0.1 * n(lat) + 0.2 * (1 - Math.abs(0.5 - sstEdge));
      const chl = 0.6 * chlGradient + 0.15 * n(lat + 2) + 0.1 * n(lng + 1) + 0.15 * (1 - Math.abs(0.5 - chlGradient));
      // Weighting blend (tunable)
      const wSst = 0.6, wChl = 0.4;
      const confidence = Math.max(0, Math.min(1, wSst * sst + wChl * chl));
      return {
        confidence,
        factors: {
          sst: { score: Math.max(0, Math.min(1, sst)), weight: wSst, note: 'Edges & breaks (front probability)' },
          chl: { score: Math.max(0, Math.min(1, chl)), weight: wChl, note: 'Color gradient & clarity proxy' },
        },
      } as const;
    }

    const hotspots = {
      type: "FeatureCollection" as const,
      features: points.map((p, i) => {
        const [lng, lat] = p;
        const s = synthScores(lng, lat, i + 1);
        return {
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: p },
        properties: {
          id: `hotspot-${i + 1}`,
          title: i === 0 ? "Hot" : i === 1 ? "Warm" : "Interesting",
          confidence: s.confidence,
          rationale: "SST/CHL synthetic scoring (MVP)",
          factors: s.factors,
        },
      }}),
    };

    const summary = {
      notes: "MVP analysis: confidence blends SST edges and CHL gradients.",
      schema: {
        factors: {
          sst: { weight: 0.6, signal: "edges" },
          chl: { weight: 0.4, signal: "gradient" },
        },
      },
    } as const;

    return NextResponse.json({ hotspots, summary });
  } catch (e: any) {
    return NextResponse.json({ error: "Analyze route error", detail: e?.message }, { status: 500 });
  }
}


