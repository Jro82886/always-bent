import { NextRequest, NextResponse } from "next/server";
import { bbox as turfBbox } from '@turf/turf';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { polygon, date, want } = await req.json() as {
      polygon: GeoJSON.Feature<GeoJSON.Polygon> | GeoJSON.Polygon
      date: string
      want: { sst: boolean; chl: boolean }
    }
    if (!polygon || !date) return NextResponse.json({ error: 'polygon+date required' }, { status: 400 })
    const bbox = turfBbox(polygon as any)

    const sample = await fetch(`${process.env.INTERNAL_BASE_URL || ''}/api/rasters/sample`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        polygon, bbox, time: date,
        layers: { sst: !!want?.sst, chl: !!want?.chl }
      })
    })
    if (!sample.ok) throw new Error(`/api/rasters/sample ${sample.status}`)
    const data = await sample.json()

    const sstVals: number[] = data?.sst?.values ?? []
    const chlVals: number[] = data?.chl?.values ?? []
    const mean = (arr:number[]) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : NaN
    const min  = (arr:number[]) => arr.length ? Math.min(...arr) : NaN
    const max  = (arr:number[]) => arr.length ? Math.max(...arr) : NaN

    return NextResponse.json({
      areaKm2: data?.areaKm2 ?? 0,
      hasSST: sstVals.length > 0,
      hasCHL: chlVals.length > 0,
      sst: sstVals.length ? {
        meanC: mean(sstVals), minC: min(sstVals), maxC: max(sstVals),
        gradientCperKm: data?.sst?.gradientCperKm ?? 0
      } : undefined,
      chl: chlVals.length ? { mean: mean(chlVals) } : undefined,
      debug: { bbox, date, counts: { sst: sstVals.length, chl: chlVals.length } }
    })
  } catch (e:any) {
    console.error('[analyze] error', e)
    return NextResponse.json({ error: 'analyze failed' }, { status: 500 })
  }
}