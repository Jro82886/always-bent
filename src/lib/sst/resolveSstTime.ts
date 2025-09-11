import { lngLatToTile } from "@/lib/tiles/lnglatToTile";

async function tileOk(time: string, z: number, x: number, y: number) {
  const url = `/api/tiles/sst/${z}/${x}/${y}.png?time=${encodeURIComponent(time)}`;
  const res = await fetch(url, { method: "HEAD", cache: "no-store" });
  return res.ok && (res.headers.get("content-type") || "").includes("image/png");
}

/**
 * Resolve a usable date for NASA GIBS tiles.
 * requested: "latest" | "today" | "-1d" | "-2d" | "YYYY-MM-DD"
 */
export async function resolveSstTime(
  map: any,
  requested: string
): Promise<{ timeUsed: string; badge?: string }> {
  // choose a mid zoom for probing (product caps at ~9)
  const center = map.getCenter();
  const zoom = Math.min(Math.max(Math.round(map.getZoom()), 5), 8);
  const { x, y, z } = lngLatToTile(center.lng, center.lat, zoom);

  if (requested !== "latest") {
    const ok = await tileOk(requested, z, x, y);
    return { timeUsed: requested, badge: ok ? undefined : "(no tile)" };
  }

  const chain = ["today", "-1d", "-2d"];
  for (let i = 0; i < chain.length; i++) {
    if (await tileOk(chain[i], z, x, y)) {
      return {
        timeUsed: chain[i],
        badge: i === 0 ? undefined : i === 1 ? "(yesterday)" : "(2 days ago)"
      };
    }
  }
  // last resort
  return { timeUsed: "-2d", badge: "(2 days ago)" };
}
