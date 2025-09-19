/**
 * Normalized Stormio snapshot structure
 * This is the EXACT shape we persist everywhere:
 * - bite_reports.context
 * - catch_reports.conditions  
 * - analysis.conditions
 */
export interface StormioSnapshot {
  weather: {
    sstC: number | null;
    windKt: number | null;
    windDir: string | null;
    swellFt: number | null;
    swellPeriodS: number | null;
    pressureHpa: number | null;
    pressureTrend?: 'rising' | 'falling' | 'steady' | null;
  };
  moon: {
    phase: string;
    illumPct: number;
  };
  tides: {
    next: {
      type: 'high' | 'low';
      timeIso: string;
      heightM?: number | null;
    };
    // Optional: full events/curve if needed
    events?: Array<{
      type: 'high' | 'low';
      timeIso: string;
      heightM?: number | null;
    }>;
  };
  sun: {
    sunriseIso: string;
    sunsetIso: string;
  };
  lastIso: string; // Timestamp from Stormio
}

/**
 * Location data for reports
 */
export interface LocationData {
  lat: number;
  lng: number;
  accuracy_m?: number;
}

/**
 * Bite report request payload
 */
export interface BiteReportRequest {
  bite_id: string; // Client-generated UUIDv7
  location: LocationData;
  inlet_id?: string;
  notes?: string;
  fish_on?: boolean;
  species?: string;
}

/**
 * Catch report request payload
 */
export interface CatchReportRequest {
  species?: string;
  notes?: string;
  selected_inlet?: string;
  lat: number;
  lng: number;
  is_abfi_bite?: boolean;
  analysis?: any; // Full analysis JSON from Snip Tool
  photo_urls?: string[];
}
