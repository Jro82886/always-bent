import { lngLatToTile } from "@/lib/tiles/lnglatToTile";
import mapboxgl from "mapbox-gl";

// try a HEAD request to a single tile to see if it's available
async function tileOk(time: string, z: number, x: number, y: number) {
  const url = `/api/tiles/sst/${z}/${x}/${y}.png?time=${encodeURIComponent(time)}`;
  const res = await fetch(url, { method: "HEAD", cache: "no-store" });
  return res.ok && (res.headers.get("content-type") || "").includes("image/png");
}

// Given map center and zoom, probe today → -1d → -2d → (optional -3d)
export async function resolveSstTime(
  map: mapboxgl.Map,
  requested: string // "today" | "-1d" | "-2d" | "-3d" | "YYYY-MM-DD" | "latest"
): Promise<{ timeUsed: string; badge?: string }> {
  const center = map.getCenter();
  const zoom = Math.min(Math.max(Math.round(map.getZoom()), 3), 7); // MODIS L3 ~ level 9 max; probe mid-zoom
  const { x, y, z } = lngLatToTile(center.lng, center.lat, zoom);

  // If a specific date or relative string (not 'latest') was chosen, just use it
  if (requested !== "latest") {
    const ok = await tileOk(requested, z, x, y);
    return { timeUsed: requested, badge: ok ? undefined : "(no tile)" };
  }

  // latest chain
  const chain = ["today", "-1d", "-2d"];
  for (let i = 0; i < chain.length; i++) {
    if (await tileOk(chain[i], z, x, y)) {
      return { timeUsed: chain[i], badge: i === 0 ? undefined : i === 1 ? "(yesterday)" : "(2 days ago)" };
    }
  }
  // last resort: still show '-2d' so tiles load as user pans (some areas may exist)
  return { timeUsed: "-2d", badge: "(2 days ago)" };
}

