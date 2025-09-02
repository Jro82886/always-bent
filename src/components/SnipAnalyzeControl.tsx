"use client";
import type mapboxgl from "mapbox-gl";
import SnipTool from "@/components/SnipTool";

export default function SnipAnalyzeControl({ map }: { map: mapboxgl.Map }) {
  return <SnipTool map={map} />;
}


