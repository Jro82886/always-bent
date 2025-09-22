export type SnipAnalysis = {
  polygon: GeoJSON.Polygon;
  bbox: [number, number, number, number];
  timeISO: string;
  sst?: { mean: number; min: number; max: number; gradient: number } | null;
  chl?: { mean: number; min: number; max: number; gradient: number } | null;
  gfw?: { 
    counts: { 
      longliner: number; 
      drifting_longline: number; 
      trawler: number; 
      events: number 
    }; 
    sampleNames?: string[] 
  } | null;
  presence: {
    user: { present: boolean; points?: [number, number, number][] } | null;
    fleet: { 
      count: number; 
      consecutiveDays: number; 
      daysWithPresence: string[]; 
      vessels: Array<{ id: string; name?: string; daysSeen: number }> 
    } | null;
  };
  hotspots?: Array<{ 
    type: 'front' | 'chl-band' | 'sst-band'; 
    geometry: any; 
    strength: 'weak' | 'moderate' | 'strong'; 
    notes?: string 
  }>;
  toggles: { sst: boolean; chl: boolean; gfw: boolean };
  narrative: string;
};
