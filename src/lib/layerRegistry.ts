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
  {
    id: "sst",
    label: "SST (Copernicus)",
    tiles: ["/api/tiles/sst/{z}/{x}/{y}.png"],
    opacity: 0.9,
    attribution: "© Copernicus Marine Service",
    minzoom: 0,
    maxzoom: 24,
  },
  {
    id: "chlorophyll",
    label: "Chlorophyll (Copernicus)",
    tiles: ["/api/tiles/chl/{z}/{x}/{y}.png"],
    opacity: 0.85,
    attribution: "© Copernicus Marine Service",
    minzoom: 0,
    maxzoom: 24,
  },
];


