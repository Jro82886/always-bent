export type GeoResult =
  | { ok: true; coords: { lat: number; lng: number; accuracy: number } }
  | { ok: false; reason: "denied" | "timeout" | "unavailable" | "unknown"; message: string };

export function getLocation(opts?: PositionOptions): Promise<GeoResult> {
  const options: PositionOptions = {
    enableHighAccuracy: false,
    timeout: 8000,
    maximumAge: 60000,
    ...(opts || {}),
  };
  return new Promise((resolve) => {
    if (!(typeof navigator !== "undefined" && "geolocation" in navigator)) {
      resolve({ ok: false, reason: "unavailable", message: "Geolocation not supported" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          ok: true,
          coords: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy ?? 0,
          },
        });
      },
      (err) => {
        const code = err?.code;
        if (code === 1) resolve({ ok: false, reason: "denied", message: "Permission denied" });
        else if (code === 2) resolve({ ok: false, reason: "unavailable", message: "Position unavailable" });
        else if (code === 3) resolve({ ok: false, reason: "timeout", message: "Timed out" });
        else resolve({ ok: false, reason: "unknown", message: err?.message || "Unknown error" });
      },
      options
    );
  });
}



