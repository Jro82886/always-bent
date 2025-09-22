export type GearType = 'longliner' | 'drifting_longline' | 'trawler';

export type LayerToggles = {
  sst: boolean;
  chl: boolean;
  gfw: boolean;
  myTracks: boolean;
  fleetTracks: boolean;
  gfwTracks: boolean;
};

export type ScalarStats = {
  mean: number | null;
  min: number | null;
  max: number | null;
  gradient: number | null; // absolute °/km or mg/m³ per km
  units: '°F' | 'mg/m³';
  reason?: string; // when null values, e.g. "NoData" or "layer off"
};

export type GFWClip = {
  counts: { longliner: number; drifting_longline: number; trawler: number; events: number };
  sampleVesselNames?: string[]; // optional for flavor
};

export type SnipAnalysis = {
  polygon: GeoJSON.Polygon;
  bbox: [number, number, number, number];
  timeISO: string;
  sst?: ScalarStats | null;
  chl?: ScalarStats | null;
  gfw?: GFWClip | null;
  toggles: LayerToggles;
  notes?: string; // future proof
};

export type SnipReportPayload = {
  analysis: SnipAnalysis;
  preview: { sst: boolean; chl: boolean; gfw: boolean };
};