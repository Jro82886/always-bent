"use client";

import { useEffect, useState } from "react";
import { useMapbox } from "@/lib/MapCtx";
import { useAppState } from "@/store/appState";
import { addOrUpdateRaster, setRasterVisible, getRasterLayer } from "@/lib/layers";

// Legacy toggle (no longer used). Keeping a minimal null export to avoid accidental imports.
export default function SSTToggle() {
  return null;
}


