"use client";

import { useState } from "react";
import { getLocation } from "@/lib/services/geo";

export default function TestLocationPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetLocation = async () => {
    if (loading) return;
    setLoading(true);
    const res = await getLocation();
    if (res.ok) {
      setCoords(res.coords);
      setError(null);
    } else {
      setCoords(null);
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 text-white space-y-4">
      <h1 className="text-xl font-bold">Test Geolocation</h1>
      <button
        onClick={handleGetLocation}
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Getting…" : "Get My Location"}
      </button>

      {coords && (
        <p className="mt-4">
          Latitude: {coords.lat}, Longitude: {coords.lng} (±{Math.round(coords.accuracy)}m)
        </p>
      )}
      {error && <p className="mt-4 text-red-400">Error: {error}</p>}
    </div>
  );
}


