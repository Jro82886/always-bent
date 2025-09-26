// types/analyze.ts
export type AnalyzeAPI = {
  areaKm2: number
  hasSST: boolean
  hasCHL: boolean
  sst?: { 
    meanC: number
    minC: number
    maxC: number
    gradientCperKm: number
    p10C?: number
    p90C?: number
  }
  chl?: { 
    mean: number
    p10?: number
    p90?: number 
  }
  weather?: {
    wind: { speed: number; direction: string }
    seas: { height: number; period: number }
    temp: number
    conditions: string
  } | null
  fleet?: {
    vessels: Array<{ name: string; type: string; lastSeen: string }>
    count: number
  } | null
  reports?: {
    count: number
    species: string[]
    recentCatch: string
  } | null
}

export type AnalysisVM = {
  areaKm2: number
  hasSST: boolean
  hasCHL: boolean
  sst?: { 
    meanF: number
    minF: number
    maxF: number
    gradFperMile: number
    p10F?: number
    p90F?: number
  }
  chl?: { 
    mean: number
    p10?: number
    p90?: number 
  }
  weather?: {
    wind: { speed: number; direction: string }
    seas: { height: number; period: number }
    temp: number
    conditions: string
  } | null
  fleet?: {
    vessels: Array<{ name: string; type: string; lastSeen: string }>
    count: number
  } | null
  reports?: {
    count: number
    species: string[]
    recentCatch: string
  } | null
  narrative?: string
  confidence?: 'high' | 'no-data' | 'error'
}

export const toVM = (a: AnalyzeAPI): AnalysisVM => {
  const c2f = (c: number) => (c * 9) / 5 + 32
  const km2mile = (km: number) => km * 0.621371
  
  return {
    areaKm2: a.areaKm2,
    hasSST: a.hasSST,
    hasCHL: a.hasCHL,
    sst: a.sst && {
      meanF: c2f(a.sst.meanC),
      minF: c2f(a.sst.minC),
      maxF: c2f(a.sst.maxC),
      gradFperMile: ((a.sst.gradientCperKm * 9) / 5) / km2mile(1),
      p10F: a.sst.p10C !== undefined ? c2f(a.sst.p10C) : undefined,
      p90F: a.sst.p90C !== undefined ? c2f(a.sst.p90C) : undefined,
    },
    chl: a.chl && { 
      mean: a.chl.mean,
      p10: a.chl.p10,
      p90: a.chl.p90,
    },
    weather: a.weather,
    fleet: a.fleet,
    reports: a.reports,
  }
}

// Keep the old types for backward compatibility during migration
export type AnalyzeAPIResponse = {
  ok: boolean
  analysis?: {
    oceanData: {
      sst?: {
        mean_f?: number
        min_f?: number
        max_f?: number
        gradient_f?: number
        n_valid?: number
      } | null
      chl?: {
        mean?: number
        min?: number
        max?: number
        gradient?: number
        n_valid?: number
      } | null
    }
    narrative: string
    stats: {
      area_km2: number
      sst_mean_f?: number
      sst_range_f?: number | null
      chl_mean_mg_m3?: number
      chl_range_mg_m3?: number | null
    }
    confidence: 'high' | 'no-data' | 'error'
  }
  error?: string
}

export const toVMFromResponse = (response: AnalyzeAPIResponse): AnalysisVM | null => {
  if (!response.ok || !response.analysis) return null

  const { oceanData, stats, narrative, confidence } = response.analysis
  const sstData = oceanData.sst
  const chlData = oceanData.chl

  return {
    areaKm2: stats.area_km2,
    hasSST: !!sstData && sstData.mean_f !== undefined,
    hasCHL: !!chlData && chlData.mean !== undefined,
    sst: sstData && sstData.mean_f !== undefined ? {
      meanF: sstData.mean_f,
      minF: sstData.min_f || sstData.mean_f,
      maxF: sstData.max_f || sstData.mean_f,
      gradFperMile: sstData.gradient_f || 0
    } : undefined,
    chl: chlData && chlData.mean !== undefined ? {
      mean: chlData.mean
    } : undefined,
    narrative,
    confidence
  }
}