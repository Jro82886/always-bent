"use client";

import type mapboxgl from "mapbox-gl";
import toast from "react-hot-toast";

export async function exportMapAsPng(map: mapboxgl.Map) {
  try {
    const canvas = map.getCanvas();
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `abfi-imagery-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
  } catch (err) {
    console.error("Export failed", err);
    toast.error("Failed to export map");
  }
}



