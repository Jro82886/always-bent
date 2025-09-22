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

export type WindStats = {
  speed_kn: number | null;
  direction_deg: number | null;
};

export type SwellStats = {
  height_ft: number | null;
  period_s: number | null;
  direction_deg: number | null;
};

export type TrackPresence = {
  myVesselInArea: boolean;
  fleetVessels: number;       // unique vessels from selected inlet
  fleetVisitsDays: number;    // consecutive days with presence (≤7)
  gfw?: {
    longliner: number;
    drifting_longline: number;
    trawler: number;
    events: number;
  } | null;
};

export type PolygonMeta = {
  bbox: [number, number, number, number];
  area_sq_km: number;
  centroid: { lat: number; lon: number };
};

export type GFWClip = {
  counts: { longliner: number; drifting_longline: number; trawler: number; events: number };
  sampleVesselNames?: string[]; // optional for flavor
  reason?: string;
};

export type SnipAnalysis = {
  polygon: GeoJSON.Polygon;
  timeISO: string;
  
  // Environmental
  sst?: ScalarStats | null;
  chl?: ScalarStats | null;
  wind?: WindStats | null;
  swell?: SwellStats | null;
  
  // Activity awareness
  presence?: TrackPresence | null;
  
  // Toggles
  toggles: LayerToggles;
  
  // Metadata
  polygonMeta: PolygonMeta;
  notes?: string;
  narrative?: string; // ensure present (used by UI)
  obtainedVia: 'snip' | 'bite';
};

export type SnipReportPayload = {
  analysis: SnipAnalysis;
  preview: { sst: boolean; chl: boolean; gfw: boolean };
};