import { NextResponse } from "next/server";

type LayerKind = "sst" | "chlorophyll";
type BBox = [number, number, number, number];
type AnalyzeRequest = {
  inletId: string;
  bbox: BBox;
  date: string; // YYYY-MM-DD
  layer: LayerKind;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AnalyzeRequest;

    if (!body?.inletId || !body?.bbox || !body?.date || !body?.layer) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const [minLng, minLat, maxLng, maxLat] = body.bbox;

    const p1: [number, number] = [
      (minLng * 2 + maxLng) / 3,
      (minLat * 2 + maxLat) / 3,
    ];
    const p2: [number, number] = [
      (minLng + maxLng * 2) / 3,
      (minLat + maxLat * 2) / 3,
    ];

    const summary =
      body.layer === "chlorophyll"
        ? `Demo: Chlorophyll pattern on ${body.date} near ${body.inletId} shows a usable gradient. Look for bait tight to the edge at first light.`
        : `Demo: SST on ${body.date} near ${body.inletId} shows a small temp break. Work the warm side edge early, then slide deeper.`;

    const resp = {
      summary,
      features: {
        type: "FeatureCollection" as const,
        features: [
          {
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: p1 },
            properties: {
              id: "hotspot-001",
              title: "Predicted hotspot",
              confidence: 0.78,
              best_window: "06:00–10:00",
              rationale:
                body.layer === "chlorophyll"
                  ? "CHL break + local pattern"
                  : "SST break + local pattern",
              source_layer: body.layer,
            },
          },
          {
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: p2 },
            properties: {
              id: "hotspot-002",
              title: "Secondary hotspot",
              confidence: 0.63,
              best_window: "10:00–13:00",
              rationale: "Secondary edge / drift line",
              source_layer: body.layer,
            },
          },
        ],
      },
    };

    return NextResponse.json(resp, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


