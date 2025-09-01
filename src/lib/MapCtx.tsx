"use client";

import { createContext, useContext } from "react";
import type mapboxgl from "mapbox-gl";

// Create the context
export const MapCtx = createContext<mapboxgl.Map | null>(null);

// Hook for consuming it
export function useMapbox() {
  return useContext(MapCtx);
}


