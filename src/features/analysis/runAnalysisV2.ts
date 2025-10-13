import type { AnalyzeAPI } from '@/types/analyze';
import { useAppState } from '@/lib/store';
import { toVM } from '@/types/analyze';

export async function runAnalyzeV2(polygon: GeoJSON.Polygon) {
  // Use a known recent date with available Copernicus data
  const dateISO = '2025-01-20'; // January 20, 2025 - we know this date has data
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ polygon, date: dateISO, want: { sst:true, chl:true } })
  })
  if (!res.ok) throw new Error(`analyze ${res.status}`)
  const api = await res.json()
  const vm = toVM(api)

  const s = useAppState.getState()
  s.setAnalysisVM(vm)
  s.openDynamicModal()
}
