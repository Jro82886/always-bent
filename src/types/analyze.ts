// types/analyze.ts
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

export type AnalysisVM = {
  areaKm2: number
  sst?: { meanF: number; minF: number; maxF: number; gradFperMile: number }
  chl?: { mean: number; min: number; max: number }
  hasSST: boolean
  hasCHL: boolean
  narrative: string
  confidence: 'high' | 'no-data' | 'error'
}

export const toVM = (response: AnalyzeAPIResponse): AnalysisVM | null => {
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
      mean: chlData.mean,
      min: chlData.min || chlData.mean,
      max: chlData.max || chlData.mean
    } : undefined,
    narrative,
    confidence
  }
}