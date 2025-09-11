export type LayerEntry = {
  id: string;
  label: string;
  tiles: string[];
  opacity?: number;
  minzoom?: number;
  maxzoom?: number;
  attribution?: string;
};

const TILES_BASE = process.env.NEXT_PUBLIC_TILES_BASE || "";

export const LAYERS: LayerEntry[] = [
  // Copernicus layers removed for MUR-only MVP
  {
    id: "chlorophyll",
    label: "Chlorophyll",
    tiles: [
      `${TILES_BASE}/copernicus/chl/{z}/{x}/{y}.png`,
    ],
    opacity: 0.9,
    attribution: "© Copernicus",
    minzoom: 0,
    maxzoom: 10,
  },
  {
    id: "waves_3h",
    label: "Waves (3-hour)",
    tiles: [
      `${TILES_BASE}/copernicus/waves_3h/{z}/{x}/{y}.png`,
    ],
    opacity: 0.7,
    attribution: "© Copernicus",
    minzoom: 0,
    maxzoom: 10,
  },
];


