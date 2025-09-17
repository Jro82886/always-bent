import { NextRequest, NextResponse } from "next/server";
import { findRealHotspots } from '@/lib/analysis/real-pixel-extractor';

type AnalyzePayload = {
  bbox: [number, number, number, number];
  time?: string;
  layers?: string[];
  inletId?: string;
  map?: any; // Map instance passed from client
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
        };
      }),
    };

    // Build a basic report object (placeholder values derived from bbox + hotspots)
    const [w, s, e, n] = [minLng, minLat, maxLng, maxLat];
    const centerLng = (w + e) / 2;
    const centerLat = (s + n) / 2;
    const milesPerDegLat = 69.0;
    const milesPerDegLon = Math.cos((centerLat * Math.PI) / 180) * 69.172;
    const boxNm = Math.round(((e - w) * milesPerDegLon + (n - s) * milesPerDegLat) / 2);
    const best = (hotspots.features[0]?.properties?.confidence ?? 0) * 2.5; // ~0-2.5 °F/mi
    const bearingDeg = 45; // placeholder orientation
    const report = {
      boxCenter: { lng: centerLng, lat: centerLat },
      boxSizeNm: boxNm,
      tempRangeF: { min: 77.2, max: 79.8 },
      strongestBreak: {
        magFPerNm: +best.toFixed(1),
        center: { lng: hotspots.features[0]?.geometry.coordinates[0] ?? centerLng, lat: hotspots.features[0]?.geometry.coordinates[1] ?? centerLat },
        bearingDeg,
        lineOrientation: "NE–SW",
      },
      movement24h: { nm: 4.0, bearingDeg: 315, note: "warm push toward canyon head" },
      projection24_48h: { note: "likely creeping NW; may pin to west wall" },
      areas: [
        { name: "Canyon Head (100–200 fathom)", why: "Strongest break overlaps steep relief" },
        { name: "Southern Wall Outflow", why: "Filament likely to form rip line" },
        { name: "Northern Lobe", why: "Secondary gradient tightening" },
      ],
      approach: {
        primary: "Work tight SST break near canyon head; cover both sides",
        secondary: "Scan southern filament early",
        timing: "Hit at first light before further NW drift",
      },
      summary: `Strong NE–SW SST front (~${(+best.toFixed(1))}°F/mi). Shifted ~4 NM NW in 24h.`,
      date: body?.time ?? new Date().toISOString().slice(0, 10),
    } as const;

    const summary = {
      notes: "MVP analysis: confidence blends SST edges and CHL gradients.",
      schema: {
        factors: {
          sst: { weight: 0.6, signal: "edges" },
          chl: { weight: 0.4, signal: "gradient" },
        },
      },
    } as const;

    return NextResponse.json({ hotspots, summary, report });
  } catch (e: any) {
    return NextResponse.json({ error: "Analyze route error", detail: e?.message }, { status: 500 });
  }
}


